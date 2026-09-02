import { Booking, SlotAvailability } from '../types/firebase';
import { BookingStatus } from '../types';
import { db, auth, handleFirestoreError, OperationType } from '../lib/firebase';
import { collection, doc, getDocs, getDoc, setDoc, updateDoc, deleteDoc, query, where, orderBy, runTransaction, writeBatch, onSnapshot } from 'firebase/firestore';

export const bookingService = {
  collectionPath: 'bookings',

  async create(booking: Booking): Promise<Booking> {
    console.log(`Creating booking in ${this.collectionPath}`, booking);
    try {
      const currentUserId = auth.currentUser?.uid || booking.playerId || booking.userId || "";
      const slots = booking.slots && booking.slots.length > 0 ? booking.slots : [booking.time];
      const bookingRef = doc(db, this.collectionPath, booking.id);

      await runTransaction(db, async (transaction) => {
        // 1. Check all slot locks in transaction
        for (const slot of slots) {
          const slotLockId = `${booking.pitchId}_${booking.date}_${slot}`.replace(/[\/\s—:]/g, '-');
          const slotLockRef = doc(db, 'slotLocks', slotLockId);
          const slotLockDoc = await transaction.get(slotLockRef);

          if (slotLockDoc.exists()) {
            const data = slotLockDoc.data();
            const expiresAt = data.expiresAt ? new Date(data.expiresAt).getTime() : 0;
            const isExpired = expiresAt < Date.now();
            if (data.status === 'active' && !isExpired && data.userId !== currentUserId) {
              throw new Error('SLOT_ALREADY_BOOKED');
            }
          }
        }

        // 2. Write slot locks and lightweight slot availability mirrors
        const expiresAt = new Date();
        expiresAt.setMinutes(expiresAt.getMinutes() + 10); // Hold for 10 minutes

        for (const slot of slots) {
          const slotLockId = `${booking.pitchId}_${booking.date}_${slot}`.replace(/[\/\s—:]/g, '-');
          const slotLockRef = doc(db, 'slotLocks', slotLockId);
          
          transaction.set(slotLockRef, {
            id: slotLockId,
            pitchId: booking.pitchId,
            date: booking.date,
            time: slot,
            slots: slots,
            bookingId: booking.id,
            userId: currentUserId,
            status: 'active',
            createdAt: new Date().toISOString(),
            expiresAt: expiresAt.toISOString()
          });

          // Write lightweight public slot availability mirror (no PII or payment details)
          const slotAvailRef = doc(db, 'slotAvailability', slotLockId);
          transaction.set(slotAvailRef, {
            id: slotLockId,
            pitchId: booking.pitchId,
            date: booking.date,
            time: slot,
            status: 'held',
            expiresAt: expiresAt.toISOString(),
            updatedAt: new Date().toISOString()
          });
        }

        // 3. Write booking document
        const safeBooking: Booking = {
          ...booking,
          playerId: currentUserId,
          status: booking.status || BookingStatus.PENDING_PAYMENT,
          holdExpiresAt: expiresAt.toISOString(),
          updatedAt: new Date().toISOString()
        };

        transaction.set(bookingRef, safeBooking);
      });

      return { ...booking };
    } catch (error: any) {
      console.error("Failed to execute booking transaction", error);
      if (error.message === 'SLOT_ALREADY_BOOKED') {
        throw new Error('One or more of your selected time slots are no longer available. The schedule has been updated. Please select another time.');
      }
      handleFirestoreError(error, OperationType.WRITE, this.collectionPath);
      throw error;
    }
  },

  async getById(id: string): Promise<Booking | null> {
    console.log(`Fetching booking ${id} from ${this.collectionPath}`);
    try {
      const docRef = doc(db, this.collectionPath, id);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        return docSnap.data() as Booking;
      }
      return null;
    } catch (error) {
      console.warn("Failed to fetch from Firestore, returning null", error);
      return null;
    }
  },

  async listByUser(playerId: string): Promise<Booking[]> {
    console.log(`Fetching bookings for player ${playerId} from ${this.collectionPath}`);
    try {
      const q1 = query(
        collection(db, this.collectionPath),
        where("playerId", "==", playerId),
      );
      const q2 = query(
        collection(db, this.collectionPath),
        where("userId", "==", playerId),
      );
      const [snap1, snap2] = await Promise.all([getDocs(q1), getDocs(q2)]);
      const bookingsMap = new Map<string, Booking>();
      snap1.forEach((doc) => {
        const data = { id: doc.id, ...doc.data() } as Booking;
        bookingsMap.set(data.id, data);
      });
      snap2.forEach((doc) => {
        const data = { id: doc.id, ...doc.data() } as Booking;
        bookingsMap.set(data.id, data);
      });
      const bookings = Array.from(bookingsMap.values());
      // Sort in memory to avoid needing composite indexes if missing
      return bookings.sort((a, b) => new Date(b.createdAt || b.date).getTime() - new Date(a.createdAt || a.date).getTime());
    } catch (error) {
      console.warn("Failed to fetch player bookings from Firestore", error);
      return [];
    }
  },

  async listByOwner(ownerId: string): Promise<Booking[]> {
    console.log(`Fetching bookings for owner ${ownerId} from ${this.collectionPath}`);
    try {
      const q = query(
        collection(db, this.collectionPath),
        where("ownerId", "==", ownerId),
      );
      const querySnapshot = await getDocs(q);
      const bookings: Booking[] = [];
      querySnapshot.forEach((doc) => {
        const raw = doc.data() as any;
        bookings.push({
          id: doc.id,
          ...raw,
          price: raw.price ?? raw.totalPrice ?? 0,
          totalPrice: raw.totalPrice ?? raw.price ?? 0,
          turfName: raw.turfName || raw.pitchName || "Sports Ground",
          pitchName: raw.pitchName || raw.turfName || "Sports Ground",
          userName: raw.userName || raw.playerName || "Player",
        } as Booking);
      });
      return bookings.sort((a, b) => new Date(b.createdAt || b.date).getTime() - new Date(a.createdAt || a.date).getTime());
    } catch (error) {
      console.warn("Failed to fetch owner bookings from Firestore", error);
      return [];
    }
  },

  subscribeByOwner(
    ownerId: string, 
    onUpdate: (bookings: Booking[]) => void, 
    onError?: (err: any) => void
  ): () => void {
    try {
      const q = query(
        collection(db, this.collectionPath),
        where("ownerId", "==", ownerId),
      );
      return onSnapshot(
        q,
        (snapshot) => {
          const bookings: Booking[] = [];
          snapshot.forEach((doc) => {
            const raw = doc.data() as any;
            bookings.push({
              id: doc.id,
              ...raw,
              price: raw.price ?? raw.totalPrice ?? 0,
              totalPrice: raw.totalPrice ?? raw.price ?? 0,
              turfName: raw.turfName || raw.pitchName || "Sports Ground",
              pitchName: raw.pitchName || raw.turfName || "Sports Ground",
              userName: raw.userName || raw.playerName || "Player",
            } as Booking);
          });
          bookings.sort((a, b) => new Date(b.createdAt || b.date).getTime() - new Date(a.createdAt || a.date).getTime());
          onUpdate(bookings);
        },
        (error) => {
          console.warn("Error in owner booking subscription:", error);
          if (onError) onError(error);
        }
      );
    } catch (err) {
      console.warn("Failed to establish snapshot listener for owner bookings:", err);
      if (onError) onError(err);
      return () => {};
    }
  },

  async update(id: string, data: Partial<Booking>): Promise<void> {
    console.log(`Updating booking ${id} in ${this.collectionPath}`, data);
    try {
      const bookingRef = doc(db, this.collectionPath, id);
      
      if (data.status === BookingStatus.CANCELLED || data.status === BookingStatus.REJECTED) {
        await runTransaction(db, async (transaction) => {
          const bookingDoc = await transaction.get(bookingRef);
          if (!bookingDoc.exists()) return;
          const b = bookingDoc.data() as Booking;

          transaction.update(bookingRef, {
            ...data,
            updatedAt: new Date().toISOString()
          });

          const slots = b.slots && b.slots.length > 0 ? b.slots : [b.time];
          for (const slot of slots) {
            const slotLockId = `${b.pitchId || b.turfId}_${b.date}_${slot}`.replace(/[\/\s—:]/g, '-');
            const slotLockRef = doc(db, 'slotLocks', slotLockId);
            const slotLockDoc = await transaction.get(slotLockRef);

            if (slotLockDoc.exists()) {
              transaction.update(slotLockRef, { 
                 status: 'released',
                 releasedAt: new Date().toISOString(),
                 releaseReason: data.status === BookingStatus.CANCELLED ? 'player_cancelled' : 'owner_rejected_payment'
              });
            }

            // Update lightweight slot availability mirror to open
            const slotAvailRef = doc(db, 'slotAvailability', slotLockId);
            transaction.set(slotAvailRef, {
              id: slotLockId,
              pitchId: b.pitchId || b.turfId,
              date: b.date,
              time: slot,
              status: 'open',
              updatedAt: new Date().toISOString()
            }, { merge: true });
          }
        });
      } else if (data.status === BookingStatus.CONFIRMED || data.status === BookingStatus.CHECKED_IN || data.status === BookingStatus.COMPLETED) {
        await runTransaction(db, async (transaction) => {
          const bookingDoc = await transaction.get(bookingRef);
          if (!bookingDoc.exists()) return;
          const b = bookingDoc.data() as Booking;

          transaction.update(bookingRef, {
            ...data,
            updatedAt: new Date().toISOString()
          });

          const slots = b.slots && b.slots.length > 0 ? b.slots : [b.time];
          for (const slot of slots) {
            const slotLockId = `${b.pitchId || b.turfId}_${b.date}_${slot}`.replace(/[\/\s—:]/g, '-');
            const slotAvailRef = doc(db, 'slotAvailability', slotLockId);
            transaction.set(slotAvailRef, {
              id: slotLockId,
              pitchId: b.pitchId || b.turfId,
              date: b.date,
              time: slot,
              status: 'booked',
              updatedAt: new Date().toISOString()
            }, { merge: true });
          }
        });
      } else {
        await updateDoc(bookingRef, {
          ...data,
          updatedAt: new Date().toISOString()
        });
      }
    } catch (error) {
      console.error("Failed to update booking in Firestore", error);
      // Fallback direct updateDoc attempt if transaction failed
      try {
        await updateDoc(doc(db, this.collectionPath, id), {
          ...data,
          updatedAt: new Date().toISOString()
        });
      } catch (fallbackError) {
        console.error("Fallback updateDoc also failed:", fallbackError);
        throw fallbackError;
      }
    }
  },

  async delete(id: string): Promise<void> {
    console.log(`Deleting booking ${id} from ${this.collectionPath}`);
    try {
      await deleteDoc(doc(db, this.collectionPath, id));
    } catch (error) {
      console.warn("Failed to delete booking from Firestore", error);
    }
  },

  async releaseHold(bookingId: string): Promise<void> {
    console.log(`Releasing hold for booking ${bookingId}`);
    try {
      const bookingRef = doc(db, this.collectionPath, bookingId);
      await runTransaction(db, async (transaction) => {
        const bookingDoc = await transaction.get(bookingRef);
        if (!bookingDoc.exists()) return;
        const b = bookingDoc.data() as Booking;

        transaction.update(bookingRef, {
          status: BookingStatus.CANCELLED,
          updatedAt: new Date().toISOString()
        });

        const slots = b.slots && b.slots.length > 0 ? b.slots : [b.time];
        for (const slot of slots) {
          const slotLockId = `${b.pitchId}_${b.date}_${slot}`.replace(/[\/\s—:]/g, '-');
          const slotLockRef = doc(db, 'slotLocks', slotLockId);
          const slotLockDoc = await transaction.get(slotLockRef);

          if (slotLockDoc.exists()) {
            transaction.update(slotLockRef, {
              status: 'released',
              releasedAt: new Date().toISOString(),
              releaseReason: 'hold_released'
            });
          }

          // Update lightweight slot availability mirror to open
          const slotAvailRef = doc(db, 'slotAvailability', slotLockId);
          transaction.set(slotAvailRef, {
            id: slotLockId,
            pitchId: b.pitchId,
            date: b.date,
            time: slot,
            status: 'open',
            updatedAt: new Date().toISOString()
          }, { merge: true });
        }
      });
    } catch (error) {
      console.warn("Failed to release temporary hold:", error);
    }
  },

  subscribeSlotAvailabilityByPitchAndDate(
    pitchId: string, 
    date: string, 
    onUpdate: (slots: SlotAvailability[]) => void, 
    onError?: (err: any) => void
  ) {
    const q = query(
      collection(db, 'slotAvailability'),
      where("pitchId", "==", pitchId),
      where("date", "==", date)
    );
    return onSnapshot(q, (snapshot) => {
      const slots: SlotAvailability[] = [];
      snapshot.forEach((doc) => {
        slots.push(doc.data() as SlotAvailability);
      });
      onUpdate(slots);
    }, (error) => {
      console.warn("Notice subscribing to slot availability:", error);
      if (onError) onError(error);
    });
  },

  subscribeByPitchAndDate(pitchId: string, date: string, onUpdate: (bookings: Booking[]) => void, onError?: (err: any) => void) {
    const q = query(
      collection(db, this.collectionPath),
      where("pitchId", "==", pitchId),
      where("date", "==", date)
    );
    return onSnapshot(q, (snapshot) => {
      const bookings: Booking[] = [];
      snapshot.forEach((doc) => {
        bookings.push(doc.data() as Booking);
      });
      onUpdate(bookings);
    }, (error) => {
      console.warn("Notice subscribing to pitch bookings:", error);
      if (onError) onError(error);
    });
  },

  subscribeByPlayer(playerId: string, onUpdate: (bookings: Booking[]) => void, onError?: (err: any) => void) {
    const q = query(
      collection(db, this.collectionPath),
      where("playerId", "==", playerId)
    );
    return onSnapshot(q, (snapshot) => {
      const bookings: Booking[] = [];
      snapshot.forEach((doc) => {
        bookings.push(doc.data() as Booking);
      });
      const sorted = bookings.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      onUpdate(sorted);
    }, (error) => {
      console.warn("Notice subscribing to player bookings:", error);
      if (onError) onError(error);
    });
  },

  // Beta: Helper for clearing expired slots safely in frontend.
  // In production, use Cloud Scheduler + Cloud Functions.
  async releaseExpiredSlotLocks(pitchId?: string, date?: string): Promise<void> {
    console.log("Checking for expired slot locks...");
    try {
      const constraints: any[] = [];
      if (pitchId) constraints.push(where('pitchId', '==', pitchId));
      if (date) constraints.push(where('date', '==', date));
      
      // Only query if we have constraints to avoid massive scans
      if (constraints.length === 0) return;

      const q = query(collection(db, 'slotLocks'), ...constraints);
      const snapshot = await getDocs(q);
      
      if (snapshot.empty) return;

      const batch = writeBatch(db);
      let count = 0;
      const now = new Date().toISOString();

      snapshot.forEach(docSnap => {
        const data = docSnap.data();
        if (data.status === 'active' && data.expiresAt && data.expiresAt < now) {
            batch.update(docSnap.ref, {
               status: 'expired',
               releasedAt: now,
               releaseReason: 'payment_window_expired'
            });
            const slotKey = `${data.pitchId}_${data.date}_${data.time}`.replace(/[\/\s—:]/g, '-');
            const slotAvailRef = doc(db, 'slotAvailability', slotKey);
            batch.set(slotAvailRef, {
              id: slotKey,
              pitchId: data.pitchId,
              date: data.date,
              time: data.time,
              status: 'open',
              updatedAt: now
            }, { merge: true });
            count++;
        }
      });

      if (count > 0) {
        await batch.commit();
        console.log(`Released ${count} expired slot locks`);
      }
    } catch (error) {
      console.warn("Failed to release expired slot locks:", error);
    }
  },

  // Owner live slot toggle: Lock/Block for maintenance or walk-in, or unlock/open
  async toggleSlotBlock(pitchId: string, date: string, time: string, isBlocked: boolean, reason: string = 'maintenance'): Promise<void> {
    const slotKey = `${pitchId}_${date}_${time}`.replace(/[\/\s—:]/g, '-');
    const slotAvailRef = doc(db, 'slotAvailability', slotKey);
    const slotLockRef = doc(db, 'slotLocks', slotKey);
    const now = new Date().toISOString();

    try {
      if (isBlocked) {
        // Mark as blocked in availability
        await setDoc(slotAvailRef, {
          id: slotKey,
          pitchId,
          date,
          time,
          status: 'blocked',
          reason,
          updatedAt: now
        }, { merge: true });

        // Also record in slotLocks so conflict checking prevents bookings
        await setDoc(slotLockRef, {
          id: slotKey,
          pitchId,
          date,
          time,
          status: 'active',
          reason: `owner_block_${reason}`,
          createdAt: now,
          expiresAt: new Date(Date.now() + 86400000 * 365).toISOString() // Block indefinitely until unlocked
        }, { merge: true });
      } else {
        // Unlock / Open slot
        await setDoc(slotAvailRef, {
          id: slotKey,
          pitchId,
          date,
          time,
          status: 'open',
          updatedAt: now
        }, { merge: true });

        await setDoc(slotLockRef, {
          id: slotKey,
          pitchId,
          date,
          time,
          status: 'released',
          releaseReason: 'owner_unlocked',
          releasedAt: now
        }, { merge: true });
      }
    } catch (error) {
      console.error("Failed to toggle slot block status in Firestore:", error);
      throw error;
    }
  },

  // Subscribe to real-time slot availability for a pitch and date
  subscribeSlotAvailability(
    pitchId: string, 
    date: string, 
    onUpdate: (slots: SlotAvailability[]) => void, 
    onError?: (err: any) => void
  ): () => void {
    const q = query(
      collection(db, 'slotAvailability'),
      where('pitchId', '==', pitchId),
      where('date', '==', date)
    );

    return onSnapshot(
      q,
      (snapshot) => {
        const list: SlotAvailability[] = [];
        snapshot.forEach((docSnap) => {
          list.push(docSnap.data() as SlotAvailability);
        });
        onUpdate(list);
      },
      (error) => {
        console.warn('Slot availability listener error:', error);
        if (onError) onError(error);
      }
    );
  }
};

