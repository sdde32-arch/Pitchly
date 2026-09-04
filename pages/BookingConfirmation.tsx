import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Layout } from "../components/Layout";
import { useBooking } from "../context/BookingContext";
import { bookingService } from "../services/bookingService";
import { pitchService } from "../services/pitchService";
import { Turf } from "../types";
import { 
  Check, 
  ShieldCheck, 
  CheckCircle2, 
  ChevronLeft, 
  Loader2, 
  ArrowRight,
  Calendar,
  Clock,
  MapPin,
  Share2,
  Copy,
  Home,
  QrCode,
  Sparkles
} from "lucide-react";

export const BookingConfirmation: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { bookings } = useBooking();
  
  const [booking, setBooking] = useState<any | null>(null);
  const [turf, setTurf] = useState<Turf | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const fetchDetails = async () => {
      if (!id) return;
      try {
        let foundBooking: any = bookings.find(b => b.id === id) || null;
        if (!foundBooking) {
          foundBooking = await bookingService.getById(id);
        }
        
        if (foundBooking) {
          setBooking(foundBooking);
          const foundTurf = await pitchService.getById((foundBooking as any).pitchId || foundBooking.turfId);
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
          title: "FootLink Match Pass",
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
  const endHour = parseInt(slotText.split(":")[0] || "18") + (booking.duration || 2);
  const formattedEndTime = `${String(endHour).padStart(2, "0")}:00`;
  const formattedPrice = ((booking as any).totalPrice || booking.price || 0).toLocaleString();
  const formattedDate = new Date(booking.date).toLocaleDateString('en-US', { 
    weekday: 'short', 
    month: 'short', 
    day: 'numeric', 
    year: 'numeric' 
  });

  const isConfirmed = booking.status === "confirmed" || booking.status === "active";

  return (
    <Layout>
      <div className="min-h-[100dvh] bg-app-base text-text-primary flex flex-col">
        {/* Navigation Header */}
        <div className="sticky top-0 z-40 bg-surface-card/90 backdrop-blur-md border-b border-border-subtle px-4 py-3 flex items-center justify-between">
          <button
            id="confirmation-back-btn"
            onClick={() => navigate('/bookings')}
            className="w-10 h-10 rounded-2xl bg-surface-raised hover:bg-border-subtle flex items-center justify-center text-text-primary transition-colors border border-border-subtle shadow-xs cursor-pointer active:scale-95"
            title="Back to Bookings"
          >
            <ChevronLeft size={20} strokeWidth={2.5} />
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
            
            {/* Animated Success Badge */}
            <div className="w-18 h-18 sm:w-20 sm:h-20 rounded-full bg-primary-lime/15 border-2 border-primary-lime/30 flex items-center justify-center mb-4 shadow-sm">
              <Check size={38} className="text-primary-lime" strokeWidth={3.5} />
            </div>
            
            {/* High-Contrast Clear Headline */}
            <h1 className="text-2xl sm:text-3xl font-extrabold text-text-primary mb-1.5 tracking-tight font-display">
              Match Locked In!
            </h1>
            <p className="text-text-secondary text-xs sm:text-sm mb-6 max-w-xs font-medium">
              Your slot at <strong className="text-text-primary font-bold">{turf.name}</strong> has been secured.
            </p>
            
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
                    <p className="text-[10px] text-text-tertiary font-mono">FootLink Match Ticket</p>
                  </div>
                </div>

                <div className="flex items-center gap-1.5">
                  <span className={`text-[10px] font-extrabold uppercase px-2.5 py-1 rounded-full border tracking-wider ${
                    isConfirmed
                      ? "bg-[#22C55E]/15 text-[#22C55E] border-[#22C55E]/30"
                      : "bg-[#F59E0B]/15 text-[#F59E0B] border-[#F59E0B]/30"
                  }`}>
                    {booking.status || "CONFIRMED"}
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

              {/* Total Paid & Payment Method */}
              <div className="flex items-center justify-between p-3.5 rounded-2xl bg-primary-lime/10 border border-primary-lime/25 mb-5">
                <div>
                  <p className="text-[10px] uppercase font-bold tracking-wider text-text-secondary">Amount Paid</p>
                  <p className="text-primary-lime font-black text-lg sm:text-xl font-display">
                    UGX {formattedPrice}
                  </p>
                </div>
                <div className="text-right">
                  <span className="inline-flex items-center gap-1 text-[11px] font-bold text-primary-lime bg-primary-lime/15 px-2.5 py-1 rounded-full border border-primary-lime/30">
                    <Check size={12} strokeWidth={3} />
                    <span>Payment Verified</span>
                  </span>
                </div>
              </div>

              {/* Gate Entry Check-in Strip */}
              <div className="pt-3 border-t border-dashed border-border-subtle flex items-center justify-between text-left">
                <div className="space-y-0.5">
                  <p className="text-[11px] font-bold text-text-primary flex items-center gap-1">
                    <QrCode size={13} className="text-primary-lime" />
                    <span>Matchday Gate Check-In</span>
                  </p>
                  <p className="text-[10px] text-text-tertiary font-medium">
                    Show this pass to the pitch marshal upon arrival
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
            
            {/* Primary Action Button: View My Bookings */}
            <button
              id="view-my-bookings-btn"
              onClick={() => navigate('/bookings')}
              className="w-full h-13 sm:h-14 bg-primary-lime hover:bg-[#96E600] text-accent-text rounded-2xl flex items-center justify-center gap-2 transition-all active:scale-[0.98] font-black text-sm tracking-wide shadow-md shadow-primary-lime/20 cursor-pointer mb-3"
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
                onClick={() => navigate('/home')}
                className="h-11 sm:h-12 bg-surface-card hover:bg-surface-raised border border-border-subtle text-text-primary rounded-2xl flex items-center justify-center gap-2 transition-all active:scale-98 font-bold text-xs cursor-pointer shadow-xs"
              >
                <Home size={15} />
                <span>Back to Home</span>
              </button>
            </div>

          </div>
        </div>
      </div>
    </Layout>
  );
};

