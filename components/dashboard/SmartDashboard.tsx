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

interface SmartDashboardProps {
  upcomingBooking?: Booking | null;
  onExplorePitches?: () => void;
}

export const SmartDashboard: React.FC<SmartDashboardProps> = ({
  upcomingBooking,
  onExplorePitches,
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

  const handleCopyMatchInvite = () => {
    const matchText = `⚽ Matchday Invite: Lugogo AstroTurf 7v7 on Friday 07:00 PM!\nSlot reference: #FTL-8821\nJoin our squad lineup on FootLink App: https://footlink.ug/match/8821`;
    navigator.clipboard?.writeText(matchText);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  return (
    <div id="home-smart-dashboard" className="scroll-mt-20">
      <div className="bg-surface-card rounded-2xl border border-border-subtle hover:border-border-prominent p-4 sm:p-5 shadow-xs transition-all">
        {/* Header Tabs */}
        <div className="flex items-center justify-between gap-2 border-b border-border-subtle pb-3 mb-4">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setActiveTab("match")}
              className={`text-xs font-bold px-3 py-1.5 rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 ${
                activeTab === "match"
                  ? "bg-primary-lime text-accent-text"
                  : "text-text-secondary hover:text-text-primary hover:bg-surface-raised"
              }`}
            >
              <Radio size={12} className={activeTab === "match" ? "text-accent-text" : "text-primary-lime"} />
              <span>Next Matchday</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("quickbook")}
              className={`text-xs font-bold px-3 py-1.5 rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 ${
                activeTab === "quickbook"
                  ? "bg-primary-lime text-accent-text"
                  : "text-text-secondary hover:text-text-primary hover:bg-surface-raised"
              }`}
            >
              <Zap size={12} className={activeTab === "quickbook" ? "text-accent-text" : "text-amber-500"} />
              <span>Quick Book Slot</span>
            </button>
          </div>

          <div className="hidden xs:flex items-center gap-1.5 text-[11px] text-text-tertiary">
            <span>Kampala Premier League</span>
          </div>
        </div>

        {activeTab === "match" ? (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 text-[10px] font-black uppercase tracking-wider">
                    Confirmed
                  </span>
                  <span className="text-xs text-text-secondary font-semibold">Friday, 29 Aug • 07:00 PM</span>
                </div>
                <h3 className="text-sm sm:text-base font-bold text-text-primary">
                  Playmakers FC <span className="text-text-tertiary font-normal">vs</span> Naguru Stars
                </h3>
                <p className="text-xs text-text-secondary flex items-center gap-1 mt-0.5">
                  <MapPin size={12} className="text-primary-lime shrink-0" />
                  <span>Lugogo AstroTurf Grounds • Pitch 2 (7v7)</span>
                </p>
              </div>

              {/* Compact Countdown */}
              <div className="flex items-center gap-1.5 bg-surface-raised border border-border-subtle px-3 py-2 rounded-xl shrink-0 self-start sm:self-auto">
                <div className="text-center px-1">
                  <span className="font-mono text-sm font-bold text-text-primary block leading-none">{countdown.days}d</span>
                  <span className="text-[8px] text-text-tertiary uppercase">Days</span>
                </div>
                <span className="text-text-tertiary font-bold">:</span>
                <div className="text-center px-1">
                  <span className="font-mono text-sm font-bold text-text-primary block leading-none">{String(countdown.hours).padStart(2, "0")}h</span>
                  <span className="text-[8px] text-text-tertiary uppercase">Hours</span>
                </div>
                <span className="text-text-tertiary font-bold">:</span>
                <div className="text-center px-1">
                  <span className="font-mono text-sm font-bold text-text-primary block leading-none">{String(countdown.minutes).padStart(2, "0")}m</span>
                  <span className="text-[8px] text-text-tertiary uppercase">Mins</span>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="flex flex-wrap items-center justify-between gap-2 pt-3 border-t border-border-subtle">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowMatchPassModal(true)}
                  className="px-3.5 py-1.5 rounded-xl bg-primary-lime hover:bg-primary-lime-hover text-accent-text text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer active:scale-95"
                >
                  <QrCode size={13} />
                  <span>Digital Pass</span>
                </button>

                <button
                  type="button"
                  onClick={handleCopyMatchInvite}
                  className="px-3 py-1.5 rounded-xl bg-surface-raised hover:bg-border-subtle border border-border-subtle text-xs font-medium text-text-primary transition-all flex items-center gap-1.5 cursor-pointer active:scale-95"
                >
                  {copiedLink ? <Check size={13} className="text-emerald-500" /> : <Share2 size={13} />}
                  <span>{copiedLink ? "Copied" : "Share"}</span>
                </button>
              </div>

              <span className="text-[11px] text-text-secondary">
                Lineup: <strong className="text-text-primary">8/10</strong> players confirmed
              </span>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] font-semibold text-text-secondary block mb-1">Select Turf Ground</label>
                <select
                  value={selectedQuickPitchId}
                  onChange={(e) => setSelectedQuickPitchId(e.target.value)}
                  className="w-full h-10 px-3 rounded-xl bg-surface-raised text-xs text-text-primary border border-border-subtle focus:outline-none focus:border-primary-lime"
                >
                  {TURFS.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name} (UGX {t.pricePerHour?.toLocaleString()}/hr)
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[11px] font-semibold text-text-secondary block mb-1">Preferred Time Slot</label>
                <div className="grid grid-cols-2 gap-2">
                  {["Tonight 07:00 PM", "Tonight 09:00 PM", "Tomorrow 06:00 PM", "Tomorrow 08:00 PM"].map((time) => (
                    <button
                      key={time}
                      type="button"
                      onClick={() => setSelectedQuickTime(time)}
                      className={`h-10 px-2 rounded-xl text-[11px] font-medium border transition-colors cursor-pointer truncate ${
                        selectedQuickTime === time
                          ? "bg-primary-lime/15 text-primary-lime border-primary-lime/40 font-bold"
                          : "bg-surface-raised text-text-secondary border-border-subtle hover:text-text-primary"
                      }`}
                    >
                      {time}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-border-subtle">
              <span className="text-xs text-text-secondary">
                Instant confirmation & Mobile Money split-pay supported
              </span>
              <button
                type="button"
                onClick={() => navigate(`/turf/${selectedQuickPitchId}`)}
                className="px-4 py-2 rounded-xl bg-primary-lime hover:bg-primary-lime-hover text-accent-text text-xs font-bold transition-all shadow-xs cursor-pointer active:scale-95"
              >
                Proceed to Book &rarr;
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
