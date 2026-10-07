import { db } from '../lib/firebase';
import { collection, doc, query, where, getDocs, getDoc, setDoc, updateDoc, deleteDoc } from 'firebase/firestore';
import { Review } from '../types/firebase';

export const reviewService = {
  collectionPath: 'reviews',

  /**
   * Create a new review and update aggregate pitch rating
   */
  async create(review: Omit<Review, 'id' | 'createdAt' | 'updatedAt'>): Promise<Review> {
    const reviewsRef = collection(db, this.collectionPath);
    const newDocRef = doc(reviewsRef);
    
    // Check if player has already reviewed this specific booking (only if valid bookingId provided)
    if (review.bookingId && review.bookingId.trim().length > 0 && review.bookingId !== 'community') {
      try {
        const existingRef = query(
          collection(db, this.collectionPath),
          where('bookingId', '==', review.bookingId),
          where('playerId', '==', review.playerId)
        );
        const snap = await getDocs(existingRef);
        if (!snap.empty) {
          throw new Error('You have already submitted a review for this booking session.');
        }
      } catch (err: any) {
        if (err.message && err.message.includes('already submitted')) {
          throw err;
        }
        console.warn('Booking check bypassed (offline/permission):', err);
      }
    }

    const timestamp = new Date().toISOString();
    const reviewData: Review = {
      ...review,
      id: newDocRef.id,
      createdAt: timestamp,
      updatedAt: timestamp,
    };
    
    await setDoc(newDocRef, reviewData);

    // Recalculate aggregate pitch rating in background
    try {
      await this.recalculatePitchRating(review.pitchId);
    } catch (e) {
      console.warn('Notice updating aggregate pitch rating:', e);
    }

    return reviewData;
  },

  async getById(id: string): Promise<Review | null> {
    const docRef = doc(db, this.collectionPath, id);
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      return snap.data() as Review;
    }
    return null;
  },

  /**
   * List reviews for a pitch, checking both slug and normalized IDs
   */
  async listByPitch(pitchId: string): Promise<Review[]> {
    const idsToSearch = new Set<string>([pitchId]);
    const normalized = pitchId.replace(/^pitch-/, '');
    idsToSearch.add(normalized);
    if (!pitchId.startsWith('pitch-')) {
      idsToSearch.add(`pitch-${pitchId}`);
    }

    const allReviewsMap = new Map<string, Review>();

    for (const pid of Array.from(idsToSearch)) {
      try {
        const q = query(
          collection(db, this.collectionPath),
          where('pitchId', '==', pid)
        );
        const snap = await getDocs(q);
        snap.docs.forEach((d) => {
          const rev = d.data() as Review;
          if (rev && rev.id) {
            allReviewsMap.set(rev.id, rev);
          }
        });
      } catch (err) {
        console.warn(`Error querying reviews for pitch ${pid}:`, err);
      }
    }

    const reviews = Array.from(allReviewsMap.values()).sort(
      (a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()
    );

    return reviews;
  },

  async listByUser(userId: string): Promise<Review[]> {
    const q = query(
      collection(db, this.collectionPath),
      where('playerId', '==', userId)
    );
    const snap = await getDocs(q);
    const reviews = snap.docs.map(doc => doc.data() as Review).sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
    return reviews;
  },

  async update(id: string, data: Partial<Review>): Promise<void> {
    const docRef = doc(db, this.collectionPath, id);
    await updateDoc(docRef, {
      ...data,
      updatedAt: new Date().toISOString()
    });

    const current = await this.getById(id);
    if (current && current.pitchId) {
      await this.recalculatePitchRating(current.pitchId);
    }
  },

  async delete(id: string): Promise<void> {
    const current = await this.getById(id);
    const pitchId = current?.pitchId;

    const docRef = doc(db, this.collectionPath, id);
    await deleteDoc(docRef);

    if (pitchId) {
      try {
        await this.recalculatePitchRating(pitchId);
      } catch (e) {
        console.warn('Notice updating aggregate pitch rating after deletion:', e);
      }
    }
  },

  /**
   * Recalculates average rating and review count from Firestore and updates pitch document
   */
  async recalculatePitchRating(pitchId: string): Promise<{ averageRating: number; totalReviews: number }> {
    try {
      const reviews = await this.listByPitch(pitchId);
      const totalReviews = reviews.length;
      const averageRating = totalReviews > 0
        ? Number((reviews.reduce((acc, r) => acc + (r.rating || 5), 0) / totalReviews).toFixed(1))
        : 0;

      const idsToUpdate = [pitchId, pitchId.replace(/^pitch-/, '')];
      for (const targetId of idsToUpdate) {
        try {
          const pitchRef = doc(db, 'pitches', targetId);
          await updateDoc(pitchRef, {
            rating: averageRating,
            totalReviews: totalReviews,
          });
        } catch {
          // May not exist in Firestore pitches collection (e.g. static constants turf)
        }
      }

      return { averageRating, totalReviews };
    } catch (err) {
      console.warn('Could not recalculate pitch rating:', err);
      return { averageRating: 0, totalReviews: 0 };
    }
  }
};
