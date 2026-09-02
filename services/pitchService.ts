import { Pitch } from '../types/firebase';
import { db } from '../lib/firebase';
import { collection, doc, getDocs, getDoc, setDoc, updateDoc, deleteDoc, query, where } from 'firebase/firestore';

const withTimeout = <T>(promise: Promise<T>, timeoutMs: number = 10000, errorMessage = "Operation timed out"): Promise<T> => {
  return Promise.race([
    promise,
    new Promise<never>((_, reject) => setTimeout(() => reject(new Error(errorMessage)), timeoutMs))
  ]);
};

export const pitchService = {
  collectionPath: 'pitches',

  async create(pitch: Pitch): Promise<Pitch> {
    console.log(`Creating pitch in ${this.collectionPath}`, pitch);
    try {
      await withTimeout(
        setDoc(doc(db, this.collectionPath, pitch.id), pitch),
        10000,
        "Failed to submit pitch: Connection timed out. Please check your internet connection."
      );
      return pitch;
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
        return docSnap.data() as Pitch;
      }
      return null;
    } catch (error) {
      console.warn("Failed to fetch from Firestore, returning null", error);
      return null;
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
      return pitches;
    } catch (error) {
      console.warn("Failed to fetch public pitches from Firestore", error);
      return [];
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
    try {
      await withTimeout(
        updateDoc(doc(db, this.collectionPath, id), data),
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
