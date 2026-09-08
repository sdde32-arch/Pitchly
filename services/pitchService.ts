import { Pitch } from '../types/firebase';
import { db } from '../lib/firebase';
import { collection, doc, getDocs, getDoc, setDoc, updateDoc, deleteDoc, query, where } from 'firebase/firestore';
import { offlineCacheService } from './offlineCacheService';

const withTimeout = <T>(promise: Promise<T>, timeoutMs: number = 10000, errorMessage = "Operation timed out"): Promise<T> => {
  return Promise.race([
    promise,
    new Promise<never>((_, reject) => setTimeout(() => reject(new Error(errorMessage)), timeoutMs))
  ]);
};

/**
 * Strips all undefined fields from an object to prevent Firestore crashing
 * with "Unsupported field value: undefined".
 */
export function sanitizeFirestorePayload<T extends Record<string, any>>(obj: T): T {
  const clean: Record<string, any> = {};
  for (const [key, value] of Object.entries(obj)) {
    if (value !== undefined) {
      if (value !== null && typeof value === 'object' && !Array.isArray(value)) {
        clean[key] = sanitizeFirestorePayload(value);
      } else {
        clean[key] = value;
      }
    }
  }
  return clean as T;
}

export const pitchService = {
  collectionPath: 'pitches',

  async create(pitch: Pitch): Promise<Pitch> {
    console.log(`Creating pitch in ${this.collectionPath}`, pitch);
    const sanitized = sanitizeFirestorePayload(pitch);
    try {
      await withTimeout(
        setDoc(doc(db, this.collectionPath, pitch.id), sanitized),
        10000,
        "Failed to submit pitch: Connection timed out. Please check your internet connection."
      );
      return sanitized;
    } catch (error: any) {
      console.error("Failed to write to Firestore", error);
      throw new Error(error.message || "Failed to create pitch. Please check your network and try again.");
    }
  },

  async getById(id: string): Promise<Pitch | null> {
    console.log(`Fetching pitch ${id} from ${this.collectionPath}`);
    try {
      const docRef = doc(db, this.collectionPath, id);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        const pitch = docSnap.data() as Pitch;
        return pitch;
      }
      return offlineCacheService.getCachedPitchById(id);
    } catch (error) {
      console.warn("Failed to fetch pitch from Firestore, checking offline cache", error);
      return offlineCacheService.getCachedPitchById(id);
    }
  },

  async listPublic(): Promise<Pitch[]> {
    console.log(`Fetching active public pitches from ${this.collectionPath}`);
    try {
      const q = query(collection(db, this.collectionPath), where("status", "==", "ACTIVE"));
      const querySnapshot = await getDocs(q);
      const pitches: Pitch[] = [];
      querySnapshot.forEach((doc) => {
        pitches.push(doc.data() as Pitch);
      });
      if (pitches.length > 0) {
        offlineCacheService.cachePitches(pitches);
        return pitches;
      }
      // If empty (e.g. offline query returned nothing), fallback to offline cache
      const cached = offlineCacheService.getCachedPitches();
      return cached.length > 0 ? cached : [];
    } catch (error) {
      console.warn("Failed to fetch public pitches from Firestore, using offline cache", error);
      return offlineCacheService.getCachedPitches();
    }
  },

  async listByOwner(ownerId: string): Promise<Pitch[]> {
    console.log(`Fetching pitches for owner ${ownerId} from ${this.collectionPath}`);
    try {
      const q = query(collection(db, this.collectionPath), where("ownerId", "==", ownerId));
      const querySnapshot = await getDocs(q);
      const pitches: Pitch[] = [];
      querySnapshot.forEach((doc) => {
        pitches.push(doc.data() as Pitch);
      });
      return pitches;
    } catch (error) {
      console.warn("Failed to fetch owner pitches from Firestore", error);
      return [];
    }
  },

  async update(id: string, data: Partial<Pitch>): Promise<void> {
    console.log(`Updating pitch ${id} in ${this.collectionPath}`, data);
    const sanitized = sanitizeFirestorePayload(data as Record<string, any>);
    try {
      await withTimeout(
        updateDoc(doc(db, this.collectionPath, id), sanitized),
        10000,
        "Failed to update pitch: Connection timed out. Please check your internet connection."
      );
    } catch (error: any) {
      console.error("Failed to update pitch in Firestore", error);
      throw new Error(error.message || "Failed to update pitch. Please check your network and try again.");
    }
  },

  async delete(id: string): Promise<void> {
    console.log(`Deleting pitch ${id} from ${this.collectionPath}`);
    try {
      await deleteDoc(doc(db, this.collectionPath, id));
    } catch (error) {
      console.warn("Failed to delete from Firestore", error);
    }
  }
};
