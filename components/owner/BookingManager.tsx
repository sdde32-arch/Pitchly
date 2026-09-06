import React, { useEffect, useState } from "react";
import { Booking, BookingStatus, PaymentMethod, ReportTargetType } from "../../types";
import { ReportModal } from "../ReportModal";
import { OwnerService } from "../../services/owner";
import { bookingService } from "../../services/bookingService";
import { useUser } from "../../context/UserContext";
import {
  Check,
  X,
  Search,
  CheckCircle,
  CheckCircle2,
  AlertCircle,
  Banknote,
  Smartphone,
  ChevronRight,
  Image,
  Info,
  Calendar,
  User,
  ShieldAlert,
  ShieldCheck,
  AlertTriangle,
  Phone,
  Clock,
  MapPin,
  Filter,
  DollarSign,
  Loader2
} from "lucide-react";

export const BookingManager: React.FC = () => {
  const { user, loading: authLoading } = useUser();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [filter, setFilter] = useState<
    "ALL" | "PENDING" | "CONFIRMED" | "CANCELLED" | "PAYMENT_REVIEWS"
  >("ALL");
  const [reportTarget, setReportTarget] = useState<{ type: ReportTargetType; id: string } | null>(null);
  const [activeReportMenu, setActiveReportMenu] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [toast, setToast] = useState<{
    type: "success" | "error" | "info";
    title: string;
    message: string;
  } | null>(null);
  const [previewReceiptUrl, setPreviewReceiptUrl] = useState<string | null>(
    null,
  );
  const [thisMonthOnly, setThisMonthOnly] = useState(false);
  const [viewMode, setViewMode] = useState<"bookings" | "payments">("bookings");
  const [activePaymentBucket, setActivePaymentBucket] = useState<"SUBMITTED" | "CASH" | "UNPAID">("SUBMITTED");

  const isThisMonth = (dateStr?: string) => {
    if (!dateStr) return false;
    const now = new Date();
    const parts = dateStr.split('-');
    if (parts.length >= 2) {
      const year = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10);
      if (!isNaN(year) && !isNaN(month)) {
        return year === now.getFullYear() && month === (now.getMonth() + 1);
      }
    }
    const bDate = new Date(dateStr);
    if (isNaN(bDate.getTime())) return false;
    return bDate.getFullYear() === now.getFullYear() && bDate.getMonth() === now.getMonth();
  };

  useEffect(() => {
    if (authLoading) return;
    if (user?.uid) {
      // Real-time listener for owner bookings
      const unsubscribe = bookingService.subscribeByOwner(user.uid, (data) => {
        setBookings(data);
      });
      return () => unsubscribe();
    } else {
      loadBookings();
    }
  }, [user?.uid, authLoading]);

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), 4000);
    return () => clearTimeout(timer);
  }, [toast]);

  const loadBookings = async () => {
    const data = await OwnerService.getBookings();
    setBookings(data);
  };

  const [justConfirmedId, setJustConfirmedId] = useState<string | null>(null);

  const handleAction = async (
    booking: Booking,
    action: "CONFIRMED" | "CANCELLED" | "REJECTED" | "CHECKED_IN",
    customReason?: string
  ) => {
    setProcessingId(booking.id);
    const reasonToUse = customReason || rejectReason || (action === "REJECTED" ? "Payment rejected by facility owner" : "Booking cancelled");
    
    const updates: Partial<Booking> = {
      status: action as BookingStatus,
      updatedAt: new Date().toISOString()
    };

    if (action === "CONFIRMED") {
      updates.status = BookingStatus.CONFIRMED;
      updates.approvedAt = new Date().toISOString();
      if (booking.status === BookingStatus.PAYMENT_SUBMITTED || booking.paymentStatus === "SUBMITTED") {
        updates.paymentStatus = "PAID";
      }
    } else if (action === "CHECKED_IN") {
      updates.status = BookingStatus.CHECKED_IN;
    } else if (action === "REJECTED" || action === "CANCELLED") {
      updates.status = action === "REJECTED" ? BookingStatus.REJECTED : BookingStatus.CANCELLED;
      updates.rejectionReason = reasonToUse;
      updates.reviewedAt = new Date().toISOString();
    }

    try {
      // Optimistic update immediately for zero-lag UI response
      setBookings((prev) =>
        prev.map((b) => (b.id === booking.id ? { ...b, ...updates } : b)),
      );

      if (action === "CONFIRMED") {
        setJustConfirmedId(booking.id);
        setTimeout(() => setJustConfirmedId(null), 3000);
      }

      await bookingService.update(booking.id, updates);

      if (action === "CONFIRMED") {
        setToast({
          type: "success",
          title: "Booking Confirmed! ⚽",
          message: `Match for ${booking.userName || "Player"} on ${booking.date} (${booking.time}) is confirmed.`
        });
      } else if (action === "CHECKED_IN") {
        setToast({
          type: "success",
          title: "Player Checked In! 🎟️",
          message: `${booking.userName || "Player"} is checked in for the match.`
        });
      } else {
        setToast({
          type: "info",
          title: action === "REJECTED" ? "Booking Declined" : "Booking Cancelled",
          message: `Reservation slot has been freed up successfully.`
        });
      }
    } catch (e: any) {
      console.error("Booking action failed:", e);
      // Revert if error
      setToast({
        type: "error",
        title: "Update Failed",
        message: e?.message || "Could not update booking. Please try again."
      });
    } finally {
      setProcessingId(null);
      setRejectingId(null);
      setRejectReason("");
    }
  };

  const handleMarkPaid = async (booking: Booking) => {
    setProcessingId(booking.id);
    const updates: Partial<Booking> = {
      paymentStatus: "PAID",
      updatedAt: new Date().toISOString()
    };
    try {
      setBookings((prev) =>
        prev.map((b) => (b.id === booking.id ? { ...b, ...updates } : b)),
      );
      await bookingService.update(booking.id, updates);
      setToast({
        type: "success",
        title: "Payment Received! 💰",
        message: `Marked booking for ${booking.userName || "Player"} as PAID.`
      });
    } catch (e: any) {
      setToast({
        type: "error",
        title: "Payment Update Failed",
        message: e?.message || "Could not update payment status."
      });
    } finally {
      setProcessingId(null);
    }
  };

  const filtered = bookings.filter((b) => {
    const matchMonth = !thisMonthOnly || isThisMonth(b.date);
    if (!matchMonth) return false;

    if (filter === "PAYMENT_REVIEWS") return b.status === BookingStatus.PAYMENT_SUBMITTED;
    const matchStatus =
      filter === "ALL" ||
      b.status === filter ||
      (filter === "PENDING" && b.status === BookingStatus.PENDING_PAYMENT);
    const matchSearch =
      !searchQuery ||
      (b.userName || "")
        .toLowerCase()
        .includes((searchQuery || "").toLowerCase()) ||
      (b.id || "").toLowerCase().includes((searchQuery || "").toLowerCase());
    return matchStatus && matchSearch;
  });

  const paymentBookings = thisMonthOnly
    ? bookings.filter((b) => isThisMonth(b.date))
    : bookings;

  const screenshotSubmittedBookings = paymentBookings.filter(
    (b) => b.paymentStatus === "SUBMITTED" || b.status === BookingStatus.PAYMENT_SUBMITTED
  );
  const cashBookings = paymentBookings.filter(
    (b) => b.paymentMethod === PaymentMethod.CASH
  );
  const unpaidBookings = paymentBookings.filter(
    (b) => (b.paymentStatus === "UNPAID" || b.status === BookingStatus.PENDING_PAYMENT) && b.paymentMethod !== PaymentMethod.CASH
  );

  const activeBucketBookings =
    activePaymentBucket === "SUBMITTED"
      ? screenshotSubmittedBookings
      : activePaymentBucket === "CASH"
      ? cashBookings
      : unpaidBookings;

  return (
    <div className="space-y-6 animate-fadeIn font-sans w-full">
      {/* Dynamic Toast Feedback Banner */}
      {toast && (
        <div
          className={`p-3.5 sm:p-4 rounded-2xl border flex items-center justify-between gap-3 shadow-lg transition-all animate-fadeIn ${
            toast.type === "success"
              ? "bg-[#22C55E]/15 border-[#22C55E]/40 text-[#22C55E]"
              : toast.type === "error"
              ? "bg-[#EF4444]/15 border-[#EF4444]/40 text-[#EF4444]"
              : "bg-[#38BDF8]/15 border-[#38BDF8]/40 text-[#38BDF8]"
          }`}
        >
          <div className="flex items-center gap-2.5 min-w-0">
            {toast.type === "success" ? (
              <CheckCircle size={18} className="shrink-0 text-[#22C55E]" />
            ) : toast.type === "error" ? (
              <AlertCircle size={18} className="shrink-0 text-[#EF4444]" />
            ) : (
              <Info size={18} className="shrink-0 text-[#38BDF8]" />
            )}
            <div className="min-w-0">
              <p className="text-xs font-black tracking-wide">{toast.title}</p>
              <p className="text-[11px] opacity-90 truncate">{toast.message}</p>
            </div>
          </div>
          <button
            onClick={() => setToast(null)}
            className="p-1 rounded-lg hover:bg-black/10 dark:hover:bg-white/10 shrink-0 cursor-pointer"
          >
            <X size={15} />
          </button>
        </div>
      )}

      {/* Top Segmented Header View Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-surface-card border border-border-subtle p-2 sm:p-2.5 rounded-2xl shadow-sm">
        <div className="flex items-center gap-1.5 p-1 bg-surface-raised rounded-xl w-full sm:w-auto">
          <button
            onClick={() => setViewMode("bookings")}
            className={`flex-1 sm:flex-initial px-4 py-2 text-xs font-extrabold rounded-lg transition-all text-center select-none active:scale-95 cursor-pointer ${
              viewMode === "bookings"
                ? "bg-primary-lime text-accent-text shadow-sm shadow-primary-lime/20"
                : "text-text-secondary hover:text-text-primary"
            }`}
          >
            Match Bookings
          </button>
          <button
            onClick={() => setViewMode("payments")}
            className={`flex-1 sm:flex-initial px-4 py-2 text-xs font-extrabold rounded-lg transition-all text-center select-none active:scale-95 cursor-pointer flex items-center justify-center gap-1.5 ${
              viewMode === "payments"
                ? "bg-primary-lime text-accent-text shadow-sm shadow-primary-lime/20"
                : "text-text-secondary hover:text-text-primary"
            }`}
          >
            <span>Payment Records</span>
            {screenshotSubmittedBookings.length > 0 && (
              <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                viewMode === "payments" ? "bg-accent-text text-primary-lime" : "bg-[#38BDF8] text-white"
              }`}>
                {screenshotSubmittedBookings.length}
              </span>
            )}
          </button>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setThisMonthOnly(!thisMonthOnly)}
            className={`flex-1 sm:flex-initial px-3.5 py-2 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 border ${
              thisMonthOnly
                ? "bg-primary-lime/15 border-primary-lime text-primary-lime"
                : "bg-surface-raised border-border-subtle text-text-secondary hover:text-text-primary"
            }`}
          >
            <Calendar size={13} />
            <span>This Month Only</span>
          </button>
        </div>
      </div>

      {/* VIEW MODE 1: BOOKINGS LIST */}
      {viewMode === "bookings" ? (
        <div className="space-y-4 sm:space-y-6">
          {/* Quick Metrics Bar: 1 col on mobile, 3 cols on tablet/desktop */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 sm:gap-4">
            <div className="bg-surface-card rounded-2xl p-3 sm:p-4 text-center border border-border-subtle shadow-sm flex sm:flex-col items-center justify-between sm:justify-center px-4">
              <p className="text-[10px] sm:text-[11px] font-bold text-text-secondary uppercase tracking-wider order-1 sm:order-2 sm:mt-0.5">
                Pending Bookings
              </p>
              <p className="text-xl sm:text-2xl font-black text-[#38BDF8] order-2 sm:order-1">
                {bookings.filter((b) => b.status === "PENDING" || b.status === BookingStatus.PENDING_PAYMENT).length}
              </p>
            </div>
            <div className="bg-surface-card rounded-2xl p-3 sm:p-4 text-center border border-border-subtle shadow-sm flex sm:flex-col items-center justify-between sm:justify-center px-4">
              <p className="text-[10px] sm:text-[11px] font-bold text-text-secondary uppercase tracking-wider order-1 sm:order-2 sm:mt-0.5">
                Confirmed Matches
              </p>
              <p className="text-xl sm:text-2xl font-black text-[#22C55E] order-2 sm:order-1">
                {bookings.filter((b) => b.status === "CONFIRMED" || b.status === "CHECKED_IN").length}
              </p>
            </div>
            <div className="bg-surface-card rounded-2xl p-3 sm:p-4 text-center border border-border-subtle shadow-sm flex sm:flex-col items-center justify-between sm:justify-center px-4">
              <p className="text-[10px] sm:text-[11px] font-bold text-text-secondary uppercase tracking-wider order-1 sm:order-2 sm:mt-0.5">
                Cancelled / Rejected
              </p>
              <p className="text-xl sm:text-2xl font-black text-[#EF4444] order-2 sm:order-1">
                {bookings.filter((b) => b.status === "CANCELLED" || b.status === "REJECTED").length}
              </p>
            </div>
          </div>

          {/* Search & Filter Bar */}
          <div className="flex flex-col md:flex-row gap-3 justify-between">
            {/* Filter Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1">
              {(
                [
                  "ALL",
                  "PENDING",
                  "CONFIRMED",
                  "CANCELLED",
                  "PAYMENT_REVIEWS",
                ] as const
              ).map((f) => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`px-3 sm:px-3.5 py-2 text-xs font-bold rounded-xl transition-all whitespace-nowrap ${
                    filter === f 
                      ? "bg-text-primary text-app-base font-extrabold shadow-sm" 
                      : "bg-surface-card text-text-secondary hover:text-text-primary border border-border-subtle"
                  }`}
                >
                  {f === "PAYMENT_REVIEWS" ? "Payment Reviews" : f.charAt(0) + f.slice(1).toLowerCase()}
                </button>
              ))}
            </div>

            {/* Search Input */}
            <div className="relative flex-1 md:max-w-xs">
              <Search
                size={14}
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-tertiary"
              />
              <input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search player or ID..."
                className="w-full bg-surface-card border border-border-subtle text-text-primary rounded-xl pl-9 pr-4 py-2 text-xs font-semibold outline-none focus:border-border-prominent transition-all placeholder:text-text-tertiary min-h-[40px]"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-text-tertiary hover:text-text-primary text-xs"
                >
                  <X size={14} />
                </button>
              )}
            </div>
          </div>

          {/* Bookings Card List */}
          {filtered.length === 0 ? (
            <div className="text-center py-16 text-text-secondary bg-surface-card rounded-2xl border border-border-subtle">
              <Calendar size={40} className="mx-auto mb-3 opacity-40 text-text-tertiary" />
              <p className="text-sm font-bold text-text-primary">
                {filter === "PAYMENT_REVIEWS"
                  ? "No payment review requests pending"
                  : "No bookings found matching filters"}
              </p>
              <p className="text-xs text-text-tertiary mt-1">
                Try switching the filter or clearing the search query.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
              {filtered.map((booking) => {
                const isConfirmed = booking.status === "CONFIRMED" || booking.status === "CHECKED_IN";
                const isPending = booking.status === "PENDING" || booking.status === BookingStatus.PENDING_PAYMENT;
                const isCancelled = booking.status === "CANCELLED" || booking.status === "REJECTED";
                const isPaymentReview = booking.status === BookingStatus.PAYMENT_SUBMITTED;
                const isJustConfirmed = justConfirmedId === booking.id;

                return (
                  <div
                    key={booking.id}
                    className={`bg-surface-card rounded-2xl p-4 sm:p-4.5 border transition-all duration-300 shadow-sm flex flex-col justify-between gap-3.5 ${
                      isJustConfirmed
                        ? "border-[#22C55E] ring-2 ring-[#22C55E]/40 bg-[#22C55E]/5 shadow-lg shadow-[#22C55E]/10"
                        : isConfirmed
                        ? "border-[#22C55E]/30 hover:border-[#22C55E]/50"
                        : "border-border-subtle hover:border-border-prominent"
                    }`}
                  >
                    {/* Header: Player Info & Status Badge */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-11 h-11 bg-surface-raised rounded-xl flex items-center justify-center shrink-0 border border-border-subtle text-text-secondary">
                          <User size={20} />
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-extrabold text-text-primary truncate">
                            {booking.userName || "Player"}
                          </p>
                          <p className="text-xs text-text-secondary flex items-center gap-1 mt-0.5">
                            <Clock size={12} className="text-text-tertiary" />
                            <span>{booking.date} · {booking.time}</span>
                          </p>
                        </div>
                      </div>

                      <span
                        className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-md shrink-0 border ${
                          isConfirmed
                            ? "bg-[#22C55E]/10 text-[#22C55E] border-[#22C55E]/30"
                            : isPending
                            ? "bg-[#38BDF8]/10 text-[#38BDF8] border-[#38BDF8]/30"
                            : isPaymentReview
                            ? "bg-[#FACC15]/10 text-[#FACC15] border-[#FACC15]/30"
                            : "bg-[#EF4444]/10 text-[#EF4444] border-[#EF4444]/30"
                        }`}
                      >
                        {isPaymentReview ? "Review MoMo" : booking.status}
                      </span>
                    </div>

                    {/* Middle Info Box */}
                    <div className="bg-surface-raised rounded-xl p-3 border border-border-subtle/80 flex items-center justify-between text-xs">
                      <div>
                        <span className="text-[10px] font-bold text-text-tertiary uppercase block">
                          Facility / Arena
                        </span>
                        <span className="text-xs font-bold text-text-primary">
                          {booking.turfName || "Sports Ground"}
                        </span>
                      </div>

                      <div className="text-right">
                        <span className="text-[10px] font-bold text-text-tertiary uppercase block">
                          Amount
                        </span>
                        <div className="flex items-center gap-1.5 justify-end">
                          <span className="text-xs font-black text-text-primary">
                            UGX {(booking.price || 0).toLocaleString()}
                          </span>
                          <span
                            className={`text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded ${
                              booking.paymentStatus === "PAID"
                                ? "bg-[#22C55E]/15 text-[#22C55E]"
                                : booking.paymentStatus === "SUBMITTED"
                                ? "bg-[#38BDF8]/15 text-[#38BDF8]"
                                : "bg-[#EF4444]/15 text-[#EF4444]"
                            }`}
                          >
                            {booking.paymentStatus || "UNPAID"}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Action Bar */}
                    <div className="flex items-center justify-between pt-1 border-t border-border-subtle gap-2 flex-wrap">
                      {/* Left: Contact Player & Report */}
                      <div className="flex items-center gap-1.5">
                        {(booking.playerPhone || (booking as any).userPhone) && (
                          <a
                            href={`tel:${booking.playerPhone || (booking as any).userPhone}`}
                            className="px-2.5 py-1.5 bg-surface-raised hover:bg-border-subtle border border-border-subtle rounded-lg text-xs font-bold text-text-secondary hover:text-text-primary flex items-center gap-1 transition-all"
                            title="Call Player"
                          >
                            <Phone size={12} />
                            <span className="hidden sm:inline">Call</span>
                          </a>
                        )}

                        <button
                          onClick={() => {
                            setActiveReportMenu(activeReportMenu === booking.id ? null : booking.id);
                          }}
                          className="px-2.5 py-1.5 bg-surface-raised hover:bg-border-subtle border border-border-subtle rounded-lg text-xs font-bold text-text-tertiary hover:text-[#EF4444] flex items-center gap-1 transition-all"
                          title="Report Issue"
                        >
                          <ShieldAlert size={12} />
                          <span className="hidden sm:inline">Report</span>
                        </button>
                      </div>

                      {/* Right: Confirmation / Rejection Controls */}
                      <div className="flex items-center gap-2 ml-auto">
                        {/* Pending Match Confirmation */}
                        {isPending && (
                          <>
                            <button
                              onClick={() => handleAction(booking, "CONFIRMED")}
                              disabled={processingId === booking.id}
                              className="px-4 py-2 bg-[#22C55E] hover:bg-[#22C55E]/90 text-white rounded-xl text-xs font-black flex items-center gap-1.5 transition-all shadow-sm shadow-[#22C55E]/20 cursor-pointer active:scale-95 disabled:opacity-50 min-h-[38px]"
                            >
                              {processingId === booking.id ? (
                                <>
                                  <Loader2 size={14} className="animate-spin" />
                                  <span>Confirming...</span>
                                </>
                              ) : (
                                <>
                                  <Check size={14} strokeWidth={3} />
                                  <span>Confirm</span>
                                </>
                              )}
                            </button>
                            <button
                              onClick={() => handleAction(booking, "CANCELLED")}
                              disabled={processingId === booking.id}
                              className="px-3 py-2 bg-surface-raised hover:bg-[#EF4444]/10 border border-border-subtle hover:border-[#EF4444]/30 text-[#EF4444] rounded-xl text-xs font-bold flex items-center gap-1 transition-all cursor-pointer active:scale-95 min-h-[38px] disabled:opacity-50"
                            >
                              {processingId === booking.id ? (
                                <Loader2 size={14} className="animate-spin" />
                              ) : (
                                <>
                                  <X size={14} />
                                  <span>Decline</span>
                                </>
                              )}
                            </button>
                          </>
                        )}

                        {/* Confirmed Match State */}
                        {isConfirmed && (
                          <div className="flex items-center gap-2 flex-wrap justify-end">
                            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-[#22C55E]/15 border border-[#22C55E]/40 text-[#22C55E] text-xs font-black rounded-xl">
                              <CheckCircle2 size={14} />
                              <span>{booking.status === "CHECKED_IN" ? "Checked In" : "Confirmed"}</span>
                            </div>

                            {booking.status === "CONFIRMED" && (
                              <button
                                onClick={() => handleAction(booking, "CHECKED_IN")}
                                disabled={processingId === booking.id}
                                className="px-3 py-1.5 bg-surface-raised hover:bg-primary-lime/20 border border-border-subtle hover:border-primary-lime/40 text-text-secondary hover:text-primary-lime text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center gap-1 min-h-[32px]"
                                title="Check in player when they arrive at pitch"
                              >
                                <ShieldCheck size={13} />
                                <span>Check In</span>
                              </button>
                            )}

                            {booking.paymentStatus !== "PAID" && (
                              <button
                                onClick={() => handleMarkPaid(booking)}
                                disabled={processingId === booking.id}
                                className="px-3 py-1.5 bg-surface-raised hover:bg-[#22C55E]/20 border border-border-subtle hover:border-[#22C55E]/40 text-text-secondary hover:text-[#22C55E] text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center gap-1 min-h-[32px]"
                                title="Mark match as paid in cash"
                              >
                                <DollarSign size={13} />
                                <span>Mark Paid</span>
                              </button>
                            )}
                          </div>
                        )}

                        {/* Cancelled / Rejected State */}
                        {isCancelled && (
                          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-[#EF4444]/15 border border-[#EF4444]/40 text-[#EF4444] text-xs font-bold rounded-xl">
                            <X size={14} />
                            <span>Declined</span>
                          </div>
                        )}

                        {/* Payment Verification Review */}
                        {isPaymentReview && (
                          <div className="flex items-center gap-2">
                            {booking.paymentProofUrl && (
                              <button
                                onClick={() => setPreviewReceiptUrl(booking.paymentProofUrl!)}
                                className="px-2.5 py-2 bg-surface-raised hover:bg-border-subtle border border-border-subtle rounded-xl text-xs font-bold text-[#38BDF8] flex items-center gap-1.5 min-h-[38px]"
                              >
                                <Image size={14} />
                                <span>Receipt</span>
                              </button>
                            )}

                            <button
                              onClick={() => handleAction(booking, "CONFIRMED")}
                              disabled={processingId === booking.id}
                              className="px-3.5 py-2 bg-primary-lime hover:bg-[#96E600] text-accent-text font-extrabold rounded-xl text-xs flex items-center gap-1.5 transition-all cursor-pointer active:scale-95 disabled:opacity-50 min-h-[38px]"
                            >
                              {processingId === booking.id ? (
                                <Loader2 size={14} className="animate-spin" />
                              ) : (
                                <>
                                  <Check size={14} strokeWidth={3} />
                                  <span>Approve MoMo</span>
                                </>
                              )}
                            </button>

                            {rejectingId === booking.id ? (
                              <div className="flex items-center gap-1.5">
                                <input
                                  type="text"
                                  value={rejectReason}
                                  onChange={(e) => setRejectReason(e.target.value)}
                                  placeholder="Reason..."
                                  className="bg-surface-raised text-text-primary text-xs px-2.5 py-1.5 rounded-lg border border-border-subtle outline-none w-28"
                                />
                                <button
                                  onClick={() => handleAction(booking, "REJECTED")}
                                  disabled={!rejectReason}
                                  className="px-2.5 py-1.5 bg-[#EF4444] text-white text-xs font-bold rounded-lg"
                                >
                                  OK
                                </button>
                                <button
                                  onClick={() => {
                                    setRejectingId(null);
                                    setRejectReason("");
                                  }}
                                  className="p-1.5 text-text-tertiary hover:text-text-primary"
                                >
                                  <X size={14} />
                                </button>
                              </div>
                            ) : (
                              <button
                                onClick={() => setRejectingId(booking.id)}
                                disabled={processingId === booking.id}
                                className="px-3 py-2 bg-[#EF4444]/10 text-[#EF4444] border border-[#EF4444]/30 rounded-xl text-xs font-bold hover:bg-[#EF4444]/20 min-h-[38px]"
                              >
                                Reject
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Issue Menu Dropdown */}
                    {activeReportMenu === booking.id && (
                      <div className="mt-2 p-2 bg-surface-raised rounded-xl border border-border-subtle space-y-1 text-left animate-fadeIn">
                        <button
                          onClick={() => {
                            setReportTarget({ type: ReportTargetType.BOOKING, id: booking.id });
                            setActiveReportMenu(null);
                          }}
                          className="w-full p-2 text-xs font-bold text-text-primary hover:bg-surface-card rounded-lg transition-colors flex items-center gap-2"
                        >
                          <AlertTriangle size={13} className="text-[#FACC15]" />
                          <span>Report Match Issue (No-show / Dispute)</span>
                        </button>
                        <button
                          onClick={() => {
                            setReportTarget({ type: ReportTargetType.USER, id: booking.playerId || "unknown_player" });
                            setActiveReportMenu(null);
                          }}
                          className="w-full p-2 text-xs font-bold text-text-primary hover:bg-surface-card rounded-lg transition-colors flex items-center gap-2"
                        >
                          <User size={13} className="text-[#EF4444]" />
                          <span>Report Player Behavior</span>
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      ) : (
        /* VIEW MODE 2: CONSOLIDATED PAYMENT RECORDS */
        <div className="space-y-6">
          {/* Payment Pipeline Buckets */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
            {/* Screenshot Submitted Bucket */}
            <button
              onClick={() => setActivePaymentBucket("SUBMITTED")}
              className={`p-4 rounded-2xl border text-left transition-all relative overflow-hidden group active:scale-[0.99] cursor-pointer ${
                activePaymentBucket === "SUBMITTED"
                  ? "bg-surface-card border-[#38BDF8] shadow-sm ring-1 ring-[#38BDF8]"
                  : "bg-surface-card border-border-subtle hover:border-border-prominent"
              }`}
            >
              <div className="flex justify-between items-center mb-3">
                <div className="w-10 h-10 bg-[#38BDF8]/15 text-[#38BDF8] rounded-xl flex items-center justify-center">
                  <Smartphone size={20} />
                </div>
                <span className="text-2xl font-black text-[#38BDF8]">
                  {screenshotSubmittedBookings.length}
                </span>
              </div>
              <h4 className="text-xs font-extrabold uppercase tracking-wider text-text-primary">
                MoMo Screenshots
              </h4>
              <p className="text-[11px] text-text-tertiary mt-0.5 font-medium">
                Awaiting Verification
              </p>
            </button>

            {/* Cash on Arrival Bucket */}
            <button
              onClick={() => setActivePaymentBucket("CASH")}
              className={`p-4 rounded-2xl border text-left transition-all relative overflow-hidden group active:scale-[0.99] cursor-pointer ${
                activePaymentBucket === "CASH"
                  ? "bg-surface-card border-[#22C55E] shadow-sm ring-1 ring-[#22C55E]"
                  : "bg-surface-card border-border-subtle hover:border-border-prominent"
              }`}
            >
              <div className="flex justify-between items-center mb-3">
                <div className="w-10 h-10 bg-[#22C55E]/15 text-[#22C55E] rounded-xl flex items-center justify-center">
                  <Banknote size={20} />
                </div>
                <span className="text-2xl font-black text-[#22C55E]">
                  {cashBookings.length}
                </span>
              </div>
              <h4 className="text-xs font-extrabold uppercase tracking-wider text-text-primary">
                Cash on Arrival
              </h4>
              <p className="text-[11px] text-text-tertiary mt-0.5 font-medium">
                Pay at Facility
              </p>
            </button>

            {/* Unpaid Bookings Bucket */}
            <button
              onClick={() => setActivePaymentBucket("UNPAID")}
              className={`p-4 rounded-2xl border text-left transition-all relative overflow-hidden group active:scale-[0.99] cursor-pointer ${
                activePaymentBucket === "UNPAID"
                  ? "bg-surface-card border-[#FACC15] shadow-sm ring-1 ring-[#FACC15]"
                  : "bg-surface-card border-border-subtle hover:border-border-prominent"
              }`}
            >
              <div className="flex justify-between items-center mb-3">
                <div className="w-10 h-10 bg-[#FACC15]/15 text-[#FACC15] rounded-xl flex items-center justify-center">
                  <AlertCircle size={20} />
                </div>
                <span className="text-2xl font-black text-[#FACC15]">
                  {unpaidBookings.length}
                </span>
              </div>
              <h4 className="text-xs font-extrabold uppercase tracking-wider text-text-primary">
                Unpaid Matches
              </h4>
              <p className="text-[11px] text-text-tertiary mt-0.5 font-medium">
                Pending Settlement
              </p>
            </button>
          </div>

          {/* List of Active Pipeline Records */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-black uppercase tracking-wider text-text-secondary">
                {activePaymentBucket === "SUBMITTED"
                  ? "Mobile Money Receipts for Review"
                  : activePaymentBucket === "CASH"
                  ? "Pay On Arrival Match List"
                  : "Unsettled Bookings"}
                {" "}({activeBucketBookings.length})
              </h3>
            </div>

            {activeBucketBookings.length === 0 ? (
              <div className="text-center py-16 text-text-secondary bg-surface-card rounded-2xl border border-border-subtle">
                <Info size={36} className="mx-auto mb-2.5 opacity-40 text-text-tertiary" />
                <p className="text-xs font-bold uppercase tracking-wider text-text-primary">
                  No bookings found in this payment queue
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
                {activeBucketBookings.map((booking) => (
                  <div
                    key={booking.id}
                    className="bg-surface-card rounded-2xl p-4 border border-border-subtle hover:border-border-prominent transition-all shadow-sm space-y-3"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-10 h-10 bg-surface-raised rounded-xl flex items-center justify-center text-text-secondary shrink-0 border border-border-subtle">
                          <User size={18} />
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-bold text-text-primary truncate">
                            {booking.userName || "Player"}
                          </p>
                          <p className="text-xs text-text-secondary truncate">
                            {booking.turfName || booking.pitchName || "Sports Ground"} · {booking.date} · {booking.time}
                          </p>
                        </div>
                      </div>

                      <span className="text-xs font-black text-text-primary shrink-0">
                        UGX {(booking.price || booking.totalPrice || 0).toLocaleString()}
                      </span>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-border-subtle text-xs gap-2">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                        booking.paymentStatus === "PAID"
                          ? "bg-[#22C55E]/15 text-[#22C55E]"
                          : booking.paymentStatus === "SUBMITTED"
                          ? "bg-[#38BDF8]/15 text-[#38BDF8]"
                          : "bg-[#FACC15]/15 text-[#FACC15]"
                      }`}>
                        {booking.paymentStatus || "UNPAID"}
                      </span>

                      <div className="flex items-center gap-2">
                        {booking.paymentProofUrl && (
                          <button
                            onClick={() => setPreviewReceiptUrl(booking.paymentProofUrl!)}
                            className="px-3 py-1.5 bg-surface-raised hover:bg-border-subtle border border-border-subtle text-[#38BDF8] rounded-lg text-xs font-bold flex items-center gap-1"
                          >
                            <Image size={13} />
                            <span>View MoMo Screenshot</span>
                          </button>
                        )}

                        {booking.status === BookingStatus.PAYMENT_SUBMITTED && (
                          <button
                            onClick={() => handleAction(booking, "CONFIRMED")}
                            disabled={processingId === booking.id}
                            className="px-3 py-1.5 bg-primary-lime text-accent-text font-bold rounded-lg text-xs flex items-center gap-1 active:scale-95"
                          >
                            {processingId === booking.id ? (
                              <Loader2 size={13} className="animate-spin" />
                            ) : (
                              <>
                                <Check size={13} strokeWidth={3} />
                                <span>Approve</span>
                              </>
                            )}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Screenshot Preview Modal */}
      {previewReceiptUrl && (
        <div
          className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn"
          onClick={() => setPreviewReceiptUrl(null)}
        >
          <div
            className="relative max-w-xl w-full bg-surface-card rounded-2xl border border-border-subtle p-3 shadow-2xl space-y-3"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-2 border-b border-border-subtle">
              <span className="text-xs font-bold text-text-primary uppercase tracking-wider">
                Submitted MoMo Payment Proof
              </span>
              <button
                onClick={() => setPreviewReceiptUrl(null)}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-text-secondary hover:text-text-primary bg-surface-raised hover:bg-border-subtle"
              >
                <X size={16} />
              </button>
            </div>
            <div className="max-h-[75vh] overflow-auto rounded-xl bg-app-base flex items-center justify-center">
              <img
                src={previewReceiptUrl}
                alt="Payment Receipt"
                className="w-full h-auto object-contain rounded-lg"
                onError={(e) => {
                  e.currentTarget.src = "/placeholder-receipt.png";
                }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Report Modal */}
      {reportTarget && (
        <ReportModal
          isOpen={!!reportTarget}
          onClose={() => setReportTarget(null)}
          targetType={reportTarget.type}
          targetId={reportTarget.id}
          reporterRole="owner"
        />
      )}

      {/* Floating Dynamic Feedback Toast */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-[140] animate-fadeIn max-w-sm w-[calc(100%-3rem)] shadow-2xl">
          <div
            className={`p-3.5 sm:p-4 rounded-2xl border flex items-center justify-between gap-3 backdrop-blur-xl shadow-2xl ${
              toast.type === "success"
                ? "bg-[#091a10]/95 border-[#22C55E]/60 text-[#22C55E]"
                : toast.type === "error"
                ? "bg-[#1f0909]/95 border-[#EF4444]/60 text-[#EF4444]"
                : "bg-[#071321]/95 border-[#38BDF8]/60 text-[#38BDF8]"
            }`}
          >
            <div className="flex items-center gap-3 min-w-0">
              <div
                className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border ${
                  toast.type === "success"
                    ? "bg-[#22C55E]/20 border-[#22C55E]/40 text-[#22C55E]"
                    : toast.type === "error"
                    ? "bg-[#EF4444]/20 border-[#EF4444]/40 text-[#EF4444]"
                    : "bg-[#38BDF8]/20 border-[#38BDF8]/40 text-[#38BDF8]"
                }`}
              >
                {toast.type === "success" ? (
                  <CheckCircle2 size={18} />
                ) : toast.type === "error" ? (
                  <AlertCircle size={18} />
                ) : (
                  <Info size={18} />
                )}
              </div>
              <div className="min-w-0">
                <p className="text-xs font-black text-text-primary tracking-wide">
                  {toast.title}
                </p>
                <p className="text-[11px] text-text-secondary truncate mt-0.5">
                  {toast.message}
                </p>
              </div>
            </div>
            <button
              onClick={() => setToast(null)}
              className="p-1.5 rounded-lg text-text-secondary hover:text-text-primary hover:bg-white/10 shrink-0 cursor-pointer"
            >
              <X size={14} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
