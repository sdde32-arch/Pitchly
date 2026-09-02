import { db } from '../lib/firebase';
import { collection, doc, query, where, getDocs, getDoc, setDoc, updateDoc, deleteDoc, orderBy, serverTimestamp } from 'firebase/firestore';
import { Review } from '../types/firebase';

export const reviewService = {
  collectionPath: 'reviews',

  async create(review: Omit<Review, 'id' | 'createdAt' | 'updatedAt'>): Promise<Review> {
    const reviewsRef = collection(db, this.collectionPath);
    const newDocRef = doc(reviewsRef);
    
    // Check if player has already reviewed this booking
    const existingRef = query(collection(db, this.collectionPath), where('bookingId', '==', review.bookingId));
    const snap = await getDocs(existingRef);
    if (!snap.empty) {
        throw new Error('You have already reviewed this booking.');
    }

    const timestamp = new Date().toISOString();
    const reviewData: Review = {
      ...review,
      id: newDocRef.id,
      createdAt: timestamp,
      updatedAt: timestamp,
    };
    
    await setDoc(newDocRef, reviewData);
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

  async listByPitch(pitchId: string): Promise<Review[]> {
    const q = query(
      collection(db, this.collectionPath),
      where('pitchId', '==', pitchId)
    );
    const snap = await getDocs(q);
    const reviews = snap.docs.map(doc => doc.data() as Review).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    return reviews;
  },

  async listByUser(userId: string): Promise<Review[]> {
    const q = query(
      collection(db, this.collectionPath),
      where('playerId', '==', userId)
    );
    const snap = await getDocs(q);
    const reviews = snap.docs.map(doc => doc.data() as Review).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    return reviews;
  },

  async update(id: string, data: Partial<Review>): Promise<void> {
    const docRef = doc(db, this.collectionPath, id);
    await updateDoc(docRef, {
        ...data,
        updatedAt: new Date().toISOString()
    });
  },

  async delete(id: string): Promise<void> {
    const docRef = doc(db, this.collectionPath, id);
    await deleteDoc(docRef);
  }
};
