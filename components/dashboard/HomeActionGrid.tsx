import React from "react";
import { useNavigate } from "react-router-dom";
import { Zap, Users, MapPin, Trophy, ArrowUpRight } from "lucide-react";
import { motion } from "motion/react";

interface HomeActionGridProps {
  onExplorePitches: () => void;
  onFilterInstant?: () => void;
  layout?: "row" | "sidebar";
  className?: string;
}

export const HomeActionGrid: React.FC<HomeActionGridProps> = ({
  onExplorePitches,
  onFilterInstant,
  layout = "row",
  className,
}) => {
  const navigate = useNavigate();

  const actions = [
    {
      id: "book-pitch",
      title: "Find a Pitch",
      desc: "Instant slots & rates",
      icon: Zap,
      action: onExplorePitches,
      tag: "Live Slots",
      color: "text-primary-lime",
      bg: "bg-primary-lime/10",
      border: "border-primary-lime/30",
    },
    {
      id: "explore-map",
      title: "Pitch Radar",
      desc: "Live map of turfs",
      icon: MapPin,
      action: () => navigate("/explore-map"),
      tag: "Map View",
      color: "text-[#38BDF8]",
      bg: "bg-[#38BDF8]/10",
      border: "border-[#38BDF8]/30",
    },
    {
      id: "match-proposals",
      title: "Match Invites",
      desc: "Challenges & split fees",
      icon: Trophy,
      action: () => navigate("/invitations"),
      tag: "Community",
      color: "text-[#FACC15]",
      bg: "bg-[#FACC15]/10",
      border: "border-[#FACC15]/30",
    },
    {
      id: "squad-matches",
      title: "Squad Manager",
      desc: "Lineups & team dues",
      icon: Users,
      action: () => navigate("/teams"),
      tag: "Squads",
      color: "text-[#A78BFA]",
      bg: "bg-[#A78BFA]/10",
      border: "border-[#A78BFA]/30",
    },
  ];

  const gridClass =
    className ||
    (layout === "sidebar"
      ? "grid grid-cols-2 gap-2.5 sm:gap-3"
      : "grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4");

  return (
    <section aria-label="Football Quick Actions" className={gridClass}>
      {actions.map((item) => {
        const Icon = item.icon;
        return (
          <motion.button
            key={item.id}
            id={`quick-action-${item.id}`}
            type="button"
            whileHover={{ y: -2 }}
            whileTap={{ scale: 0.98 }}
            transition={{ duration: 0.15 }}
            onClick={item.action}
            className="relative bg-surface-card hover:bg-surface-raised border border-border-subtle hover:border-border-prominent rounded-2xl p-3.5 sm:p-4 text-left transition-all duration-200 group cursor-pointer flex flex-col justify-between shadow-2xs"
          >
            <div className="flex items-start justify-between mb-3">
              <div className={`w-10 h-10 rounded-xl ${item.bg} border ${item.border} flex items-center justify-center ${item.color} group-hover:scale-105 transition-transform`}>
                <Icon size={20} strokeWidth={2.2} />
              </div>
              <span className="text-[10px] font-black uppercase tracking-wider text-text-tertiary bg-surface-raised px-2 py-0.5 rounded-md border border-border-subtle group-hover:border-border-prominent">
                {item.tag}
              </span>
            </div>

            <div>
              <div className="flex items-center gap-1">
                <h3 className="text-xs sm:text-sm font-black text-text-primary tracking-tight group-hover:text-primary-lime transition-colors">
                  {item.title}
                </h3>
                <ArrowUpRight size={14} className="text-text-tertiary group-hover:text-primary-lime group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform shrink-0" />
              </div>
              <p className="text-[11px] text-text-secondary mt-0.5 line-clamp-1 font-medium">
                {item.desc}
              </p>
            </div>
          </motion.button>
        );
      })}
    </section>
  );
};
