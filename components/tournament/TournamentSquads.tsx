import React, { useState } from "react";
import { Users, Filter, Award } from "lucide-react";
import { TournamentTeam, TournamentPlayer } from "../../types/tournament";

interface TournamentSquadsProps {
  teams: TournamentTeam[];
  players: TournamentPlayer[];
}

export const TournamentSquads: React.FC<TournamentSquadsProps> = ({ teams, players }) => {
  const [selectedTeam, setSelectedTeam] = useState<string>("all");

  const filteredPlayers =
    selectedTeam === "all"
      ? players
      : players.filter((p) => p.teamName === selectedTeam);

  return (
    <div className="space-y-6 animate-fadeIn pb-16">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-text-primary uppercase tracking-tight flex items-center gap-2">
            <Users size={20} className="text-primary-lime" />
            Official Squads & Rosters
          </h2>
          <p className="text-xs text-text-secondary mt-1">
            Browse registered clubs and their official player rosters for the tournament.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 text-xs text-text-secondary font-bold">
            <Filter size={14} className="text-primary-lime" />
            <span>Filter Club:</span>
          </div>
          <select
            value={selectedTeam}
            onChange={(e) => setSelectedTeam(e.target.value)}
            className="bg-surface-card border border-border-subtle rounded-xl px-3 py-1.5 text-sm font-bold text-text-primary focus:border-primary-lime cursor-pointer shadow-sm"
          >
            <option value="all">All Clubs ({teams.length})</option>
            {teams.map((t) => (
              <option key={t.id} value={t.teamName}>
                {t.teamName} ({t.group})
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {teams
          .filter((t) => selectedTeam === "all" || t.teamName === selectedTeam)
          .map((team) => {
            const teamPlayers = players.filter((p) => p.teamName === team.teamName);
            return (
              <div
                key={team.id}
                className="bg-surface-card border border-border-subtle rounded-2xl p-4 shadow-sm flex flex-col"
              >
                <div className="flex items-center justify-between border-b border-border-subtle pb-3 mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-surface-raised border border-border-subtle flex items-center justify-center font-black text-primary-lime text-xs">
                      {team.badgeInitials || team.teamName.substring(0, 3).toUpperCase()}
                    </div>
                    <div>
                      <h3 className="text-sm font-black text-text-primary uppercase truncate max-w-[140px]">
                        {team.teamName}
                      </h3>
                      <p className="text-[10px] font-bold text-text-tertiary">
                        {team.group} • {teamPlayers.length} Players
                      </p>
                    </div>
                  </div>
                </div>

                {team.managerName && (
                  <div className="text-[11px] text-text-secondary font-medium mb-3 bg-app-base px-2 py-1.5 rounded-lg border border-border-subtle inline-flex items-center">
                    Manager: <span className="font-bold text-text-primary ml-1">{team.managerName}</span>
                  </div>
                )}

                <div className="space-y-1.5 flex-1 max-h-[220px] overflow-y-auto pr-1">
                  {teamPlayers.length === 0 ? (
                    <p className="text-[11px] text-text-tertiary italic text-center py-4">
                      No official roster submitted yet.
                    </p>
                  ) : (
                    teamPlayers.map((p) => (
                      <div
                        key={p.id}
                        className="flex items-center gap-2.5 p-2 bg-app-base border border-border-subtle rounded-xl hover:border-primary-lime/30 transition-colors"
                      >
                        <div className="w-6 h-6 rounded bg-surface-raised font-mono text-[10px] font-black text-text-secondary flex items-center justify-center shrink-0">
                          {p.jerseyNumber ? `#${p.jerseyNumber}` : "-"}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs font-bold text-text-primary truncate">
                              {p.playerName}
                            </span>
                            {p.captain && (
                              <span className="px-1 py-0.5 rounded bg-amber-500/20 text-amber-400 text-[8px] font-black flex items-center gap-0.5 shrink-0">
                                <Award size={8} /> C
                              </span>
                            )}
                          </div>
                          <div className="text-[9px] text-text-tertiary font-medium">
                            {p.position || "Player"}
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            );
          })}
      </div>
    </div>
  );
};
