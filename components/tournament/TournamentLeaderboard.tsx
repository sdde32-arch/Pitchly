import React, { useState, useEffect, useMemo } from "react";
import {
  Trophy,
  Shield,
  Search,
  RefreshCw,
  TrendingUp,
  Award,
  Zap,
  Target,
  ChevronDown,
  ChevronUp,
  ChevronRight,
  Flame,
  CheckCircle2,
  Clock,
  ExternalLink,
  Layers,
  ArrowUpDown,
  SlidersHorizontal,
  Info,
} from "lucide-react";
import {
  TournamentTeamStanding,
  TournamentFixture,
  DEFAULT_TOURNAMENT,
} from "../../types/tournament";
import {
  tournamentService,
  normalizeTournamentTeam,
  sortStandingsByPointsGdWins,
} from "../../services/tournamentService";

interface TournamentLeaderboardProps {
  tournamentId?: string;
  fixtures?: TournamentFixture[];
  onSelectTeam?: (teamName: string) => void;
  onNavigateToFixtures?: () => void;
}

type SortField = "points" | "goalDifference" | "won" | "goalsFor" | "goalsAgainst" | "played" | "winRate";
type SortDirection = "asc" | "desc";

// Official 16 Teams Theme & Crest Badges
const CLUB_CREST_MAP: Record<
  string,
  { bg: string; text: string; border: string; initials: string; accent: string }
> = {
  // Group A
  "WEHAT SELECT": { bg: "bg-indigo-600/15", text: "text-indigo-400", border: "border-indigo-500/30", initials: "WS", accent: "#6366f1" },
  "BUSABALA UNITED FC": { bg: "bg-sky-600/15", text: "text-sky-400", border: "border-sky-500/30", initials: "BUF", accent: "#0284c7" },
  "BROTHER LOVE FC": { bg: "bg-pink-600/15", text: "text-pink-400", border: "border-pink-500/30", initials: "BLF", accent: "#ec4899" },
  "KIRUDDU HOSP FC": { bg: "bg-fuchsia-600/15", text: "text-fuchsia-400", border: "border-fuchsia-500/30", initials: "KHF", accent: "#d946ef" },

  // Group B
  "BUNGA FC": { bg: "bg-emerald-600/15", text: "text-emerald-400", border: "border-emerald-500/30", initials: "BFC", accent: "#10b981" },
  "LEGENDS FC": { bg: "bg-yellow-500/15", text: "text-yellow-400", border: "border-yellow-500/30", initials: "LFC", accent: "#eab308" },
  "PRO PERFORMERS FC": { bg: "bg-purple-600/15", text: "text-purple-400", border: "border-purple-500/30", initials: "PPF", accent: "#a855f7" },
  "SENIOR PLAYERS": { bg: "bg-orange-600/15", text: "text-orange-400", border: "border-orange-500/30", initials: "SPF", accent: "#f97316" },

  // Group C
  "WEHAT FC": { bg: "bg-blue-600/15", text: "text-blue-400", border: "border-blue-500/30", initials: "WFC", accent: "#3b82f6" },
  "IMDAD FC": { bg: "bg-cyan-600/15", text: "text-cyan-400", border: "border-cyan-500/30", initials: "IFC", accent: "#06b6d4" },
  "GOOD FRIENDS": { bg: "bg-teal-500/15", text: "text-teal-300", border: "border-teal-500/30", initials: "GF", accent: "#14b8a6" },
  "DODGE AMO FC": { bg: "bg-red-600/15", text: "text-red-400", border: "border-red-500/30", initials: "DAF", accent: "#ef4444" },

  // Group D
  "INVESTORS FC": { bg: "bg-rose-600/15", text: "text-rose-400", border: "border-rose-500/30", initials: "IFC", accent: "#f43f5e" },
  "PURE HEARTS FC": { bg: "bg-lime-500/15", text: "text-lime-400", border: "border-lime-500/30", initials: "PHF", accent: "#84cc16" },
  "GENTLE STAR FC": { bg: "bg-amber-600/15", text: "text-amber-400", border: "border-amber-500/30", initials: "GSF", accent: "#f59e0b" },
  "HMK": { bg: "bg-violet-600/15", text: "text-violet-400", border: "border-violet-500/30", initials: "HMK", accent: "#8b5cf6" },
};

