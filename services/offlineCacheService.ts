import { Pitch, Booking } from '../types/firebase';
import { UserProfileData } from '../context/UserContext';

const KEYS = {
  PITCHES: 'pitchly_offline_pitches',
  USER_BOOKINGS_PREFIX: 'pitchly_offline_bookings_',
  OWNER_BOOKINGS_PREFIX: 'pitchly_offline_owner_bookings_',
  USER_PROFILE: 'pitchly_last_user',
  LAST_SYNC: 'pitchly_offline_last_sync',
};

export interface OfflineCacheSummary {
  pitchesCount: number;
  userBookingsCount: number;
  lastSyncedAt: string | null;
  isAvailable: boolean;
}

export const offlineCacheService = {
  /**
   * Save public pitches list to offline storage
   */
  cachePitches(pitches: Pitch[]): void {
    if (!pitches || pitches.length === 0) return;
    try {
      localStorage.setItem(KEYS.PITCHES, JSON.stringify(pitches));
      localStorage.setItem(KEYS.LAST_SYNC, new Date().toISOString());
    } catch (err) {
      console.warn('[OfflineCache] Failed to cache pitches:', err);
    }
  },

  /**
   * Retrieve cached pitches from offline storage
   */
  getCachedPitches(): Pitch[] {
    try {
      const data = localStorage.getItem(KEYS.PITCHES);
      return data ? JSON.parse(data) : [];
    } catch (err) {
      console.warn('[OfflineCache] Failed to read cached pitches:', err);
      return [];
    }
  },

  /**
   * Retrieve a single pitch by ID from offline cache
   */
  getCachedPitchById(id: string): Pitch | null {
    const list = this.getCachedPitches();
    return list.find((p) => p.id === id) || null;
  },

  /**
   * Save player's bookings to offline storage
   */
  cacheUserBookings(userId: string, bookings: Booking[]): void {
    if (!userId) return;
    try {
      localStorage.setItem(`${KEYS.USER_BOOKINGS_PREFIX}${userId}`, JSON.stringify(bookings));
    } catch (err) {
      console.warn(`[OfflineCache] Failed to cache bookings for ${userId}:`, err);
    }
  },

  /**
   * Retrieve player's bookings from offline storage
   */
  getCachedUserBookings(userId: string): Booking[] {
    if (!userId) return [];
    try {
      const data = localStorage.getItem(`${KEYS.USER_BOOKINGS_PREFIX}${userId}`);
      return data ? JSON.parse(data) : [];
    } catch (err) {
      console.warn(`[OfflineCache] Failed to read cached bookings for ${userId}:`, err);
      return [];
    }
  },

  /**
   * Save owner's bookings to offline storage
   */
  cacheOwnerBookings(ownerId: string, bookings: Booking[]): void {
    if (!ownerId) return;
    try {
      localStorage.setItem(`${KEYS.OWNER_BOOKINGS_PREFIX}${ownerId}`, JSON.stringify(bookings));
    } catch (err) {
      console.warn(`[OfflineCache] Failed to cache owner bookings for ${ownerId}:`, err);
    }
  },

  /**
   * Retrieve owner's bookings from offline storage
   */
  getCachedOwnerBookings(ownerId: string): Booking[] {
    if (!ownerId) return [];
    try {
      const data = localStorage.getItem(`${KEYS.OWNER_BOOKINGS_PREFIX}${ownerId}`);
      return data ? JSON.parse(data) : [];
    } catch (err) {
      console.warn(`[OfflineCache] Failed to read cached owner bookings for ${ownerId}:`, err);
      return [];
    }
  },

  /**
   * Cache user profile data
   */
  cacheUserProfile(profile: UserProfileData): void {
    try {
      localStorage.setItem(KEYS.USER_PROFILE, JSON.stringify(profile));
    } catch (err) {
      console.warn('[OfflineCache] Failed to cache profile:', err);
    }
  },

  /**
   * Retrieve cached user profile
   */
  getCachedUserProfile(): UserProfileData | null {
    try {
      const data = localStorage.getItem(KEYS.USER_PROFILE);
      return data ? JSON.parse(data) : null;
    } catch {
      return null;
    }
  },

  /**
   * Get an aggregated summary of all offline cached data
   */
  getSummary(userId?: string): OfflineCacheSummary {
    const pitches = this.getCachedPitches();
    const userBookings = userId ? this.getCachedUserBookings(userId) : [];
    const lastSync = localStorage.getItem(KEYS.LAST_SYNC);
    return {
      pitchesCount: pitches.length,
      userBookingsCount: userBookings.length,
      lastSyncedAt: lastSync,
      isAvailable: pitches.length > 0 || userBookings.length > 0,
    };
  },

  /**
   * Clear all pitchly offline data on logout
   */
  clearCache(): void {
    try {
      localStorage.removeItem(KEYS.PITCHES);
      localStorage.removeItem(KEYS.LAST_SYNC);
      // Remove all booking keys
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (
          key &&
          (key.startsWith(KEYS.USER_BOOKINGS_PREFIX) || key.startsWith(KEYS.OWNER_BOOKINGS_PREFIX))
        ) {
          localStorage.removeItem(key);
        }
      }
    } catch (err) {
      console.warn('[OfflineCache] Failed to clear offline cache:', err);
    }
  },
};
