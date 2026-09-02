import { Notification, Booking, Match, MatchPlayer } from '../types/firebase';
import { BookingStatus } from '../types';
import { db } from '../lib/firebase';
import { 
  collection, 
  collectionGroup, 
  query, 
  where, 
  getDocs, 
  getDoc, 
  setDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  doc 
} from 'firebase/firestore';

export interface UpcomingMatchItem {
  id: string;
  title: string;
  date: string;
  time: string;
  turfName: string;
  source: 'booking' | 'match';
  pitchId?: string;
  mapUrl?: string;
}

const pitchCache: Record<string, any> = {};

const getPitchDetails = async (pitchId: string) => {
  if (!pitchId) return null;
  if (pitchCache[pitchId]) return pitchCache[pitchId];
  try {
    const pitchDoc = await getDoc(doc(db, 'pitches', pitchId));
    if (pitchDoc.exists()) {
      const pitchData = pitchDoc.data();
      pitchCache[pitchId] = pitchData;
      return pitchData;
    }
  } catch (err) {
    console.error("Error fetching pitch details for map link:", err);
  }
  return null;
};

const getMapUrl = (turfName: string, location?: string, fullAddress?: string, coordinates?: [number, number]) => {
  if (coordinates && coordinates.length === 2) {
    return `https://www.google.com/maps/search/?api=1&query=${coordinates[0]},${coordinates[1]}`;
  }
  if (fullAddress) {
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(fullAddress)}`;
  }
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(turfName + (location ? ', ' + location : ''))}`;
};

