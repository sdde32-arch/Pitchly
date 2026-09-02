import { User } from '../types/firebase';
import { db } from '../lib/firebase';
import { collection, doc, getDoc, getDocs, setDoc, updateDoc, query, limit } from 'firebase/firestore';

export const userService = {
  // Define base collection name
  collectionPath: 'users',

  async create(user: User): Promise<User> {
    try {
      await setDoc(doc(db, this.collectionPath, user.id), user);
      return user;
    } catch (err) {
      console.warn("Failed to create user in Firestore:", err);
      return user;
    }
  },

  async getById(id: string): Promise<User | null> {
    try {
      const snap = await getDoc(doc(db, this.collectionPath, id));
      if (snap.exists()) {
        return snap.data() as User;
      }
      return null;
    } catch (err) {
      console.warn(`Error getting user ${id}:`, err);
      return null;
    }
  },

  async update(id: string, data: Partial<User>): Promise<void> {
    try {
      await updateDoc(doc(db, this.collectionPath, id), data);
    } catch (err) {
      console.warn(`Error updating user ${id}:`, err);
    }
  },

  async listSearchableUsers(): Promise<User[]> {
    try {
      const q = query(collection(db, this.collectionPath), limit(100));
      const snap = await getDocs(q);
      const users: User[] = [];
      snap.forEach((d) => {
        users.push({ id: d.id, ...d.data() } as User);
      });
      return users;
    } catch (err) {
      console.warn("Error listing users from Firestore:", err);
      return [];
    }
  },

  async archiveOrCreate(id: string): Promise<void> {
    // Implement delete logic if needed
  }
};

