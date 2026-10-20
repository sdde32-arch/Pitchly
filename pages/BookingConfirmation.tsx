import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Layout } from "../components/Layout";
import { useBooking } from "../context/BookingContext";
import { bookingService } from "../services/bookingService";
import { pitchService } from "../services/pitchService";
import { Turf, BookingStatus, PaymentMethod } from "../types";
import { formatBookingDate } from "../lib/dateUtils";
import { storageService } from "../services/storageService";
import { 
  Check, 
  ShieldCheck, 
  CheckCircle2, 
  ArrowLeft, ChevronLeft, 
  Loader2, 
  ArrowRight,
  Calendar,
  Clock,
  MapPin,
  Share2,
  Copy,
  Home,
  QrCode,
  Sparkles,
  AlertTriangle,
  Zap,
  CreditCard,
  UploadCloud,
  X
} from "lucide-react";

export const BookingConfirmation: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { bookings } = useBooking();
  
  const [booking, setBooking] = useState<any | null>(null);
  const [turf, setTurf] = useState<Turf | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [remainingSeconds, setRemainingSeconds] = useState<number | null>(null);
  const [isAutoReleased, setIsAutoReleased] = useState(false);

  // Upgrade tentative booking state
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [upgradeTier, setUpgradeTier] = useState<'DEPOSIT' | 'FULL'>('DEPOSIT');
  const [upgradeMethod, setUpgradeMethod] = useState<PaymentMethod>(PaymentMethod.MTN);
  const [upgradeProofUrl, setUpgradeProofUrl] = useState<string | null>(null);
  const [upgradeProofFileName, setUpgradeProofFileName] = useState("");
  const [upgradeUploadingProof, setUpgradeUploadingProof] = useState(false);
  const [upgradeTxRef, setUpgradeTxRef] = useState("");
  const [upgrading, setUpgrading] = useState(false);
  const [upgradeError, setUpgradeError] = useState("");

  useEffect(() => {
    const fetchDetails = async () => {
      if (!id) return;
      try {
        let foundBooking: any = bookings.find(b => b.id === id) || null;
        if (!foundBooking) {
          foundBooking = await bookingService.getById(id);
        }
        
        // Check for mock booking fallback
        if (!foundBooking) {
          if (id === "booking_mock_1" || id.startsWith("booking_mock_")) {
            foundBooking = {
              id: id,
              turfId: "panamera-kololo",
              pitchId: "panamera-kololo",
              turfName: "Panamera Sports Lounge & Turf",
              pitchName: "Panamera Sports Lounge & Turf",
              playerId: "player_mock_1",
              userName: "David Okello",
              ownerId: "owner_panamera_kololo",
              date: new Date(Date.now() + 86400000 * 2).toISOString().split("T")[0],
              time: "18:00 - 19:00",
              slots: ["18:00"],
              duration: 1,
              status: BookingStatus.CONFIRMED,
              price: 70000,
              totalPrice: 70000,
              paymentStatus: "PAID",
              paymentMethod: "MTN",
              location: "Plot 24 Saddler Way, Kololo, Kampala",
              image: "https://images.unsplash.com/photo-1574629810360-7efbbe195018?auto=format&fit=crop&w=1200&q=80",
              pitchFormat: "7-a-side AstroTurf",
              bookingRef: "FTL-88219"
            };
          }
        }
        
        if (foundBooking) {
          setBooking(foundBooking);
          const pitchIdToLook = (foundBooking as any).pitchId || foundBooking.turfId;
          let foundTurf: any = null;
          if (pitchIdToLook) {
            try {
              foundTurf = await pitchService.getById(pitchIdToLook);
            } catch (pErr) {
              console.warn("Could not fetch pitch from service", pErr);
            }
          }
          // If not in database or inactive, construct a valid Turf object directly from the historical booking record
          if (!foundTurf) {
            foundTurf = {
              id: pitchIdToLook || "pitch_confirmed",
              name: foundBooking.turfName || foundBooking.pitchName || "Sports Arena Turf",
              location: foundBooking.location || "Kampala, Uganda",
              fullAddress: foundBooking.location || "Kampala, Uganda",
              pricePerHour: foundBooking.price || 70000,
              image: foundBooking.image || "https://images.unsplash.com/photo-1574629810360-7efbbe195018?auto=format&fit=crop&w=1200&q=80",
              pitchFormats: [foundBooking.pitchFormat || "7-a-side AstroTurf"],
              contactPhone: foundBooking.contactPhone || "+256 701 556 778"
            };
          }
          setTurf(foundTurf as any);
        }
      } catch (error) {
        console.error("Failed to load booking details:", error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchDetails();
  }, [id, bookings]);

  const handleSharePass = async () => {
    const shareUrl = window.location.href;
    const shareText = `Pitch pass secured at ${turf?.name || "the turf"}! Reference: #${(booking?.id || id || "").slice(-6).toUpperCase()}`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: "Pitchly Match Pass",
          text: shareText,
          url: shareUrl,
        });
        return;
      } catch (err) {
        // Fallback to clipboard
      }
    }

    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch (err) {
      console.warn("Failed to copy pass URL", err);
    }
  };

  const handleCopyRef = async () => {
    const refCode = (booking?.id || id || "").slice(-6).toUpperCase();
    try {
      await navigator.clipboard.writeText(refCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.warn("Failed to copy code", err);
    }
  };

  const isTentative = booking?.status === BookingStatus.TENTATIVE || booking?.bookingTier === 'TENTATIVE';
  const isPreempted = booking?.status === BookingStatus.PREEMPTED;
  const isDepositPaid = booking?.status === BookingStatus.DEPOSIT_PAID;
  const isDepositAwaitingVerification = (booking?.status === BookingStatus.PAYMENT_SUBMITTED || booking?.status === BookingStatus.PENDING_PAYMENT) && booking?.bookingTier === 'DEPOSIT';
  const isCancelled = booking?.status === BookingStatus.CANCELLED;

  const handleUpgradeProofUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setUpgradeUploadingProof(true);
      setUpgradeError("");
      const url = await storageService.uploadPaymentProof(`upgrade-${booking?.id}-${Date.now()}`, file);
      setUpgradeProofUrl(url);
      setUpgradeProofFileName(file.name);
    } catch (err: any) {
      setUpgradeError(err.message || "Failed to upload receipt screenshot.");
    } finally {
      setUpgradeUploadingProof(false);
    }
  };

  const handleUpgradeTentative = async () => {
    if (!booking) return;
    if ((upgradeMethod === PaymentMethod.MTN || upgradeMethod === PaymentMethod.AIRTEL) && !upgradeProofUrl && !upgradeTxRef) {
      setUpgradeError("Please upload your receipt screenshot or enter your transaction reference.");
      return;
    }

    try {
      setUpgrading(true);
      setUpgradeError("");
      const depositPct = (turf as any)?.depositPercentage || 30;
      const totalAmount = (booking as any).totalPrice || booking.price || 0;
      const calcDeposit = Math.max(20000, Math.round((totalAmount * (depositPct / 100)) / 1000) * 1000);
      const calcBalance = Math.max(0, totalAmount - calcDeposit);

      const updated = await bookingService.upgradeTentativeBooking(booking.id, upgradeTier, {
        paymentMethod: upgradeMethod,
        paymentProofUrl: upgradeProofUrl || undefined,
        transactionRef: upgradeTxRef || undefined,
        depositAmount: upgradeTier === 'DEPOSIT' ? calcDeposit : 0,
        balanceDue: upgradeTier === 'DEPOSIT' ? calcBalance : 0,
      });

      setBooking(updated);
      setShowUpgradeModal(false);
    } catch (err: any) {
      console.error("Failed to upgrade tentative booking:", err);
      setUpgradeError(err.message || "Failed to upgrade reservation.");
    } finally {
      setUpgrading(false);
    }
  };

  useEffect(() => {
    if (!booking) return;
    // Tentative bookings and guaranteed bookings do not have a 15-minute expiration countdown
    if (isTentative || isPreempted || isDepositPaid || booking.status === BookingStatus.CONFIRMED) {
      setRemainingSeconds(null);
      return;
    }

    const isPending =
      booking.status === BookingStatus.PENDING ||
      booking.status === BookingStatus.PENDING_PAYMENT ||
      (booking.paymentStatus === 'UNPAID' && booking.status !== BookingStatus.CONFIRMED);

    if (!isPending) {
      setRemainingSeconds(null);
      return;
    }

    const checkAndTick = () => {
      const isExpired = bookingService.isPendingBookingExpired(booking);
      if (isExpired) {
        setIsAutoReleased(true);
        bookingService.releasePendingBooking(
          booking.id,
          'Payment window expired (15 minutes exceeded without completed payment)'
        ).then(() => {
          setBooking((prev: any) => prev ? {
            ...prev,
            status: BookingStatus.CANCELLED,
            cancellationReason: 'Payment window expired (15 minutes exceeded without completed payment)'
          } : null);
        });
        setRemainingSeconds(0);
        return;
      }

      const remMs = bookingService.getRemainingPaymentTimeMs(booking);
      setRemainingSeconds(Math.max(0, Math.ceil(remMs / 1000)));
    };

    checkAndTick();
    const interval = setInterval(checkAndTick, 1000);
    return () => clearInterval(interval);
  }, [booking?.id, booking?.status, booking?.paymentStatus, booking?.holdExpiresAt, isTentative, isPreempted, isDepositPaid]);

  if (loading) {
    return (
      <Layout>
        <div className="min-h-[80vh] flex flex-col items-center justify-center gap-3">
          <Loader2 className="w-9 h-9 text-primary-lime animate-spin" />
          <p className="text-xs font-semibold text-text-secondary">Securing your Match Pass...</p>
        </div>
      </Layout>
    );
  }

  if (!booking || !turf) {
    return (
      <Layout>
        <div className="min-h-[80vh] flex flex-col items-center justify-center p-6 text-center">
          <div className="w-16 h-16 rounded-full bg-status-error/10 text-status-error flex items-center justify-center mb-4">
            <CheckCircle2 size={32} />
          </div>
          <h2 className="text-text-primary text-xl font-bold mb-2">Booking Not Found</h2>
          <p className="text-text-secondary text-xs sm:text-sm max-w-xs mb-6">
            We couldn't retrieve this match reservation. It may have expired or been removed.
          </p>
          <button 
            onClick={() => navigate('/bookings')} 
            className="px-6 py-3 rounded-2xl bg-primary-lime text-accent-text font-black text-xs uppercase tracking-wider shadow-md hover:bg-primary-lime-hover transition-all cursor-pointer"
          >
            Go to My Bookings
          </button>
        </div>
      </Layout>
    );
  }

  const bookingRef = (booking.id || id || "").slice(-6).toUpperCase();
  const slotText = (booking.slots && booking.slots.length > 0 ? booking.slots[0] : booking.time) || "18:00";
  const duration = booking.duration && booking.duration > 0 ? booking.duration : (booking.slots ? booking.slots.length : 1);
  const endHour = (parseInt(slotText.split(":")[0] || "18", 10) + duration) % 24;
  const formattedEndTime = `${String(endHour).padStart(2, "0")}:00`;
  const formattedPrice = ((booking as any).totalPrice || booking.price || 0).toLocaleString();
  const formattedDate = formatBookingDate(booking.date, { 
    weekday: 'short', 
    month: 'short', 
    day: 'numeric', 
    year: 'numeric' 
  });

  const isConfirmed = booking.status === "confirmed" || booking.status === "active";

  return (
    <Layout>
      <div className="min-h-full bg-app-base text-text-primary flex flex-col">
        {/* Navigation Header */}
        <div className="sticky top-0 z-40 bg-surface-card/90 backdrop-blur-md border-b border-border-subtle px-4 py-3 flex items-center justify-between">
          <button
            id="confirmation-back-btn"
            onClick={() => navigate('/home', { replace: true })}
            className="w-10 h-10 rounded-2xl bg-surface-raised hover:bg-border-subtle flex items-center justify-center text-text-primary transition-colors border border-border-subtle shadow-xs cursor-pointer active:scale-95"
            title="Back to Home"
            aria-label="Back to Home"
          >
            <ArrowLeft size={20} strokeWidth={2.5} />
          </button>
          <span className="font-bold text-sm text-text-primary tracking-wide">Official Match Pass</span>
          <button
            id="confirmation-share-btn"
            onClick={handleSharePass}
            className="w-10 h-10 rounded-2xl bg-surface-raised hover:bg-border-subtle flex items-center justify-center text-text-primary transition-colors border border-border-subtle shadow-xs cursor-pointer active:scale-95"
            title="Share Pass"
          >
            <Share2 size={18} />
          </button>
        </div>

        {/* Scrollable Container with Ample Bottom Clearance */}
        <div className="flex-1 overflow-y-auto px-4 pt-6 pb-32 sm:pb-36 max-w-md mx-auto w-full">
          <div className="flex flex-col items-center justify-center text-center">
            
            {/* Animated Status Badge */}
            {booking.status === BookingStatus.CANCELLED ? (
              <div className="w-18 h-18 sm:w-20 sm:h-20 rounded-full bg-[#EF4444]/15 border-2 border-[#EF4444]/30 flex items-center justify-center mb-4 shadow-sm text-[#EF4444]">
                <AlertTriangle size={38} strokeWidth={2.5} />
              </div>
            ) : isPreempted ? (
              <div className="w-18 h-18 sm:w-20 sm:h-20 rounded-full bg-[#EF4444]/15 border-2 border-[#EF4444]/30 flex items-center justify-center mb-4 shadow-sm text-[#EF4444]">
                <AlertTriangle size={38} strokeWidth={2.5} />
              </div>
            ) : isTentative ? (
              <div className="w-18 h-18 sm:w-20 sm:h-20 rounded-full bg-amber-500/15 border-2 border-amber-500/40 flex items-center justify-center mb-4 shadow-sm text-amber-400">
                <Clock size={38} strokeWidth={2.5} className="animate-pulse" />
              </div>
            ) : remainingSeconds !== null ? (
              <div className="w-18 h-18 sm:w-20 sm:h-20 rounded-full bg-[#FACC15]/15 border-2 border-[#FACC15]/30 flex items-center justify-center mb-4 shadow-sm text-[#FACC15]">
                <Clock size={38} strokeWidth={2.5} className="animate-pulse" />
              </div>
            ) : (
              <div className="w-18 h-18 sm:w-20 sm:h-20 rounded-full bg-primary-lime/15 border-2 border-primary-lime/30 flex items-center justify-center mb-4 shadow-sm">
                <Check size={38} className="text-primary-lime" strokeWidth={3.5} />
              </div>
            )}
            
            {/* Dynamic Headline */}
            <h1 className="text-2xl sm:text-3xl font-extrabold text-text-primary mb-1.5 tracking-tight font-display">
              {booking.status === BookingStatus.CANCELLED
                ? "Reservation Released"
                : isPreempted
                  ? "Slot Reallocated"
                  : isTentative
                    ? "Tentative Hold Placed"
                    : isDepositPaid
                      ? "Match Locked In (Deposit Paid)!"
                      : isDepositAwaitingVerification
                        ? "Deposit Submitted (Awaiting Verification)"
                        : remainingSeconds !== null
                          ? "Payment Pending"
                          : "Match Locked In!"}
            </h1>
            <p className="text-text-secondary text-xs sm:text-sm mb-6 max-w-xs font-medium">
              {booking.status === BookingStatus.CANCELLED
                ? (booking.cancellationReason || "This booking reservation has expired or been cancelled.")
                : isPreempted
                  ? "Another squad completed an instant deposit/full payment and secured this time slot. Your tentative reservation was released."
                  : isTentative
                    ? `Your slot at ${turf.name} is provisionally held. If another team pays a deposit or pays in full, it will be reallocated to them!`
                    : isDepositPaid
                      ? `Your deposit is registered. Your slot at ${turf.name} is 100% secured.`
                      : isDepositAwaitingVerification
                        ? `Your deposit proof has been submitted. The pitch owner will verify your payment shortly.`
                        : remainingSeconds !== null
                          ? `Your slot at ${turf.name} is held for 15 minutes while awaiting payment confirmation.`
                          : `Your slot at ${turf.name} has been secured.`}
            </p>

            {/* Tentative Warning & Upgrade Callout */}
            {isTentative && (
              <div className="w-full mb-5 bg-amber-500/10 border border-amber-500/40 rounded-2xl p-4 text-left space-y-3">
                <div className="flex items-start gap-3">
                  <Zap size={20} className="text-amber-400 shrink-0 mt-0.5 animate-pulse" />
                  <div>
                    <h4 className="text-xs font-bold text-text-primary">Tentative Hold — Anyone Can Claim This Slot!</h4>
                    <p className="text-[11px] text-text-secondary leading-relaxed mt-0.5">
                      This reservation has zero upfront payment. If another squad chooses this time and pays the deposit or full fee, it will be immediately reallocated to them.
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setShowUpgradeModal(true)}
                  className="w-full py-2.5 px-4 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-extrabold text-xs transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md"
                >
                  <ShieldCheck size={16} />
                  <span>Lock In Slot Now (Pay Deposit / Full)</span>
                </button>
              </div>
            )}

            {/* Preempted Explanation Callout */}
            {isPreempted && (
              <div className="w-full mb-5 bg-[#EF4444]/10 border border-[#EF4444]/30 rounded-2xl p-4 text-left space-y-3">
                <div className="flex items-start gap-3">
                  <AlertTriangle size={20} className="text-[#EF4444] shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-xs font-bold text-text-primary">Time Slot Claimed by Another Team</h4>
                    <p className="text-[11px] text-text-secondary leading-relaxed mt-0.5">
                      Another team booked this position and paid an instant deposit. Don't worry — there are plenty of other available slots!
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => navigate('/home')}
                  className="w-full py-2.5 px-4 rounded-xl bg-primary-lime text-accent-text font-extrabold text-xs transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md"
                >
                  <Calendar size={15} />
                  <span>Find Another Time Slot</span>
                </button>
              </div>
            )}

            {/* 15-Minute Countdown Banner if Pending */}
            {remainingSeconds !== null && (
              <div className="w-full mb-5 bg-[#FACC15]/10 border border-[#FACC15]/30 rounded-2xl p-4 flex items-center justify-between text-[#FACC15] gap-3 text-left">
                <div className="flex items-center gap-2.5 min-w-0">
                  <Clock size={20} className="animate-pulse shrink-0" />
                  <div className="min-w-0">
                    <p className="text-xs font-bold leading-tight truncate">15-Minute Payment Window</p>
                    <p className="text-[11px] text-text-secondary truncate">
                      Unpaid slots release automatically when timer reaches zero.
                    </p>
                  </div>
                </div>
                <div className="font-mono font-black text-sm px-3 py-1 bg-[#FACC15]/20 rounded-lg border border-[#FACC15]/30 shrink-0">
                  {Math.floor(remainingSeconds / 60)}:{String(remainingSeconds % 60).padStart(2, '0')}
                </div>
              </div>
            )}
            
            {/* Official Pitch Pass Card */}
            <div 
              id="official-pitch-pass-card"
              className="w-full bg-surface-card rounded-3xl p-5 sm:p-6 border border-border-subtle text-left relative overflow-hidden mb-6 shadow-xl"
            >
              {/* Card Header */}
              <div className="flex items-center justify-between pb-4 border-b border-border-subtle mb-4">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-primary-lime/15 text-primary-lime flex items-center justify-center font-bold">
                    <ShieldCheck size={18} className="text-primary-lime" />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-xs sm:text-sm text-text-primary leading-tight">Official Pitch Pass</h3>
                    <p className="text-[10px] text-text-tertiary font-mono">Pitchly Match Ticket</p>
                  </div>
                </div>

                <div className="flex items-center gap-1.5">
                  <span className={`text-[10px] font-extrabold uppercase px-2.5 py-1 rounded-full border tracking-wider ${
                    isPreempted
                      ? "bg-[#EF4444]/15 text-[#EF4444] border-[#EF4444]/30"
                      : isTentative
                        ? "bg-amber-500/15 text-amber-300 border-amber-500/30"
                        : isDepositPaid
                          ? "bg-primary-lime/15 text-primary-lime border-primary-lime/30"
                          : isDepositAwaitingVerification
                            ? "bg-[#FACC15]/15 text-[#FACC15] border-[#FACC15]/30"
                            : isConfirmed
                              ? "bg-[#22C55E]/15 text-[#22C55E] border-[#22C55E]/30"
                              : "bg-[#F59E0B]/15 text-[#F59E0B] border-[#F59E0B]/30"
                  }`}>
                    {isPreempted ? "REALLOCATED" : isTentative ? "TENTATIVE HOLD" : isDepositPaid ? "DEPOSIT PAID" : isDepositAwaitingVerification ? "AWAITING VERIFICATION" : (booking.status || "CONFIRMED")}
                  </span>
                </div>
              </div>

              {/* Venue & Booking Reference Row */}
              <div className="bg-surface-raised rounded-2xl p-3.5 border border-border-subtle mb-4">
                <div className="flex items-start justify-between gap-2 mb-1.5">
                  <div className="min-w-0 flex-1">
                    <p className="text-[10px] uppercase font-bold tracking-wider text-text-tertiary">Venue</p>
                    <h4 className="font-extrabold text-sm sm:text-base text-text-primary truncate">{turf.name}</h4>
                  </div>
                  <button
                    onClick={handleCopyRef}
                    className="shrink-0 flex items-center gap-1 px-2 py-1 rounded-lg bg-surface-card hover:bg-border-subtle border border-border-subtle text-text-secondary hover:text-text-primary text-[10px] font-mono font-bold transition-all cursor-pointer active:scale-95"
                    title="Copy Reference Code"
                  >
                    <span>REF: #{bookingRef}</span>
                    <Copy size={11} />
                  </button>
                </div>

                <div className="flex items-center gap-3 text-xs text-text-secondary font-medium">
                  <div className="flex items-center gap-1 min-w-0">
                    <MapPin size={12} className="text-primary-lime shrink-0" />
                    <span className="truncate">{turf.location || turf.formattedAddress || "Kampala, Uganda"}</span>
                  </div>
                  {turf.pitchFormats && turf.pitchFormats.length > 0 && (
                    <span className="shrink-0 text-[11px] font-bold text-text-tertiary">
                      • {turf.pitchFormats[0]}
                    </span>
                  )}
                </div>
              </div>
              
              {/* Match Schedule Details Grid */}
              <div className="grid grid-cols-2 gap-3 mb-5">
                <div className="bg-surface-raised/60 rounded-2xl p-3 border border-border-subtle">
                  <div className="flex items-center gap-1.5 text-text-tertiary mb-1">
                    <Calendar size={13} className="text-primary-lime" />
                    <span className="text-[10px] uppercase font-bold tracking-wider">Match Date</span>
                  </div>
                  <p className="text-text-primary font-bold text-xs sm:text-sm">
                    {formattedDate}
                  </p>
                </div>

                <div className="bg-surface-raised/60 rounded-2xl p-3 border border-border-subtle">
                  <div className="flex items-center gap-1.5 text-text-tertiary mb-1">
                    <Clock size={13} className="text-primary-lime" />
                    <span className="text-[10px] uppercase font-bold tracking-wider">Time Slot</span>
                  </div>
                  <p className="text-text-primary font-bold text-xs sm:text-sm">
                    {slotText} – {formattedEndTime}
                  </p>
                </div>
              </div>

              {/* Total Paid & Payment Method Breakdown */}
              {isTentative ? (
                <div className="flex items-center justify-between p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 mb-5">
                  <div>
                    <p className="text-[10px] uppercase font-bold tracking-wider text-text-secondary">Amount Paid</p>
                    <p className="text-amber-400 font-black text-lg sm:text-xl font-display">
                      UGX 0 <span className="text-xs font-semibold text-text-tertiary">(Unpaid)</span>
                    </p>
                    <p className="text-[10px] text-amber-300/80 font-medium mt-0.5">Matchday Fee: UGX {formattedPrice}</p>
                  </div>
                  <div className="text-right">
                    <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-300 bg-amber-500/15 px-2.5 py-1 rounded-full border border-amber-500/30">
                      <Clock size={12} />
                      <span>Preemptible Hold</span>
                    </span>
                  </div>
                </div>
              ) : isDepositPaid ? (
                <div className="p-3.5 rounded-2xl bg-primary-lime/10 border border-primary-lime/25 mb-5 space-y-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-[10px] uppercase font-bold tracking-wider text-text-secondary">Deposit Paid</p>
                      <p className="text-primary-lime font-black text-lg sm:text-xl font-display">
                        UGX {(booking.depositAmount || Math.round(((booking.totalPrice || booking.price || 0) * 0.3) / 1000) * 1000).toLocaleString()}
                      </p>
                    </div>
                    <div className="text-right">
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold text-primary-lime bg-primary-lime/15 px-2.5 py-1 rounded-full border border-primary-lime/30">
                        <Check size={12} strokeWidth={3} />
                        <span>Deposit Verified</span>
                      </span>
                    </div>
                  </div>
                  <div className="pt-2 border-t border-primary-lime/20 flex justify-between items-center text-xs">
                    <span className="text-text-secondary">Balance Due at Venue:</span>
                    <span className="text-text-primary font-bold">
                      UGX {(booking.balanceDue || Math.max(0, (booking.totalPrice || booking.price || 0) - (booking.depositAmount || 0))).toLocaleString()}
                    </span>
                  </div>
                </div>
              ) : isDepositAwaitingVerification ? (
                <div className="p-3.5 rounded-2xl bg-[#FACC15]/10 border border-[#FACC15]/25 mb-5 space-y-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-[10px] uppercase font-bold tracking-wider text-text-secondary">Deposit Submitted</p>
                      <p className="text-[#FACC15] font-black text-lg sm:text-xl font-display">
                        UGX {(booking.depositAmount || Math.round(((booking.totalPrice || booking.price || 0) * 0.3) / 1000) * 1000).toLocaleString()}
                      </p>
                    </div>
                    <div className="text-right">
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold text-[#FACC15] bg-[#FACC15]/15 px-2.5 py-1 rounded-full border border-[#FACC15]/30">
                        <Clock size={12} />
                        <span>Awaiting Verification</span>
                      </span>
                    </div>
                  </div>
                  <div className="pt-2 border-t border-[#FACC15]/20 flex justify-between items-center text-xs">
                    <span className="text-text-secondary">Balance Due at Venue:</span>
                    <span className="text-text-primary font-bold">
                      UGX {(booking.balanceDue || Math.max(0, (booking.totalPrice || booking.price || 0) - (booking.depositAmount || 0))).toLocaleString()}
                    </span>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-between p-3.5 rounded-2xl bg-primary-lime/10 border border-primary-lime/25 mb-5">
                  <div>
                    <p className="text-[10px] uppercase font-bold tracking-wider text-text-secondary">{isConfirmed ? "Amount Paid" : "Amount Due"}</p>
                    <p className="text-primary-lime font-black text-lg sm:text-xl font-display">
                      UGX {formattedPrice}
                    </p>
                  </div>
                  <div className="text-right">
                    <span className={`inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-full border ${isConfirmed ? "text-primary-lime bg-primary-lime/15 border-primary-lime/30" : "text-[#FACC15] bg-[#FACC15]/15 border-[#FACC15]/30"}`}>
                      {isConfirmed ? <Check size={12} strokeWidth={3} /> : <Clock size={12} />}
                      <span>{isConfirmed ? "Payment Verified" : "Verification Pending"}</span>
                    </span>
                  </div>
                </div>
              )}

              {/* Gate Entry Check-in Strip */}
              <div className="pt-3 border-t border-dashed border-border-subtle flex items-center justify-between text-left">
                <div className="space-y-0.5">
                  {!isConfirmed && !isDepositPaid && (
                    <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-[#FACC15]/15 border border-[#FACC15]/30 text-[#FACC15] text-[10px] font-black uppercase tracking-wider mb-1">
                      <Clock size={10} />
                      <span>Awaiting owner verification</span>
                    </div>
                  )}
                  <p className="text-[11px] font-bold text-text-primary flex items-center gap-1">
                    <QrCode size={13} className={isConfirmed || isDepositPaid ? "text-primary-lime" : "text-[#FACC15]"} />
                    <span>{isConfirmed || isDepositPaid ? "Matchday Gate Check-In" : "Check-In Pass (Unverified)"}</span>
                  </p>
                  <p className="text-[10px] text-text-tertiary font-medium">
                    {isConfirmed || isDepositPaid 
                      ? "Show this pass to the pitch marshal upon arrival" 
                      : "Pass activates once payment is verified by facility owner"}
                  </p>
                </div>
                <div className="font-mono text-[10px] font-black text-text-secondary tracking-widest bg-surface-raised px-2.5 py-1.5 rounded-lg border border-border-subtle">
                  #{bookingRef}
                </div>
              </div>
              
              {/* Subtle background watermark */}
              <div className="absolute -right-8 -bottom-8 opacity-[0.03] text-text-primary pointer-events-none">
                <CheckCircle2 size={160} />
              </div>
            </div>

            {/* Notification Toast for Actions */}
            {copied && (
              <div className="mb-4 px-3.5 py-2 rounded-xl bg-surface-raised border border-primary-lime/40 text-primary-lime text-xs font-bold flex items-center gap-1.5 shadow-sm animate-fade-in">
                <Check size={14} />
                <span>Reference code copied to clipboard!</span>
              </div>
            )}

            {/* If tentative, primary action can be Lock In Slot */}
            {isTentative && (
              <button
                onClick={() => setShowUpgradeModal(true)}
                className="w-full h-13 sm:h-14 bg-amber-500 hover:bg-amber-400 text-black rounded-2xl flex items-center justify-center gap-2 transition-all active:scale-[0.98] font-black text-sm tracking-wide shadow-md shadow-amber-500/20 cursor-pointer mb-3"
              >
                <ShieldCheck size={18} />
                <span>Lock In Slot (Pay Deposit / Full)</span>
              </button>
            )}
            
            {/* Action Button: View My Bookings */}
            <button
              id="view-my-bookings-btn"
              onClick={() => navigate('/bookings', { replace: true })}
              className={`w-full h-13 sm:h-14 rounded-2xl flex items-center justify-center gap-2 transition-all active:scale-[0.98] font-black text-sm tracking-wide cursor-pointer mb-3 ${
                isTentative
                  ? "bg-surface-card hover:bg-surface-raised border border-border-subtle text-text-primary shadow-xs"
                  : "bg-primary-lime hover:bg-[#96E600] text-accent-text shadow-md shadow-primary-lime/20"
              }`}
            >
              <span>View in My Bookings</span>
              <ArrowRight size={18} />
            </button>

            {/* Secondary Action Grid */}
            <div className="grid grid-cols-2 gap-2.5 w-full">
              <button
                id="share-pass-btn"
                onClick={handleSharePass}
                className="h-11 sm:h-12 bg-surface-card hover:bg-surface-raised border border-border-subtle text-text-primary rounded-2xl flex items-center justify-center gap-2 transition-all active:scale-98 font-bold text-xs cursor-pointer shadow-xs"
              >
                <Share2 size={15} className="text-primary-lime" />
                <span>Share Pass</span>
              </button>

              <button
                id="back-to-home-btn"
                onClick={() => navigate('/home', { replace: true })}
                className="h-11 sm:h-12 bg-surface-card hover:bg-surface-raised border border-border-subtle text-text-primary rounded-2xl flex items-center justify-center gap-2 transition-all active:scale-98 font-bold text-xs cursor-pointer shadow-xs"
              >
                <Home size={15} />
                <span>Back to Home</span>
              </button>
            </div>

          </div>
        </div>

        {/* Upgrade Tentative Booking Modal */}
        {showUpgradeModal && (
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 animate-fadeIn">
            <div className="w-full max-w-md bg-surface-card border-t sm:border border-border-subtle rounded-t-3xl sm:rounded-3xl p-5 sm:p-6 space-y-4 text-text-primary max-h-[90vh] overflow-y-auto shadow-2xl">
              <div className="flex items-start justify-between border-b border-border-subtle pb-3">
                <div>
                  <h3 className="font-extrabold text-base text-text-primary">Lock In & Secure Slot</h3>
                  <p className="text-xs text-text-secondary mt-0.5">Protect this reservation against any takeovers</p>
                </div>
                <button
                  onClick={() => setShowUpgradeModal(false)}
                  className="w-8 h-8 rounded-full bg-surface-raised hover:bg-border-subtle flex items-center justify-center text-text-tertiary hover:text-text-primary"
                >
                  <X size={16} />
                </button>
              </div>

              {upgradeError && (
                <div className="p-3 rounded-xl bg-[#EF4444]/10 border border-[#EF4444]/30 text-[#EF4444] text-xs font-medium">
                  {upgradeError}
                </div>
              )}

              {/* Choose Upgrade Tier */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-text-primary block">Select Lock Option</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setUpgradeTier('DEPOSIT')}
                    className={`p-3 rounded-xl border text-left cursor-pointer transition-all ${
                      upgradeTier === 'DEPOSIT'
                        ? 'bg-primary-lime/10 border-primary-lime text-text-primary'
                        : 'bg-surface-raised border-border-subtle text-text-secondary'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-bold">Deposit (30%)</span>
                      <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-primary-lime/20 text-primary-lime">
                        Secure
                      </span>
                    </div>
                    <span className="text-xs font-black text-primary-lime block">
                      UGX {Math.max(20000, Math.round((((booking.totalPrice || booking.price || 0) * 0.3)) / 1000) * 1000).toLocaleString()}
                    </span>
                    <span className="text-[10px] text-text-tertiary">Pay balance at turf</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setUpgradeTier('FULL')}
                    className={`p-3 rounded-xl border text-left cursor-pointer transition-all ${
                      upgradeTier === 'FULL'
                        ? 'bg-primary-lime/10 border-primary-lime text-text-primary'
                        : 'bg-surface-raised border-border-subtle text-text-secondary'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-bold">Full Payment</span>
                      <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-surface-card text-text-tertiary">
                        100%
                      </span>
                    </div>
                    <span className="text-xs font-black text-primary-lime block">
                      UGX {((booking.totalPrice || booking.price || 0)).toLocaleString()}
                    </span>
                    <span className="text-[10px] text-text-tertiary">Zero balance left</span>
                  </button>
                </div>
              </div>

              {/* Payment Method */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-text-primary block">Payment Method</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setUpgradeMethod(PaymentMethod.MTN)}
                    className={`py-2 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-2 cursor-pointer ${
                      upgradeMethod === PaymentMethod.MTN ? 'bg-primary-lime/10 border-primary-lime text-primary-lime' : 'bg-surface-raised border-border-subtle text-text-secondary'
                    }`}
                  >
                    <div className="w-5 h-5 rounded-full bg-[#FFCC00] text-black font-black text-[9px] flex items-center justify-center">MTN</div>
                    <span>MTN MoMo</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setUpgradeMethod(PaymentMethod.AIRTEL)}
                    className={`py-2 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-2 cursor-pointer ${
                      upgradeMethod === PaymentMethod.AIRTEL ? 'bg-primary-lime/10 border-primary-lime text-primary-lime' : 'bg-surface-raised border-border-subtle text-text-secondary'
                    }`}
                  >
                    <div className="w-5 h-5 rounded-full bg-[#FF0000] text-white font-black text-[9px] flex items-center justify-center">AIR</div>
                    <span>Airtel Money</span>
                  </button>
                </div>
              </div>

              {/* Payment Instructions */}
              <div className="p-3 bg-surface-raised rounded-xl text-xs space-y-1 text-text-secondary border border-border-subtle">
                <p>1. Dial <strong className="text-text-primary">{upgradeMethod === PaymentMethod.MTN ? '*165#' : '*185#'}</strong></p>
                <p>
                  2. Send UGX <strong className="text-primary-lime font-bold">
                    {(upgradeTier === 'DEPOSIT' ? Math.max(20000, Math.round((((booking.totalPrice || booking.price || 0) * 0.3)) / 1000) * 1000) : (booking.totalPrice || booking.price || 0)).toLocaleString()}
                  </strong> to <strong className="text-text-primary">{(turf as any)?.paymentPhone || turf?.contactPhone || "0772 123 456"}</strong>
                </p>
                <p>3. Enter transaction reference or attach screenshot below</p>
              </div>

              {/* Transaction Ref */}
              <div>
                <label className="text-xs font-bold text-text-primary block mb-1">Transaction Reference</label>
                <input
                  type="text"
                  value={upgradeTxRef}
                  onChange={(e) => setUpgradeTxRef(e.target.value)}
                  placeholder="e.g. 192849102 or TXN-..."
                  className="w-full px-3 py-2 rounded-xl bg-surface-raised border border-border-subtle text-text-primary text-xs font-mono focus:outline-hidden focus:border-primary-lime"
                />
              </div>

              {/* Receipt Upload */}
              <div>
                <label className="text-xs font-bold text-text-primary block mb-1">Upload Receipt Screenshot</label>
                <label className="block cursor-pointer">
                  <input type="file" className="hidden" accept="image/*" onChange={handleUpgradeProofUpload} disabled={upgradeUploadingProof} />
                  <div className="w-full h-20 rounded-xl border border-dashed border-border-prominent hover:border-primary-lime flex items-center justify-center gap-2 text-xs text-text-secondary bg-surface-raised">
                    {upgradeUploadingProof ? (
                      <Loader2 size={18} className="animate-spin text-primary-lime" />
                    ) : upgradeProofUrl ? (
                      <span className="text-primary-lime font-bold truncate max-w-[80%]">{upgradeProofFileName || "Receipt Uploaded"}</span>
                    ) : (
                      <>
                        <UploadCloud size={18} />
                        <span>Select image file</span>
                      </>
                    )}
                  </div>
                </label>
              </div>

              {/* Confirm Upgrade Button */}
              <div className="pt-2">
                <button
                  type="button"
                  onClick={handleUpgradeTentative}
                  disabled={upgrading || (!upgradeProofUrl && !upgradeTxRef)}
                  className="w-full h-12 rounded-xl bg-primary-lime hover:bg-[#96E600] disabled:opacity-50 text-accent-text font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer transition-all shadow-md"
                >
                  {upgrading ? <Loader2 size={16} className="animate-spin" /> : <ShieldCheck size={16} />}
                  <span>Confirm Lock & Upgrade Slot</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};

