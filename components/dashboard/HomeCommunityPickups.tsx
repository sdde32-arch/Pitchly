import React, { useState } from "react";
import { Users, MapPin, Clock, Plus, CheckCircle2, ChevronRight, Zap } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { useNavigate } from "react-router-dom";
import { HomeCommunityPickupsSkeleton } from "../ui/Skeleton";

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

interface HomeCommunityPickupsProps {
  loading?: boolean;
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

export const HomeCommunityPickups: React.FC<HomeCommunityPickupsProps> = ({
  loading = false,
}) => {
  const navigate = useNavigate();
  const [joinedMatches, setJoinedMatches] = useState<Record<string, boolean>>({});
  const [showToast, setShowToast] = useState<string | null>(null);

  if (loading) {
    return <HomeCommunityPickupsSkeleton />;
  }

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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 sm:gap-4">
        <div className="flex items-center gap-2.5">
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse shrink-0" />
          <div>
            <h2 className="text-base sm:text-lg font-bold text-text-primary tracking-tight">
              Open Pickup Matches
            </h2>
            <p className="text-xs text-text-secondary mt-0.5">
              Jump in on local community games looking for extra players
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => navigate("/teams")}
          className="text-xs font-bold text-primary-lime hover:underline transition-colors cursor-pointer flex items-center gap-1 self-start sm:self-auto pt-1 sm:pt-0"
        >
          <span>Find more games</span>
          <ChevronRight size={14} />
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
        {SAMPLE_PICKUPS.map((match) => {
          const isJoined = !!joinedMatches[match.id];
          return (
            <motion.div
              key={match.id}
              whileHover={{ y: -2 }}
              transition={{ duration: 0.15 }}
              className="bg-surface-card rounded-2xl p-4 sm:p-5 border border-border-subtle hover:border-border-prominent shadow-xs flex flex-col justify-between space-y-4 transition-all duration-200 group"
            >
              <div className="space-y-2.5">
                <div className="flex items-center justify-between gap-2">
                  <span className="px-2.5 py-0.5 rounded-full bg-surface-raised text-text-secondary border border-border-subtle text-[10px] font-bold uppercase tracking-wider">
                    {match.format}
                  </span>
                  <span
                    className={`text-[10.5px] font-semibold px-2.5 py-0.5 rounded-full border ${
                      isJoined
                        ? "bg-primary-lime/15 text-primary-lime border-primary-lime/30 font-bold"
                        : "bg-surface-raised text-text-secondary border-border-subtle"
                    }`}
                  >
                    {isJoined ? "Spot Reserved" : `${match.spotsNeeded} spots left`}
                  </span>
                </div>

                <h3 className="text-sm font-bold text-text-primary leading-snug group-hover:text-primary-lime transition-colors">
                  {match.title}
                </h3>

                <div className="space-y-1.5 text-xs text-text-secondary font-medium">
                  <div className="flex items-center gap-2 truncate">
                    <MapPin size={13} className="text-primary-lime shrink-0" />
                    <span className="truncate">{match.venue}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock size={13} className="text-text-tertiary shrink-0" />
                    <span>{match.time}</span>
                  </div>
                </div>
              </div>

              <div className="pt-3.5 border-t border-border-subtle flex items-center justify-between gap-3">
                <div>
                  <span className="text-[9.5px] text-text-tertiary uppercase tracking-wider block font-semibold">
                    Player Share
                  </span>
                  <span className="text-xs font-bold text-text-primary">
                    UGX {match.pricePerPlayer.toLocaleString()}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={(e) => handleJoin(match, e)}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer active:scale-95 flex items-center gap-1.5 shrink-0 ${
                    isJoined
                      ? "bg-primary-lime/20 text-primary-lime border border-primary-lime/40"
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
