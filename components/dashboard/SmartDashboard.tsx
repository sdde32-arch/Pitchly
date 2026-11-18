import React, { useState, useEffect } from "react";
import {
  Calendar,
  Clock,
  MapPin,
  ChevronRight,
  Zap,
  QrCode,
  Share2,
  Check,
  Radio,
  Sparkles,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { useNavigate } from "react-router-dom";
import { useUser } from "../../context/UserContext";
import { Booking } from "../../types/firebase";
import { MatchWeatherWidget } from "../weather/MatchWeatherWidget";
import { SmartDashboardSkeleton } from "../ui/Skeleton";
import { EmptyState } from "../ui/EmptyState";
import { SITE_URL } from "../../utils/contact";

interface SmartDashboardProps {
  upcomingBooking?: Booking | null;
  onExplorePitches?: () => void;
  loading?: boolean;
}

function getCountdownParts(booking?: Booking | null) {
  if (!booking?.date) {
    return { days: 0, hours: 0, minutes: 0 };
  }
  const timeStr = booking.timeSlot || booking.time || booking.slots?.[0] || "00:00";
  const timeMatch = String(timeStr).match(/(\d{1,2}):(\d{2})(?:\s*(AM|PM))?/i);
  let hours24 = 0;
  let mins = 0;
  if (timeMatch) {
    hours24 = parseInt(timeMatch[1], 10);
    mins = parseInt(timeMatch[2], 10);
    const meridiem = timeMatch[3]?.toUpperCase();
    if (meridiem === "PM" && hours24 < 12) hours24 += 12;
    if (meridiem === "AM" && hours24 === 12) hours24 = 0;
  }
  const target = new Date(
    `${booking.date}T${String(hours24).padStart(2, "0")}:${String(mins).padStart(2, "0")}:00`
  );
  const diffMs = target.getTime() - Date.now();
  if (Number.isNaN(diffMs) || diffMs <= 0) {
    return { days: 0, hours: 0, minutes: 0 };
  }
  const totalMinutes = Math.floor(diffMs / 60000);
  const days = Math.floor(totalMinutes / (60 * 24));
  const hours = Math.floor((totalMinutes % (60 * 24)) / 60);
  const minutes = totalMinutes % 60;
  return { days, hours, minutes };
}

export const SmartDashboard: React.FC<SmartDashboardProps> = ({
  upcomingBooking,
  onExplorePitches,
  loading = false,
}) => {
  const navigate = useNavigate();
  const { stats, addXP } = useUser();

  // QR Digital Match Pass Modal State
  const [showMatchPassModal, setShowMatchPassModal] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  // Tab switch between Next Match & Quick Book
  const [activeTab, setActiveTab] = useState<"match" | "quickbook">("match");

  // Quick Booking mini selector
  const [selectedQuickPitchId, setSelectedQuickPitchId] = useState<string>("");
  const [selectedQuickTime, setSelectedQuickTime] = useState<string>("Tonight 07:00 PM");

  // Live countdown timer for the next match
  const [countdown, setCountdown] = useState(() => getCountdownParts(upcomingBooking));

  useEffect(() => {
    setCountdown(getCountdownParts(upcomingBooking));
    const timer = setInterval(() => {
      setCountdown(getCountdownParts(upcomingBooking));
    }, 60000);
    return () => clearInterval(timer);
  }, [upcomingBooking]);

  if (loading) {
    return <SmartDashboardSkeleton />;
  }

  if (!upcomingBooking) {
    return (
      <div id="home-smart-dashboard" className="scroll-mt-24">
        <EmptyState
          icon={Calendar}
          title="No matches yet"
          description="Book a pitch to see your next matchday pass and kickoff details here."
          actionText={onExplorePitches ? "Find a pitch" : undefined}
          onAction={onExplorePitches}
          accentColor="lime"
          className="max-w-none"
        />
      </div>
    );
  }

  const pitchLabel = upcomingBooking.pitchName || upcomingBooking.turfName || "Booked Pitch";
  const timeLabel =
    upcomingBooking.timeSlot || upcomingBooking.time || upcomingBooking.slots?.[0] || "Time TBD";
  const refCode = (upcomingBooking.bookingRef || upcomingBooking.id || "").slice(-8).toUpperCase();

  const handleCopyMatchInvite = () => {
    const targetPitchId = upcomingBooking.pitchId || upcomingBooking.turfId;
    const shareUrl = targetPitchId
      ? `${SITE_URL}/#/turf/${targetPitchId}`
      : `${SITE_URL}/#/home`;
    const matchText = `⚽ Matchday Invite: ${pitchLabel} on ${upcomingBooking.date || "Upcoming"} (${timeLabel})\nRef: #${refCode}\nDetails: ${shareUrl}`;
    navigator.clipboard?.writeText(matchText);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  return (
    <div id="home-smart-dashboard" className="scroll-mt-24">
      <div className="bg-surface-card rounded-2xl border border-border-subtle hover:border-border-prominent p-4.5 sm:p-6 shadow-xs transition-all duration-200">
        {/* Header: Clean Unboxed Title & Live Indicator */}
        <div className="flex items-center justify-between gap-3 border-b border-border-subtle pb-3.5 mb-5">
          <div className="flex items-center gap-2">
            <Radio size={15} className="text-primary-lime animate-pulse" />
            <h3 className="font-display text-sm font-extrabold uppercase tracking-wider text-text-primary">
              Next Matchday Hub
            </h3>
          </div>

          <div className="flex items-center gap-2 text-xs text-text-secondary font-medium">
            <span className="w-2 h-2 rounded-full bg-primary-lime animate-pulse" />
            <span className="text-[11px] font-semibold text-text-tertiary">Upcoming</span>
          </div>
        </div>

        <div className="space-y-4 sm:space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1.5 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="px-2.5 py-0.5 rounded-full bg-primary-lime/10 text-primary-lime border border-primary-lime/25 text-[10px] font-bold uppercase tracking-wider">
                  Active Reservation
                </span>
                <div className="flex items-center gap-1 text-xs text-text-secondary font-medium">
                  <Calendar size={12} className="text-text-tertiary" />
                  <span>
                    {upcomingBooking.date || "Date TBD"} • {timeLabel}
                  </span>
                </div>
              </div>

              <h3 id="heading-next-matchday" className="font-display text-base sm:text-lg font-bold text-text-primary tracking-tight truncate scroll-mt-24">
                {`Match at ${pitchLabel}`}
              </h3>

              <p className="text-xs text-text-secondary flex items-center gap-1.5 truncate">
                <MapPin size={13} className="text-primary-lime shrink-0" />
                <span className="truncate">
                  {upcomingBooking.location || pitchLabel}
                </span>
              </p>
            </div>

            {/* Countdown Clock Display */}
            <div className="flex items-center gap-2 bg-surface-raised border border-border-subtle px-3.5 py-2.5 rounded-xl shrink-0 self-start sm:self-auto">
              <div className="text-center min-w-[34px]">
                <span className="font-mono tabular-nums text-base font-bold text-text-primary block leading-none">{countdown.days}</span>
                <span className="text-[9px] font-bold text-text-tertiary uppercase mt-1 block">Days</span>
              </div>
              <span className="text-text-tertiary font-bold text-sm -mt-2">:</span>
              <div className="text-center min-w-[34px]">
                <span className="font-mono tabular-nums text-base font-bold text-text-primary block leading-none">{String(countdown.hours).padStart(2, "0")}</span>
                <span className="text-[9px] font-bold text-text-tertiary uppercase mt-1 block">Hours</span>
              </div>
              <span className="text-text-tertiary font-bold text-sm -mt-2">:</span>
              <div className="text-center min-w-[34px]">
                <span className="font-mono tabular-nums text-base font-bold text-text-primary block leading-none">{String(countdown.minutes).padStart(2, "0")}</span>
                <span className="text-[9px] font-bold text-text-tertiary uppercase mt-1 block">Mins</span>
              </div>
            </div>
          </div>

          {/* Optional Weather line - hidden automatically if no real forecast exists */}
          {upcomingBooking?.date && (
            <MatchWeatherWidget
              selectedDate={upcomingBooking.date}
              selectedTime={upcomingBooking.timeSlot || upcomingBooking.time}
              pitchName={upcomingBooking.pitchName}
              compact={true}
            />
          )}

          {/* Matchday Action Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-3.5 border-t border-border-subtle">
            <div className="flex items-center gap-2 text-xs text-text-secondary">
              <span className="w-1.5 h-1.5 rounded-full bg-primary-lime shrink-0" />
              <span>Ref: <strong className="text-text-primary font-semibold">#{refCode}</strong></span>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setShowMatchPassModal(true)}
                className="px-4 py-2 rounded-xl bg-primary-lime hover:bg-primary-lime-hover text-accent-text text-xs font-bold transition-all shadow-2xs flex items-center gap-1.5 cursor-pointer active:scale-95"
              >
                <QrCode size={14} />
                <span>Digital Pass</span>
              </button>

              <button
                type="button"
                onClick={handleCopyMatchInvite}
                className="px-4 py-2 rounded-xl bg-surface-raised hover:bg-border-subtle border border-border-subtle text-xs font-semibold text-text-primary transition-all flex items-center gap-1.5 cursor-pointer active:scale-95"
              >
                {copiedLink ? <Check size={14} className="text-primary-lime" /> : <Share2 size={14} />}
                <span>{copiedLink ? "Link Copied" : "Share Invite"}</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* DIGITAL MATCH PASS MODAL */}
      <AnimatePresence>
        {showMatchPassModal && (
          <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-surface-card border border-border-subtle rounded-2xl max-w-sm w-full p-5 space-y-4 text-text-primary relative shadow-2xl"
            >
              <div className="flex items-center justify-between border-b border-border-subtle pb-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-primary-lime/15 text-primary-lime border border-primary-lime/30 flex items-center justify-center">
                    <QrCode size={18} />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-text-primary leading-tight">Digital Match Pass</h3>
                    <p className="text-[10.5px] text-text-secondary">Gate entry & player check-in</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowMatchPassModal(false)}
                  className="w-7 h-7 rounded-lg hover:bg-surface-raised text-text-tertiary hover:text-text-primary flex items-center justify-center cursor-pointer"
                >
                  &times;
                </button>
              </div>

              {/* QR Code Container */}
              <div className="bg-white p-4 rounded-xl flex flex-col items-center justify-center space-y-2 text-neutral-900">
                <div className="w-40 h-40 bg-neutral-900 rounded-lg flex items-center justify-center p-2 relative overflow-hidden">
                  <div className="grid grid-cols-6 gap-1 w-full h-full opacity-90">
                    {Array.from({ length: 36 }).map((_, i) => (
                      <div
                        key={i}
                        className={`rounded-xs ${
                          (i % 2 === 0 && i % 3 !== 0) || i === 0 || i === 5 || i === 30
                            ? "bg-white"
                            : "bg-neutral-800"
                        }`}
                      />
                    ))}
                  </div>
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div className="w-8 h-8 rounded-full bg-primary-lime text-accent-text flex items-center justify-center font-black text-xs shadow-md">
                      PTC
                    </div>
                  </div>
                </div>
                <span className="font-mono text-xs font-bold tracking-widest text-neutral-700">#{refCode}</span>
              </div>

              {/* Pass details */}
              <div className="bg-surface-raised p-3 rounded-xl border border-border-subtle space-y-1.5 text-xs">
                <div className="flex justify-between gap-2">
                  <span className="text-text-secondary">Pitch:</span>
                  <span className="font-bold text-text-primary truncate">{pitchLabel}</span>
                </div>
                <div className="flex justify-between gap-2">
                  <span className="text-text-secondary">Venue:</span>
                  <span className="font-medium text-text-primary truncate">{upcomingBooking.location || "Location not specified"}</span>
                </div>
                <div className="flex justify-between gap-2">
                  <span className="text-text-secondary">Kickoff:</span>
                  <span className="font-mono font-bold text-primary-lime">{upcomingBooking.date || "TBD"} • {timeLabel}</span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setShowMatchPassModal(false)}
                className="w-full py-2.5 rounded-xl bg-surface-raised hover:bg-border-subtle border border-border-subtle text-xs font-bold text-text-primary cursor-pointer transition-colors"
              >
                Close Pass
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
