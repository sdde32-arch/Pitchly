import React from "react";
import { Trophy, ChevronRight } from "lucide-react";
import { useNavigate } from "react-router-dom";

export const TournamentBanner: React.FC = () => {
  const navigate = useNavigate();

  return (
    <section
      id="tournament-promotions-section"
      onClick={() => navigate("/tournament")}
      className="rounded-xl border border-border-subtle bg-surface-card hover:border-border-prominent transition-colors p-3.5 mt-5 cursor-pointer"
    >
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-9 h-9 rounded-lg bg-surface-raised border border-border-subtle flex items-center justify-center text-primary-lime shrink-0">
            <Trophy size={18} />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 text-[11px] text-text-tertiary">
              <span className="font-semibold text-primary-lime">Season 2</span>
              <span>·</span>
              <span>Matchday 3</span>
            </div>
            <h3 className="text-sm font-semibold text-text-primary tracking-tight truncate">
              WEHAT Soccer Tournament
            </h3>
          </div>
        </div>

        <div className="flex items-center gap-1 text-xs font-medium text-text-secondary shrink-0">
          <span className="hidden sm:inline">View Hub</span>
          <ChevronRight size={14} className="text-text-tertiary" />
        </div>
      </div>
    </section>
  );
};
