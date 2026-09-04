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
import { TURFS } from "../../constants";
import { Booking } from "../../types/firebase";
import { MatchWeatherWidget } from "../weather/MatchWeatherWidget";
import { SmartDashboardSkeleton } from "../ui/Skeleton";

interface SmartDashboardProps {
  upcomingBooking?: Booking | null;
  onExplorePitches?: () => void;
  loading?: boolean;
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
  const [selectedQuickPitchId, setSelectedQuickPitchId] = useState<string>(TURFS[0]?.id || "1");
  const [selectedQuickTime, setSelectedQuickTime] = useState<string>("Tonight 07:00 PM");

  // Live countdown timer for the next match
  const [countdown, setCountdown] = useState({
    days: 2,
    hours: 5,
    minutes: 42,
  });

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev.minutes > 0) {
          return { ...prev, minutes: prev.minutes - 1 };
        }
        if (prev.hours > 0) {
          return { ...prev, hours: prev.hours - 1, minutes: 59 };
        }
        if (prev.days > 0) {
          return { ...prev, days: prev.days - 1, hours: 23, minutes: 59 };
        }
        return prev;
      });
    }, 60000);
    return () => clearInterval(timer);
  }, []);

  if (loading) {
    return <SmartDashboardSkeleton />;
  }

  const handleCopyMatchInvite = () => {
    const matchText = `⚽ Matchday Invite: Lugogo AstroTurf 7v7 on Friday 07:00 PM!\nSlot reference: #FTL-8821\nJoin our squad lineup on FootLink App: https://footlink.ug/match/8821`;
    navigator.clipboard?.writeText(matchText);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  return (
    <div id="home-smart-dashboard" className="scroll-mt-20">
      <div className="bg-surface-card rounded-2xl border border-border-subtle hover:border-border-prominent p-4.5 sm:p-6 shadow-xs transition-all duration-200">
        {/* Header Segmented Tabs */}
        <div className="flex items-center justify-between gap-3 border-b border-border-subtle pb-3.5 mb-5">
          <div className="inline-flex p-1 rounded-xl bg-surface-raised border border-border-subtle gap-1">
            <button
              type="button"
              onClick={() => setActiveTab("match")}
              className={`text-xs font-bold px-3 py-1.5 rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
                activeTab === "match"
                  ? "bg-primary-lime text-accent-text shadow-2xs"
                  : "text-text-secondary hover:text-text-primary"
              }`}
            >
              <Radio size={13} className={activeTab === "match" ? "text-accent-text" : "text-primary-lime"} />
              <span>Next Matchday</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("quickbook")}
              className={`text-xs font-bold px-3 py-1.5 rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
                activeTab === "quickbook"
                  ? "bg-primary-lime text-accent-text shadow-2xs"
                  : "text-text-secondary hover:text-text-primary"
              }`}
            >
              <Zap size={13} className={activeTab === "quickbook" ? "text-accent-text" : "text-text-secondary"} />
              <span>Quick Reserve</span>
            </button>
          </div>

          <div className="hidden sm:flex items-center gap-2 text-xs text-text-secondary font-medium">
            <span className="w-2 h-2 rounded-full bg-primary-lime animate-pulse" />
            <span>Matchday Radar</span>
          </div>
        </div>

        {activeTab === "match" ? (
          <div className="space-y-4 sm:space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-1.5 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="px-2.5 py-0.5 rounded-full bg-primary-lime/10 text-primary-lime border border-primary-lime/25 text-[10px] font-bold uppercase tracking-wider">
                    {upcomingBooking ? "Active Reservation" : "Confirmed Fixture"}
                  </span>
                  <div className="flex items-center gap-1 text-xs text-text-secondary font-medium">
                    <Calendar size={12} className="text-text-tertiary" />
                    <span>
                      {upcomingBooking?.date
                        ? `${upcomingBooking.date} • ${upcomingBooking.timeSlot || upcomingBooking.time || upcomingBooking.slots?.[0] || "Evening Slot"}`
                        : "Friday Matchday • 07:00 PM"}
                    </span>
                  </div>
                </div>

                <h3 className="text-base sm:text-lg font-bold text-text-primary tracking-tight truncate">
                  {upcomingBooking
                    ? `Match at ${upcomingBooking.pitchName || "Turf Ground"}`
                    : "Playmakers FC vs Naguru Stars"}
                </h3>

                <p className="text-xs text-text-secondary flex items-center gap-1.5 truncate">
                  <MapPin size={13} className="text-primary-lime shrink-0" />
                  <span className="truncate">
                    {upcomingBooking?.pitchName || "Lugogo AstroTurf Grounds"} • Pitch 2 (Floodlit)
                  </span>
                </p>
              </div>

              {/* Countdown Clock Display */}
              <div className="flex items-center gap-2 bg-surface-raised border border-border-subtle px-3.5 py-2.5 rounded-xl shrink-0 self-start sm:self-auto">
                <div className="text-center min-w-[34px]">
                  <span className="font-mono text-base font-bold text-text-primary block leading-none">{countdown.days}</span>
                  <span className="text-[9px] font-bold text-text-tertiary uppercase mt-1 block">Days</span>
                </div>
                <span className="text-text-tertiary font-bold text-sm -mt-2">:</span>
                <div className="text-center min-w-[34px]">
                  <span className="font-mono text-base font-bold text-text-primary block leading-none">{String(countdown.hours).padStart(2, "0")}</span>
                  <span className="text-[9px] font-bold text-text-tertiary uppercase mt-1 block">Hours</span>
                </div>
                <span className="text-text-tertiary font-bold text-sm -mt-2">:</span>
                <div className="text-center min-w-[34px]">
                  <span className="font-mono text-base font-bold text-text-primary block leading-none">{String(countdown.minutes).padStart(2, "0")}</span>
                  <span className="text-[9px] font-bold text-text-tertiary uppercase mt-1 block">Mins</span>
                </div>
              </div>
            </div>

            {/* Matchday Action Bar */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-3.5 border-t border-border-subtle">
              <div className="flex items-center gap-2 text-xs text-text-secondary">
                <span className="w-1.5 h-1.5 rounded-full bg-primary-lime shrink-0" />
                <span>Lineup Status: <strong className="text-text-primary font-semibold">8/10</strong> confirmed</span>
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
        ) : (
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-text-secondary block mb-1.5">Select Pitch Ground</label>
                <select
                  value={selectedQuickPitchId}
                  onChange={(e) => setSelectedQuickPitchId(e.target.value)}
                  className="w-full h-11 px-3.5 rounded-xl bg-surface-raised text-xs text-text-primary border border-border-subtle focus:outline-none focus:border-primary-lime cursor-pointer font-medium"
                >
                  {TURFS.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name} (UGX {t.pricePerHour?.toLocaleString()}/hr)
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-text-secondary block mb-1.5">Preferred Time Slot</label>
                <div className="grid grid-cols-2 gap-2">
                  {["Tonight 07:00 PM", "Tonight 09:00 PM", "Tomorrow 06:00 PM", "Tomorrow 08:00 PM"].map((time) => (
                    <button
                      key={time}
                      type="button"
                      onClick={() => setSelectedQuickTime(time)}
                      className={`h-11 px-2.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer truncate ${
                        selectedQuickTime === time
                          ? "bg-primary-lime/15 text-primary-lime border-primary-lime/50 font-bold"
                          : "bg-surface-raised text-text-secondary border-border-subtle hover:text-text-primary hover:border-border-prominent"
                      }`}
                    >
                      {time}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Weather forecast for chosen quick slot */}
            {(() => {
              const quickDateStr = selectedQuickTime.startsWith("Tonight")
                ? new Date().toISOString().split("T")[0]
                : new Date(Date.now() + 86400000).toISOString().split("T")[0];
              const quickTimeSlot = selectedQuickTime.includes("07:00 PM")
                ? "19:00"
                : selectedQuickTime.includes("09:00 PM")
                ? "21:00"
                : selectedQuickTime.includes("06:00 PM")
                ? "18:00"
                : "20:00";
              const currentPitch = TURFS.find((t) => t.id === selectedQuickPitchId);

              return (
                <div className="pt-1">
                  <MatchWeatherWidget
                    selectedDate={quickDateStr}
                    selectedTime={quickTimeSlot}
                    pitchName={currentPitch?.name}
                    compact={true}
                  />
                </div>
              );
            })()}

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-border-subtle">
              <span className="text-xs text-text-secondary flex items-center gap-1.5">
                <Check size={14} className="text-primary-lime shrink-0" />
                Instant confirmation • Mobile Money & Airtel split-pay supported
              </span>
              <button
                type="button"
                onClick={() => {
                  const quickDateStr = selectedQuickTime.startsWith("Tonight")
                    ? new Date().toISOString().split("T")[0]
                    : new Date(Date.now() + 86400000).toISOString().split("T")[0];
                  const quickTimeSlot = selectedQuickTime.includes("07:00 PM")
                    ? "19:00"
                    : selectedQuickTime.includes("09:00 PM")
                    ? "21:00"
                    : selectedQuickTime.includes("06:00 PM")
                    ? "18:00"
                    : "20:00";
                  navigate(`/turf/${selectedQuickPitchId}/book?date=${quickDateStr}&time=${quickTimeSlot}`);
                }}
                className="px-5 py-2.5 rounded-xl bg-primary-lime hover:bg-primary-lime-hover text-accent-text text-xs font-bold transition-all shadow-xs cursor-pointer active:scale-95 shrink-0 self-start sm:self-auto"
              >
                Proceed to Book Slot &rarr;
              </button>
            </div>
          </div>
        )}
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
                      FTL
                    </div>
                  </div>
                </div>
                <span className="font-mono text-xs font-bold tracking-widest text-neutral-700">#FTL-8821-PASS</span>
              </div>

              {/* Pass details */}
              <div className="bg-surface-raised p-3 rounded-xl border border-border-subtle space-y-1.5 text-xs">
                <div className="flex justify-between">
                  <span className="text-text-secondary">Fixture:</span>
                  <span className="font-bold text-text-primary">Playmakers vs Naguru Stars</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-text-secondary">Venue:</span>
                  <span className="font-medium text-text-primary">Lugogo AstroTurf • Pitch 2</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-text-secondary">Gate Code:</span>
                  <span className="font-mono font-bold text-primary-lime">7429</span>
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