export const notificationService = {
  collectionPath: 'notifications',
  
  async getUpcomingMatches(userId: string): Promise<UpcomingMatchItem[]> {
    try {
      const upcoming: UpcomingMatchItem[] = [];
      const now = new Date();
      const twoHoursFromNow = new Date(now.getTime() + 2 * 60 * 60 * 1000);

      const isUpcoming = (dateStr: string, timeStr: string) => {
        if (!dateStr || !timeStr) return false;
        const [year, month, day] = dateStr.split('-').map(Number);
        const [hours, minutes] = timeStr.split(':').map(Number);
        if (isNaN(year) || isNaN(hours)) return false;
        
        const matchDate = new Date(year, month - 1, day, hours, minutes);
        return matchDate > now && matchDate <= twoHoursFromNow;
      };

      // 1. Check direct bookings by the user
      try {
        const bookingsQuery = query(
          collection(db, 'bookings'),
          where('playerId', '==', userId),
          where('status', 'in', [
            BookingStatus.CONFIRMED,
            BookingStatus.PAYMENT_SUBMITTED,
            'PAID',
            BookingStatus.CHECKED_IN
          ])
        );
        
        const bookingsSnap = await getDocs(bookingsQuery);
        const bookingsPromises = bookingsSnap.docs.map(async (docSnap) => {
          const b = docSnap.data() as Booking;
          if (isUpcoming(b.date, b.time)) {
            const pitchId = b.pitchId || b.turfId || '';
            const pitch = pitchId ? await getPitchDetails(pitchId) : null;
            const mapUrl = getMapUrl(
              b.turfName || 'Unknown Turf',
              pitch?.location,
              pitch?.fullAddress,
              pitch?.coordinates
            );

            upcoming.push({
              id: docSnap.id,
              title: 'Your Booking',
              date: b.date,
              time: b.time,
              turfName: b.turfName || 'Unknown Turf',
              source: 'booking',
              pitchId,
              mapUrl
            });
          }
        });
        await Promise.all(bookingsPromises);
      } catch (err) {
        console.error("Permission error on bookings query:", err);
      }

      // 2. Check team matches where user is a participant
      try {
        const playersQuery = query(
          collectionGroup(db, 'matchPlayers'),
          where('userId', '==', userId)
        );
        
        const playersSnap = await getDocs(playersQuery);
        
        // Fetch each actual Match document
        const matchPromises = playersSnap.docs.map(async (docSnap) => {
          const mp = docSnap.data() as MatchPlayer;
          if (mp.status === 'joined' || mp.status === 'invited') {
            const matchRef = doc(db, 'matches', mp.matchId);
            try {
              const matchDoc = await getDoc(matchRef);
              if (matchDoc.exists()) {
                const m = matchDoc.data() as Match;
                if (m.status !== 'Cancelled' && m.status !== 'Completed' && isUpcoming(m.date, m.time)) {
                  const pitchId = m.pitchId || '';
                  const pitch = pitchId ? await getPitchDetails(pitchId) : null;
                  const mapUrl = getMapUrl(
                    m.pitchName || 'Unknown Turf',
                    pitch?.location,
                    pitch?.fullAddress,
                    pitch?.coordinates
                  );

                  // Deduplicate if the match was somehow also a direct booking, though IDs differ
                  upcoming.push({
                    id: m.id,
                    title: m.title || 'Team Match',
                    date: m.date,
                    time: m.time,
                    turfName: m.pitchName || 'Unknown Turf',
                    source: 'match',
                    pitchId,
                    mapUrl
                  });
                }
              }
            } catch (err) {
              console.error(`Permission error on match doc read ${mp.matchId}:`, err);
            }
          }
        });
        
        await Promise.all(matchPromises);
      } catch (err) {
        console.error("Permission error on matchPlayers collectionGroup query:", err);
        console.warn(
          "COLLECTION_GROUP QUERY NOTICE:\n" +
          "If you are seeing 'Missing or insufficient permissions' here, make sure your Firestore Security Rules contain the recursive wildcard rule for matchPlayers:\n\n" +
          "match /{path=**}/matchPlayers/{playerId} {\n" +
          "  allow read: if isAuthenticated() && (resource == null || resource.data.userId == request.auth.uid || isAdmin());\n" +
          "}\n\n" +
          "Since Firebase is configured manually, copy and paste the rules from firestore.rules into your Firebase console at https://console.firebase.google.com/"
        );
      }
      
      // Sort by soonest
      upcoming.sort((a, b) => {
        const aTime = new Date(`${a.date}T${a.time}:00`).getTime();
        const bTime = new Date(`${b.date}T${b.time}:00`).getTime();
        return aTime - bTime;
      });
      
      return upcoming;
    } catch (e) {
      console.error("Failed to fetch upcoming matches", e);
      return [];
    }
  },

  async create(notification: Notification): Promise<Notification> {
    try {
      const docId = notification.id || `notif_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      const payload: Notification = {
        ...notification,
        id: docId,
        createdAt: notification.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      await setDoc(doc(db, this.collectionPath, docId), payload);
      return payload;
    } catch (err) {
      console.warn("Failed to create firestore notification, fallback logging:", err);
      return notification;
    }
  },

  async listByUser(userId: string): Promise<Notification[]> {
    if (!userId) return [];
    try {
      const q = query(
        collection(db, this.collectionPath),
        where('userId', '==', userId)
      );
      const snap = await getDocs(q);
      const list: Notification[] = [];
      snap.forEach((d) => list.push({ id: d.id, ...d.data() } as Notification));
      list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      return list;
    } catch (err) {
      console.warn("Error fetching user notifications:", err);
      return [];
    }
  },

  subscribeUserNotifications(userId: string, callback: (notifications: Notification[]) => void): () => void {
    if (!userId) {
      callback([]);
      return () => {};
    }
    const q = query(
      collection(db, this.collectionPath),
      where('userId', '==', userId)
    );
    return onSnapshot(
      q,
      (snap) => {
        const list: Notification[] = [];
        snap.forEach((d) => list.push({ id: d.id, ...d.data() } as Notification));
        list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        callback(list);
      },
      (err) => {
        console.warn("Error subscribing to notifications:", err);
        callback([]);
      }
    );
  },

  async markAsRead(id: string): Promise<void> {
    try {
      await updateDoc(doc(db, this.collectionPath, id), {
        isRead: true,
        updatedAt: new Date().toISOString(),
      });
    } catch (err) {
      console.warn("Failed marking notification as read:", err);
    }
  },

  async delete(id: string): Promise<void> {
    try {
      await deleteDoc(doc(db, this.collectionPath, id));
    } catch (err) {
      console.warn("Failed deleting notification:", err);
    }
  }
};

