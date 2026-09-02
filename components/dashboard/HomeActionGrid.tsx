import React from "react";
import { useNavigate } from "react-router-dom";
import { Zap, Mail, Users, MapPin } from "lucide-react";
import { motion } from "motion/react";

interface HomeActionGridProps {
  onExplorePitches: () => void;
}

export const HomeActionGrid: React.FC<HomeActionGridProps> = ({
  onExplorePitches,
}) => {
  const navigate = useNavigate();

  const actions = [
    {
      id: "book-pitch",
      title: "Book a Pitch",
      desc: "Instant slots & rates",
      icon: Zap,
      iconColor: "text-primary-lime",
      bgColor: "bg-primary-lime/10 border-primary-lime/30",
      action: onExplorePitches,
      badge: "Fast",
    },
    {
      id: "match-proposals",
      title: "Proposals",
      desc: "Invite & split slots",
      icon: Mail,
      iconColor: "text-amber-500",
      bgColor: "bg-amber-500/10 border-amber-500/30",
      action: () => navigate("/invitations"),
      badge: "Invites",
    },
    {
      id: "squad-matches",
      title: "Squad Hub",
      desc: "Tactics & line-ups",
      icon: Users,
      iconColor: "text-blue-500",
      bgColor: "bg-blue-500/10 border-blue-500/30",
      action: () => navigate("/teams"),
      badge: "Roster",
    },
    {
      id: "explore-map",
      title: "Pitch Radar",
      desc: "Interactive grounds",
      icon: MapPin,
      iconColor: "text-emerald-400",
      bgColor: "bg-emerald-500/10 border-emerald-500/30",
      action: () => navigate("/explore-map"),
      badge: "Live Map",
    },
  ];

  return (
    <section aria-label="Quick Actions" className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-6">
      {actions.map((item) => {
        const Icon = item.icon;
        return (
          <motion.button
            key={item.id}
            type="button"
            whileHover={{ y: -2 }}
            whileTap={{ scale: 0.96 }}
            transition={{ duration: 0.15 }}
            onClick={item.action}
            className="flex flex-col justify-between p-4 rounded-2xl bg-surface-card hover:bg-surface-raised border border-border-subtle hover:border-border-prominent shadow-xs text-left cursor-pointer transition-colors group"
          >
            <div className="flex items-center justify-between w-full mb-3">
              <div
                className={`w-10 h-10 rounded-xl flex items-center justify-center border ${item.bgColor} shrink-0`}
              >
                <Icon size={18} className={item.iconColor} />
              </div>
              <span className="text-[9.5px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md bg-surface-raised border border-border-subtle text-text-secondary group-hover:text-text-primary">
                {item.badge}
              </span>
            </div>

            <div>
              <h4 className="text-[13.5px] font-bold text-text-primary group-hover:text-primary-lime transition-colors leading-tight">
                {item.title}
              </h4>
              <p className="text-[11px] text-text-secondary truncate mt-0.5">{item.desc}</p>
            </div>
          </motion.button>
        );
      })}
    </section>
  );
};
