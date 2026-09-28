import React, { useState } from "react";
import { Layout } from "../components/Layout";
import { useBooking } from "../context/BookingContext";
import { useUser } from "../context/UserContext";
import { chatService } from "../services/chatService";
import { ArrowLeft, ChevronLeft, MapPin, AlertTriangle, ShieldAlert, User, Calendar, Trophy, Trash2, Loader2, CheckCircle2, X, MessageSquare, Phone, QrCode } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { ReportModal } from "../components/ReportModal";
import { ReportTargetType, BookingStatus } from "../types";
import { EmptyState } from "../components/ui/EmptyState";
import { BookingCardSkeleton } from "../components/ui/Skeleton";
import { formatBookingDate, formatBookingTime } from "../lib/dateUtils";

export const Bookings: React.FC = () => {
  const navigate = useNavigate();
  const { user, userProfile } = useUser();
  const { bookings, loading, updateBookingStatus, removeBooking } = useBooking();
  const [activeTab, setActiveTab] = useState<"upcoming" | "completed" | "cancelled">("upcoming");
  const [reportTarget, setReportTarget] = useState<{ type: ReportTargetType; id: string } | null>(null);
  const [activeReportMenu, setActiveReportMenu] = useState<string | null>(null);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [confirmModal, setConfirmModal] = useState<{
    bookingId: string;
    action: "CANCEL" | "DELETE";
    title: string;
    message: string;
  } | null>(null);
  const [feedbackToast, setFeedbackToast] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  // Fallback mock bookings if there are none in the context
  const getMockBookings = () => {
    const today = new Date();
    const futureDate1 = new Date(today.getTime() + 86400000 * 2).toISOString().split("T")[0];
    const futureDate2 = new Date(today.getTime() + 86400000 * 4).toISOString().split("T")[0];
    const pastDate = new Date(today.getTime() - 86400000 * 3).toISOString().split("T")[0];
    const cancelledDate = new Date(today.getTime() - 86400000 * 7).toISOString().split("T")[0];

    return [
      {
        id: "booking_mock_1",
        turfId: "panamera-kololo",
        pitchId: "panamera-kololo",
        turfName: "Panamera Sports Lounge & Turf",
        pitchName: "Panamera Sports Lounge & Turf",
        playerId: "player_mock_1",
        userName: "David Okello",
        ownerId: "owner_panamera_kololo",
        date: futureDate1,
        time: "18:00 - 19:00",
        slots: ["18:00"],
        duration: 1,
        status: BookingStatus.CONFIRMED,
        price: 70000,
        totalPrice: 70000,
        paymentStatus: "PAID" as const,
        paymentMethod: "MTN",
        location: "Plot 24 Saddler Way, Kololo, Kampala",
        image: "https://images.unsplash.com/photo-1574629810360-7efbbe195018?auto=format&fit=crop&w=800&q=80",
        pitchFormat: "7-a-side AstroTurf",
        managerName: "Denis Mukasa",
        contactPhone: "+256 701 556 778",
        bookingRef: "FTL-88219"
      },
      {
        id: "booking_mock_2",
        turfId: "kinetic-bugolobi",
        pitchId: "kinetic-bugolobi",
        turfName: "Kinetic Sports Arena",
        pitchName: "Kinetic Sports Arena",
        playerId: "player_mock_1",
        userName: "David Okello",
        ownerId: "owner_kinetic_bugolobi",
        date: futureDate2,
        time: "20:00 - 21:00",
        slots: ["20:00"],
        duration: 1,
        status: BookingStatus.PENDING,
        price: 80000,
        totalPrice: 80000,
        paymentStatus: "SUBMITTED" as const,
        paymentMethod: "AIRTEL",
        location: "Bandali Rise, Bugolobi, Kampala",
        image: "https://images.unsplash.com/photo-1577223625816-7546f13df25d?auto=format&fit=crop&w=800&q=80",
        pitchFormat: "5-a-side Floodlit Turf",
        managerName: "Sarah Namubiru",
        contactPhone: "+256 782 449 112",
        bookingRef: "FTL-94032"
      },
      {
        id: "booking_mock_3",
        turfId: "lugogo-astroturf",
        pitchId: "lugogo-astroturf",
        turfName: "Lugogo AstroTurf Grounds",
        pitchName: "Lugogo AstroTurf Grounds",
        playerId: "player_mock_1",
        userName: "David Okello",
        ownerId: "owner_lugogo_grounds",
        date: pastDate,
        time: "16:00 - 18:00",
        slots: ["16:00", "17:00"],
        duration: 2,
        status: BookingStatus.COMPLETED,
        price: 180000,
        totalPrice: 180000,
        paymentStatus: "PAID" as const,
        paymentMethod: "MTN",
        location: "Lugogo Bypass, Kampala",
        image: "https://images.unsplash.com/photo-1556056504-5c7696c4c28d?auto=format&fit=crop&w=800&q=80",
        pitchFormat: "11-a-side Full Field",
        managerName: "Coach Brian Kigozi",
        contactPhone: "+256 752 991 304",
        bookingRef: "FTL-71190"
      },
      {
        id: "booking_mock_4",
        turfId: "kensington-kololo",
        pitchId: "kensington-kololo",
        turfName: "Kensington Sports Ground",
        pitchName: "Kensington Sports Ground",
        playerId: "player_mock_1",
        userName: "David Okello",
        ownerId: "owner_kensington",
        date: cancelledDate,
        time: "15:00 - 16:00",
        slots: ["15:00"],
        duration: 1,
        status: BookingStatus.CANCELLED,
        price: 120000,
        totalPrice: 120000,
        paymentStatus: "UNPAID" as const,
        location: "Kololo, Kampala",
        image: "https://images.unsplash.com/photo-1543326727-cf6c39e8f84c?auto=format&fit=crop&q=80",
        pitchFormat: "7-a-side Natural Grass",
        managerName: "Arthur Kasozi",
        contactPhone: "+256 772 113 450",
        bookingRef: "FTL-55201"
      }
    ];
  };

  const allBookings = bookings.length > 0 ? bookings : getMockBookings();

  const filteredBookings = allBookings.filter((b) => {
    const rawStatus = (b.status || "").toString().toUpperCase();
    if (activeTab === "upcoming") {
      return (
        rawStatus === "CONFIRMED" ||
        rawStatus === "PENDING" ||
        rawStatus === "PENDING_PAYMENT" ||
        rawStatus === "PAYMENT_SUBMITTED"
      );
    } else if (activeTab === "completed") {
      return (
        rawStatus === "COMPLETED" ||
        rawStatus === "CHECKED_IN" ||
        rawStatus === "NO_SHOW" ||
        rawStatus === "DISPUTED"
      );
    } else {
      return rawStatus === "CANCELLED" || rawStatus === "REJECTED";
    }
  });

  const handleChatOwner = async (b: any) => {
    if (!user) {
      navigate('/login');
      return;
    }
    const targetOwnerId = b.ownerId || "owner_facility_default";
    try {
      const convId = await chatService.getOrCreateDirectConversation(
        user.uid,
        targetOwnerId,
        {
          turfName: b.pitchName || b.turfName || "Sports Ground",
          pitchId: b.pitchId || b.turfId,
          participantDetails: {
            [user.uid]: {
              name: userProfile?.name || user.displayName || "Player",
              avatar: user.photoURL || ""
            },
            [targetOwnerId]: {
              name: b.managerName || "Pitch Manager",
              role: "Owner"
            }
          }
        }
      );
      navigate(`/chat/${convId}`);
    } catch (e) {
      console.error("Failed to start chat with owner:", e);
    }
  };

  const handleConfirmAction = async () => {
    if (!confirmModal) return;
    const { bookingId, action } = confirmModal;
    setActionLoadingId(bookingId);
    setConfirmModal(null);
    try {
      if (action === "CANCEL") {
        await updateBookingStatus(bookingId, BookingStatus.CANCELLED);
        setFeedbackToast({ type: "success", message: "Booking cancelled successfully. Slot is now available." });
      } else {
        await removeBooking(bookingId);
        setFeedbackToast({ type: "success", message: "Booking record removed." });
      }
    } catch (err: any) {
      console.error("Booking action failed:", err);
      setFeedbackToast({ type: "error", message: err?.message || "Failed to update booking." });
    } finally {
      setActionLoadingId(null);
      setTimeout(() => setFeedbackToast(null), 4000);
    }
  };

  return (
    <Layout>
      <div className="min-h-full bg-app-base text-text-primary font-sans pb-24 relative">
        {/* Dynamic Toast Feedback */}
        {feedbackToast && (
          <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 w-[90%] max-w-sm">
            <div className={`p-3.5 rounded-2xl border flex items-center justify-between gap-3 shadow-xl animate-fadeIn ${
              feedbackToast.type === "success" 
                ? "bg-[#22C55E]/15 border-[#22C55E]/40 text-[#22C55E]" 
                : "bg-[#EF4444]/15 border-[#EF4444]/40 text-[#EF4444]"
            }`}>
              <div className="flex items-center gap-2 text-xs font-bold min-w-0">
                <CheckCircle2 size={16} className="shrink-0" />
                <span className="truncate">{feedbackToast.message}</span>
              </div>
              <button onClick={() => setFeedbackToast(null)} className="p-1 text-text-tertiary hover:text-text-primary cursor-pointer">
                <X size={14} />
              </button>
            </div>
          </div>
        )}
        {/* Header */}
        <div className="max-w-xl mx-auto p-4 flex items-center justify-between sticky top-0 bg-app-base/90 backdrop-blur-md z-40 border-b border-border-subtle">
          <button 
            onClick={() => navigate("/home")} 
            className="w-9 h-9 rounded-full flex items-center justify-center text-text-primary hover:bg-surface-raised transition-colors cursor-pointer"
            title="Back to Home"
            aria-label="Back to Home"
          >
            <ArrowLeft size={18} strokeWidth={2.5} />
          </button>
          <h1 id="heading-my-bookings" className="text-[15px] font-bold text-text-primary scroll-mt-24">
            My Bookings
          </h1>
          <div className="w-9 h-9"></div>
        </div>

        <div className="max-w-xl mx-auto p-4 space-y-6">
          {/* Segmented Filter Control */}
          <div id="bookings-filter-control" className="p-1 bg-surface-card rounded-2xl border border-border-subtle flex gap-1 items-center scroll-mt-24">
            {(["upcoming", "completed", "cancelled"] as const).map((tab) => {
              const isActive = activeTab === tab;
              return (
                <button 
                  key={tab}
                  className={`flex-1 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all min-h-[40px] cursor-pointer ${
                    isActive 
                      ? "bg-primary-lime text-accent-text shadow-sm shadow-primary-lime/20" 
                      : "text-text-secondary hover:text-text-primary hover:bg-surface-raised"
                  }`}
                  onClick={() => setActiveTab(tab)}
                >
                  {tab}
                </button>
              );
            })}
          </div>

          {/* List */}
          <div id="walkthrough-qr-pass-section" className="flex flex-col gap-4 scroll-mt-24">
            {loading ? (
              Array.from({ length: 3 }).map((_, idx) => (
                <BookingCardSkeleton key={idx} />
              ))
            ) : filteredBookings.length === 0 ? (
              <EmptyState
                icon={Calendar}
                title={`No ${activeTab} bookings`}
                description={`You don't have any ${activeTab} bookings scheduled at the moment. Find a pitch near you to get playing.`}
                actionText="Find a Turf"
                onAction={() => navigate("/home")}
                accentColor="lime"
                className="my-4"
              />
            ) : (
              filteredBookings.map((b) => (
                <div key={b.id} className="bg-surface-card rounded-2xl p-4 border border-border-subtle space-y-4 hover:border-[#383838] transition-all">
                  <div className="flex justify-between items-center pb-3 border-b border-border-subtle">
                    <div>
                      <p className="text-text-primary font-bold text-sm">
                        {formatBookingDate(b.date)}
                      </p>
                      <p className="text-text-secondary text-xs font-medium mt-0.5">
                        {formatBookingTime(b.time, (b as any).slots, (b as any).duration)}
                      </p>
                    </div>
                    <div className="text-right flex flex-col items-end gap-1.5">
                      <p className="text-text-primary font-black text-sm">
                        UGX {((b as any).totalPrice || (b as any).price || 0).toLocaleString()}
                      </p>
                      <span className={`px-2.5 py-0.5 rounded-md text-[10px] font-bold border uppercase tracking-wider ${
                        b.status === BookingStatus.CONFIRMED || b.status === BookingStatus.COMPLETED || b.status === BookingStatus.CHECKED_IN
                          ? "bg-[#22C55E]/10 text-[#22C55E] border-[#22C55E]/30"
                          : b.status === BookingStatus.CANCELLED || b.status === BookingStatus.REJECTED || b.status === BookingStatus.NO_SHOW
                            ? "bg-[#EF4444]/10 text-[#EF4444] border-[#EF4444]/30"
                            : "bg-[#FACC15]/10 text-[#FACC15] border-[#FACC15]/30"
                      }`}>
                        {b.status.toUpperCase().replace('_', ' ')}
                      </span>
                    </div>
                  </div>

                  <div className="flex gap-4">
                    <div className="w-18 h-18 rounded-2xl overflow-hidden shrink-0 border border-border-subtle bg-surface-raised shadow-xs">
                      <img 
                        src={(b as any).image || "https://images.unsplash.com/photo-1574629810360-7efbbe195018?auto=format&fit=crop&q=80"} 
                        alt="Pitch"
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.currentTarget.src = "https://images.unsplash.com/photo-1574629810360-7efbbe195018?auto=format&fit=crop&q=80";
                        }}
                      />
                    </div>
                    <div className="flex-1 min-w-0 flex flex-col justify-center">
                      <div className="flex items-center gap-2">
                        <h3 className="text-text-primary font-extrabold text-[15px] leading-tight truncate">
                          {(b as any).pitchName || (b as any).turfName || "Football Pitch"}
                        </h3>
                        <span className="shrink-0 text-[10px] font-mono font-bold text-text-tertiary bg-surface-raised px-1.5 py-0.5 rounded border border-border-subtle">
                          #{(b.id || "").slice(-6).toUpperCase()}
                        </span>
                      </div>
                      
                      <div className="flex items-center gap-1.5 text-text-secondary text-xs font-medium mt-1 truncate">
                        <MapPin size={13} className="text-primary-lime shrink-0" />
                        <span className="truncate">{(b as any).location || "Kampala, Uganda"}</span>
                      </div>

                      <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                        <span className="text-[10px] font-bold text-text-secondary bg-surface-raised px-2 py-0.5 rounded-md border border-border-subtle">
                          {(b as any).pitchFormat || (b as any).type || "7-a-side AstroTurf"}
                        </span>
                        {(b as any).managerName && (
                          <span className="text-[10px] font-medium text-text-tertiary">
                            Manager: <strong className="text-text-secondary font-semibold">{(b as any).managerName}</strong>
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-border-subtle flex items-center justify-end gap-2 flex-wrap">
                    <button 
                      onClick={() => setActiveReportMenu(activeReportMenu === b.id ? null : b.id)}
                      className="px-2.5 py-1.5 rounded-xl bg-surface-raised hover:bg-border-subtle border border-border-subtle text-text-tertiary hover:text-text-secondary text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer mr-auto"
                    >
                      <ShieldAlert size={13} />
                      <span>Report</span>
                    </button>

                    <button
                      onClick={() => handleChatOwner(b)}
                      className="px-3 py-1.5 rounded-xl bg-surface-raised hover:bg-border-subtle border border-border-subtle text-text-primary text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer active:scale-95"
                      title="Chat with Pitch Owner/Manager"
                    >
                      <MessageSquare size={13} className="text-primary-lime" />
                      <span>Chat Host</span>
                    </button>

                    {activeTab === "upcoming" && (
                      <>
                        <button
                          disabled={actionLoadingId === b.id}
                          className="px-3 py-1.5 rounded-xl bg-surface-raised hover:bg-[#EF4444]/20 hover:text-[#EF4444] border border-border-subtle text-text-secondary text-xs font-bold transition-colors cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
                          onClick={() => {
                            setConfirmModal({
                              bookingId: b.id,
                              action: "CANCEL",
                              title: "Cancel Match Booking?",
                              message: "Are you sure you want to cancel this booking? This will release the slot for other players."
                            });
                          }}
                        >
                          {actionLoadingId === b.id ? (
                            <Loader2 size={13} className="animate-spin text-[#EF4444]" />
                          ) : null}
                          <span>Cancel</span>
                        </button>
                        <button
                          className="px-4 py-1.5 rounded-xl bg-primary-lime hover:bg-[#96E600] text-accent-text text-xs font-extrabold flex items-center gap-1.5 transition-all cursor-pointer shadow-xs active:scale-95"
                          onClick={() => navigate(`/booking-confirmation/${b.id}`)}
                        >
                          <QrCode size={13} />
                          <span>View Pass</span>
                        </button>
                      </>
                    )}
                    {activeTab === "completed" && (
                      <button 
                        onClick={() => navigate(`/match-summary/${b.id}`)}
                        className="px-4 py-2 rounded-xl bg-primary-lime hover:bg-[#96E600] text-accent-text text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer"
                        id={`match-summary-btn-${b.id}`}
                      >
                        <Trophy size={14} />
                        Summary
                      </button>
                    )}
                    {activeTab === "cancelled" && (
                      <button 
                        disabled={actionLoadingId === b.id}
                        className="px-4 py-2 rounded-xl bg-[#EF4444]/15 hover:bg-[#EF4444]/25 text-[#EF4444] border border-[#EF4444]/30 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
                        onClick={() => {
                          setConfirmModal({
                            bookingId: b.id,
                            action: "DELETE",
                            title: "Delete Booking History?",
                            message: "Are you sure you want to permanently remove this cancelled booking record?"
                          });
                        }}
                      >
                        {actionLoadingId === b.id ? (
                          <Loader2 size={13} className="animate-spin text-[#EF4444]" />
                        ) : (
                          <Trash2 size={14} />
                        )}
                        <span>Delete</span>
                      </button>
                    )}
                  </div>

                  {/* Expandable Report Selection Menu */}
                  {activeReportMenu === b.id && (
                    <div className="mt-3 p-2 bg-surface-raised rounded-xl border border-border-subtle space-y-1 text-left animate-fadeIn">
                      <button
                        onClick={() => {
                          setReportTarget({ type: ReportTargetType.BOOKING, id: b.id });
                          setActiveReportMenu(null);
                        }}
                        className="w-full p-2.5 text-xs font-bold text-text-primary hover:bg-border-subtle rounded-lg transition-colors flex items-center gap-2 cursor-pointer"
                      >
                        <AlertTriangle size={15} className="text-[#FACC15]" />
                        <span>Report booking issue (no-show, condition)</span>
                      </button>
                      <button
                        onClick={() => {
                          setReportTarget({ type: ReportTargetType.USER, id: b.ownerId || "unknown_owner" });
                          setActiveReportMenu(null);
                        }}
                        className="w-full p-2.5 text-xs font-bold text-[#EF4444] hover:bg-border-subtle rounded-lg transition-colors flex items-center gap-2 cursor-pointer"
                      >
                        <User size={15} />
                        <span>Report pitch owner (conduct, fraud)</span>
                      </button>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {reportTarget && (
        <ReportModal
          isOpen={!!reportTarget}
          onClose={() => setReportTarget(null)}
          targetType={reportTarget.type}
          targetId={reportTarget.id}
          reporterRole="player"
        />
      )}

      {/* Confirmation Modal */}
      {confirmModal && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-fadeIn"
          onClick={() => setConfirmModal(null)}
        >
          <div 
            className="bg-surface-card border border-border-subtle p-5 rounded-2xl max-w-sm w-full space-y-4 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#EF4444]/15 text-[#EF4444] flex items-center justify-center shrink-0">
                <AlertTriangle size={20} />
              </div>
              <div>
                <h3 className="text-sm font-black text-text-primary">{confirmModal.title}</h3>
                <p className="text-xs text-text-secondary mt-1">{confirmModal.message}</p>
              </div>
            </div>
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-border-subtle">
              <button
                onClick={() => setConfirmModal(null)}
                className="px-3.5 py-2 rounded-xl bg-surface-raised hover:bg-border-subtle text-text-secondary text-xs font-bold transition-all cursor-pointer"
              >
                Go Back
              </button>
              <button
                onClick={handleConfirmAction}
                className="px-4 py-2 rounded-xl bg-[#EF4444] hover:bg-[#EF4444]/90 text-white text-xs font-black transition-all shadow-md cursor-pointer"
              >
                {confirmModal.action === "CANCEL" ? "Yes, Cancel Slot" : "Yes, Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
};
