import { Booking, SlotAvailability } from '../types/firebase';
import { BookingStatus, PaymentMethod } from '../types';
import { db, auth, handleFirestoreError, OperationType } from '../lib/firebase';
import { collection, doc, getDocs, getDoc, setDoc, updateDoc, deleteDoc, query, where, orderBy, runTransaction, writeBatch, onSnapshot } from 'firebase/firestore';
import { offlineCacheService } from './offlineCacheService';
import { slotAlertService } from './slotAlertService';
import { isValidTransactionRef, normalizeUgPhone } from '../utils/validation';

export const PENDING_BOOKING_EXPIRATION_MINUTES = 15;
export const PENDING_BOOKING_EXPIRATION_MS = PENDING_BOOKING_EXPIRATION_MINUTES * 60 * 1000;

/**
 * Returns the ISO string of the kickoff moment in Africa/Kampala time (UTC+3, no DST),
 * formatted as `${date}T${HH}:${MM}:00+03:00`.
 * date is 'YYYY-MM-DD'. Takes the first time found in the slot string
 * (handles "18:00", "18:00 - 19:00", "6:00 PM", "9:30 AM", etc.).
 * If parsing fails, returns 23:59 of that day at +03:00.
 */
export function getKickoffISO(date: string, slot: string): string {
  const fallback = `${date}T23:59:00+03:00`;
  if (!date || !slot || typeof slot !== 'string') return fallback;
  try {
    const trimmed = slot.trim();
    // 12-hour format with AM/PM e.g. "6:00 PM", "6 PM", "06:30 pm", "6:00 PM - 7:00 PM"
    const match12 = trimmed.match(/^(\d{1,2})(?::(\d{2}))?\s*(am|pm)/i);
    if (match12) {
      let hours = parseInt(match12[1], 10);
      const minutes = match12[2] ? parseInt(match12[2], 10) : 0;
      const meridiem = match12[3].toLowerCase();
      if (hours >= 1 && hours <= 12 && minutes >= 0 && minutes < 60) {
        if (meridiem === 'pm' && hours !== 12) hours += 12;
        else if (meridiem === 'am' && hours === 12) hours = 0;
        return `${date}T${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:00+03:00`;
      }
    }
    // 24-hour format e.g. "18:00", "18:00 - 19:00", "09:30"
    const match24 = trimmed.match(/^(\d{1,2}):(\d{2})/);
    if (match24) {
      const hours = parseInt(match24[1], 10);
      const minutes = parseInt(match24[2], 10);
      if (hours >= 0 && hours < 24 && minutes >= 0 && minutes < 60) {
        return `${date}T${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:00+03:00`;
      }
    }
    // 24-hour hour-only format e.g. "18", "18 - 19"
    const matchHourOnly = trimmed.match(/^(\d{1,2})(?:\s*-\s*\d{1,2}|$)/);
    if (matchHourOnly) {
      const hours = parseInt(matchHourOnly[1], 10);
      if (hours >= 0 && hours < 24) {
        return `${date}T${String(hours).padStart(2, '0')}:00:00+03:00`;
      }
    }
    return fallback;
  } catch {
    return fallback;
  }
}

/**
 * Checks if a TENTATIVE booking's hold window has expired.
 * Returns true when booking is TENTATIVE and holdExpiresAt is in the past.
 * Used by screens/components to derive and display an "Expired" hold state.
 */
export function isHoldExpired(booking: Partial<Booking> | null | undefined): boolean {
  if (!booking) return false;
  const isTentative =
    booking.status === BookingStatus.TENTATIVE ||
    (booking.status as any) === 'TENTATIVE';
  if (!isTentative) return false;

  const now = Date.now();
  if (booking.holdExpiresAt) {
    return new Date(booking.holdExpiresAt).getTime() <= now;
  }
  if (booking.createdAt) {
    return (new Date(booking.createdAt).getTime() + 48 * 60 * 60 * 1000) <= now;
  }
  return false;
}

export const MAX_OPEN_UNPAID_HOLDS = 1;

/**
 * Counts active open unpaid tentative holds for a user.
 * Discards PREEMPTED, CANCELLED, REJECTED, and expired holds (via isHoldExpired).
 */
