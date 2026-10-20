import { Booking, SlotAvailability } from '../types/firebase';
import { BookingStatus, PaymentMethod } from '../types';
import { db, auth, handleFirestoreError, OperationType } from '../lib/firebase';
import { collection, doc, getDocs, getDoc, setDoc, updateDoc, deleteDoc, query, where, orderBy, runTransaction, writeBatch, onSnapshot } from 'firebase/firestore';
import { offlineCacheService } from './offlineCacheService';
import { slotAlertService } from './slotAlertService';

export const PENDING_BOOKING_EXPIRATION_MINUTES = 15;
export const PENDING_BOOKING_EXPIRATION_MS = PENDING_BOOKING_EXPIRATION_MINUTES * 60 * 1000;

export const bookingService = {
  collectionPath: 'bookings',

  async create(booking: Booking): Promise<Booking> {
    console.log(`Creating booking in ${this.collectionPath}`, booking);
    if (booking.bookingTier === 'TENTATIVE' || (booking.status as any) === BookingStatus.TENTATIVE || (booking.status as any) === 'TENTATIVE') {
      throw new Error('Tentative reservations are no longer supported for new bookings. Please secure your slot with a deposit or full payment.');
    }
    if (String(booking.paymentMethod || '').trim().toUpperCase() === 'CASH') {
      throw new Error('Cash payments are not supported for new bookings. Please pay using MTN MoMo or Airtel Money.');
    }
    try {
      const currentUserId = auth.currentUser?.uid || booking.playerId || booking.userId || "";
      const slots = booking.slots && booking.slots.length > 0 ? booking.slots : [booking.time];
      const bookingRef = doc(db, this.collectionPath, booking.id);

      const incomingTier: Booking['bookingTier'] = booking.bookingTier || 'FULL';
      const preemptedBookingIds: string[] = [];

      await runTransaction(db, async (transaction) => {
        // 1. Check all slot locks in transaction
        for (const slot of slots) {
          const slotLockId = `${booking.pitchId}_${booking.date}_${slot}`.replace(/[\/\s—:]/g, '-');
          const slotLockRef = doc(db, 'slotLocks', slotLockId);
          const slotLockDoc = await transaction.get(slotLockRef);

          if (slotLockDoc.exists()) {
            const data = slotLockDoc.data();
            const expiresAt = data.expiresAt ? new Date(data.expiresAt).getTime() : 0;
            const isExpired = expiresAt > 0 && expiresAt < Date.now();
            const isTentativeLock = data.status === 'tentative' || data.tier === 'TENTATIVE';

            if (isTentativeLock && !isExpired && data.userId !== currentUserId) {
              if (incomingTier === 'DEPOSIT' || incomingTier === 'FULL') {
                // Incoming guaranteed booking with deposit or full payment preempts the tentative hold!
                if (data.bookingId && !preemptedBookingIds.includes(data.bookingId)) {
                  preemptedBookingIds.push(data.bookingId);
                }
              } else {
                // Incoming booking is ALSO tentative - cannot overwrite an existing tentative booking with another tentative hold!
                throw new Error('SLOT_ALREADY_TENTATIVE');
              }
            } else if (data.status === 'active' && !isExpired && data.userId !== currentUserId) {
              throw new Error('SLOT_ALREADY_BOOKED');
            }
          }
        }

        // Preempt any existing tentative bookings found on the chosen slots
        for (const oldBookingId of preemptedBookingIds) {
          const oldBookingRef = doc(db, this.collectionPath, oldBookingId);
          const oldBookingDoc = await transaction.get(oldBookingRef);
          if (oldBookingDoc.exists()) {
            transaction.update(oldBookingRef, {
              status: BookingStatus.PREEMPTED,
              preemptedAt: new Date().toISOString(),
              preemptedByBookingId: booking.id,
              cancellationReason: 'Your tentative booking was reallocated to another squad who completed an instant deposit/full payment.',
              updatedAt: new Date().toISOString()
            });
          }
        }

        // 2. Write slot locks and lightweight slot availability mirrors
        const isTentative = (incomingTier as any) === 'TENTATIVE';
        const expiresAt = isTentative
          // Tentative holds stay active provisionally until kick-off or 48 hours
          ? new Date(Date.now() + 48 * 60 * 60 * 1000)
          // Instant full/deposit with pending payment gets 15-minute checkout window
          : new Date(Date.now() + PENDING_BOOKING_EXPIRATION_MS);

        const slotLockStatus = isTentative ? 'tentative' : 'active';
        const slotAvailStatus = isTentative
          ? 'tentative'
          : (booking.status === BookingStatus.CONFIRMED || booking.status === BookingStatus.DEPOSIT_PAID ? 'booked' : 'held');

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
            status: slotLockStatus,
            tier: incomingTier,
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
            status: slotAvailStatus,
            bookingTier: incomingTier,
            bookingId: booking.id,
            expiresAt: expiresAt.toISOString(),
            updatedAt: new Date().toISOString()
          });
        }

        // 3. Write booking document
        const safeBooking: Booking = {
          ...booking,
          playerId: currentUserId,
          bookingTier: incomingTier,
          status: booking.status || (isTentative ? BookingStatus.TENTATIVE : BookingStatus.PENDING_PAYMENT),
          holdExpiresAt: expiresAt.toISOString(),
          updatedAt: new Date().toISOString()
        };

        transaction.set(bookingRef, safeBooking);
      });

      // Notify window of any preemption so active UI/alerts update immediately
      if (preemptedBookingIds.length > 0 && typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('pitchly:tentative_booking_preempted', {
          detail: { preemptedBookingIds, newBookingId: booking.id }
        }));
      }

      return { ...booking };
    } catch (error: any) {
      console.error("Failed to execute booking transaction", error);
      if (error.message === 'SLOT_ALREADY_BOOKED') {
        throw new Error('One or more of your selected time slots are no longer available. The schedule has been updated. Please select another time.');
      }
      if (error.message === 'SLOT_ALREADY_TENTATIVE') {
        throw new Error('This time slot is already tentatively held by another squad. To claim this slot, you must pay a deposit or pay in full.');
      }
      handleFirestoreError(error, OperationType.WRITE, this.collectionPath);
      throw error;
    }
  },

  /**
   * Upgrade a tentative reservation to a guaranteed booking (Deposit or Full Payment)
   */
  async upgradeTentativeBooking(
    bookingId: string,
    tier: 'DEPOSIT' | 'FULL',
    paymentDetails: {
      paymentMethod: PaymentMethod;
      paymentProofUrl?: string;
      transactionRef?: string;
      depositAmount?: number;
      balanceDue?: number;
    }
  ): Promise<Booking> {
    const bookingRef = doc(db, this.collectionPath, bookingId);
    let updatedBooking: Booking | null = null;

    await runTransaction(db, async (transaction) => {
      const snap = await transaction.get(bookingRef);
      if (!snap.exists()) throw new Error('Booking not found');
      const b = snap.data() as Booking;

      if (b.status === BookingStatus.PREEMPTED) {
        throw new Error('This tentative reservation has already been claimed by another squad.');
      }
      if (b.status === BookingStatus.CANCELLED) {
        throw new Error('This booking has been cancelled.');
      }

      const nextStatus = BookingStatus.PAYMENT_SUBMITTED;
      const nextPaymentStatus = tier === 'DEPOSIT' ? 'PARTIAL' : (paymentDetails.paymentProofUrl ? 'SUBMITTED' : 'PAID');

      const updates: Partial<Booking> = {
        bookingTier: tier,
        status: nextStatus,
        paymentStatus: nextPaymentStatus,
        paymentMethod: paymentDetails.paymentMethod,
        paymentProofUrl: paymentDetails.paymentProofUrl || b.paymentProofUrl,
        transactionRef: paymentDetails.transactionRef || b.transactionRef,
        depositAmount: paymentDetails.depositAmount ?? (b.depositAmount || 0),
        balanceDue: paymentDetails.balanceDue ?? (b.balanceDue || 0),
        paymentSubmittedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      transaction.update(bookingRef, updates);
      updatedBooking = { ...b, ...updates };

      const slots = b.slots && b.slots.length > 0 ? b.slots : [b.time];
      for (const slot of slots) {
        const slotLockId = `${b.pitchId || b.turfId}_${b.date}_${slot}`.replace(/[\/\s—:]/g, '-');
        const slotLockRef = doc(db, 'slotLocks', slotLockId);
        const slotLockSnap = await transaction.get(slotLockRef);

        if (slotLockSnap.exists()) {
          transaction.update(slotLockRef, {
            status: 'active',
            tier: tier,
            expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString()
          });
        }

        const slotAvailRef = doc(db, 'slotAvailability', slotLockId);
        transaction.set(slotAvailRef, {
          id: slotLockId,
          pitchId: b.pitchId || b.turfId,
          date: b.date,
          time: slot,
          status: 'booked',
          bookingTier: tier,
          bookingId: b.id,
          updatedAt: new Date().toISOString()
        }, { merge: true });
      }
    });

    if (!updatedBooking) throw new Error('Failed to upgrade booking');
    return updatedBooking;
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
      const sorted = bookings.sort((a, b) => new Date(b.createdAt || b.date).getTime() - new Date(a.createdAt || a.date).getTime());
      if (sorted.length > 0) {
        offlineCacheService.cacheUserBookings(playerId, sorted);
        return sorted;
      }
      const cached = offlineCacheService.getCachedUserBookings(playerId);
      return cached.length > 0 ? cached : [];
    } catch (error) {
      console.warn("Failed to fetch player bookings from Firestore, using offline cache", error);
      return offlineCacheService.getCachedUserBookings(playerId);
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
      const sorted = bookings.sort((a, b) => new Date(b.createdAt || b.date).getTime() - new Date(a.createdAt || a.date).getTime());
      if (sorted.length > 0) {
        offlineCacheService.cacheOwnerBookings(ownerId, sorted);
        return sorted;
      }
      const cached = offlineCacheService.getCachedOwnerBookings(ownerId);
      return cached.length > 0 ? cached : [];
    } catch (error) {
      console.warn("Failed to fetch owner bookings from Firestore, using offline cache", error);
      return offlineCacheService.getCachedOwnerBookings(ownerId);
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
          const sorted = bookings.sort((a, b) => new Date(b.createdAt || b.date).getTime() - new Date(a.createdAt || a.date).getTime());
          offlineCacheService.cacheOwnerBookings(ownerId, sorted);
          onUpdate(sorted);
        },
        (error) => {
          console.warn("Error in owner booking subscription, falling back to cache:", error);
          const cached = offlineCacheService.getCachedOwnerBookings(ownerId);
          if (cached.length > 0) onUpdate(cached);
          if (onError) onError(error);
        }
      );
    } catch (err) {
      console.warn("Failed to establish snapshot listener for owner bookings, using cache:", err);
      const cached = offlineCacheService.getCachedOwnerBookings(ownerId);
      if (cached.length > 0) onUpdate(cached);
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

  /**
   * Helper to check if a booking is pending and has exceeded the 15-minute payment window.
   */
  isPendingBookingExpired(booking: Partial<Booking>): boolean {
    if (!booking) return false;
    // Finished, cancelled, reallocated, or terminal bookings are not eligible for auto-release
    if (
      booking.status === BookingStatus.CONFIRMED ||
      booking.status === BookingStatus.COMPLETED ||
      booking.status === BookingStatus.CHECKED_IN ||
      booking.status === BookingStatus.CANCELLED ||
      booking.status === BookingStatus.REJECTED ||
      booking.status === BookingStatus.PREEMPTED
    ) {
      return false;
    }

    // If payment was verified/paid or deposit was already secured, not pending expiration
    if (
      booking.paymentStatus === 'PAID' || 
      booking.paymentStatus === 'APPROVED' || 
      booking.status === BookingStatus.DEPOSIT_PAID || 
      (booking.bookingTier === 'DEPOSIT' && booking.depositAmount && booking.depositAmount > 0 && booking.paymentStatus === 'PARTIAL')
    ) {
      return false;
    }

    const now = Date.now();

    // Special handling for Tentative reservations:
    // They are NOT subject to the 15-minute payment countdown window!
    // They remain active for up to 48 hours (or kick-off time) unless preempted by a paying customer.
    if (booking.status === BookingStatus.TENTATIVE || booking.bookingTier === 'TENTATIVE') {
      if (booking.holdExpiresAt) {
        return new Date(booking.holdExpiresAt).getTime() <= now;
      }
      if (booking.createdAt) {
        return (new Date(booking.createdAt).getTime() + 48 * 60 * 60 * 1000) <= now;
      }
      return false;
    }

    // Check if status represents pending payment or unconfirmed hold
    const isPending =
      booking.status === BookingStatus.PENDING_PAYMENT ||
      booking.status === BookingStatus.PENDING ||
      (booking.status as any) === 'temporarily_held' ||
      booking.paymentStatus === 'UNPAID';

    if (!isPending) return false;

    if (booking.holdExpiresAt) {
      return new Date(booking.holdExpiresAt).getTime() <= now;
    }
    if (booking.createdAt) {
      return (new Date(booking.createdAt).getTime() + PENDING_BOOKING_EXPIRATION_MS) <= now;
    }
    return false;
  },

  /**
   * Calculates remaining time in the 15-minute payment window in milliseconds.
   */
  getRemainingPaymentTimeMs(booking: Partial<Booking>): number {
    if (!booking) return 0;
    if (
      booking.status === BookingStatus.CONFIRMED ||
      booking.status === BookingStatus.COMPLETED ||
      booking.status === BookingStatus.CHECKED_IN ||
      booking.status === BookingStatus.PREEMPTED ||
      booking.status === BookingStatus.CANCELLED ||
      booking.status === BookingStatus.REJECTED ||
      booking.status === BookingStatus.DEPOSIT_PAID ||
      booking.paymentStatus === 'PAID' ||
      booking.paymentStatus === 'APPROVED' ||
      booking.status === BookingStatus.TENTATIVE ||
      booking.bookingTier === 'TENTATIVE'
    ) {
      return 0;
    }

    const expiryTime = booking.holdExpiresAt
      ? new Date(booking.holdExpiresAt).getTime()
      : booking.createdAt
        ? new Date(booking.createdAt).getTime() + PENDING_BOOKING_EXPIRATION_MS
        : Date.now() + PENDING_BOOKING_EXPIRATION_MS;

    return Math.max(0, expiryTime - Date.now());
  },

  /**
   * Releases an individual pending booking:
   * 1. Marks booking status as CANCELLED with expiration explanation.
   * 2. Marks slot locks as expired with reason 'payment_window_expired_15min'.
   * 3. Sets public slotAvailability mirror back to 'open' so other players can book it immediately.
   * 4. Triggers slotAlertService notifications for waiting subscribers.
   * 5. Dispatches local browser event 'pitchly:pending_booking_released'.
   */
  async releasePendingBooking(
    bookingId: string,
    reason: string = 'Payment window expired (15-minute window exceeded without completed payment)'
  ): Promise<boolean> {
    console.log(`Auto-releasing pending booking: ${bookingId}. Reason: ${reason}`);
    try {
      const bookingRef = doc(db, this.collectionPath, bookingId);
      let pitchId = '';
      let turfName = 'Pitch';
      let date = '';
      let time = '';
      let slots: string[] = [];
      const nowIso = new Date().toISOString();

      await runTransaction(db, async (transaction) => {
        const bookingDoc = await transaction.get(bookingRef);
        if (!bookingDoc.exists()) return;
        const b = bookingDoc.data() as Booking;

        // Skip if already confirmed, checked in, or paid
        if (
          b.status === BookingStatus.CONFIRMED ||
          b.status === BookingStatus.COMPLETED ||
          b.status === BookingStatus.CHECKED_IN ||
          b.paymentStatus === 'PAID' ||
          b.paymentStatus === 'APPROVED'
        ) {
          return;
        }

        pitchId = b.pitchId || b.turfId || '';
        turfName = b.turfName || b.pitchName || 'Pitch';
        date = b.date;
        time = b.time;
        slots = b.slots && b.slots.length > 0 ? b.slots : [b.time];

        // 1. Mark booking CANCELLED with auto-release audit reason
        transaction.update(bookingRef, {
          status: BookingStatus.CANCELLED,
          cancellationReason: reason,
          cancelledAt: nowIso,
          updatedAt: nowIso
        });

        // 2. Release all associated slot locks
        for (const slot of slots) {
          const slotLockId = `${pitchId}_${b.date}_${slot}`.replace(/[\/\s—:]/g, '-');
          const slotLockRef = doc(db, 'slotLocks', slotLockId);
          const slotLockDoc = await transaction.get(slotLockRef);

          if (slotLockDoc.exists()) {
            transaction.update(slotLockRef, {
              status: 'expired',
              releasedAt: nowIso,
              releaseReason: 'payment_window_expired_15min'
            });
          }

          // 3. Mark lightweight public slot mirror as open immediately
          const slotAvailRef = doc(db, 'slotAvailability', slotLockId);
          transaction.set(slotAvailRef, {
            id: slotLockId,
            pitchId: pitchId,
            date: b.date,
            time: slot,
            status: 'open',
            updatedAt: nowIso
          }, { merge: true });
        }
      });

      // 4. Trigger alert subscribers if any player registered an alert for this slot
      if (pitchId && date && time) {
        try {
          await slotAlertService.triggerAlerts(pitchId, date, time, turfName);
        } catch (alertErr) {
          console.warn("Failed to trigger slot alerts on booking auto-release:", alertErr);
        }
      }

      // 5. Dispatch event so UI screens can immediately react
      if (typeof window !== 'undefined') {
        window.dispatchEvent(
          new CustomEvent('pitchly:pending_booking_released', {
            detail: { bookingId, pitchId, date, slots, reason }
          })
        );
      }

      return true;
    } catch (error) {
      console.error(`Failed to release pending booking ${bookingId}:`, error);
      // Fallback single-document update if transaction encountered contention
      try {
        await updateDoc(doc(db, this.collectionPath, bookingId), {
          status: BookingStatus.CANCELLED,
          cancellationReason: reason,
          cancelledAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        });
        return true;
      } catch (fallbackErr) {
        console.error(`Fallback release updateDoc failed for ${bookingId}:`, fallbackErr);
        return false;
      }
    }
  },

  /**
   * Main function to automatically release pending bookings if the user does not complete payment
   * within the 15-minute window.
   */
  async autoReleasePendingBookings(options?: {
    pitchId?: string;
    date?: string;
    userId?: string;
    bookingId?: string;
    forceNow?: boolean;
  }): Promise<{ releasedCount: number; releasedBookingIds: string[] }> {
    console.log("Checking and auto-releasing expired pending bookings (15m window)...", options);
    const releasedBookingIds: string[] = [];

    try {
      // Direct single booking release check
      if (options?.bookingId) {
        const b = await this.getById(options.bookingId);
        if (b && (options.forceNow || this.isPendingBookingExpired(b))) {
          const ok = await this.releasePendingBooking(
            options.bookingId,
            'Payment window expired (15-minute window exceeded without completed payment)'
          );
          if (ok) releasedBookingIds.push(options.bookingId);
        }
        return { releasedCount: releasedBookingIds.length, releasedBookingIds };
      }

      const currentUid = auth.currentUser?.uid || options?.userId;
      const queries = [];

      if (options?.pitchId && options?.date) {
        queries.push(
          query(
            collection(db, this.collectionPath),
            where('pitchId', '==', options.pitchId),
            where('date', '==', options.date)
          )
        );
      } else if (currentUid) {
        queries.push(
          query(
            collection(db, this.collectionPath),
            where('playerId', '==', currentUid)
          )
        );
        queries.push(
          query(
            collection(db, this.collectionPath),
            where('userId', '==', currentUid)
          )
        );
      }

      const docMap = new Map<string, Booking>();
      for (const q of queries) {
        try {
          const snap = await getDocs(q);
          snap.forEach((d) => {
            docMap.set(d.id, { id: d.id, ...d.data() } as Booking);
          });
        } catch (err) {
          console.warn("Notice querying bookings in autoReleasePendingBookings:", err);
        }
      }

      // Check cached bookings for any pending items needing release
      if (currentUid) {
        const cached = offlineCacheService.getCachedUserBookings(currentUid);
        for (const b of cached) {
          if (!docMap.has(b.id)) {
            docMap.set(b.id, b);
          }
        }
      }

      // Evaluate and release each expired pending booking
      for (const booking of docMap.values()) {
        if (options?.forceNow || this.isPendingBookingExpired(booking)) {
          console.log(`Booking ${booking.id} pending payment exceeded 15 minutes. Releasing now.`);
          const released = await this.releasePendingBooking(
            booking.id,
            'Payment window expired (15-minute window exceeded without completed payment)'
          );
          if (released) {
            releasedBookingIds.push(booking.id);
          }
        }
      }

      // Clean up any remaining expired slotLocks for this pitch or user
      await this.releaseExpiredSlotLocks(options?.pitchId, options?.date);

      return { releasedCount: releasedBookingIds.length, releasedBookingIds };
    } catch (err) {
      console.error("Error running autoReleasePendingBookings:", err);
      return { releasedCount: releasedBookingIds.length, releasedBookingIds };
    }
  },

  // Helper for clearing expired slots safely in frontend.
  async releaseExpiredSlotLocks(pitchId?: string, date?: string): Promise<void> {
    console.log("Checking for expired slot locks...");
    try {
      const constraints: any[] = [];
      if (pitchId) constraints.push(where('pitchId', '==', pitchId));
      if (date) constraints.push(where('date', '==', date));
      
      const q = constraints.length > 0
        ? query(collection(db, 'slotLocks'), ...constraints)
        : query(collection(db, 'slotLocks'));
      const snapshot = await getDocs(q);
      
      if (snapshot.empty) return;

      const batch = writeBatch(db);
      let count = 0;
      const now = new Date().toISOString();
      const associatedBookingIds = new Set<string>();

      snapshot.forEach(docSnap => {
        const data = docSnap.data();
        if (data.status === 'active' && data.expiresAt && data.expiresAt < now) {
            batch.update(docSnap.ref, {
               status: 'expired',
               releasedAt: now,
               releaseReason: 'payment_window_expired_15min'
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

            if (data.bookingId) {
              associatedBookingIds.add(data.bookingId);
            }
        }
      });

      if (count > 0) {
        await batch.commit();
        console.log(`Released ${count} expired slot locks`);
      }

      // Release any pending bookings that held those expired slot locks
      for (const bookingId of associatedBookingIds) {
        await this.releasePendingBooking(
          bookingId,
          'Payment window expired (15-minute window exceeded without completed payment)'
        );
      }
    } catch (error) {
      console.warn("Failed to release expired slot locks:", error);
    }
  },

  /**
   * Starts a background polling interval that continuously monitors and automatically
   * releases pending bookings that have crossed the 15-minute expiration threshold.
   * Returns a cleanup function to cancel the interval on unmount.
   */
  startAutoReleaseInterval(intervalMs: number = 30000): () => void {
    const timer = setInterval(() => {
      this.autoReleasePendingBookings().catch((err) => {
        console.warn("Periodic auto-release error:", err);
      });
    }, intervalMs);

    return () => clearInterval(timer);
  },

  // Owner live slot toggle: Lock/Block for maintenance or walk-in, or unlock/open
  async toggleSlotBlock(pitchId: string, date: string, time: string, isBlocked: boolean, reason: string = 'maintenance'): Promise<void> {
    const currentUserId = auth.currentUser?.uid;
    if (!currentUserId) {
      throw new Error('You must be signed in as a pitch owner or manager to block or unblock slots.');
    }

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
          userId: currentUserId,
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
          userId: currentUserId,
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

