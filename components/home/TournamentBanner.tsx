import React from "react";
import { Trophy, ChevronRight, Zap } from "lucide-react";
import { useNavigate } from "react-router-dom";

export const TournamentBanner: React.FC = () => {
  const navigate = useNavigate();

  return (
    <section
      id="tournament-promotions-section"
      className="relative rounded-2xl overflow-hidden border border-border-subtle bg-gradient-to-r from-surface-card via-surface-card to-surface-raised p-4 sm:p-5 shadow-sm mt-6 group transition-all"
    >
      {/* 4 Group Colors Spectrum Stripe */}
      <div className="absolute top-0 left-0 right-0 h-1 grid grid-cols-4">
        <div className="bg-blue-500" />
        <div className="bg-emerald-500" />
        <div className="bg-purple-500" />
        <div className="bg-amber-500" />
      </div>

      {/* Subtle Glow Backdrop */}
      <div className="absolute -top-10 -right-10 w-40 h-40 bg-primary-lime/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-3.5">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary-lime/20 via-primary-lime/10 to-transparent border border-primary-lime/30 flex items-center justify-center text-primary-lime shrink-0 shadow-sm">
            <Trophy size={24} className="stroke-[2.2]" />
          </div>
          <div className="space-y-0.5">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-primary-lime text-black flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-black animate-pulse" />
                Live Hub
              </span>
              <span className="text-[11px] font-bold text-text-secondary flex items-center gap-1">
                <Zap size={12} className="text-amber-400" />
                Season 2 • Matchday 2
              </span>
            </div>
            <h3 className="text-base sm:text-lg font-black text-text-primary tracking-tight font-display">
              WEHAT Championship
            </h3>
            <div className="flex items-center gap-2 text-xs text-text-tertiary">
              <span>16 Clubs</span>
              <span>•</span>
              <span>4 Groups</span>
              <span>•</span>
              <span className="text-primary-lime font-semibold">Live Standings</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            id="banner-tournament-hub-btn"
            type="button"
            onClick={() => navigate("/tournament")}
            className="h-10 px-5 rounded-xl bg-primary-lime hover:bg-[#96E600] text-black text-xs font-black transition-all flex items-center gap-1.5 shadow-md shadow-primary-lime/20 cursor-pointer active:scale-95"
          >
            <span>Match Center</span>
            <ChevronRight size={15} strokeWidth={2.5} />
          </button>
        </div>
      </div>
    </section>
  );
};