export function countOpenUnpaidHolds(bookings: Array<Partial<Booking>> | Booking[] | null | undefined): number {
  if (!Array.isArray(bookings)) return 0;
  return bookings.filter((b) => {
    if (!b) return false;
    const status = b.status as any;
    // PREEMPTED, CANCELLED, REJECTED and expired holds do not count
    if (status === BookingStatus.PREEMPTED || status === 'PREEMPTED') return false;
    if (status === BookingStatus.CANCELLED || status === 'CANCELLED') return false;
    if (status === BookingStatus.REJECTED || status === 'REJECTED') return false;

    const isTentative =
      status === BookingStatus.TENTATIVE ||
      status === 'TENTATIVE';
    if (!isTentative) return false;

    if (isHoldExpired(b)) return false;

    // Treat a TENTATIVE booking with a missing holdExpiresAt as expired once its booking date is in the past (Africa/Kampala)
    if (!b.holdExpiresAt && b.date) {
      const todayKampala = new Intl.DateTimeFormat('en-CA', { timeZone: 'Africa/Kampala' }).format(new Date());
      if (b.date < todayKampala) return false;
    }

    return true;
  }).length;
}

export const ERROR_MESSAGES: Record<string, string> = {
  INVALID_HOLD: 'Invalid unpaid reservation details. Holds must use Cash payment, zero deposit, and tentative status.',
  CASH_ONLY_FOR_HOLDS: 'Cash payment is only available for pay-at-the-pitch unpaid reservations (tentative holds). Please pay a deposit or in full with MTN MoMo or Airtel Money.',
  PAYMENT_PROOF_REQUIRED: 'Please enter a valid mobile money transaction reference (6 to 25 characters, as on your MoMo message) or upload a payment screenshot.',
  PHONE_REQUIRED: 'A valid Ugandan phone number (e.g. 07XXXXXXXX or +2567XXXXXXXX) is required for unpaid reservations so the venue owner can contact you.',
  OPEN_HOLD_LIMIT: 'You already have an open unpaid reservation. Pay a deposit or cancel it to reserve another.',
  SLOT_ALREADY_BOOKED: 'This slot is already booked and confirmed by another squad.',
  SLOT_ALREADY_TENTATIVE: 'This slot is already held by another player. Pay a deposit to take it.'
};

