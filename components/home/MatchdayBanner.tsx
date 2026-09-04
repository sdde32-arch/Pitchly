import React from "react";
import { Zap, Moon, Users, ChevronRight, Sparkles } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface MatchdayBannerProps {
  onFilterFloodlit: () => void;
}

export const MatchdayBanner: React.FC<MatchdayBannerProps> = ({
  onFilterFloodlit,
}) => {
  const navigate = useNavigate();

  return (
    <section
      id="matchday-promotions-section"
      className="relative rounded-3xl overflow-hidden border border-primary-lime/30 bg-gradient-to-r from-surface-card via-surface-card to-primary-lime/10 p-4 sm:p-5 shadow-sm"
    >
      {/* Subtle Football Net Glow Backdrop */}
      <div className="absolute top-0 right-0 w-48 h-48 bg-primary-lime/10 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="w-11 h-11 rounded-2xl bg-primary-lime/15 border border-primary-lime/30 flex items-center justify-center text-primary-lime shrink-0">
            <Moon size={22} className="stroke-[2.2]" />
          </div>

          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-primary-lime text-accent-text">
                Matchday Special
              </span>
              <span className="text-xs font-semibold text-primary-lime flex items-center gap-1">
                <Sparkles size={12} />
                Floodlit Night Sessions
              </span>
            </div>

            <h3 className="text-base sm:text-lg font-black text-text-primary tracking-tight font-display">
              Play Under the Lights in Kampala
            </h3>

            <p className="text-xs text-text-secondary leading-relaxed max-w-lg">
              Book nighttime turf sessions with crystal LED floodlights. Split fees easily with your squad or join community pickups.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            id="banner-floodlit-btn"
            type="button"
            onClick={onFilterFloodlit}
            className="h-10 px-4 rounded-xl bg-primary-lime hover:bg-[#96E600] text-accent-text text-xs font-black transition-all flex items-center gap-1.5 shadow-md shadow-primary-lime/20 cursor-pointer active:scale-95"
          >
            <span>Night Pitches</span>
            <ChevronRight size={14} strokeWidth={2.5} />
          </button>

          <button
            id="banner-squads-btn"
            type="button"
            onClick={() => navigate("/teams")}
            className="h-10 px-3.5 rounded-xl bg-surface-raised hover:bg-border-subtle border border-border-subtle text-xs font-bold text-text-primary transition-colors cursor-pointer"
          >
            Squad Hub
          </button>
        </div>
      </div>
    </section>
  );
};
