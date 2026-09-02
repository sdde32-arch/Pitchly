import { db } from '../lib/firebase';
import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  onSnapshot,
  orderBy,
  limit,
} from 'firebase/firestore';
import {
  MatchInvitation,
  MatchInvitationCreatorRole,
  MatchInvitationResponseStatus,
  MatchInvitationStatus,
  Notification,
} from '../types/firebase';
import { notificationService } from './notificationService';

export const calculate24hBeforeExpiry = (dateStr: string, timeStr: string): string => {
  try {
    if (!dateStr) return new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
    // Parse Date (YYYY-MM-DD)
    const [year, month, day] = dateStr.split('-').map(Number);
    
    // Parse time (e.g. "07:00 PM", "19:00", "7:00 PM")
    let hours = 19;
    let minutes = 0;
    
    if (timeStr) {
      const isPM = timeStr.toLowerCase().includes('pm');
      const isAM = timeStr.toLowerCase().includes('am');
      const cleanTime = timeStr.replace(/[^0-9:]/g, '');
      const parts = cleanTime.split(':').map(Number);
      hours = parts[0] || 19;
      minutes = parts[1] || 0;
      
      if (isPM && hours < 12) hours += 12;
      if (isAM && hours === 12) hours = 0;
    }
    
    const matchKickoffDate = new Date(year, (month || 1) - 1, day || 1, hours, minutes);
    // 24 hours before match kickoff
    const expiryDate = new Date(matchKickoffDate.getTime() - 24 * 60 * 60 * 1000);
    
    // If 24 hours before is already in the past, default to match kickoff or 2 hours from now
    if (expiryDate.getTime() <= Date.now()) {
      return new Date(matchKickoffDate.getTime() - 2 * 60 * 60 * 1000).toISOString();
    }
    
    return expiryDate.toISOString();
  } catch (err) {
    console.warn("Error calculating expiry, defaulting to 24h from now", err);
    return new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
  }
};