export const bookingService = {
  collectionPath: 'bookings',
  ERROR_MESSAGES,
  MAX_OPEN_UNPAID_HOLDS,
  countOpenUnpaidHolds,

  async create(booking: Booking): Promise<Booking> {
    console.log(`Creating booking in ${this.collectionPath}`, booking);

    const isTentativeBooking =
      (booking.status as any) === BookingStatus.TENTATIVE ||
      (booking.status as any) === 'TENTATIVE';

    const normalizedPaymentMethod = String(booking.paymentMethod || '').trim().toUpperCase();

    // a) if bookingTier is TENTATIVE or status TENTATIVE: require paymentMethod CASH (case-insensitive), depositAmount 0 and status TENTATIVE, else throw Error('INVALID_HOLD').
    if (isTentativeBooking) {
      const isCash = normalizedPaymentMethod === 'CASH';
      const isDepositZero = Number(booking.depositAmount || 0) === 0;
      const isStatusTentative =
        (booking.status as any) === BookingStatus.TENTATIVE ||
        (booking.status as any) === 'TENTATIVE';
      if (!isCash || !isDepositZero || !isStatusTentative) {
        throw new Error('INVALID_HOLD');
      }
    }

    // b) if paymentMethod is CASH and tier is not TENTATIVE: throw Error('CASH_ONLY_FOR_HOLDS').
    if (normalizedPaymentMethod === 'CASH' && booking.bookingTier !== 'TENTATIVE') {
      throw new Error('CASH_ONLY_FOR_HOLDS');
    }

    // c) if status is PAYMENT_SUBMITTED: require isValidTransactionRef(transactionRef) OR a paymentProofUrl longer than 10 characters, else throw Error('PAYMENT_PROOF_REQUIRED').
    const isSubmitted =
      booking.status === BookingStatus.PAYMENT_SUBMITTED ||
      (booking.status as any) === 'PAYMENT_SUBMITTED';

    if (typeof booking.transactionRef === 'string') {
      booking.transactionRef = booking.transactionRef.trim();
    }

    if (isSubmitted) {
      const hasValidTxRef = isValidTransactionRef(booking.transactionRef);
      const hasValidProofUrl = typeof booking.paymentProofUrl === 'string' && booking.paymentProofUrl.trim().length > 10;
      if (!hasValidTxRef && !hasValidProofUrl) {
        throw new Error('PAYMENT_PROOF_REQUIRED');
      }
    }

    // d) holds only: require a valid phone (normalizeUgPhone(booking.playerPhone)); if invalid throw Error('PHONE_REQUIRED'); store the normalized value in playerPhone.
    if (isTentativeBooking) {
      const normalizedPhone = normalizeUgPhone(booking.playerPhone);
      if (!normalizedPhone) {
        throw new Error('PHONE_REQUIRED');
      }
      booking.playerPhone = normalizedPhone;
    }

    // e) holds only: before the transaction query the player's own bookings (where playerId == auth uid),
    // count those with status TENTATIVE that are not expired by isHoldExpired; if the count >= MAX_OPEN_UNPAID_HOLDS throw Error('OPEN_HOLD_LIMIT').
    // PREEMPTED, CANCELLED, REJECTED and expired holds do not count.
    if (isTentativeBooking) {
      const authUid = auth.currentUser?.uid || booking.playerId || booking.userId;
      if (authUid) {
        const qPlayer = query(
          collection(db, this.collectionPath),
          where('playerId', '==', authUid)
        );
        const playerSnap = await getDocs(qPlayer);
        const playerBookings: Booking[] = [];
        playerSnap.forEach((docSnap) => {
          playerBookings.push({ id: docSnap.id, ...docSnap.data() } as Booking);
        });
        const openHolds = countOpenUnpaidHolds(playerBookings);
        if (openHolds >= MAX_OPEN_UNPAID_HOLDS) {
          throw new Error('OPEN_HOLD_LIMIT');
        }
      }
    }
    try {
      const currentUserId = auth.currentUser?.uid || booking.playerId || booking.userId || "";
      const slots = booking.slots && booking.slots.length > 0 ? booking.slots : [booking.time];
      const bookingRef = doc(db, this.collectionPath, booking.id);

      const incomingTier: Booking['bookingTier'] = booking.bookingTier || 'FULL';
      const bumpedBookingsMap = new Map<string, {
        bookingId: string;
        userId: string;
        slots: string[];
        pitchId: string;
        date: string;
        time: string;
      }>();
      const otherSlotsToRelease: Array<{
        lockId: string;
        lockRef: any;
        pitchId: string;
        date: string;
        time: string;
      }> = [];

      await runTransaction(db, async (transaction) => {
        // ========================================================
        // (a) READ PHASE (All transaction reads before any writes)
        // ========================================================

        // 1. Read slot locks for all slots selected by the paying booking
        for (const slot of slots) {
          const slotLockId = `${booking.pitchId}_${booking.date}_${slot}`.replace(/[\/\s—:]/g, '-');
          const slotLockRef = doc(db, 'slotLocks', slotLockId);
          const slotLockDoc = await transaction.get(slotLockRef);

          if (slotLockDoc.exists()) {
            const data = slotLockDoc.data();
            const expiresAt = data.expiresAt ? new Date(data.expiresAt).getTime() : 0;
            const isExpired = expiresAt > 0 && expiresAt < Date.now();
            const isTentativeLock = data.status === 'tentative';

            if (isTentativeLock && !isExpired && data.userId !== currentUserId) {
              if (incomingTier === 'DEPOSIT' || incomingTier === 'FULL') {
                // Incoming guaranteed booking with deposit or full payment preempts the tentative hold!
                if (data.bookingId && !bumpedBookingsMap.has(data.bookingId)) {
                  const allSlots = Array.isArray(data.slots) && data.slots.length > 0
                    ? data.slots
                    : [data.time || slot];
                  bumpedBookingsMap.set(data.bookingId, {
                    bookingId: data.bookingId,
                    userId: data.userId || '',
                    slots: allSlots,
                    pitchId: data.pitchId || booking.pitchId,
                    date: data.date || booking.date,
                    time: data.time || slot
                  });
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

        // 2. Read slot locks for OTHER slots belonging to any bumped bookings (those not covered by the paying booking)
        const seenOtherLockIds = new Set<string>();
        for (const bumped of bumpedBookingsMap.values()) {
          for (const otherSlot of bumped.slots) {
            if (!slots.includes(otherSlot)) {
              const otherLockId = `${bumped.pitchId}_${bumped.date}_${otherSlot}`.replace(/[\/\s—:]/g, '-');
              if (!seenOtherLockIds.has(otherLockId)) {
                seenOtherLockIds.add(otherLockId);
                const otherLockRef = doc(db, 'slotLocks', otherLockId);
                const otherLockDoc = await transaction.get(otherLockRef);

                if (otherLockDoc.exists()) {
                  const otherData = otherLockDoc.data();
                  // Keep only those whose bookingId equals the bumped booking's id
                  if (otherData.bookingId === bumped.bookingId) {
                    otherSlotsToRelease.push({
                      lockId: otherLockId,
                      lockRef: otherLockRef,
                      pitchId: bumped.pitchId,
                      date: bumped.date,
                      time: otherSlot
                    });
                  }
                }
              }
            }
          }
        }

        // ========================================================
        // (b) WRITE PHASE (All transaction writes after reads)
        // ========================================================
        const nowIso = new Date().toISOString();

        // 1. Mark each bumped booking as PREEMPTED WITHOUT reading it (players cannot read other players' bookings)
        for (const bumped of bumpedBookingsMap.values()) {
          const bumpedBookingRef = doc(db, this.collectionPath, bumped.bookingId);
          transaction.update(bumpedBookingRef, {
            status: BookingStatus.PREEMPTED,
            preemptedAt: nowIso,
            preemptedByBookingId: booking.id,
            cancellationReason: 'Your tentative booking was reallocated to another squad who completed an instant deposit/full payment.',
            updatedAt: nowIso
          });
        }

        // 2. Release all other slots of bumped bookings (lock -> released, slotAvailability -> open)
        for (const item of otherSlotsToRelease) {
          transaction.update(item.lockRef, {
            status: 'released',
            releasedAt: nowIso,
            releaseReason: 'preempted'
          });

          const otherSlotAvailRef = doc(db, 'slotAvailability', item.lockId);
          transaction.set(otherSlotAvailRef, {
            id: item.lockId,
            pitchId: item.pitchId,
            date: item.date,
            time: item.time,
            status: 'open',
            updatedAt: nowIso
          }, { merge: true });
        }

        // 3. Notify the bumped player via a document in the `notifications` collection
        const pitchDisplayName = booking.turfName || booking.pitchName || 'the pitch';
        for (const bumped of bumpedBookingsMap.values()) {
          if (bumped.userId) {
            const notifRef = doc(collection(db, 'notifications'));
            const notifMessage = `Your unpaid reservation at ${pitchDisplayName} on ${bumped.date} ${bumped.time} was taken by a player who paid a deposit. Your other reserved hours at that pitch were released.`;
            transaction.set(notifRef, {
              id: notifRef.id,
              userId: bumped.userId,
              type: 'BOOKING_PREEMPTED',
              title: 'Your unpaid reservation was taken',
              message: notifMessage,
              body: notifMessage,
              bookingId: bumped.bookingId,
              pitchId: bumped.pitchId,
              read: false,
              isRead: false,
              createdAt: nowIso,
              updatedAt: nowIso
            });
          }
        }

        // 4. Write paying booking's own slot locks and slot availability mirrors (paying booking wins on shared slots)
        const isTentative = (incomingTier as any) === 'TENTATIVE';
        const hasPaymentProof =
          booking.status === BookingStatus.PAYMENT_SUBMITTED ||
          (booking.status as any) === 'PAYMENT_SUBMITTED' ||
          ((incomingTier === 'DEPOSIT' || incomingTier === 'FULL') &&
            Boolean(booking.transactionRef || booking.paymentProofUrl));

        const fifteenMinuteExpiryISO = new Date(Date.now() + PENDING_BOOKING_EXPIRATION_MS).toISOString();
        const primaryKickoffISO = getKickoffISO(booking.date, slots[0] || booking.time);

        const bookingHoldExpiresAt = hasPaymentProof
          ? primaryKickoffISO
          : isTentative
            ? primaryKickoffISO
            : fifteenMinuteExpiryISO;

        const slotLockStatus = isTentative ? 'tentative' : 'active';
        const slotAvailStatus = isTentative
          ? 'tentative'
          : (booking.status === BookingStatus.CONFIRMED || booking.status === BookingStatus.DEPOSIT_PAID ? 'booked' : 'held');

        for (const slot of slots) {
          const slotLockId = `${booking.pitchId}_${booking.date}_${slot}`.replace(/[\/\s—:]/g, '-');
          const slotLockRef = doc(db, 'slotLocks', slotLockId);
          
          const slotKickoffISO = getKickoffISO(booking.date, slot);
          const slotExpiresAt = hasPaymentProof
            ? slotKickoffISO
            : isTentative
              ? slotKickoffISO
              : fifteenMinuteExpiryISO;

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
            createdAt: nowIso,
            expiresAt: slotExpiresAt
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
            expiresAt: slotExpiresAt,
            updatedAt: nowIso
          });
        }

        // 5. Write paying booking document
        const safeBooking: Booking = {
          ...booking,
          playerId: currentUserId,
          bookingTier: incomingTier,
          status: booking.status || (isTentative ? BookingStatus.TENTATIVE : BookingStatus.PENDING_PAYMENT),
          holdExpiresAt: bookingHoldExpiresAt,
          updatedAt: nowIso
        };

        transaction.set(bookingRef, safeBooking);
      });

      // Notify window of any preemption so active UI/alerts update immediately
      if (bumpedBookingsMap.size > 0 && typeof window !== 'undefined') {
        const preemptedBookingIds = Array.from(bumpedBookingsMap.keys());
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
      // 1. ALL READS FIRST: Read booking document
      const snap = await transaction.get(bookingRef);
      if (!snap.exists()) throw new Error('Booking not found');
      const b = snap.data() as Booking;

      if (b.status === BookingStatus.PREEMPTED) {
        throw new Error('This tentative reservation has already been claimed by another squad.');
      }
      if (b.status === BookingStatus.CANCELLED) {
        throw new Error('This booking has been cancelled.');
      }

      const slots = b.slots && b.slots.length > 0 ? b.slots : [b.time];
      const pitchId = b.pitchId || b.turfId;

      // 2. ALL READS FIRST: Read all slotLocks before any writes
      const slotLockDataList: Array<{
        slot: string;
        slotLockId: string;
        slotLockRef: any;
        slotLockSnap: any;
        slotAvailRef: any;
        slotKickoffISO: string;
      }> = [];

      for (const slot of slots) {
        const slotLockId = `${pitchId}_${b.date}_${slot}`.replace(/[\/\s—:]/g, '-');
        const slotLockRef = doc(db, 'slotLocks', slotLockId);
        const slotLockSnap = await transaction.get(slotLockRef);
        const slotAvailRef = doc(db, 'slotAvailability', slotLockId);
        const slotKickoffISO = getKickoffISO(b.date, slot);

        slotLockDataList.push({
          slot,
          slotLockId,
          slotLockRef,
          slotLockSnap,
          slotAvailRef,
          slotKickoffISO,
        });
      }

      const earliestKickoffISO = slotLockDataList.length > 0
        ? [...slotLockDataList].map(d => d.slotKickoffISO).sort()[0]
        : getKickoffISO(b.date, slots[0] || b.time);

      const nextStatus = BookingStatus.PAYMENT_SUBMITTED;
      const nextPaymentStatus = tier === 'DEPOSIT' ? 'PARTIAL' : (paymentDetails.paymentProofUrl ? 'SUBMITTED' : 'PAID');
      const nowIso = new Date().toISOString();

      const updates: Partial<Booking> = {
        bookingTier: tier,
        status: nextStatus,
        paymentStatus: nextPaymentStatus,
        paymentMethod: paymentDetails.paymentMethod,
        paymentProofUrl: paymentDetails.paymentProofUrl || b.paymentProofUrl,
        transactionRef: paymentDetails.transactionRef ? paymentDetails.transactionRef.trim() : (b.transactionRef ? b.transactionRef.trim() : undefined),
        depositAmount: paymentDetails.depositAmount ?? (b.depositAmount || 0),
        balanceDue: paymentDetails.balanceDue ?? (b.balanceDue || 0),
        holdExpiresAt: earliestKickoffISO,
        paymentSubmittedAt: nowIso,
        updatedAt: nowIso
      };

      // 3. WRITES: Update booking document
      transaction.update(bookingRef, updates);
      updatedBooking = { ...b, ...updates };

      // 4. WRITES: Update slotLocks and slotAvailability for ALL slots
      for (const item of slotLockDataList) {
        if (item.slotLockSnap.exists()) {
          transaction.update(item.slotLockRef, {
            status: 'active',
            tier: tier,
            expiresAt: item.slotKickoffISO,
            updatedAt: nowIso
          });
        } else {
          transaction.set(item.slotLockRef, {
            id: item.slotLockId,
            pitchId: pitchId,
            date: b.date,
            time: item.slot,
            slots: slots,
            bookingId: b.id,
            userId: b.userId || b.playerId || '',
            status: 'active',
            tier: tier,
            createdAt: nowIso,
            expiresAt: item.slotKickoffISO
          });
        }

        transaction.set(item.slotAvailRef, {
          id: item.slotLockId,
          pitchId: pitchId,
          date: b.date,
          time: item.slot,
          status: 'held',
          bookingTier: tier,
          bookingId: b.id,
          expiresAt: item.slotKickoffISO,
          updatedAt: nowIso
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

  async cancelBooking(id: string, reason: string = 'Cancelled by player'): Promise<void> {
    const nowIso = new Date().toISOString();
    await this.update(id, {
      status: BookingStatus.CANCELLED,
      cancelledAt: nowIso,
      cancellationReason: reason,
      updatedAt: nowIso
    });
  },

  async update(id: string, data: Partial<Booking>): Promise<void> {
    console.log(`Updating booking ${id} in ${this.collectionPath}`, data);
    try {
      const bookingRef = doc(db, this.collectionPath, id);
      
      if (data.status === BookingStatus.CANCELLED || data.status === BookingStatus.REJECTED) {
        let alertData: { pitchId: string; date: string; time: string; turfName: string } | null = null;
        await runTransaction(db, async (transaction) => {
          const bookingDoc = await transaction.get(bookingRef);
          if (!bookingDoc.exists()) return;
          const b = bookingDoc.data() as Booking;

          // Guard: only trigger alerts if booking was not already cancelled or rejected
          if (b.status !== BookingStatus.CANCELLED && b.status !== BookingStatus.REJECTED) {
            alertData = {
              pitchId: b.pitchId || b.turfId || '',
              date: b.date,
              time: b.time || (b.slots && b.slots[0]) || '',
              turfName: b.turfName || b.pitchName || 'Pitch'
            };
          }

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

        // Trigger slot alerts once after cancel/reject transaction settles
        if (alertData && (alertData as any).pitchId && (alertData as any).date && (alertData as any).time) {
          try {
            await slotAlertService.triggerAlerts(
              (alertData as any).pitchId,
              (alertData as any).date,
              (alertData as any).time,
              (alertData as any).turfName
            );
          } catch (alertErr) {
            console.warn("Failed to trigger slot alerts after cancel/reject:", alertErr);
          }
        }
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

  /**
   * Confirms an unpaid reservation (tentative hold) by the pitch owner.
   * Runs in ONE transaction with all reads first:
   * 1. Reads the booking document and all associated slotLock documents.
   * 2. Verifies booking status is TENTATIVE and hold is not expired.
   * 3. Sets booking status CONFIRMED, approvedAt, updatedAt, keeps paymentStatus UNPAID and balanceDue = total.
   * 4. For every slot, sets slotLocks status 'active' with expiresAt = that slot's getKickoffISO and slotAvailability status 'booked' (merge).
   * 5. Creates a notification for the player:
   *    title: "Reservation confirmed"
   *    message: "<pitch> on <date> <time> is confirmed. Pay UGX <balance> at the pitch."
   */
  async confirmUnpaidReservation(booking: Booking): Promise<void> {
    const bookingId = booking.id;
    const bookingRef = doc(db, this.collectionPath, bookingId);
    const nowIso = new Date().toISOString();
    let balanceDueNumber = 0;
    let pitchName = '';
    let bookingDate = '';
    let bookingTime = '';
    let playerUserId = '';

    await runTransaction(db, async (transaction) => {
      // 1. ALL READS FIRST
      const bookingDoc = await transaction.get(bookingRef);
      if (!bookingDoc.exists()) {
        throw new Error('BOOKING_NOT_FOUND');
      }
      const b = bookingDoc.data() as Booking;

      if (b.status !== BookingStatus.TENTATIVE && (b.status as any) !== 'TENTATIVE') {
        throw new Error('NOT_A_TENTATIVE_RESERVATION');
      }

      if (this.isHoldExpired(b)) {
        throw new Error('RESERVATION_EXPIRED');
      }

      const pitchId = b.pitchId || b.turfId;
      const slots = b.slots && b.slots.length > 0 ? b.slots : [b.time];

      // Read all slot lock documents
      const lockDocsWithRefs = [];
      for (const slot of slots) {
        const slotLockId = `${pitchId}_${b.date}_${slot}`.replace(/[\/\s—:]/g, '-');
        const slotLockRef = doc(db, 'slotLocks', slotLockId);
        const slotLockDoc = await transaction.get(slotLockRef);
        const slotAvailRef = doc(db, 'slotAvailability', slotLockId);
        lockDocsWithRefs.push({ slot, slotLockId, slotLockRef, slotLockDoc, slotAvailRef });
      }

      // Compute total and balance due
      const bAny = b as any;
      const totalAmount = Number(bAny.totalAmount || b.totalPrice || b.price || 0);
      balanceDueNumber = bAny.balanceDue ?? totalAmount;
      pitchName = bAny.turfName || bAny.pitchName || 'Pitch';
      bookingDate = b.date;
      bookingTime = bAny.time || '';
      playerUserId = b.userId || bAny.playerId || '';

      // 2. WRITES PHASE
      transaction.update(bookingRef, {
        status: BookingStatus.CONFIRMED,
        approvedAt: nowIso,
        updatedAt: nowIso,
        paymentStatus: 'UNPAID',
        balanceDue: balanceDueNumber
      });

      for (const item of lockDocsWithRefs) {
        const slotKickoffISO = getKickoffISO(b.date, item.slot);
        if (item.slotLockDoc.exists()) {
          transaction.update(item.slotLockRef, {
            status: 'active',
            tier: 'CONFIRMED',
            expiresAt: slotKickoffISO,
            updatedAt: nowIso
          });
        } else {
          transaction.set(item.slotLockRef, {
            id: item.slotLockId,
            pitchId: pitchId,
            date: b.date,
            time: item.slot,
            slots: slots,
            bookingId: b.id,
            userId: b.userId || b.playerId,
            status: 'active',
            tier: 'CONFIRMED',
            createdAt: nowIso,
            expiresAt: slotKickoffISO
          });
        }

        transaction.set(item.slotAvailRef, {
          id: item.slotLockId,
          pitchId: pitchId,
          date: b.date,
          time: item.slot,
          status: 'booked',
          bookingTier: 'CONFIRMED',
          bookingId: b.id,
          expiresAt: slotKickoffISO,
          updatedAt: nowIso
        }, { merge: true });
      }
    });

    // 3. Create notification for player
    if (playerUserId) {
      try {
        const notifRef = doc(collection(db, 'notifications'));
        const notifMessage = `${pitchName} on ${bookingDate} ${bookingTime} is confirmed. Pay UGX ${balanceDueNumber.toLocaleString()} at the pitch.`;
        await setDoc(notifRef, {
          id: notifRef.id,
          userId: playerUserId,
          type: 'SYSTEM',
          title: 'Reservation confirmed',
          message: notifMessage,
          body: notifMessage,
          bookingId: bookingId,
          pitchId: booking.pitchId || booking.turfId,
          read: false,
          isRead: false,
          createdAt: nowIso,
          updatedAt: nowIso
        });
      } catch (notifErr) {
        console.warn("Could not create reservation confirmation notification:", notifErr);
      }
    }
  },

  /**
   * Declines an unpaid reservation by the pitch owner.
   * Reuses the existing reject/cancel path in bookingService.update to update status to REJECTED,
   * release slot locks, and update slotAvailability to open.
   * Creates a notification for the player:
   * title: "Reservation declined"
   * message: "Your reservation at <pitch> on <date> was declined by the owner."
   */
  async declineUnpaidReservation(booking: Booking, reason?: string): Promise<void> {
    const declineReason = reason || "Declined by owner";
    await this.update(booking.id, {
      status: BookingStatus.REJECTED,
      rejectionReason: declineReason
    });

    const playerUserId = booking.userId || booking.playerId;
    if (playerUserId) {
      try {
        const notifRef = doc(collection(db, 'notifications'));
        const pitchName = booking.turfName || booking.pitchName || 'the pitch';
        const notifMessage = `Your reservation at ${pitchName} on ${booking.date} was declined by the owner.`;
        const nowIso = new Date().toISOString();
        await setDoc(notifRef, {
          id: notifRef.id,
          userId: playerUserId,
          type: 'SYSTEM',
          title: 'Reservation declined',
          message: notifMessage,
          body: notifMessage,
          bookingId: booking.id,
          pitchId: booking.pitchId || booking.turfId,
          read: false,
          isRead: false,
          createdAt: nowIso,
          updatedAt: nowIso
        });
      } catch (notifErr) {
        console.warn("Could not create decline notification:", notifErr);
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
   * Helper to check if a tentative hold has expired.
   */
  isHoldExpired(booking: Partial<Booking> | null | undefined): boolean {
    return isHoldExpired(booking);
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
      booking.status === BookingStatus.PREEMPTED ||
      booking.status === BookingStatus.PAYMENT_SUBMITTED ||
      (booking.status as any) === 'PAYMENT_SUBMITTED' ||
      booking.status === BookingStatus.DEPOSIT_PAID ||
      (booking.status as any) === 'DEPOSIT_PAID'
    ) {
      return false;
    }

    // If payment was verified/paid or deposit was already secured, or payment proof submitted, not pending expiration
    if (
      booking.paymentStatus === 'PAID' || 
      booking.paymentStatus === 'APPROVED' || 
      booking.paymentStatus === 'SUBMITTED' ||
      (booking.paymentStatus as any) === 'PARTIAL' ||
      Boolean(booking.transactionRef || booking.paymentProofUrl) ||
      (booking.bookingTier === 'DEPOSIT' && booking.depositAmount && booking.depositAmount > 0 && booking.paymentStatus === 'PARTIAL')
    ) {
      return false;
    }

    const now = Date.now();

    // Special handling for Tentative reservations:
    // They are NOT subject to the 15-minute payment countdown window!
    // They remain active for up to 48 hours (or kick-off time) unless preempted by a paying customer.
    if (booking.status === BookingStatus.TENTATIVE) {
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
      booking.status === BookingStatus.PAYMENT_SUBMITTED ||
      (booking.status as any) === 'PAYMENT_SUBMITTED' ||
      booking.paymentStatus === 'PAID' ||
      booking.paymentStatus === 'APPROVED' ||
      booking.paymentStatus === 'SUBMITTED' ||
      (booking.paymentStatus as any) === 'PARTIAL' ||
      Boolean(booking.transactionRef || booking.paymentProofUrl) ||
      booking.status === BookingStatus.TENTATIVE
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
      let didRelease = false;
      const nowIso = new Date().toISOString();

      await runTransaction(db, async (transaction) => {
        const bookingDoc = await transaction.get(bookingRef);
        if (!bookingDoc.exists()) return;
        const b = bookingDoc.data() as Booking;

        // Skip if already confirmed, checked in, paid, or submitted payment proof / deposit paid
        const isPaidOrSubmitted =
          b.status === BookingStatus.CONFIRMED ||
          b.status === BookingStatus.COMPLETED ||
          b.status === BookingStatus.CHECKED_IN ||
          b.status === BookingStatus.PAYMENT_SUBMITTED ||
          (b.status as any) === 'PAYMENT_SUBMITTED' ||
          b.status === BookingStatus.DEPOSIT_PAID ||
          (b.status as any) === 'DEPOSIT_PAID' ||
          b.paymentStatus === 'PAID' ||
          b.paymentStatus === 'APPROVED' ||
          b.paymentStatus === 'SUBMITTED' ||
          (b.paymentStatus as any) === 'PARTIAL' ||
          Boolean(b.transactionRef || b.paymentProofUrl);

        if (isPaidOrSubmitted) {
          console.log(`Skipping auto-release for booking ${bookingId}: status is ${b.status}, paymentStatus is ${b.paymentStatus}, or proof attached.`);
          return;
        }

        // Only PENDING_PAYMENT without proof may be auto-cancelled
        didRelease = true;
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

      if (!didRelease) {
        return false;
      }

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
      return false;
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
        const isExpired = Boolean(data.expiresAt && data.expiresAt < now);
        if (!isExpired) return;

        const isTentativeLock = data.status === 'tentative';

        if (isTentativeLock) {
          // Release expired tentative hold without attempting to modify the other player's booking document (security rules forbid it)
          batch.update(docSnap.ref, {
            status: 'released',
            releasedAt: now,
            releaseReason: 'hold_expired'
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
          // Do NOT add to associatedBookingIds
        } else if (data.status === 'active') {
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

