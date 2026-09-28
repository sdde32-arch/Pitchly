import React, { useState, useMemo } from "react";
import { Users, Filter, Award, Search, Shield, ChevronRight } from "lucide-react";
import { TournamentTeam, TournamentPlayer } from "../../types/tournament";

interface TournamentSquadsProps {
  teams: TournamentTeam[];
  players: TournamentPlayer[];
}

export const TournamentSquads: React.FC<TournamentSquadsProps> = ({ teams, players }) => {
  const [selectedGroup, setSelectedGroup] = useState<string>("all");
  const [selectedTeam, setSelectedTeam] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");

  const groups = ["all", "Group A", "Group B", "Group C", "Group D"];

  const filteredTeams = useMemo(() => {
    return teams.filter((t) => {
      const matchesGroup = selectedGroup === "all" || t.group === selectedGroup;
      const matchesTeam = selectedTeam === "all" || t.teamName === selectedTeam;
      const matchesSearch =
        !searchQuery ||
        t.teamName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        players.some(
          (p) =>
            p.teamName === t.teamName &&
            p.playerName.toLowerCase().includes(searchQuery.toLowerCase())
        );
      return matchesGroup && matchesTeam && matchesSearch;
    });
  }, [teams, players, selectedGroup, selectedTeam, searchQuery]);

  return (
    <div className="space-y-3 animate-fadeIn pb-12">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 px-1">
        <div>
          <h2 className="text-xs font-bold text-text-primary">
            Squad Rosters
          </h2>
          <p className="text-[11px] text-text-tertiary">
            16 registered clubs · Players & positions
          </p>
        </div>

        {/* Group Selector */}
        <div className="flex items-center gap-1 overflow-x-auto scrollbar-none">
          {groups.map((grp) => (
            <button
              key={grp}
              onClick={() => {
                setSelectedGroup(grp);
                setSelectedTeam("all");
              }}
              className={`px-2 py-0.5 rounded-md text-xs font-medium transition-all cursor-pointer whitespace-nowrap ${
                selectedGroup === grp
                  ? "bg-surface-raised text-text-primary font-bold border border-border-subtle shadow-xs"
                  : "text-text-secondary hover:text-text-primary hover:bg-surface-raised/50"
              }`}
            >
              {grp === "all" ? "All" : grp}
            </button>
          ))}
        </div>
      </div>

      {/* Search & Club Select Bar */}
      <div className="flex flex-col sm:flex-row gap-2">
        <div className="relative flex-1">
          <Search
            size={12}
            className="absolute left-2.5 top-1/2 -translate-y-1/2 text-text-tertiary"
          />
          <input
            type="text"
            placeholder="Filter player or club..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full h-8 pl-7 pr-3 rounded-lg bg-surface-card border border-border-subtle text-xs text-text-primary placeholder:text-text-tertiary focus:outline-none focus:border-primary-lime/50 transition-colors"
          />
        </div>

        <select
          value={selectedTeam}
          onChange={(e) => setSelectedTeam(e.target.value)}
          className="h-8 bg-surface-card border border-border-subtle rounded-lg px-2.5 text-xs text-text-primary focus:border-primary-lime cursor-pointer shrink-0"
        >
          <option value="all">All 16 Clubs</option>
          {teams
            .filter((t) => selectedGroup === "all" || t.group === selectedGroup)
            .map((t) => (
              <option key={t.id} value={t.teamName}>
                {t.teamName} ({t.group})
              </option>
            ))}
        </select>
      </div>

      {/* Squad Cards Grid */}
      {filteredTeams.length === 0 ? (
        <div className="bg-surface-card border border-border-subtle rounded-xl p-8 text-center space-y-2">
          <Shield size={28} className="text-text-tertiary mx-auto" />
          <p className="text-xs font-semibold text-text-primary">No clubs found</p>
          <p className="text-[11px] text-text-tertiary">
            Try adjusting your search query or group filter.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {filteredTeams.map((team) => {
            const teamPlayers = players.filter((p) => p.teamName === team.teamName);
            const initials =
              team.badgeInitials || team.teamName.substring(0, 3).toUpperCase();

            return (
              <div
                key={team.id}
                className="bg-surface-card border border-border-subtle rounded-xl p-3.5 shadow-xs flex flex-col justify-between"
              >
                <div>
                  {/* Team Card Header */}
                  <div className="flex items-center justify-between gap-2 pb-2.5 border-b border-border-subtle/50">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-8 h-8 rounded-lg bg-surface-raised border border-border-subtle flex items-center justify-center font-bold text-primary-lime text-xs shrink-0">
                        {initials}
                      </div>
                      <div className="min-w-0">
                        <h3 className="text-xs sm:text-sm font-bold text-text-primary truncate">
                          {team.teamName}
                        </h3>
                        <p className="text-[10px] text-text-tertiary">
                          {team.group} • {teamPlayers.length || "11"} Registered
                        </p>
                      </div>
                    </div>

                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-surface-raised border border-border-subtle text-text-secondary shrink-0">
                      {team.group}
                    </span>
                  </div>

                  {/* Manager line if available */}
                  {team.managerName && (
                    <div className="mt-2 text-[10px] text-text-secondary bg-surface-raised/60 px-2 py-1 rounded border border-border-subtle/40 flex items-center gap-1.5">
                      <span className="text-text-tertiary">Head Coach / Manager:</span>
                      <strong className="text-text-primary">{team.managerName}</strong>
                    </div>
                  )}

                  {/* Player list */}
                  <div className="mt-2.5 space-y-1 max-h-[180px] overflow-y-auto pr-1">
                    {teamPlayers.length === 0 ? (
                      <p className="text-[11px] text-text-tertiary italic text-center py-3">
                        Squad roster being finalized.
                      </p>
                    ) : (
                      teamPlayers.map((p) => (
                        <div
                          key={p.id}
                          className="flex items-center justify-between gap-2 p-1.5 rounded-lg bg-surface-raised/40 hover:bg-surface-raised border border-border-subtle/40 transition-colors"
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <span className="w-5 text-center font-mono text-[10px] font-bold text-text-tertiary shrink-0">
                              {p.jerseyNumber ? `#${p.jerseyNumber}` : "-"}
                            </span>
                            <span className="text-xs font-semibold text-text-primary truncate">
                              {p.playerName}
                            </span>
                          </div>

                          <div className="flex items-center gap-1 shrink-0">
                            {p.captain && (
                              <span className="px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 text-[9px] font-bold flex items-center gap-0.5">
                                <Award size={9} /> C
                              </span>
                            )}
                            <span className="text-[9px] text-text-tertiary">
                              {p.position || "Player"}
                            </span>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
