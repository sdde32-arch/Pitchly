import React, { useState } from "react";
import { Users, MapPin, Clock, Plus, CheckCircle2, ChevronRight, Zap } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { useNavigate } from "react-router-dom";

interface PickupMatch {
  id: string;
  title: string;
  venue: string;
  time: string;
  format: string;
  spotsNeeded: number;
  totalSpots: number;
  pricePerPlayer: number;
  hostName: string;
  skillLevel: string;
}

const SAMPLE_PICKUPS: PickupMatch[] = [
  {
    id: "pickup-1",
    title: "Lugogo Casual Friday 7v7",
    venue: "Lugogo AstroTurf Grounds",
    time: "Today, 08:00 PM",
    format: "7-A-Side",
    spotsNeeded: 2,
    totalSpots: 14,
    pricePerPlayer: 10000,
    hostName: "Coach Brian",
    skillLevel: "Open / Friendly",
  },
  {
    id: "pickup-2",
    title: "Naguru Floodlit Futsal Night",
    venue: "Naguru Floodlit Turf Pitch",
    time: "Tomorrow, 07:30 PM",
    format: "5-A-Side",
    spotsNeeded: 1,
    totalSpots: 10,
    pricePerPlayer: 8000,
    hostName: "Denis K.",
    skillLevel: "Intermediate",
  },
  {
    id: "pickup-3",
    title: "Kansanga Sunday Morning Cup",
    venue: "Kansanga Football Arena",
    time: "Sun, 08:30 AM",
    format: "7-A-Side",
    spotsNeeded: 3,
    totalSpots: 14,
    pricePerPlayer: 7000,
    hostName: "Emma O.",
    skillLevel: "Competitive",
  },
];

export const HomeCommunityPickups: React.FC = () => {
  const navigate = useNavigate();
  const [joinedMatches, setJoinedMatches] = useState<Record<string, boolean>>({});
  const [showToast, setShowToast] = useState<string | null>(null);

  const handleJoin = (match: PickupMatch, e: React.MouseEvent) => {
    e.stopPropagation();
    const isJoined = !!joinedMatches[match.id];
    setJoinedMatches((prev) => ({ ...prev, [match.id]: !isJoined }));

    if (!isJoined) {
      setShowToast(`Joined ${match.title}! Slot confirmed.`);
      setTimeout(() => setShowToast(null), 3000);
    }
  };

  return (
    <section
      id="community-pickups-section"
      aria-label="Open Pickup Matches"
      className="space-y-4 scroll-mt-24"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
          <h3 className="text-[15px] font-bold text-text-primary">
            Open Pickups Looking For Players
          </h3>
        </div>
        <button
          type="button"
          onClick={() => navigate("/teams")}
          className="text-xs font-bold text-primary-lime hover:underline transition-colors cursor-pointer flex items-center gap-0.5"
        >
          <span>Find more games</span>
          <ChevronRight size={13} />
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
        {SAMPLE_PICKUPS.map((match) => {
          const isJoined = !!joinedMatches[match.id];
          return (
            <motion.div
              key={match.id}
              whileHover={{ y: -2 }}
              transition={{ duration: 0.15 }}
              className="bg-surface-card rounded-2xl p-4 border border-border-subtle hover:border-border-prominent shadow-xs flex flex-col justify-between space-y-3.5 transition-colors group"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <span className="px-2 py-0.5 rounded-md bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 text-[9.5px] font-black uppercase">
                    {match.format}
                  </span>
                  <span className="text-[10px] font-semibold text-amber-500 bg-amber-500/10 px-2 py-0.5 rounded-md">
                    {isJoined ? "Spot Reserved" : `${match.spotsNeeded} spots left`}
                  </span>
                </div>

                <h4 className="text-[13.5px] font-bold text-text-primary leading-snug group-hover:text-primary-lime transition-colors">
                  {match.title}
                </h4>

                <div className="space-y-1.5 text-xs text-text-secondary font-medium">
                  <div className="flex items-center gap-1.5 truncate">
                    <MapPin size={13} className="text-primary-lime shrink-0" />
                    <span className="truncate">{match.venue}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Clock size={13} className="text-text-tertiary shrink-0" />
                    <span>{match.time}</span>
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t border-border-subtle flex items-center justify-between">
                <div>
                  <span className="text-[9px] text-text-tertiary uppercase tracking-wider block leading-none">
                    Share
                  </span>
                  <span className="text-xs font-bold text-text-primary">
                    UGX {match.pricePerPlayer.toLocaleString()}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={(e) => handleJoin(match, e)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer active:scale-95 flex items-center gap-1.5 ${
                    isJoined
                      ? "bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/40"
                      : "bg-primary-lime hover:bg-primary-lime-hover text-accent-text"
                  }`}
                >
                  {isJoined ? (
                    <>
                      <CheckCircle2 size={13} />
                      <span>Joined</span>
                    </>
                  ) : (
                    <>
                      <Plus size={13} />
                      <span>Join Slot</span>
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Confirmation Toast */}
      <AnimatePresence>
        {showToast && (
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 15 }}
            className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-surface-card border-2 border-primary-lime text-text-primary px-4 py-2 rounded-xl shadow-lg flex items-center gap-2 text-xs font-bold pointer-events-none"
          >
            <CheckCircle2 size={16} className="text-primary-lime" />
            <span>{showToast}</span>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
};