function getClubBadge(teamName: string) {
  const norm = normalizeTournamentTeam(teamName);
  return (
    CLUB_CREST_MAP[norm] || {
      bg: "bg-surface-raised",
      text: "text-primary-lime",
      border: "border-border-subtle",
      initials: norm.substring(0, 3).toUpperCase(),
      accent: "#ccff00",
    }
  );
}

export const TournamentLeaderboard: React.FC<TournamentLeaderboardProps> = ({
  tournamentId = DEFAULT_TOURNAMENT.id,
  fixtures: propFixtures,
  onSelectTeam,
  onNavigateToFixtures,
}) => {
  const [standings, setStandings] = useState<TournamentTeamStanding[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [syncing, setSyncing] = useState<boolean>(false);
  const [lastSyncTime, setLastSyncTime] = useState<Date>(new Date());
  const [feedbackMsg, setFeedbackMsg] = useState<string | null>(null);

  // Filters & Sorting state
  const [groupFilter, setGroupFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [sortField, setSortField] = useState<SortField>("points");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");

  // Selected Team Modal / Detail Sheet
  const [selectedTeam, setSelectedTeam] = useState<TournamentTeamStanding | null>(null);

  // Live Subscription to Firestore tournamentStandings collection
  useEffect(() => {
    setLoading(true);
    const unsub = tournamentService.subscribeToLeaderboard(
      tournamentId,
      (latest) => {
        setStandings(latest);
        setLoading(false);
        setLastSyncTime(new Date());
      },
      (err) => {
        console.warn("Leaderboard subscription notice:", err);
        setLoading(false);
      }
    );

    return () => unsub();
  }, [tournamentId]);

  // Manual Trigger to re-aggregate from fixtures and sync directly to Firestore
  const handleManualSync = async () => {
    try {
      setSyncing(true);
      const updated = await tournamentService.syncStandingsToFirestore(tournamentId);
      setStandings(updated);
      setLastSyncTime(new Date());
      setFeedbackMsg("Dynamic Firestore Standings Aggregated & Synced!");
      setTimeout(() => setFeedbackMsg(null), 3000);
    } catch (e) {
      console.error("Sync error:", e);
      setFeedbackMsg("Sync completed with local state.");
      setTimeout(() => setFeedbackMsg(null), 2500);
    } finally {
      setSyncing(false);
    }
  };

  // Dynamic sorting handler
  const handleSortToggle = (field: SortField) => {
    if (sortField === field) {
      setSortDirection((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortDirection("desc");
    }
  };

  // Reset to strict official tournament criteria: Points -> GD -> Wins
  const handleResetToOfficialRules = () => {
    setSortField("points");
    setSortDirection("desc");
    setGroupFilter("all");
    setSearchQuery("");
  };

  // Filter and Sort Standings Dynamically
  const processedStandings = useMemo(() => {
    let list = [...standings];

    // Filter by Group
    if (groupFilter !== "all") {
      list = list.filter((s) => s.group === groupFilter);
    }

    // Filter by Search Query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(
        (s) =>
          s.team.toLowerCase().includes(q) ||
          (s.group && s.group.toLowerCase().includes(q))
      );
    }

    // If sorting by default "points", apply the strict triple-rule:
    // 1. Points -> 2. Goal Difference -> 3. Wins
    if (sortField === "points" && sortDirection === "desc") {
      return sortStandingsByPointsGdWins(list);
    }

    // Otherwise apply interactive custom sort field
    list.sort((a, b) => {
      let valA: number = 0;
      let valB: number = 0;

      switch (sortField) {
        case "points":
          valA = a.points;
          valB = b.points;
          break;
        case "goalDifference":
          valA = a.goalDifference;
          valB = b.goalDifference;
          break;
        case "won":
          valA = a.won;
          valB = b.won;
          break;
        case "goalsFor":
          valA = a.goalsFor;
          valB = b.goalsFor;
          break;
        case "goalsAgainst":
          valA = a.goalsAgainst;
          valB = b.goalsAgainst;
          break;
        case "played":
          valA = a.played;
          valB = b.played;
          break;
        case "winRate":
          valA = a.winRate || 0;
          valB = b.winRate || 0;
          break;
        default:
          valA = a.points;
          valB = b.points;
      }

      if (valA !== valB) {
        return sortDirection === "desc" ? valB - valA : valA - valB;
      }

      // Tiebreaker: Goal Difference, then Wins, then Name
      if (b.goalDifference !== a.goalDifference) {
        return b.goalDifference - a.goalDifference;
      }
      if (b.won !== a.won) {
        return b.won - a.won;
      }
      return a.team.localeCompare(b.team);
    });

    return list.map((item, idx) => ({
      ...item,
      position: idx + 1,
    }));
  }, [standings, groupFilter, searchQuery, sortField, sortDirection]);

  // Overall Tournament Metrics
  const statsOverview = useMemo(() => {
    if (standings.length === 0) {
      return {
        leader: null,
        bestAttack: null,
        bestDefense: null,
        highestWinRate: null,
        totalGoals: 0,
      };
    }

    const sortedByOfficial = sortStandingsByPointsGdWins(standings);
    const leader = sortedByOfficial[0];

    const sortedByGF = [...standings].sort((a, b) => b.goalsFor - a.goalsFor);
    const bestAttack = sortedByGF[0];

    const sortedByGA = [...standings]
      .filter((s) => s.played > 0)
      .sort((a, b) => a.goalsAgainst - b.goalsAgainst);
    const bestDefense = sortedByGA[0] || standings[0];

    const sortedByWinRate = [...standings].sort((a, b) => (b.winRate || 0) - (a.winRate || 0));
    const highestWinRate = sortedByWinRate[0];

    const totalGoals = standings.reduce((acc, s) => acc + s.goalsFor, 0);

    return {
      leader,
      bestAttack,
      bestDefense,
      highestWinRate,
      totalGoals,
    };
  }, [standings]);

  // Top 3 Podium (Overall Leaderboard)
  const topThree = useMemo(() => {
    const sorted = sortStandingsByPointsGdWins(standings);
    return {
      gold: sorted[0] || null,
      silver: sorted[1] || null,
      bronze: sorted[2] || null,
    };
  }, [standings]);

  // Related matches for selected team
  const selectedTeamMatches = useMemo(() => {
    if (!selectedTeam || !propFixtures) return [];
    const norm = normalizeTournamentTeam(selectedTeam.team);
    return propFixtures.filter((f) => {
      const h = normalizeTournamentTeam(f.homeTeam);
      const a = normalizeTournamentTeam(f.awayTeam);
      return h === norm || a === norm;
    });
  }, [selectedTeam, propFixtures]);

  return (
    <div className="space-y-3">
      {/* Top compact indicator */}
      <div className="flex flex-wrap items-center justify-between gap-2 px-1">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-text-primary">
            Overall Standings
          </span>
          <span className="text-[11px] text-text-tertiary">
            (16 Clubs • All Groups)
          </span>
        </div>
        <button
          onClick={handleManualSync}
          disabled={syncing}
          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-surface-card hover:bg-surface-raised border border-border-subtle text-text-secondary hover:text-text-primary text-[11px] font-medium transition-all disabled:opacity-50 cursor-pointer"
          title="Recalculate standings"
        >
          <RefreshCw
            size={12}
            className={`text-primary-lime ${syncing ? "animate-spin" : ""}`}
          />
          <span>{syncing ? "Syncing..." : "Sync"}</span>
        </button>
      </div>

      {feedbackMsg && (
        <div className="py-1.5 px-3 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-medium flex items-center gap-2">
          <CheckCircle2 size={13} className="shrink-0" />
          <span>{feedbackMsg}</span>
        </div>
      )}

      {/* Search & Group Filter Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2">
        <div className="flex items-center gap-1 overflow-x-auto scrollbar-none">
          {[
            { id: "all", label: "All" },
            { id: "Group A", label: "Group A" },
            { id: "Group B", label: "Group B" },
            { id: "Group C", label: "Group C" },
            { id: "Group D", label: "Group D" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setGroupFilter(tab.id)}
              className={`px-2 py-0.5 rounded-md text-xs font-medium whitespace-nowrap transition-all cursor-pointer ${
                groupFilter === tab.id
                  ? "bg-surface-raised text-text-primary font-bold border border-border-subtle shadow-xs"
                  : "text-text-secondary hover:text-text-primary hover:bg-surface-raised/50"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="relative min-w-[160px]">
          <Search
            size={12}
            className="absolute left-2.5 top-1/2 -translate-y-1/2 text-text-tertiary"
          />
          <input
            type="text"
            placeholder="Filter club..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-7 pr-3 py-1 text-xs rounded-lg bg-surface-card border border-border-subtle text-text-primary placeholder:text-text-tertiary focus:outline-none focus:border-primary-lime transition-all"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-text-tertiary hover:text-text-primary"
            >
              ×
            </button>
          )}
        </div>
      </div>

      {/* 5. MAIN LEADERBOARD TABLE */}
      <div className="bg-surface-card border border-border-subtle rounded-xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-surface-raised/50 border-b border-border-subtle/50 text-[10px] font-bold uppercase tracking-wider text-text-tertiary select-none">
                <th className="py-2.5 pl-3 pr-1 text-center w-8">#</th>
                <th className="py-2.5 px-2">Club</th>
                <th className="py-2.5 px-1.5 text-center w-16">Group</th>
                <th
                  onClick={() => handleSortToggle("played")}
                  className="py-2.5 px-1 text-center w-8 cursor-pointer hover:text-text-primary"
                  title="Played"
                >
                  P
                </th>
                <th
                  onClick={() => handleSortToggle("won")}
                  className="py-2.5 px-1 text-center w-8 cursor-pointer hover:text-emerald-400 hidden sm:table-cell"
                  title="Won"
                >
                  W
                </th>
                <th className="py-2.5 px-1 text-center w-8 hidden sm:table-cell" title="Drawn">
                  D
                </th>
                <th className="py-2.5 px-1 text-center w-8 hidden sm:table-cell" title="Lost">
                  L
                </th>
                <th
                  onClick={() => handleSortToggle("goalDifference")}
                  className="py-2.5 px-1.5 text-center w-10 cursor-pointer hover:text-text-primary"
                  title="Goal Difference"
                >
                  GD
                </th>
                <th
                  onClick={() => handleSortToggle("points")}
                  className="py-2.5 pr-3 pl-1.5 text-center w-10 cursor-pointer hover:text-primary-lime font-bold text-text-primary"
                  title="Points"
                >
                  Pts
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-border-subtle/30">
              {loading ? (
                <tr>
                  <td colSpan={9} className="py-8 text-center">
                    <div className="inline-flex items-center gap-2 text-xs text-text-tertiary">
                      <RefreshCw size={13} className="animate-spin text-primary-lime" />
                      Loading standings...
                    </div>
                  </td>
                </tr>
              ) : processedStandings.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-8 text-center text-xs text-text-tertiary">
                    No teams matched your filter.
                  </td>
                </tr>
              ) : (
                processedStandings.map((s, idx) => {
                  const badge = getClubBadge(s.team);
                  const isTopTwo = idx < 2;

                  return (
                    <tr
                      key={s.team}
                      onClick={() => setSelectedTeam(s)}
                      className="hover:bg-surface-raised/40 transition-colors group cursor-pointer"
                    >
                      {/* Rank Position */}
                      <td className="py-2.5 pl-3 pr-1 text-center font-semibold text-xs">
                        <span className={isTopTwo ? "text-primary-lime font-bold" : "text-text-tertiary"}>
                          {idx + 1}
                        </span>
                      </td>

                      {/* Club Name */}
                      <td className="py-2.5 px-2 min-w-0">
                        <div className="flex items-center gap-2 min-w-0">
                          <div
                            className={`w-5 h-5 rounded flex items-center justify-center text-[8px] font-bold shrink-0 border ${badge.bg} ${badge.text} ${badge.border}`}
                          >
                            {badge.initials}
                          </div>
                          <span className="font-semibold text-text-primary text-xs truncate">
                            {s.team}
                          </span>
                        </div>
                      </td>

                      {/* Group */}
                      <td className="py-2.5 px-1.5 text-center">
                        <span className="text-[10px] font-medium text-text-tertiary px-1.5 py-0.5 rounded bg-surface-raised">
                          {s.group || "—"}
                        </span>
                      </td>

                      {/* Played */}
                      <td className="py-2.5 px-1 text-center text-text-secondary text-xs">
                        {s.played}
                      </td>

                      {/* Won, Drawn, Lost */}
                      <td className="py-2.5 px-1 text-center text-emerald-400 text-xs hidden sm:table-cell">
                        {s.won}
                      </td>
                      <td className="py-2.5 px-1 text-center text-amber-400 text-xs hidden sm:table-cell">
                        {s.drawn}
                      </td>
                      <td className="py-2.5 px-1 text-center text-rose-400 text-xs hidden sm:table-cell">
                        {s.lost}
                      </td>

                      {/* GD */}
                      <td
                        className={`py-2.5 px-1.5 text-center text-xs font-medium font-mono ${
                          s.goalDifference > 0
                            ? "text-emerald-400 font-bold"
                            : s.goalDifference < 0
                            ? "text-rose-400 font-bold"
                            : "text-text-secondary"
                        }`}
                      >
                        {s.goalDifference > 0 ? `+${s.goalDifference}` : s.goalDifference}
                      </td>

                      {/* Points */}
                      <td className="py-2.5 pr-3 pl-1.5 text-center">
                        <span className="font-bold text-xs text-text-primary px-1.5 py-0.5 rounded bg-surface-raised border border-border-subtle inline-block min-w-[24px]">
                          {s.points}
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 6. TEAM PERFORMANCE BREAKDOWN MODAL */}
      {selectedTeam && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div
            className="bg-surface-card border border-border-subtle rounded-2xl max-w-lg w-full p-5 sm:p-6 shadow-2xl relative max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close Button */}
            <button
              onClick={() => setSelectedTeam(null)}
              className="absolute top-4 right-4 text-text-tertiary hover:text-text-primary text-xl font-bold cursor-pointer w-8 h-8 rounded-full bg-surface-raised flex items-center justify-center transition-colors"
            >
              ✕
            </button>

            {/* Club Header */}
            <div className="flex items-center gap-3.5 mb-5">
              <div
                className={`w-14 h-14 rounded-2xl flex items-center justify-center text-lg font-black shrink-0 border ${
                  getClubBadge(selectedTeam.team).bg
                } ${getClubBadge(selectedTeam.team).text} ${
                  getClubBadge(selectedTeam.team).border
                }`}
              >
                {getClubBadge(selectedTeam.team).initials}
              </div>
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider text-primary-lime">
                  {selectedTeam.group} • Rank #{selectedTeam.position}
                </span>
                <h3 className="text-xl font-black text-text-primary">
                  {selectedTeam.team}
                </h3>
                <span className="text-xs text-text-tertiary">
                  WEHAT Soccer Tournament • Season 2
                </span>
              </div>
            </div>

            {/* Core Stats Grid */}
            <div className="grid grid-cols-4 gap-2 mb-5">
              <div className="bg-surface-raised p-2.5 rounded-xl text-center border border-border-subtle">
                <span className="text-[10px] font-bold text-text-tertiary uppercase block">
                  Points
                </span>
                <span className="text-lg font-black text-primary-lime font-display">
                  {selectedTeam.points}
                </span>
              </div>
              <div className="bg-surface-raised p-2.5 rounded-xl text-center border border-border-subtle">
                <span className="text-[10px] font-bold text-text-tertiary uppercase block">
                  Goal Diff
                </span>
                <span className="text-base font-black text-text-primary font-mono">
                  {selectedTeam.goalDifference > 0
                    ? `+${selectedTeam.goalDifference}`
                    : selectedTeam.goalDifference}
                </span>
              </div>
              <div className="bg-surface-raised p-2.5 rounded-xl text-center border border-border-subtle">
                <span className="text-[10px] font-bold text-text-tertiary uppercase block">
                  Wins
                </span>
                <span className="text-base font-black text-emerald-400 font-mono">
                  {selectedTeam.won}
                </span>
              </div>
              <div className="bg-surface-raised p-2.5 rounded-xl text-center border border-border-subtle">
                <span className="text-[10px] font-bold text-text-tertiary uppercase block">
                  Win %
                </span>
                <span className="text-base font-black text-purple-400 font-mono">
                  {selectedTeam.winRate || 0}%
                </span>
              </div>
            </div>

            {/* Detailed Record */}
            <div className="bg-surface-raised/50 rounded-xl p-3.5 border border-border-subtle mb-5 space-y-2 text-xs">
              <div className="flex justify-between items-center py-1 border-b border-border-subtle/50">
                <span className="text-text-tertiary">Matches Played (MP)</span>
                <span className="font-bold text-text-primary">{selectedTeam.played}</span>
              </div>
              <div className="flex justify-between items-center py-1 border-b border-border-subtle/50">
                <span className="text-text-tertiary">Goals For (Scored)</span>
                <span className="font-bold text-emerald-400">{selectedTeam.goalsFor}</span>
              </div>
              <div className="flex justify-between items-center py-1 border-b border-border-subtle/50">
                <span className="text-text-tertiary">Goals Against (Conceded)</span>
                <span className="font-bold text-rose-400">{selectedTeam.goalsAgainst}</span>
              </div>
              <div className="flex justify-between items-center py-1">
                <span className="text-text-tertiary">Record (W - D - L)</span>
                <span className="font-bold text-text-primary">
                  {selectedTeam.won} Wins • {selectedTeam.drawn} Draws • {selectedTeam.lost} Losses
                </span>
              </div>
            </div>

            {/* Recent Match Performances */}
            {selectedTeamMatches.length > 0 && (
              <div className="mb-5">
                <h4 className="text-xs font-bold uppercase tracking-wider text-text-secondary mb-2 flex items-center gap-1.5">
                  <Clock size={13} className="text-primary-lime" />
                  Tournament Matches
                </h4>
                <div className="space-y-2">
                  {selectedTeamMatches.map((m) => {
                    const isHome =
                      normalizeTournamentTeam(m.homeTeam) ===
                      normalizeTournamentTeam(selectedTeam.team);
                    return (
                      <div
                        key={m.id}
                        className="bg-surface-raised p-2.5 rounded-xl border border-border-subtle flex items-center justify-between text-xs"
                      >
                        <div>
                          <div className="font-bold text-text-primary">
                            {m.homeTeam} vs {m.awayTeam}
                          </div>
                          <span className="text-[10px] text-text-tertiary">
                            {m.round || m.group} • {m.time}
                          </span>
                        </div>
                        <div className="text-right">
                          {m.status === "finished" ? (
                            <span className="font-black text-text-primary text-sm font-mono px-2 py-0.5 rounded bg-surface-card border border-border-subtle">
                              {m.homeScore} - {m.awayScore}
                            </span>
                          ) : (
                            <span className="text-[11px] font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                              Upcoming
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Action buttons */}
            <div className="flex items-center gap-2 pt-2 border-t border-border-subtle">
              {onNavigateToFixtures && (
                <button
                  onClick={() => {
                    setSelectedTeam(null);
                    onNavigateToFixtures();
                  }}
                  className="flex-1 py-2 px-3 rounded-xl bg-primary-lime text-black font-black text-xs hover:bg-primary-lime/90 transition-all text-center cursor-pointer"
                >
                  View All Matchday Fixtures
                </button>
              )}
              <button
                onClick={() => setSelectedTeam(null)}
                className="py-2 px-4 rounded-xl bg-surface-raised hover:bg-surface-raised/80 text-text-secondary font-bold text-xs transition-colors cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
