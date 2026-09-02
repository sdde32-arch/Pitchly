import React, { useState, useEffect } from "react";
import {
  Trophy,
  Calendar,
  Clock,
  MapPin,
  Flame,
  ChevronRight,
  Award,
  Zap,
  Users,
  Shield,
  ArrowUpRight,
  Star,
  CheckCircle2,
  Sparkles,
  QrCode,
  Share2,
  TrendingUp,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { useNavigate } from "react-router-dom";
import { useUser } from "../../context/UserContext";
import { USER_STATS, BADGES } from "../../constants";
import { Booking } from "../../types/firebase";

interface HomeGamificationSummaryCardProps {
  upcomingBooking?: Booking | null;
  onExplorePitches?: () => void;
}

export const HomeGamificationSummaryCard: React.FC<HomeGamificationSummaryCardProps> = ({
  upcomingBooking,
  onExplorePitches,
}) => {
  const navigate = useNavigate();
  const { stats, addXP, user, userProfile } = useUser();

  // Active view tab inside the card
  const [activeTab, setActiveTab] = useState<"match" | "rewards">("match");

  // Daily XP bonus claim state
  const [claimedToday, setClaimedToday] = useState<boolean>(() => {
    try {
      const lastClaim = localStorage.getItem("pitchly_daily_xp_claim");
      const today = new Date().toISOString().split("T")[0];
      return lastClaim === today;
    } catch {
      return false;
    }
  });

  const [showBonusToast, setShowBonusToast] = useState(false);

  // Live countdown timer for the next match
  const [countdown, setCountdown] = useState({
    days: 2,
    hours: 5,
    minutes: 42,
    seconds: 18,
  });

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev.seconds > 0) {
          return { ...prev, seconds: prev.seconds - 1 };
        }
        if (prev.minutes > 0) {
          return { ...prev, minutes: 59, seconds: 59 };
        }
        if (prev.hours > 0) {
          return { ...prev, hours: prev.hours - 1, minutes: 59, seconds: 59 };
        }
        if (prev.days > 0) {
          return { ...prev, days: prev.days - 1, hours: 23, minutes: 59, seconds: 59 };
        }
        return prev;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const handleClaimDailyBonus = () => {
    if (claimedToday) return;
    try {
      const today = new Date().toISOString().split("T")[0];
      localStorage.setItem("pitchly_daily_xp_claim", today);
      setClaimedToday(true);
      if (addXP) {
        addXP(50);
      }
      setShowBonusToast(true);
      setTimeout(() => setShowBonusToast(false), 3500);
    } catch (err) {
      console.warn("Could not record daily claim", err);
    }
  };

  const currentLevel = stats?.level || USER_STATS.level;
  const currentXP = stats?.currentXP || USER_STATS.currentXP;
  const nextLevelXP = stats?.nextLevelXP || USER_STATS.nextLevelXP;
  const xpPercentage = Math.min(Math.round((currentXP / nextLevelXP) * 100), 100);

  return (
    <section
      id="home-gamification-hub"
      aria-label="Match Hub & Tournament Rank"
      className="relative rounded-2xl bg-surface-card border border-border-subtle hover:border-border-prominent shadow-sm overflow-hidden transition-all duration-300 scroll-mt-24"
    >
      {/* Subtle background ambient stadium glow */}
      <div className="absolute top-0 right-0 w-72 h-72 bg-primary-lime/5 dark:bg-primary-lime/10 rounded-full blur-3xl pointer-events-none -mr-16 -mt-16" />
      <div className="absolute bottom-0 left-0 w-60 h-60 bg-blue-500/5 dark:bg-blue-500/10 rounded-full blur-3xl pointer-events-none -ml-12 -mb-12" />

      {/* 1. TOP HEADER: Player Level, Streak & Bonus Claim */}
      <div className="relative p-4 sm:p-5 border-b border-border-subtle bg-surface-raised/40">
        <div className="flex flex-wrap items-center justify-between gap-3">
          {/* Player Identity & Level */}
          <div className="flex items-center gap-3 min-w-0">
            <div className="relative">
              <div className="w-11 h-11 rounded-xl bg-surface-card border border-border-prominent flex items-center justify-center text-primary-lime shadow-xs font-black text-sm">
                <span className="text-primary-lime font-display">Lv.{currentLevel}</span>
              </div>
              <div className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-primary-lime text-accent-text flex items-center justify-center text-[9px] font-black shadow-xs">
                ★
              </div>
            </div>

            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-text-primary truncate">
                  {userProfile?.name || (user?.displayName ? user.displayName : "Matchday Player")}
                </h3>
                <span className="hidden xs:inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-primary-lime/15 text-primary-lime border border-primary-lime/30 text-[10px] font-bold">
                  <Shield size={10} className="fill-primary-lime" />
                  Div 1 Captain
                </span>
              </div>
              <div className="flex items-center gap-2 mt-0.5 text-xs text-text-secondary">
                <span className="flex items-center gap-1 font-semibold text-amber-500 dark:text-amber-400">
                  <Flame size={13} className="fill-amber-500 text-amber-500 animate-pulse" />
                  4-Week Streak
                </span>
                <span className="text-text-tertiary">•</span>
                <span className="text-[11px] text-text-secondary font-medium">
                  {xpPercentage}% to Level {currentLevel + 1}
                </span>
              </div>
            </div>
          </div>

          {/* Gamification Action: Daily Streak / Bonus Claim */}
          <div className="flex items-center gap-2 shrink-0 ml-auto xs:ml-0">
            <button
              type="button"
              onClick={handleClaimDailyBonus}
              disabled={claimedToday}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all shadow-xs active:scale-95 cursor-pointer ${
                claimedToday
                  ? "bg-surface-raised border border-border-subtle text-text-tertiary cursor-default"
                  : "bg-primary-lime hover:bg-primary-lime-hover text-accent-text border border-primary-lime/40 animate-bounce"
              }`}
              title={claimedToday ? "Daily Matchday XP already claimed" : "Claim +50 XP Matchday Check-in"}
            >
              {claimedToday ? (
                <>
                  <CheckCircle2 size={13} className="text-primary-lime" />
                  <span>Streak Active</span>
                </>
              ) : (
                <>
                  <Sparkles size={13} className="fill-accent-text" />
                  <span>Claim +50 XP</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* XP Progress Bar */}
        <div className="mt-3.5 space-y-1">
          <div className="flex justify-between items-center text-[10.5px] font-semibold text-text-secondary">
            <span>XP Progress: {currentXP} / {nextLevelXP} XP</span>
            <span className="text-primary-lime font-bold">
              {nextLevelXP - currentXP} XP to Level {currentLevel + 1} Perks
            </span>
          </div>
          <div className="w-full h-2 rounded-full bg-surface-raised overflow-hidden border border-border-subtle p-[1px]">
            <motion.div
              className="h-full rounded-full bg-gradient-to-r from-lime-500 via-primary-lime to-emerald-400"
              initial={{ width: 0 }}
              animate={{ width: `${xpPercentage}%` }}
              transition={{ duration: 0.8, ease: "easeOut" }}
            />
          </div>
        </div>

        {/* Navigation Tabs inside Summary Card */}
        <div className="flex items-center gap-1.5 mt-4 pt-3 border-t border-border-subtle/80 overflow-x-auto no-scrollbar">
          {[
            { id: "match", label: "Upcoming Match", icon: Calendar, badge: "Live" },
            { id: "rewards", label: "Perks & Badges", icon: Award, badge: `${BADGES.filter(b => b.earned).length}/${BADGES.length}` },
          ].map((tab) => {
            const isSelected = activeTab === tab.id;
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap cursor-pointer active:scale-95 ${
                  isSelected
                    ? "bg-surface-card text-text-primary border border-border-prominent shadow-xs"
                    : "text-text-secondary hover:text-text-primary hover:bg-surface-raised/60"
                }`}
              >
                <Icon size={13} className={isSelected ? "text-primary-lime" : "text-text-tertiary"} />
                <span>{tab.label}</span>
                {tab.badge && (
                  <span
                    className={`px-1.5 py-0.2 rounded-md text-[9px] font-black uppercase ${
                      isSelected
                        ? "bg-primary-lime/20 text-primary-lime border border-primary-lime/40"
                        : "bg-surface-raised text-text-tertiary"
                    }`}
                  >
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* 2. TAB CONTENTS */}
      <div className="p-4 sm:p-5">
        <AnimatePresence mode="wait">
          {/* TAB 1: UPCOMING MATCH & COUNTDOWN */}
          {activeTab === "match" && (
            <motion.div
              key="match-tab"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
              className="space-y-4"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-surface-raised/70 rounded-xl p-3.5 border border-border-subtle">
                <div className="space-y-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 text-[10px] font-bold uppercase tracking-wider">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                      Confirmed Fixture
                    </span>
                    <span className="text-[11px] font-semibold text-text-secondary">
                      Corporate League • Matchday 13
                    </span>
                  </div>
                  <h4 className="text-sm sm:text-base font-bold text-text-primary truncate">
                    {upcomingBooking
                      ? `${(upcomingBooking as any).turfName || "Lugogo Arena"} Match`
                      : "Ntinda Gunners FC vs. Bugolobi Strikers"}
                  </h4>
                  <div className="flex flex-wrap items-center gap-3 text-xs text-text-secondary font-medium pt-0.5">
                    <span className="flex items-center gap-1">
                      <MapPin size={12} className="text-primary-lime shrink-0" />
                      <span>Lugogo Futsal Arena (Pitch 1)</span>
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock size={12} className="text-text-tertiary shrink-0" />
                      <span>Friday, 07:00 PM (Floodlit)</span>
                    </span>
                  </div>
                </div>

                {/* Match Countdown Clock */}
                <div className="flex flex-col items-start sm:items-end gap-1.5 shrink-0 bg-surface-card sm:bg-transparent p-2.5 sm:p-0 rounded-lg border border-border-subtle sm:border-0">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-text-tertiary">
                    Kickoff Countdown
                  </span>
                  <div className="flex items-center gap-1.5 font-mono">
                    {[
                      { val: countdown.days, label: "D" },
                      { val: countdown.hours, label: "H" },
                      { val: countdown.minutes, label: "M" },
                      { val: countdown.seconds, label: "S" },
                    ].map((item, idx) => (
                      <div
                        key={idx}
                        className="flex flex-col items-center justify-center w-8 h-8 rounded-lg bg-surface-card border border-border-subtle shadow-2xs"
                      >
                        <span className="text-xs font-black text-text-primary leading-none">
                          {String(item.val).padStart(2, "0")}
                        </span>
                        <span className="text-[7.5px] font-bold text-text-tertiary leading-none mt-0.5">
                          {item.label}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Squad Lineup & Match Info Badges */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                <div className="bg-surface-raised/40 rounded-xl p-2.5 border border-border-subtle flex flex-col justify-between">
                  <span className="text-[10px] uppercase font-bold text-text-tertiary">Format</span>
                  <span className="text-xs sm:text-sm font-bold text-text-primary mt-0.5">7-A-Side Futsal</span>
                </div>
                <div className="bg-surface-raised/40 rounded-xl p-2.5 border border-border-subtle flex flex-col justify-between">
                  <span className="text-[10px] uppercase font-bold text-text-tertiary">Squad Check-in</span>
                  <span className="text-xs sm:text-sm font-bold text-primary-lime mt-0.5">12 / 14 Players</span>
                </div>
                <div className="bg-surface-raised/40 rounded-xl p-2.5 border border-border-subtle flex flex-col justify-between">
                  <span className="text-[10px] uppercase font-bold text-text-tertiary">Kit Colors</span>
                  <span className="text-xs sm:text-sm font-bold text-text-primary mt-0.5">Home Navy / Bibs</span>
                </div>
                <div className="bg-surface-raised/40 rounded-xl p-2.5 border border-border-subtle flex flex-col justify-between">
                  <span className="text-[10px] uppercase font-bold text-text-tertiary">Match Stakes</span>
                  <span className="text-xs sm:text-sm font-bold text-amber-500 mt-0.5">+150 League XP</span>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="flex flex-wrap items-center justify-between gap-2.5 pt-1">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => navigate("/bookings")}
                    className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-surface-card hover:bg-surface-raised border border-border-subtle text-xs font-bold text-text-primary transition-all shadow-xs cursor-pointer active:scale-95"
                  >
                    <QrCode size={14} className="text-primary-lime" />
                    <span>View Match Pass</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => navigate("/teams")}
                    className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-surface-card hover:bg-surface-raised border border-border-subtle text-xs font-bold text-text-secondary hover:text-text-primary transition-all shadow-xs cursor-pointer active:scale-95"
                  >
                    <Users size={14} />
                    <span>Squad Tactics</span>
                  </button>
                </div>

                {onExplorePitches && (
                  <button
                    type="button"
                    onClick={onExplorePitches}
                    className="flex items-center gap-1 text-xs font-bold text-primary-lime hover:underline transition-colors ml-auto cursor-pointer"
                  >
                    <span>Book Next Slot</span>
                    <ChevronRight size={14} />
                  </button>
                )}
              </div>
            </motion.div>
          )}

          {/* TAB 2: GAMIFICATION REWARDS & BADGES */}
          {activeTab === "rewards" && (
            <motion.div
              key="rewards-tab"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
              className="space-y-4"
            >
              {/* Gamification Stats Bento */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                <div className="bg-surface-raised/50 rounded-xl p-3 border border-border-subtle">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] uppercase font-bold text-text-tertiary">Win Rate</span>
                    <TrendingUp size={13} className="text-emerald-500" />
                  </div>
                  <div className="text-base sm:text-lg font-black text-text-primary mt-1">78%</div>
                  <span className="text-[10px] text-text-secondary">25 wins in 32 matches</span>
                </div>

                <div className="bg-surface-raised/50 rounded-xl p-3 border border-border-subtle">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] uppercase font-bold text-text-tertiary">Goals Scored</span>
                    <span className="text-xs">⚽</span>
                  </div>
                  <div className="text-base sm:text-lg font-black text-text-primary mt-1">24 Goals</div>
                  <span className="text-[10px] text-text-secondary">0.75 goals / match</span>
                </div>

                <div className="bg-surface-raised/50 rounded-xl p-3 border border-border-subtle">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] uppercase font-bold text-text-tertiary">MVP Awards</span>
                    <Award size={13} className="text-amber-500" />
                  </div>
                  <div className="text-base sm:text-lg font-black text-amber-500 mt-1">7 Times</div>
                  <span className="text-[10px] text-text-secondary">Top matchday player</span>
                </div>

                <div className="bg-surface-raised/50 rounded-xl p-3 border border-border-subtle">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] uppercase font-bold text-text-tertiary">Match Streak</span>
                    <Flame size={13} className="text-amber-500 fill-amber-500" />
                  </div>
                  <div className="text-base sm:text-lg font-black text-primary-lime mt-1">4 Weeks</div>
                  <span className="text-[10px] text-text-secondary">+20% bonus XP unlocked</span>
                </div>
              </div>

              {/* Earned Badges Showcase */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-[11px] font-bold text-text-secondary px-1">
                  <span>Earned Achievements & Badges</span>
                  <button
                    type="button"
                    onClick={() => navigate("/profile")}
                    className="text-primary-lime hover:underline cursor-pointer flex items-center gap-0.5"
                  >
                    <span>View Trophy Cabinet</span>
                    <ChevronRight size={12} />
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {BADGES.map((b) => (
                    <div
                      key={b.id}
                      className={`flex items-center gap-2.5 p-2.5 rounded-xl border transition-colors ${
                        b.earned
                          ? "bg-surface-raised/40 border-border-subtle text-text-primary"
                          : "bg-surface-raised/10 border-dashed border-border-subtle text-text-tertiary opacity-60"
                      }`}
                    >
                      <div className="text-lg shrink-0">{b.icon}</div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-1">
                          <h5 className="text-xs font-bold truncate">{b.name}</h5>
                          {b.earned ? (
                            <span className="text-[9px] font-bold text-primary-lime bg-primary-lime/15 px-1.5 py-0.2 rounded-md">
                              Unlocked
                            </span>
                          ) : (
                            <span className="text-[9px] font-medium text-text-tertiary">Locked</span>
                          )}
                        </div>
                        <p className="text-[10.5px] text-text-secondary truncate">{b.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Bonus Toast Feedback */}
      <AnimatePresence>
        {showBonusToast && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="absolute bottom-3 left-1/2 -translate-x-1/2 z-30 bg-surface-card border-2 border-primary-lime text-text-primary px-4 py-2 rounded-xl shadow-lg flex items-center gap-2 text-xs font-bold pointer-events-none"
          >
            <Sparkles size={16} className="text-primary-lime fill-primary-lime" />
            <span>+50 XP Claimed! Matchday streak maintained.</span>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
};
