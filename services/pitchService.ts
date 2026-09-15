import { Pitch } from '../types/firebase';
import { db } from '../lib/firebase';
import { collection, doc, getDocs, getDoc, setDoc, updateDoc, deleteDoc, query, where } from 'firebase/firestore';
import { offlineCacheService } from './offlineCacheService';
import { TURFS } from '../constants';
import { Turf, PitchStatus } from '../types';

const DELETED_PITCHES_KEY = 'pitchly_deleted_pitch_ids';

export const getDeletedPitchIds = (): string[] => {
  try {
    const raw = localStorage.getItem(DELETED_PITCHES_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
};

export const markPitchAsDeleted = (id: string) => {
  try {
    const ids = getDeletedPitchIds();
    if (!ids.includes(id)) {
      ids.push(id);
      localStorage.setItem(DELETED_PITCHES_KEY, JSON.stringify(ids));
    }
  } catch (e) {
    console.warn('Failed to mark pitch as deleted locally:', e);
  }
};

export const isLegacyTestPitch = (p: { id?: string; name?: string }): boolean => {
  if (!p) return true;
  const id = p.id || '';
  const name = (p.name || '').toLowerCase();
  if (
    id.startsWith('test_pitch_') ||
    id.startsWith('pitch_leaflet_') ||
    id === '19KtDSBJUgyVXSGcy028' ||
    id === 'QcpJ2udZMZIE5bmod4u5' ||
    id === 'p4TH1bYgBnLgzSlhuQGH' ||
    name.includes('tal olymipic') ||
    name.includes('areeaa arena') ||
    name.includes('verification test') ||
    name.includes('kampala leaflet') ||
    name.includes('test pitch')
  ) {
    return true;
  }
  return false;
};

export const turfToPitch = (t: Turf): Pitch => ({
  id: t.id,
  ownerId: t.ownerId || `owner-${t.id}`,
  name: t.name,
  location: t.location,
  fullAddress: t.fullAddress || t.formattedAddress || t.location,
  formattedAddress: t.formattedAddress || t.fullAddress || t.location,
  coordinates: t.coordinates || [t.latitude || 0.342, t.longitude || 32.591],
  latitude: t.latitude || 0.342,
  longitude: t.longitude || 32.591,
  pricePerHour: t.pricePerHour,
  pitchFormats: t.pitchFormats || ['5-a-side', '7-a-side'],
  amenities: t.amenities || ['Floodlights', 'Changing Rooms', 'Parking'],
  images: Array.from(new Set([
    ...(t.images?.length ? t.images : (t.image ? [t.image] : [])),
    ...(t.additionalImages || [])
  ])),
  additionalImages: t.additionalImages || [],
  openingHour: t.openingHour || '06:30',
  closingHour: t.closingHour || '23:00',
  isVerified: t.isVerified ?? true,
  status: t.status || PitchStatus.ACTIVE,
  createdAt: t.submittedAt || new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  contactPhone: t.contactPhone || '+256 700 000 000',
  contactEmail: t.contactEmail || 'info@footlink.ug',
  description: t.description || '',
  surfaceType: t.surfaceType || 'Synthetic Grass (AstroTurf)',
  ...({
    rating: t.rating || 4.8,
    distance: t.distance || '2.5 km',
  } as any),
} as Pitch);

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
    if (getDeletedPitchIds().includes(id)) return null;

    // Check researched Kampala Turfs first
    const researched = TURFS.find((t) => t.id === id);
    if (researched) {
      return turfToPitch(researched);
    }

    console.log(`Fetching pitch ${id} from ${this.collectionPath}`);
    try {
      const docRef = doc(db, this.collectionPath, id);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        const pitch = docSnap.data() as Pitch;
        if (!isLegacyTestPitch(pitch)) {
          return pitch;
        }
      }
      return offlineCacheService.getCachedPitchById(id);
    } catch (error) {
      console.warn("Failed to fetch pitch from Firestore, checking offline cache", error);
      return offlineCacheService.getCachedPitchById(id);
    }
  },

  async listPublic(): Promise<Pitch[]> {
    console.log(`Fetching active public pitches from ${this.collectionPath}`);
    const deletedIds = getDeletedPitchIds();
    const researchedPitches = TURFS.map(turfToPitch).filter((p) => !deletedIds.includes(p.id));

    try {
      const q = query(collection(db, this.collectionPath), where("status", "==", "ACTIVE"));
      const querySnapshot = await getDocs(q);
      const userCreatedPitches: Pitch[] = [];

      querySnapshot.forEach((docSnap) => {
        const data = docSnap.data() as Pitch;
        if (!isLegacyTestPitch(data) && !deletedIds.includes(data.id)) {
          userCreatedPitches.push(data);
        }
      });

      // Combine user-created custom pitches with researched Kampala pitches
      const combinedMap = new Map<string, Pitch>();
      userCreatedPitches.forEach((p) => combinedMap.set(p.id, p));
      researchedPitches.forEach((p) => {
        if (!combinedMap.has(p.id)) {
          combinedMap.set(p.id, p);
        }
      });

      const result = Array.from(combinedMap.values());
      offlineCacheService.cachePitches(result);
      return result;
    } catch (error) {
      console.warn("Failed to fetch public pitches from Firestore, using researched turfs", error);
      return researchedPitches;
    }
  },

  async listByOwner(ownerId: string): Promise<Pitch[]> {
    console.log(`Fetching pitches for owner ${ownerId} from ${this.collectionPath}`);
    const deletedIds = getDeletedPitchIds();
    try {
      const q = query(collection(db, this.collectionPath), where("ownerId", "==", ownerId));
      const querySnapshot = await getDocs(q);
      const pitches: Pitch[] = [];
      querySnapshot.forEach((docSnap) => {
        const data = docSnap.data() as Pitch;
        if (!isLegacyTestPitch(data) && !deletedIds.includes(data.id)) {
          pitches.push(data);
        }
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
    markPitchAsDeleted(id);
    try {
      await deleteDoc(doc(db, this.collectionPath, id));
    } catch (error) {
      console.warn("Failed to delete from Firestore", error);
    }
  }
};