export const matchInvitationService = {
  collectionPath: 'matchInvitations',

  /**
   * Query previous bookers of a specific pitch (excluding cancelled/rejected)
   */
  async getPreviousBookersForPitch(pitchId: string, excludeUserId?: string): Promise<string[]> {
    if (!pitchId) return [];
    try {
      const q = query(
        collection(db, 'bookings'),
        where('pitchId', '==', pitchId)
      );
      const snapshot = await getDocs(q);
      const userIds = new Set<string>();

      snapshot.forEach((docSnap) => {
        const data = docSnap.data();
        const status = data.status?.toLowerCase?.() || '';
        if (status !== 'cancelled' && status !== 'rejected') {
          const uid = data.playerId || data.userId;
          if (uid && uid !== excludeUserId) {
            userIds.add(uid);
          }
        }
      });

      return Array.from(userIds);
    } catch (err) {
      console.warn("Error fetching previous bookers for pitch:", err);
      return [];
    }
  },

  /**
   * Create a new match proposal before booking
   */
  async createProposal(params: {
    creatorId: string;
    creatorName?: string;
    creatorAvatar?: string;
    creatorPhone?: string;
    creatorRole: MatchInvitationCreatorRole;
    pitchId: string;
    pitchName?: string;
    pitchLocation?: string;
    pitchImage?: string;
    pricePerHour?: number;
    proposedDateTime: string;
    date: string;
    time: string;
    playersNeeded: number;
    invitedUserIds: string[];
    broadcastToPreviousBookers: boolean;
    notes?: string;
  }): Promise<MatchInvitation> {
    const inviteDocRef = doc(collection(db, this.collectionPath));
    const inviteId = inviteDocRef.id;

    let targetInvitedUserIds = [...(params.invitedUserIds || [])];

    // If owner/staff broadcast mode is chosen, query previous bookers
    if (params.broadcastToPreviousBookers && params.pitchId) {
      const previousBookers = await this.getPreviousBookersForPitch(params.pitchId, params.creatorId);
      previousBookers.forEach((uid) => {
        if (!targetInvitedUserIds.includes(uid)) {
          targetInvitedUserIds.push(uid);
        }
      });
    }

    // Initialize responses map
    const initialResponses: Record<string, MatchInvitationResponseStatus> = {};
    // Creator is automatically accepted
    initialResponses[params.creatorId] = 'accepted';
    
    // All other invited players start as pending
    targetInvitedUserIds.forEach((uid) => {
      if (uid !== params.creatorId) {
        initialResponses[uid] = 'pending';
      }
    });

    const expiresAt = calculate24hBeforeExpiry(params.date, params.time);

    const newProposal: MatchInvitation = {
      id: inviteId,
      creatorId: params.creatorId,
      creatorName: params.creatorName || 'Player',
      creatorAvatar: params.creatorAvatar || '',
      creatorPhone: params.creatorPhone || '',
      creatorRole: params.creatorRole,
      pitchId: params.pitchId,
      pitchName: params.pitchName || 'Football Turf',
      pitchLocation: params.pitchLocation || 'Kampala',
      pitchImage: params.pitchImage || '',
      pricePerHour: params.pricePerHour || 0,
      proposedDateTime: params.proposedDateTime,
      date: params.date,
      time: params.time,
      playersNeeded: params.playersNeeded,
      invitedUserIds: targetInvitedUserIds,
      broadcastToPreviousBookers: !!params.broadcastToPreviousBookers,
      responses: initialResponses,
      status: 'proposing',
      createdAt: new Date().toISOString(),
      expiresAt,
      notes: params.notes || '',
    };

    await setDoc(inviteDocRef, newProposal);

    // Send notification to all invited players
    const notificationPromises = targetInvitedUserIds
      .filter((uid) => uid !== params.creatorId)
      .map((uid) =>
        notificationService.create({
          id: `notif_${inviteId}_${uid}_${Date.now()}`,
          userId: uid,
          title: 'Matchday Invitation ⚽',
          body: `${params.creatorName || 'A teammate'} proposed a game at ${params.pitchName || 'the turf'} on ${params.date} at ${params.time}. Attendance is free — confirm your spot!`,
          type: 'MATCH_INVITE',
          isRead: false,
          link: `/invitations?id=${inviteId}`,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        })
      );

    try {
      await Promise.allSettled(notificationPromises);
    } catch (err) {
      console.warn("Failed sending some notification invites:", err);
    }

    return newProposal;
  },

  /**
   * Get single proposal by ID
   */
  async getProposal(id: string): Promise<MatchInvitation | null> {
    try {
      const snap = await getDoc(doc(db, this.collectionPath, id));
      if (snap.exists()) {
        return { id: snap.id, ...snap.data() } as MatchInvitation;
      }
    } catch (err) {
      console.warn(`Error getting proposal ${id}:`, err);
    }
    return null;
  },

  /**
   * Realtime subscribe to single proposal
   */
  subscribeProposal(id: string, callback: (proposal: MatchInvitation | null) => void): () => void {
    const docRef = doc(db, this.collectionPath, id);
    return onSnapshot(
      docRef,
      (snapshot) => {
        if (snapshot.exists()) {
          callback({ id: snapshot.id, ...snapshot.data() } as MatchInvitation);
        } else {
          callback(null);
        }
      },
      (error) => {
        console.warn(`Error subscribing to proposal ${id}:`, error);
        callback(null);
      }
    );
  },

  /**
   * Realtime subscribe to all proposals for a user (as creator or invitee)
   */
  subscribeUserProposals(userId: string, callback: (proposals: MatchInvitation[]) => void): () => void {
    if (!userId) {
      callback([]);
      return () => {};
    }

    const colRef = collection(db, this.collectionPath);
    // Listen to all matchInvitations and filter client-side to guarantee zero missing permissions
    return onSnapshot(
      colRef,
      (snapshot) => {
        const proposals: MatchInvitation[] = [];
        snapshot.forEach((d) => {
          const data = d.data() as MatchInvitation;
          const isCreator = data.creatorId === userId;
          const isInvitee = data.invitedUserIds?.includes(userId) || data.responses?.[userId] !== undefined;
          
          if (isCreator || isInvitee) {
            proposals.push({ id: d.id, ...data });
          }
        });

        // Sort by createdAt descending
        proposals.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        callback(proposals);
      },
      (error) => {
        console.warn("Error subscribing to user proposals:", error);
        callback([]);
      }
    );
  },

  /**
   * One-time query for all proposals relevant to a user
   */
  async getProposalsForUser(userId: string): Promise<MatchInvitation[]> {
    if (!userId) return [];
    try {
      const colRef = collection(db, this.collectionPath);
      const snapshot = await getDocs(colRef);
      const proposals: MatchInvitation[] = [];
      snapshot.forEach((d) => {
        const data = d.data() as MatchInvitation;
        const isCreator = data.creatorId === userId;
        const isInvitee = data.invitedUserIds?.includes(userId) || data.responses?.[userId] !== undefined;
        if (isCreator || isInvitee) {
          proposals.push({ id: d.id, ...data });
        }
      });
      proposals.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      return proposals;
    } catch (err) {
      console.warn("Error fetching user proposals:", err);
      return [];
    }
  },

  /**
   * Respond to an invitation (Accept or Decline)
   */
  async respondToInvitation(
    invitationId: string,
    userId: string,
    response: 'accepted' | 'declined',
    userName?: string
  ): Promise<MatchInvitation | null> {
    const docRef = doc(db, this.collectionPath, invitationId);
    const snap = await getDoc(docRef);
    if (!snap.exists()) return null;

    const data = snap.data() as MatchInvitation;
    if (data.status === 'cancelled' || data.status === 'expired' || data.status === 'booked') {
      return data;
    }

    const updatedResponses = { ...(data.responses || {}) };
    updatedResponses[userId] = response;

    // Count accepted players
    const acceptedCount = Object.values(updatedResponses).filter((r) => r === 'accepted').length;
    let newStatus: MatchInvitationStatus = data.status;

    if (acceptedCount >= data.playersNeeded && data.status === 'proposing') {
      newStatus = 'all_confirmed';

      // Notify the creator that all spots are confirmed and ready to book
      try {
        await notificationService.create({
          id: `notif_allconf_${invitationId}_${Date.now()}`,
          userId: data.creatorId,
          title: 'Squad Full — Book Your Slot Now! ⚡',
          body: `All ${data.playersNeeded} players have confirmed for ${data.pitchName} on ${data.date} (${data.time}). Pay the deposit now to secure the pitch!`,
          type: 'MATCH_INVITE',
          isRead: false,
          link: `/invitations?id=${invitationId}`,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });
      } catch (err) {
        console.warn("Error sending all confirmed notification:", err);
      }
    }

    await updateDoc(docRef, {
      responses: updatedResponses,
      status: newStatus,
      updatedAt: new Date().toISOString(),
    });

    return { ...data, responses: updatedResponses, status: newStatus };
  },

  /**
   * Check if a proposal is expired or if the slot was taken by someone else
   */
  async checkSlotAvailabilityAndExpiry(proposal: MatchInvitation): Promise<MatchInvitationStatus> {
    if (!proposal.id || proposal.status === 'booked' || proposal.status === 'cancelled') {
      return proposal.status;
    }

    // 1. Check if expired (24h before match time)
    const now = Date.now();
    const expiryTime = new Date(proposal.expiresAt).getTime();
    if (now >= expiryTime && proposal.status === 'proposing') {
      await updateDoc(doc(db, this.collectionPath, proposal.id), {
        status: 'expired',
      });
      return 'expired';
    }

    // 2. Check if slot was booked or locked by someone else
    try {
      const slotLockId = `${proposal.pitchId}_${proposal.date}_${proposal.time}`.replace(/[\/\s—:]/g, '-');
      const lockDoc = await getDoc(doc(db, 'slotLocks', slotLockId));
      
      let isSlotTaken = false;
      if (lockDoc.exists()) {
        const lockData = lockDoc.data();
        const lockUser = lockData.userId;
        const lockStatus = lockData.status;
        const lockExpires = lockData.expiresAt ? new Date(lockData.expiresAt).getTime() : 0;
        
        if (lockUser !== proposal.creatorId && (lockStatus === 'booked' || (lockStatus === 'active' && lockExpires > now))) {
          isSlotTaken = true;
        }
      }

      if (!isSlotTaken) {
        // Also check bookings collection directly for any confirmed booking on that pitch, date, time
        const bQuery = query(
          collection(db, 'bookings'),
          where('pitchId', '==', proposal.pitchId),
          where('date', '==', proposal.date),
          where('time', '==', proposal.time)
        );
        const bSnap = await getDocs(bQuery);
        bSnap.forEach((bDoc) => {
          const bData = bDoc.data();
          if (bData.playerId !== proposal.creatorId && bData.status !== 'cancelled' && bData.status !== 'rejected') {
            isSlotTaken = true;
          }
        });
      }

      if (isSlotTaken && proposal.status !== 'slot_taken') {
        await updateDoc(doc(db, this.collectionPath, proposal.id), {
          status: 'slot_taken',
        });

        // Notify creator and all accepted users
        const notifyUids = [
          proposal.creatorId,
          ...Object.entries(proposal.responses || {})
            .filter(([uid, resp]) => resp === 'accepted' && uid !== proposal.creatorId)
            .map(([uid]) => uid),
        ];

        notifyUids.forEach(async (uid) => {
          try {
            await notificationService.create({
              id: `notif_slottaken_${proposal.id}_${uid}_${Date.now()}`,
              userId: uid,
              title: 'Slot Taken by Someone Else ⚠️',
              body: `The ${proposal.time} slot at ${proposal.pitchName} on ${proposal.date} was booked by another team. Tap to choose a new time with your squad!`,
              type: 'MATCH_INVITE',
              isRead: false,
              link: `/invitations?id=${proposal.id}`,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            });
          } catch (err) {
            console.warn("Error sending slot taken notification:", err);
          }
        });

        return 'slot_taken';
      }
    } catch (err) {
      console.warn("Error checking slot availability for proposal:", err);
    }

    return proposal.status;
  },

  /**
   * Reschedule a proposal that was slot_taken or expired
   * Retains the exact same invitee list and resets invitee responses to pending
   */
  async rescheduleProposal(
    invitationId: string,
    newDate: string,
    newTime: string,
    newProposedDateTime?: string
  ): Promise<void> {
    const docRef = doc(db, this.collectionPath, invitationId);
    const snap = await getDoc(docRef);
    if (!snap.exists()) return;

    const data = snap.data() as MatchInvitation;
    const newExpiresAt = calculate24hBeforeExpiry(newDate, newTime);

    // Reset invitees to pending, keep creator as accepted
    const resetResponses: Record<string, MatchInvitationResponseStatus> = {};
    resetResponses[data.creatorId] = 'accepted';
    (data.invitedUserIds || []).forEach((uid) => {
      if (uid !== data.creatorId) {
        resetResponses[uid] = 'pending';
      }
    });

    await updateDoc(docRef, {
      date: newDate,
      time: newTime,
      proposedDateTime: newProposedDateTime || `${newDate} ${newTime}`,
      expiresAt: newExpiresAt,
      responses: resetResponses,
      status: 'proposing',
      updatedAt: new Date().toISOString(),
    });

    // Notify all invitees
    (data.invitedUserIds || [])
      .filter((uid) => uid !== data.creatorId)
      .forEach(async (uid) => {
        try {
          await notificationService.create({
            id: `notif_resched_${invitationId}_${uid}_${Date.now()}`,
            userId: uid,
            title: 'Matchday Rescheduled 🔄',
            body: `${data.creatorName || 'The creator'} rescheduled the game at ${data.pitchName} to ${newDate} at ${newTime}. Confirm your attendance!`,
            type: 'MATCH_INVITE',
            isRead: false,
            link: `/invitations?id=${invitationId}`,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          });
        } catch (err) {
          console.warn("Error sending reschedule notification:", err);
        }
      });
  },

  /**
   * Cancel proposal
   */
  async cancelProposal(invitationId: string): Promise<void> {
    const docRef = doc(db, this.collectionPath, invitationId);
    const snap = await getDoc(docRef);
    if (!snap.exists()) return;

    const data = snap.data() as MatchInvitation;
    await updateDoc(docRef, {
      status: 'cancelled',
      updatedAt: new Date().toISOString(),
    });

    // Notify invitees
    (data.invitedUserIds || [])
      .filter((uid) => uid !== data.creatorId)
      .forEach(async (uid) => {
        try {
          await notificationService.create({
            id: `notif_cancel_${invitationId}_${uid}_${Date.now()}`,
            userId: uid,
            title: 'Match Proposal Cancelled',
            body: `The match proposal for ${data.pitchName} on ${data.date} has been cancelled.`,
            type: 'MATCH_INVITE',
            isRead: false,
            link: `/invitations`,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          });
        } catch (err) {
          console.warn("Error sending cancel notification:", err);
        }
      });
  },

  /**
   * Mark as booked after successful deposit payment
   */
  async markAsBooked(invitationId: string, bookingId: string): Promise<void> {
    const docRef = doc(db, this.collectionPath, invitationId);
    const snap = await getDoc(docRef);
    if (!snap.exists()) return;

    const data = snap.data() as MatchInvitation;
    await updateDoc(docRef, {
      status: 'booked',
      bookingId,
      updatedAt: new Date().toISOString(),
    });

    // Notify all accepted invitees
    Object.entries(data.responses || {})
      .filter(([uid, resp]) => resp === 'accepted' && uid !== data.creatorId)
      .forEach(async ([uid]) => {
        try {
          await notificationService.create({
            id: `notif_booked_${invitationId}_${uid}_${Date.now()}`,
            userId: uid,
            title: 'Pitch Officially Booked! 🎉',
            body: `The match at ${data.pitchName} on ${data.date} (${data.time}) is locked and confirmed. See you on the pitch!`,
            type: 'BOOKING_REMINDER',
            isRead: false,
            link: `/bookings`,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          });
        } catch (err) {
          console.warn("Error sending booked confirmation notification:", err);
        }
      });
  },
};
