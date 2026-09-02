import { AdminReview, Pitch } from "../types/firebase";
import { BookingStatus, Report, ReportStatus } from "../types";
import { db } from "../lib/firebase";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  updateDoc,
  addDoc,
  setDoc,
  query,
  where,
  orderBy,
  limit,
  startAfter,
  serverTimestamp,
} from "firebase/firestore";
import { pitchService } from "./pitchService";

export const adminService = {
  collectionPath: "adminReviews",

  async listPendingPitches(): Promise<Pitch[]> {
    console.log(`Fetching pending pitches`);
    try {
      const q = query(
        collection(db, "pitches"),
        where("status", "in", [
          "PENDING_APPROVAL",
          "PENDING_INSPECTION",
          "pending_review",
          "pending_inspection",
          "changes_requested"
        ]),
      );
      const querySnapshot = await getDocs(q);
      const pitches: Pitch[] = [];
      querySnapshot.forEach((doc) => {
        pitches.push(doc.data() as Pitch);
      });
      return pitches;
    } catch (error) {
      console.warn("Failed to fetch pending pitches", error);
      return [];
    }
  },

  async getDashboardMetrics(): Promise<{
    totalGrossVolume: number;
    estimatedCommission: number;
    totalBookingsCount: number;
    confirmedBookingsCount: number;
    pendingBookingsCount: number;
    activePitchesCount: number;
    pendingPitchesCount: number;
    totalUsersCount: number;
    totalOwnersCount: number;
    openDisputesCount: number;
    openReportsCount: number;
    recentBookings: any[];
    recentPitches: any[];
  }> {
    try {
      const [
        pitchesSnap,
        bookingsSnap,
        usersSnap,
        disputesSnap,
        reportsSnap,
        settings
      ] = await Promise.all([
        getDocs(collection(db, "pitches")),
        getDocs(query(collection(db, "bookings"), orderBy("createdAt", "desc"), limit(100))),
        getDocs(collection(db, "users")),
        getDocs(collection(db, "disputes")),
        getDocs(collection(db, "reports")),
        this.getPlatformSettings()
      ]);

      const commissionRate = (settings?.commissionRate || 10) / 100;

      let totalGrossVolume = 0;
      let confirmedBookingsCount = 0;
      let pendingBookingsCount = 0;
      const recentBookings: any[] = [];

      bookingsSnap.forEach((docSnap) => {
        const data = docSnap.data();
        const price = Number(data.price || data.totalPrice || data.amount || 0);
        const status = (data.status || "").toUpperCase();
        
        if (status === "CONFIRMED" || status === "COMPLETED" || status === "CHECKED_IN") {
          totalGrossVolume += price;
          confirmedBookingsCount++;
        } else if (status === "PENDING" || status === "PENDING_PAYMENT" || status === "PAYMENT_SUBMITTED") {
          pendingBookingsCount++;
        }

        if (recentBookings.length < 8) {
          recentBookings.push({ id: docSnap.id, ...data });
        }
      });

      let activePitchesCount = 0;
      let pendingPitchesCount = 0;
      const recentPitches: any[] = [];

      pitchesSnap.forEach((docSnap) => {
        const data = docSnap.data();
        const status = (data.status || "").toUpperCase();
        if (status === "ACTIVE" || status === "APPROVED") {
          activePitchesCount++;
        } else if (
          status === "PENDING_APPROVAL" ||
          status === "PENDING_INSPECTION" ||
          status === "PENDING_REVIEW" ||
          status === "CHANGES_REQUESTED"
        ) {
          pendingPitchesCount++;
          if (recentPitches.length < 5) {
            recentPitches.push({ id: docSnap.id, ...data });
          }
        }
      });

      let totalUsersCount = 0;
      let totalOwnersCount = 0;
      usersSnap.forEach((docSnap) => {
        const data = docSnap.data();
        const role = (data.role || "player").toLowerCase();
        if (role === "owner") {
          totalOwnersCount++;
        } else {
          totalUsersCount++;
        }
      });

      let openDisputesCount = 0;
      disputesSnap.forEach((docSnap) => {
        const data = docSnap.data();
        if (data.status !== "resolved" && data.status !== "dismissed") {
          openDisputesCount++;
        }
      });

      let openReportsCount = 0;
      reportsSnap.forEach((docSnap) => {
        const data = docSnap.data();
        const status = (data.status || "").toLowerCase();
        if (status === "pending" || status === "investigating" || status === "open") {
          openReportsCount++;
        }
      });

      return {
        totalGrossVolume,
        estimatedCommission: Math.round(totalGrossVolume * commissionRate),
        totalBookingsCount: bookingsSnap.size,
        confirmedBookingsCount,
        pendingBookingsCount,
        activePitchesCount,
        pendingPitchesCount,
        totalUsersCount,
        totalOwnersCount,
        openDisputesCount,
        openReportsCount,
        recentBookings,
        recentPitches
      };
    } catch (error) {
      console.warn("Failed to get dashboard metrics:", error);
      return {
        totalGrossVolume: 0,
        estimatedCommission: 0,
        totalBookingsCount: 0,
        confirmedBookingsCount: 0,
        pendingBookingsCount: 0,
        activePitchesCount: 0,
        pendingPitchesCount: 0,
        totalUsersCount: 0,
        totalOwnersCount: 0,
        openDisputesCount: 0,
        openReportsCount: 0,
        recentBookings: [],
        recentPitches: []
      };
    }
  },

  // ─── USER & OWNER MANAGEMENT (PHASE 2) ──────────────────────────

  async listUsers(lastDoc?: any): Promise<{ data: any[], lastDoc: any | null }> {
    try {
      let q = query(
        collection(db, "users"),
        orderBy("createdAt", "desc"),
        limit(50)
      );
      if (lastDoc) {
        q = query(
          collection(db, "users"),
          orderBy("createdAt", "desc"),
          startAfter(lastDoc),
          limit(50)
        );
      }
      const snap = await getDocs(q);
      const data = snap.docs.map((doc) => doc.data());
      const newLastDoc = snap.docs.length > 0 ? snap.docs[snap.docs.length - 1] : null;
      return { data, lastDoc: newLastDoc };
    } catch (error) {
      console.warn("Failed to fetch all users", error);
      return { data: [], lastDoc: null };
    }
  },

  async updateUserStatus(
    userId: string,
    status: string,
    adminId: string,
    userRole: string = "User"
  ): Promise<void> {
    try {
      await updateDoc(doc(db, "users", userId), {
        status: status,
        updatedAt: serverTimestamp(),
      });
      await this.logAdminAction({
        adminId,
        action: status === "suspended" ? `${userRole} Suspended` : `${userRole} Reactivated`,
        targetType: userRole,
        targetId: userId,
        metadata: { newStatus: status }
      });
    } catch (error) {
      console.warn("Failed to update user status", error);
      throw error;
    }
  },

  async setUserVerified(
    userId: string,
    isVerified: boolean,
    adminId: string,
    userRole: string = "User"
  ): Promise<void> {
    try {
      await updateDoc(doc(db, "users", userId), {
        isVerified: isVerified,
        updatedAt: serverTimestamp(),
      });
      await this.logAdminAction({
        adminId,
        action: isVerified ? `${userRole} Verified` : `${userRole} Unverified`,
        targetType: userRole,
        targetId: userId,
        metadata: { isVerified }
      });
    } catch (error) {
      console.warn("Failed to set user verified", error);
      throw error;
    }
  },

  async checkCanChangeAdminRole(userId: string): Promise<{ canChange: boolean; message?: string }> {
    try {
      const q = query(
        collection(db, "users"),
        where("role", "in", ["admin", "ADMIN", "super_admin"])
      );
      const snap = await getDocs(q);
      const adminDocs = snap.docs;
      
      const targetIsAdmin = adminDocs.some(doc => doc.id === userId);
      if (targetIsAdmin && adminDocs.length <= 1) {
        return {
          canChange: false,
          message: "Cannot change the role of the last remaining Admin account on the platform."
        };
      }
      return { canChange: true };
    } catch (error) {
      console.warn("Error checking admin count:", error);
      return { canChange: true };
    }
  },

  async updateUserRole(
    userId: string,
    newRole: string,
    adminId: string,
    adminEmail?: string,
    previousRole: string = "PLAYER"
  ): Promise<void> {
    try {
      const userRef = doc(db, "users", userId);
      const userSnap = await getDoc(userRef);
      const userData = userSnap.exists() ? userSnap.data() : null;
      
      const updates: any = {
        role: newRole,
        updatedAt: serverTimestamp(),
      };

      if (newRole.toUpperCase() === "OWNER") {
        if (!userData || !userData.businessProfile) {
          updates.businessProfile = {
            businessName: `${userData?.name || "My"} Turf Business`,
            contactEmail: userData?.email || "",
            contactPhone: userData?.phone || "",
            mobileMoneyNumber: "",
            operatingHours: { open: "08:00", close: "23:00" },
            paymentDetails: {
              mtnNumber: "",
              mtnAccountName: "",
              airtelNumber: "",
              airtelAccountName: "",
              acceptsCash: true
            }
          };
        }
      }

      await updateDoc(userRef, updates);

      await this.logAdminAction({
        adminId,
        adminEmail,
        action: `User Role Updated`,
        targetType: "User",
        targetId: userId,
        metadata: {
          previousRole: previousRole,
          newRole: newRole,
        }
      });
    } catch (error) {
      console.warn("Failed to update user role", error);
      throw error;
    }
  },

  async listOwners(): Promise<any[]> {
    try {
      const q = query(
        collection(db, "users"),
        where("role", "in", ["owner", "OWNER"]),
      );
      const snap = await getDocs(q);
      return snap.docs.map((doc) => doc.data());
    } catch (error) {
      console.warn("Failed to fetch owners", error);
      return [];
    }
  },

  async getUserRecentBookings(userId: string): Promise<any[]> {
    try {
      const q = query(
        collection(db, "bookings"),
        where("playerId", "==", userId),
      );
      const snap = await getDocs(q);
      const bookings = snap.docs.map((doc) => doc.data());
      bookings.sort(
        (a: any, b: any) =>
          new Date(b.createdAt || 0).getTime() -
          new Date(a.createdAt || 0).getTime(),
      );
      return bookings.slice(0, 10);
    } catch (error) {
      console.warn("Failed to fetch user bookings", error);
      return [];
    }
  },

  async getOwnerPitches(ownerId: string): Promise<any[]> {
    try {
      const q = query(
        collection(db, "pitches"),
        where("ownerId", "==", ownerId),
      );
      const snap = await getDocs(q);
      return snap.docs.map((doc) => doc.data());
    } catch (error) {
      console.warn("Failed to fetch owner pitches", error);
      return [];
    }
  },

  async getOwnerStaff(ownerId: string): Promise<any[]> {
    try {
      const q = query(collection(db, "staff"), where("ownerId", "==", ownerId));
      const snap = await getDocs(q);
      return snap.docs.map((doc) => doc.data());
    } catch (error) {
      console.warn("Failed to fetch owner staff", error);
      return [];
    }
  },

  async getOwnerBookingsCount(ownerId: string): Promise<number> {
    try {
      const q = query(
        collection(db, "bookings"),
        where("ownerId", "==", ownerId),
      );
      const snap = await getDocs(q);
      return snap.size;
    } catch (error) {
      return 0;
    }
  },

  // ─── BOOKING OPERATIONS (PHASE 3A) ──────────────────────────

  async listBookings(lastDoc?: any): Promise<{ data: any[], lastDoc: any | null }> {
    try {
      let q = query(
        collection(db, "bookings"),
        orderBy("createdAt", "desc"),
        limit(50)
      );
      if (lastDoc) {
        q = query(
          collection(db, "bookings"),
          orderBy("createdAt", "desc"),
          startAfter(lastDoc),
          limit(50)
        );
      }
      const snap = await getDocs(q);
      const bookings = snap.docs.map((doc) => doc.data());
      const newLastDoc = snap.docs.length > 0 ? snap.docs[snap.docs.length - 1] : null;
      return { data: bookings, lastDoc: newLastDoc };
    } catch (error) {
      console.warn("Failed to fetch all bookings", error);
      return { data: [], lastDoc: null };
    }
  },

  async cancelBookingAsAdmin(
    bookingId: string,
    adminId: string,
  ): Promise<void> {
    try {
      await updateDoc(doc(db, "bookings", bookingId), {
        status: BookingStatus.CANCELLED,
        adminCancelled: true,
        adminId: adminId,
        updatedAt: serverTimestamp(),
      });
      await this.logAdminAction({
        adminId,
        action: "Booking Cancelled By Admin",
        targetType: "Booking",
        targetId: bookingId
      });
    } catch (error) {
      console.warn("Failed to cancel booking as admin", error);
      throw error;
    }
  },

  async releaseSlotLock(slotLockId: string): Promise<void> {
    // Assuming slotLocks collection exists and documents are structured similarly
    try {
      // Find the slot lock first by id or slotLockId
      const q = query(
        collection(db, "slotLocks"),
        where("id", "==", slotLockId),
      );
      const snap = await getDocs(q);

      if (!snap.empty) {
        await updateDoc(snap.docs[0].ref, {
          status: "RELEASED",
          updatedAt: serverTimestamp(),
        });
      } else {
        await updateDoc(doc(db, "slotLocks", slotLockId), {
          status: "RELEASED",
          updatedAt: serverTimestamp(),
        });
      }
    } catch (error) {
      console.warn("Failed to release slot lock", error);
      throw error;
    }
  },

  async markBookingDisputed(bookingId: string, adminId: string): Promise<void> {
    try {
      await updateDoc(doc(db, "bookings", bookingId), {
        status: BookingStatus.DISPUTED,
        adminDisputed: true,
        disputedBy: adminId,
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      console.warn("Failed to mark booking disputed", error);
      throw error;
    }
  },

  async addBookingAdminNote(
    bookingId: string,
    adminId: string,
    note: string,
  ): Promise<void> {
    try {
      await addDoc(collection(db, "bookingAdminNotes"), {
        bookingId,
        adminId,
        note,
        createdAt: serverTimestamp(),
      });
    } catch (error) {
      console.warn("Failed to add admin note", error);
      throw error;
    }
  },

  async getBookingAdminNotes(bookingId: string): Promise<any[]> {
    try {
      const q = query(
        collection(db, "bookingAdminNotes"),
        where("bookingId", "==", bookingId),
      );
      const snap = await getDocs(q);
      const notes = snap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      notes.sort((a: any, b: any) => {
        const timeA = a.createdAt?.toMillis ? a.createdAt.toMillis() : 0;
        const timeB = b.createdAt?.toMillis ? b.createdAt.toMillis() : 0;
        return timeA - timeB; // ascending
      });
      return notes;
    } catch (error) {
      console.warn("Failed to fetch admin notes", error);
      return [];
    }
  },

  async getSlotLockForBooking(bookingId: string): Promise<any | null> {
    try {
      const q = query(
        collection(db, "slotLocks"),
        where("bookingId", "==", bookingId),
      );
      const snap = await getDocs(q);
      if (!snap.empty) {
        return { id: snap.docs[0].id, ...snap.docs[0].data() };
      }
      return null;
    } catch (error) {
      return null;
    }
  },

  // ──────────────────────────────────────────────────────────────

  // ─── PAYMENT & DISPUTE OPERATIONS (PHASE 3B) ────────────────

  async listPaymentSubmissions(lastDoc?: any): Promise<{ data: any[], lastDoc: any | null }> {
    try {
      let q = query(
        collection(db, "bookings"),
        orderBy("createdAt", "desc"),
        limit(50)
      );
      if (lastDoc) {
        q = query(
          collection(db, "bookings"),
          orderBy("createdAt", "desc"),
          startAfter(lastDoc),
          limit(50)
        );
      }
      const snap = await getDocs(q);
      const bookings = snap.docs.map((doc) => doc.data());
      const newLastDoc = snap.docs.length > 0 ? snap.docs[snap.docs.length - 1] : null;
      return { data: bookings, lastDoc: newLastDoc };
    } catch (error) {
      console.warn("Failed to fetch payment submissions", error);
      return { data: [], lastDoc: null };
    }
  },

  async listDisputedBookings(): Promise<any[]> {
    try {
      const q = query(collection(db, "disputes"));
      const snap = await getDocs(q);
      return snap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
      console.warn("Failed to fetch disputed bookings", error);
      return [];
    }
  },

  async getPaymentDisputeDetails(disputeId: string): Promise<any | null> {
    try {
      const docRef = doc(db, "disputes", disputeId);
      const snap = await getDoc(docRef);
      return snap.exists() ? { id: snap.id, ...snap.data() } : null;
    } catch (error) {
      console.warn("Failed to fetch dispute details", error);
      return null;
    }
  },

  async markBookingDisputedFull(
    bookingData: any,
    adminId: string,
    reason: string,
  ): Promise<void> {
    try {
      // 1. Update booking
      await updateDoc(doc(db, "bookings", bookingData.id), {
        status: BookingStatus.DISPUTED,
        adminDisputed: true,
        disputedBy: adminId,
        updatedAt: serverTimestamp(),
      });
      // 2. Create dispute entry
      const disputeRef = doc(collection(db, "disputes"));
      await setDoc(disputeRef, {
        id: disputeRef.id,
        bookingId: bookingData.id,
        playerId: bookingData.playerId || "",
        ownerId: bookingData.ownerId || "",
        pitchId: bookingData.turfId || "",
        reason: reason,
        status: "open",
        adminNotes: [],
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      await this.logAdminAction({
        adminId,
        action: "Dispute Opened",
        targetType: "Dispute",
        targetId: disputeRef.id,
        metadata: { reason, bookingId: bookingData.id }
      });
    } catch (error) {
      console.warn("Failed to full mark dispute", error);
      throw error;
    }
  },

  async resolveDispute(
    disputeId: string,
    adminId: string,
    resolution: string,
  ): Promise<void> {
    try {
      await updateDoc(doc(db, "disputes", disputeId), {
        status: "resolved",
        resolvedAt: serverTimestamp(),
        resolvedBy: adminId,
        resolution: resolution,
        updatedAt: serverTimestamp(),
      });
      await this.logAdminAction({
        adminId,
        action: "Dispute Resolved",
        targetType: "Dispute",
        targetId: disputeId,
        metadata: { resolution }
      });
    } catch (error) {
      console.warn("Failed to resolve dispute", error);
      throw error;
    }
  },

  async forceConfirmBooking(bookingId: string, adminId: string): Promise<void> {
    try {
      await updateDoc(doc(db, "bookings", bookingId), {
        status: BookingStatus.CONFIRMED,
        paymentStatus: "APPROVED",
        adminConfirmed: true,
        adminId: adminId,
        updatedAt: serverTimestamp(),
      });
      await this.logAdminAction({
        adminId,
        action: "Booking Force Confirmed",
        targetType: "Booking",
        targetId: bookingId
      });
    } catch (error) {
      console.warn("Failed to force confirm booking", error);
      throw error;
    }
  },

  async forceRejectBooking(bookingId: string, adminId: string): Promise<void> {
    try {
      await updateDoc(doc(db, "bookings", bookingId), {
        status: BookingStatus.REJECTED,
        paymentStatus: "REJECTED",
        adminRejected: true,
        adminId: adminId,
        updatedAt: serverTimestamp(),
      });
      await this.logAdminAction({
        adminId,
        action: "Booking Force Rejected",
        targetType: "Booking",
        targetId: bookingId
      });
    } catch (error) {
      console.warn("Failed to force reject booking", error);
      throw error;
    }
  },

  async addDisputeNote(
    disputeId: string,
    adminId: string,
    note: string,
  ): Promise<void> {
    try {
      const docRef = doc(db, "disputes", disputeId);
      const snap = await getDoc(docRef);
      if (snap.exists()) {
        const data = snap.data();
        const existingNotes = data.adminNotes || [];
        existingNotes.push({
          adminId,
          note,
          createdAt: new Date().toISOString(),
        });
        await updateDoc(docRef, {
          adminNotes: existingNotes,
          updatedAt: serverTimestamp(),
        });
      }
    } catch (error) {
      console.warn("Failed to add dispute note", error);
      throw error;
    }
  },

  // ──────────────────────────────────────────────────────────────

  async approvePitch(pitchId: string, adminId: string, note?: string): Promise<void> {
    console.log(`Approving pitch ${pitchId}`);
    try {
      await updateDoc(doc(db, "pitches", pitchId), {
        status: "ACTIVE",
        approvedAt: serverTimestamp(),
        approvedBy: adminId,
        updatedAt: serverTimestamp(),
      });
      await this.createReview(pitchId, adminId, 'APPROVED', note || "Approved without comments");
      await this.logAdminAction({
        adminId,
        action: "Pitch Approved",
        targetType: "Pitch",
        targetId: pitchId
      });
    } catch (error) {
      console.error("Failed to approve pitch", error);
      throw error;
    }
  },

  async rejectPitch(
    pitchId: string,
    adminId: string,
    reason: string,
  ): Promise<void> {
    console.log(`Rejecting pitch ${pitchId}`);
    try {
      await updateDoc(doc(db, "pitches", pitchId), {
        status: "REJECTED",
        rejectedAt: serverTimestamp(),
        rejectedBy: adminId,
        rejectionReason: reason || "No reason provided",
        updatedAt: serverTimestamp(),
      });
      await this.createReview(pitchId, adminId, 'REJECTED', reason || "No reason provided");
      await this.logAdminAction({
        adminId,
        action: "Pitch Rejected",
        targetType: "Pitch",
        targetId: pitchId,
        metadata: { reason }
      });
    } catch (error) {
      console.error("Failed to reject pitch", error);
      throw error;
    }
  },

  async requestPitchChanges(
    pitchId: string,
    adminId: string,
    message: string,
  ): Promise<void> {
    console.log(`Requesting changes for pitch ${pitchId}`);
    try {
      await updateDoc(doc(db, "pitches", pitchId), {
        status: "changes_requested",
        reviewedAt: serverTimestamp(),
        reviewedBy: adminId,
        changeRequestMessage: message || "Please update pitch details",
        updatedAt: serverTimestamp(),
      });
      await this.createReview(pitchId, adminId, 'NEEDS_CHANGES', message || "Changes requested without comments");
      await this.logAdminAction({
        adminId,
        action: "Pitch Changes Requested",
        targetType: "Pitch",
        targetId: pitchId,
        metadata: { message }
      });
    } catch (error) {
      console.error("Failed to request changes for pitch", error);
      throw error;
    }
  },

  async createReview(pitchId: string, adminId: string, decision: 'APPROVED' | 'REJECTED' | 'NEEDS_CHANGES', note: string): Promise<AdminReview> {
    const reviewData = {
      pitchId,
      adminId,
      status: decision,
      notes: note,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    const docRef = await addDoc(collection(db, "adminReviews"), reviewData);
    return { id: docRef.id, ...reviewData } as AdminReview;
  },

  async getReviewById(id: string): Promise<AdminReview | null> {
    const docSnap = await getDoc(doc(db, "adminReviews", id));
    if (!docSnap.exists()) return null;
    return { id: docSnap.id, ...docSnap.data() } as AdminReview;
  },

  async listReviewsByPitch(pitchId: string): Promise<AdminReview[]> {
    const q = query(
      collection(db, "adminReviews"),
      where("pitchId", "==", pitchId),
      orderBy("createdAt", "desc"),
      limit(20)
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as AdminReview));
  },

  async updateReview(id: string, data: Partial<AdminReview>): Promise<void> {
    const allowedUpdates: Partial<AdminReview> = {};
    const invalidKeys: string[] = [];

    for (const key of Object.keys(data) as Array<keyof AdminReview>) {
      if (key === 'notes') {
        allowedUpdates.notes = data.notes;
      } else {
        invalidKeys.push(key);
      }
    }

    if (invalidKeys.length > 0) {
      console.warn(`[updateReview] Ignoring immutable fields: ${invalidKeys.join(', ')}`);
    }

    if (Object.keys(allowedUpdates).length > 0) {
      await updateDoc(doc(db, "adminReviews", id), {
        ...allowedUpdates,
        updatedAt: new Date().toISOString()
      });
    }
  },

  // ─── AUDIT & SETTINGS OPERATIONS (PHASE 4) ────────────────────

  async logAdminAction(params: {
    adminId: string;
    adminEmail?: string;
    action: string;
    targetType: string;
    targetId: string;
    metadata?: any;
  }): Promise<void> {
    try {
      await addDoc(collection(db, "auditLogs"), {
        adminId: params.adminId,
        adminEmail: params.adminEmail || null,
        action: params.action,
        targetType: params.targetType,
        targetId: params.targetId,
        metadata: params.metadata || {},
        createdAt: serverTimestamp()
      });
    } catch (err) {
      console.warn("Failed to write audit log:", err);
    }
  },

  async listAuditLogs(lastDoc?: any): Promise<{ data: any[], lastDoc: any | null }> {
    try {
      let q = query(
        collection(db, "auditLogs"),
        orderBy("createdAt", "desc"),
        limit(50)
      );
      if (lastDoc) {
        q = query(
          collection(db, "auditLogs"),
          orderBy("createdAt", "desc"),
          startAfter(lastDoc),
          limit(50)
        );
      }
      const snap = await getDocs(q);
      const logs = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      const newLastDoc = snap.docs.length > 0 ? snap.docs[snap.docs.length - 1] : null;
      return { data: logs, lastDoc: newLastDoc };
    } catch (err) {
      console.warn("Failed to fetch audit logs:", err);
      return { data: [], lastDoc: null };
    }
  },

  async getPlatformSettings(): Promise<any> {
    try {
      const docRef = doc(db, "platformSettings", "global");
      const snap = await getDoc(docRef);
      if (snap.exists()) {
        return snap.data();
      }
      return null;
    } catch (err) {
      console.warn("Failed to fetch platform settings:", err);
      return null;
    }
  },

  async updatePlatformSettings(adminId: string, settings: any): Promise<void> {
    try {
      const docRef = doc(db, "platformSettings", "global");
      await setDoc(docRef, {
        ...settings,
        updatedAt: serverTimestamp(),
        updatedBy: adminId
      }, { merge: true });
      await this.logAdminAction({
        adminId,
        action: "Settings Updated",
        targetType: "Platform Settings",
        targetId: "global",
        metadata: settings
      });
    } catch (err) {
      console.warn("Failed to update platform settings:", err);
      throw err;
    }
  },

  async listReports(): Promise<Report[]> {
    try {
      const q = query(collection(db, "reports"));
      const snap = await getDocs(q);
      const reports: Report[] = [];
      snap.forEach((docSnap) => {
        reports.push({ id: docSnap.id, ...docSnap.data() } as Report);
      });
      // Sort in memory to avoid index requirements
      reports.sort((a, b) => {
        const timeA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const timeB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return timeB - timeA;
      });
      return reports;
    } catch (error) {
      console.warn("Failed to fetch reports", error);
      return [];
    }
  },

  async updateReportStatus(
    reportId: string,
    status: ReportStatus,
    resolutionNotes: string | undefined,
    adminId: string,
    adminEmail?: string
  ): Promise<void> {
    try {
      const updateData: any = {
        status: status,
        updatedAt: serverTimestamp(),
      };
      if (resolutionNotes !== undefined) {
        updateData.resolutionNotes = resolutionNotes;
      }
      if (status === ReportStatus.RESOLVED || status === ReportStatus.DISMISSED) {
        updateData.resolvedAt = new Date().toISOString();
      }
      await updateDoc(doc(db, "reports", reportId), updateData);

      await this.logAdminAction({
        adminId,
        adminEmail,
        action: `Report Status Updated to ${status.toUpperCase()}`,
        targetType: "Report",
        targetId: reportId,
        metadata: { status, resolutionNotes }
      });
    } catch (error) {
      console.warn("Failed to update report status", error);
      throw error;
    }
  },

  async createReport(reportData: Omit<Report, 'id'>): Promise<string> {
    try {
      const docRef = await addDoc(collection(db, "reports"), reportData);
      return docRef.id;
    } catch (error) {
      console.warn("Failed to create report", error);
      throw error;
    }
  }
};
