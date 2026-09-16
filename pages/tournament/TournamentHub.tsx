import React, { useState, useEffect, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Trophy,
  Flame,
  Calendar,
  MapPin,
  Clock,
  Share2,
  Check,
  Radio,
  ChevronLeft,
  QrCode,
  X,
  Copy,
  ExternalLink,
  List,
  LayoutGrid,
  Users,
} from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { tournamentService } from "../../services/tournamentService";
import {
  TournamentFixture,
  TournamentScorer,
  TournamentTeamStanding,
  TournamentTeam,
  TournamentPlayer,
  DEFAULT_TOURNAMENT,
  FixtureStatus,
} from "../../types/tournament";
import { Logo } from "../../components/Logo";
import { TournamentSquads } from "../../components/tournament/TournamentSquads";

type ActiveTab = "stands" | "fixtures" | "scorers" | "rosters";
type FixtureFilter = "all" | "live" | "upcoming" | "finished";
type GroupFilter = "all-groups" | "Group A" | "Group B" | "Group C" | "Group D";

const GROUPS = ["Group A", "Group B", "Group C", "Group D"] as const;

// Visual Theme & Color Palette for the 4 Tournament Groups
export const GROUP_THEMES: Record<
  string,
  {
    name: string;
    letter: string;
    borderTop: string;
    borderLeft: string;
    cardBorder: string;
    headerBg: string;
    cardGlow: string;
    pillBg: string;
    pillText: string;
    pillBorder: string;
    qualifierBar: string;
    posText: string;
    badgeStyle: string;
    dotColor: string;
    filterActive: string;
  }
> = {
  "Group A": {
    name: "Group A",
    letter: "A",
    borderTop: "border-t-blue-500",
    borderLeft: "border-l-blue-500",
    cardBorder: "border-blue-500/30",
    headerBg: "bg-blue-950/30",
    cardGlow: "bg-blue-500/10",
    pillBg: "bg-blue-500/15",
    pillText: "text-blue-400",
    pillBorder: "border-blue-500/30",
    qualifierBar: "bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.6)]",
    posText: "text-blue-400 font-black",
    badgeStyle: "bg-gradient-to-br from-blue-500 to-indigo-600 text-white shadow-xs shadow-blue-500/30",
    dotColor: "bg-blue-500",
    filterActive: "bg-blue-500 text-white shadow-xs shadow-blue-500/30",
  },
  "Group B": {
    name: "Group B",
    letter: "B",
    borderTop: "border-t-emerald-500",
    borderLeft: "border-l-emerald-500",
    cardBorder: "border-emerald-500/30",
    headerBg: "bg-emerald-950/30",
    cardGlow: "bg-emerald-500/10",
    pillBg: "bg-emerald-500/15",
    pillText: "text-emerald-400",
    pillBorder: "border-emerald-500/30",
    qualifierBar: "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.6)]",
    posText: "text-emerald-400 font-black",
    badgeStyle: "bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-xs shadow-emerald-500/30",
    dotColor: "bg-emerald-500",
    filterActive: "bg-emerald-500 text-white shadow-xs shadow-emerald-500/30",
  },
  "Group C": {
    name: "Group C",
    letter: "C",
    borderTop: "border-t-purple-500",
    borderLeft: "border-l-purple-500",
    cardBorder: "border-purple-500/30",
    headerBg: "bg-purple-950/30",
    cardGlow: "bg-purple-500/10",
    pillBg: "bg-purple-500/15",
    pillText: "text-purple-400",
    pillBorder: "border-purple-500/30",
    qualifierBar: "bg-purple-500 shadow-[0_0_8px_rgba(168,85,247,0.6)]",
    posText: "text-purple-400 font-black",
    badgeStyle: "bg-gradient-to-br from-purple-500 to-pink-600 text-white shadow-xs shadow-purple-500/30",
    dotColor: "bg-purple-500",
    filterActive: "bg-purple-500 text-white shadow-xs shadow-purple-500/30",
  },
  "Group D": {
    name: "Group D",
    letter: "D",
    borderTop: "border-t-amber-500",
    borderLeft: "border-l-amber-500",
    cardBorder: "border-amber-500/30",
    headerBg: "bg-amber-950/30",
    cardGlow: "bg-amber-500/10",
    pillBg: "bg-amber-500/15",
    pillText: "text-amber-400",
    pillBorder: "border-amber-500/30",
    qualifierBar: "bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.6)]",
    posText: "text-amber-400 font-black",
    badgeStyle: "bg-gradient-to-br from-amber-500 to-orange-600 text-white shadow-xs shadow-amber-500/30",
    dotColor: "bg-amber-500",
    filterActive: "bg-amber-500 text-black shadow-xs shadow-amber-500/30 font-black",
  },
};

const defaultGroupTheme = {
  name: "Group",
  letter: "•",
  borderTop: "border-t-primary-lime",
  borderLeft: "border-l-primary-lime",
  cardBorder: "border-border-subtle",
  headerBg: "bg-surface-raised/70",
  cardGlow: "bg-primary-lime/5",
  pillBg: "bg-primary-lime/15",
  pillText: "text-primary-lime",
  pillBorder: "border-primary-lime/30",
  qualifierBar: "bg-primary-lime",
  posText: "text-primary-lime font-black",
  badgeStyle: "bg-primary-lime text-black font-black",
  dotColor: "bg-primary-lime",
  filterActive: "bg-primary-lime text-black font-black",
};

export const getGroupTheme = (grp?: string) => {
  if (!grp) return defaultGroupTheme;
  const match = grp.match(/Group [A-D]/i)?.[0];
  if (match && GROUP_THEMES[match]) return GROUP_THEMES[match];
  return GROUP_THEMES[grp] || defaultGroupTheme;
};

// Official 16 Teams across the 4 Groups
export const OFFICIAL_WEHAT_TEAMS: { name: string; group: "Group A" | "Group B" | "Group C" | "Group D" }[] = [
  // Group A
  { name: "WEHAT FC", group: "Group A" },
  { name: "DODGE AMO FC", group: "Group A" },
  { name: "GENTLE FC", group: "Group A" },
  { name: "INVESTORS FC", group: "Group A" },

  // Group B
  { name: "BUNGA FC", group: "Group B" },
  { name: "PRO PERFORMERS FC", group: "Group B" },
  { name: "LEGENDS FC", group: "Group B" },
  { name: "SENIOR PLAYERS", group: "Group B" },

  // Group C
  { name: "KIRUDDU FC", group: "Group C" },
  { name: "BUSABALA FC", group: "Group C" },
  { name: "WEHAT SELECT", group: "Group C" },
  { name: "BROTHER LOVE FC", group: "Group C" },

  // Group D
  { name: "PURE HEARTS", group: "Group D" },
  { name: "HMK", group: "Group D" },
  { name: "GOOD FRIENDS", group: "Group D" },
  { name: "IMDAD FC", group: "Group D" },
];

// Team Monogram & Color helper
const getTeamBadge = (name: string) => {
  const initials = name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .substring(0, 3)
    .toUpperCase();

  const colorMap: Record<string, { bg: string; text: string; border: string }> = {
    // Group A
    "WEHAT FC": { bg: "bg-blue-600/15", text: "text-blue-400", border: "border-blue-500/30" },
    "DODGE AMO FC": { bg: "bg-red-600/15", text: "text-red-400", border: "border-red-500/30" },
    "GENTLE FC": { bg: "bg-amber-600/15", text: "text-amber-400", border: "border-amber-500/30" },
    "INVESTORS FC": { bg: "bg-rose-600/15", text: "text-rose-400", border: "border-rose-500/30" },

    // Group B
    "BUNGA FC": { bg: "bg-emerald-600/15", text: "text-emerald-400", border: "border-emerald-500/30" },
    "PRO PERFORMERS FC": { bg: "bg-purple-600/15", text: "text-purple-400", border: "border-purple-500/30" },
    "LEGENDS FC": { bg: "bg-yellow-500/15", text: "text-yellow-400", border: "border-yellow-500/30" },
    "SENIOR PLAYERS": { bg: "bg-orange-600/15", text: "text-orange-400", border: "border-orange-500/30" },

    // Group C
    "KIRUDDU FC": { bg: "bg-fuchsia-600/15", text: "text-fuchsia-400", border: "border-fuchsia-500/30" },
    "BUSABALA FC": { bg: "bg-sky-600/15", text: "text-sky-400", border: "border-sky-500/30" },
    "WEHAT SELECT": { bg: "bg-indigo-600/15", text: "text-indigo-400", border: "border-indigo-500/30" },
    "BROTHER LOVE FC": { bg: "bg-pink-600/15", text: "text-pink-400", border: "border-pink-500/30" },

    // Group D
    "PURE HEARTS": { bg: "bg-lime-500/15", text: "text-lime-400", border: "border-lime-500/30" },
    "HMK": { bg: "bg-violet-600/15", text: "text-violet-400", border: "border-violet-500/30" },
    "GOOD FRIENDS": { bg: "bg-teal-500/15", text: "text-teal-300", border: "border-teal-500/30" },
    "IMDAD FC": { bg: "bg-cyan-600/15", text: "text-cyan-400", border: "border-cyan-500/30" },
  };

  const style = colorMap[name] || {
    bg: "bg-surface-raised",
    text: "text-primary-lime",
    border: "border-border-subtle",
  };

  return { initials, ...style };
};

// Compute League & Group Standings dynamically from match fixtures
function computeStandings(fixtures: TournamentFixture[]): TournamentTeamStanding[] {
  const teamsMap = new Map<string, TournamentTeamStanding>();

  const teamGroupMap = new Map<string, string>();
  OFFICIAL_WEHAT_TEAMS.forEach((t) => teamGroupMap.set(t.name, t.group));

  // Initialize all 16 teams
  OFFICIAL_WEHAT_TEAMS.forEach(({ name, group }) => {
    teamsMap.set(name, {
      position: 1,
      team: name,
      group,
      played: 0,
      won: 0,
      drawn: 0,
      lost: 0,
      goalsFor: 0,
      goalsAgainst: 0,
      goalDifference: 0,
      points: 0,
      form: [],
    });
  });

  // Capture any teams from fixtures not already in default
  fixtures.forEach((f) => {
    const fGroup = f.group || (f.round?.match(/Group [A-D]/i)?.[0]);

    if (f.homeTeam && !teamsMap.has(f.homeTeam)) {
      teamsMap.set(f.homeTeam, {
        position: 1,
        team: f.homeTeam,
        group: fGroup || teamGroupMap.get(f.homeTeam) || "Group A",
        played: 0,
        won: 0,
        drawn: 0,
        lost: 0,
        goalsFor: 0,
        goalsAgainst: 0,
        goalDifference: 0,
        points: 0,
        form: [],
      });
    } else if (f.homeTeam && fGroup && !teamsMap.get(f.homeTeam)?.group) {
      teamsMap.get(f.homeTeam)!.group = fGroup;
    }

    if (f.awayTeam && !teamsMap.has(f.awayTeam)) {
      teamsMap.set(f.awayTeam, {
        position: 1,
        team: f.awayTeam,
        group: fGroup || teamGroupMap.get(f.awayTeam) || "Group A",
        played: 0,
        won: 0,
        drawn: 0,
        lost: 0,
        goalsFor: 0,
        goalsAgainst: 0,
        goalDifference: 0,
        points: 0,
        form: [],
      });
    } else if (f.awayTeam && fGroup && !teamsMap.get(f.awayTeam)?.group) {
      teamsMap.get(f.awayTeam)!.group = fGroup;
    }
  });

  // Calculate match outcomes
  fixtures.forEach((f) => {
    if (
      (f.status === "finished" || f.status === "live") &&
      f.homeScore !== null &&
      f.awayScore !== null
    ) {
      const home = teamsMap.get(f.homeTeam);
      const away = teamsMap.get(f.awayTeam);
      if (home && away) {
        home.played += 1;
        away.played += 1;
        home.goalsFor += f.homeScore;
        home.goalsAgainst += f.awayScore;
        away.goalsFor += f.awayScore;
        away.goalsAgainst += f.homeScore;

        if (f.homeScore > f.awayScore) {
          home.won += 1;
          home.points += 3;
          home.form.unshift("W");
          away.lost += 1;
          away.form.unshift("L");
        } else if (f.homeScore < f.awayScore) {
          away.won += 1;
          away.points += 3;
          away.form.unshift("W");
          home.lost += 1;
          home.form.unshift("L");
        } else {
          home.drawn += 1;
          home.points += 1;
          home.form.unshift("D");
          away.drawn += 1;
          away.points += 1;
          away.form.unshift("D");
        }
      }
    }
  });

  const standings = Array.from(teamsMap.values()).map((t) => ({
    ...t,
    goalDifference: t.goalsFor - t.goalsAgainst,
    form: t.form.slice(0, 5),
  }));

  // Sort by Points, then GD, then GF, then Name
  standings.sort((a, b) => {
    if (b.points !== a.points) return b.points - a.points;
    if (b.goalDifference !== a.goalDifference) return b.goalDifference - a.goalDifference;
    if (b.goalsFor !== a.goalsFor) return b.goalsFor - a.goalsFor;
    return a.team.localeCompare(b.team);
  });

  standings.forEach((item, idx) => {
    item.position = idx + 1;
  });

  return standings;
}

export const TournamentHub: React.FC = () => {
  const { tournamentId = DEFAULT_TOURNAMENT.id } = useParams<{ tournamentId: string }>();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState<ActiveTab>("stands");
  const [fixtures, setFixtures] = useState<TournamentFixture[]>([]);
  const [scorers, setScorers] = useState<TournamentScorer[]>([]);
  const [teams, setTeams] = useState<TournamentTeam[]>([]);
  const [players, setPlayers] = useState<TournamentPlayer[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Filters
  const [fixtureFilter, setFixtureFilter] = useState<FixtureFilter>("all");
  const [fixtureGroupFilter, setFixtureGroupFilter] = useState<string>("all");
  const [groupFilter, setGroupFilter] = useState<GroupFilter>("all-groups");
  const [standingsLayout, setStandingsLayout] = useState<"stack" | "grid">("stack");

  // Share Modal
  const [shareModalOpen, setShareModalOpen] = useState<boolean>(false);
  const [copiedLink, setCopiedLink] = useState<boolean>(false);

  const publicUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}/#/tournament/${tournamentId}`
      : `/#/tournament/${tournamentId}`;

  // Subscriptions to live tournament fixtures and scorers
  useEffect(() => {
    setLoading(true);
    let loadedCount = 0;
    const checkLoaded = () => {
      loadedCount++;
      if (loadedCount >= 4) {
        setLoading(false);
      }
    };

    const unsubFixtures = tournamentService.subscribeToFixtures(
      tournamentId,
      (data) => {
        setFixtures(data);
        checkLoaded();
      },
      () => checkLoaded()
    );

    const unsubScorers = tournamentService.subscribeToScorers(
      tournamentId,
      (data) => {
        setScorers(data);
        checkLoaded();
      },
      () => checkLoaded()
    );

    const unsubTeams = tournamentService.subscribeToTeams(
      tournamentId,
      (data) => {
        setTeams(data);
        checkLoaded();
      },
      () => checkLoaded()
    );

    const unsubPlayers = tournamentService.subscribeToPlayers(
      tournamentId,
      (data) => {
        setPlayers(data);
        checkLoaded();
      },
      () => checkLoaded()
    );

    return () => {
      unsubFixtures();
      unsubScorers();
      unsubTeams();
      unsubPlayers();
    };
  }, [tournamentId]);

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: "WEHAT Soccer Tournament",
          text: "Live standings, fixtures, and goal scorers on Pitchly.",
          url: publicUrl,
        });
        return;
      } catch {
        // Fall back to modal
      }
    }
    setShareModalOpen(true);
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(publicUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  // Quick Seed template
  const handleQuickSeed = async () => {
    try {
      setLoading(true);
      await tournamentService.seedWehatTournament(tournamentId);
    } catch (err) {
      console.error("Seed error:", err);
    } finally {
      setLoading(false);
    }
  };

  // Metrics
  const liveCount = useMemo(
    () => fixtures.filter((f) => f.status === "live").length,
    [fixtures]
  );

  const totalGoals = useMemo(() => {
    return fixtures.reduce((acc, f) => {
      const h = f.homeScore || 0;
      const a = f.awayScore || 0;
      return acc + h + a;
    }, 0);
  }, [fixtures]);

  const standings = useMemo(() => computeStandings(fixtures), [fixtures]);

  const filteredStandings = useMemo(() => {
    if (groupFilter === "all-groups") {
      return standings;
    }
    return standings
      .filter((s) => s.group === groupFilter)
      .sort((a, b) => {
        if (b.points !== a.points) return b.points - a.points;
        if (b.goalDifference !== a.goalDifference) return b.goalDifference - a.goalDifference;
        if (b.goalsFor !== a.goalsFor) return b.goalsFor - a.goalsFor;
        return a.team.localeCompare(b.team);
      });
  }, [standings, groupFilter]);

  const filteredFixtures = useMemo(() => {
    let list = fixtures;
    if (fixtureFilter !== "all") {
      list = list.filter((f) => f.status === fixtureFilter);
    }
    if (fixtureGroupFilter !== "all") {
      list = list.filter((f) => f.group === fixtureGroupFilter);
    }
    return list;
  }, [fixtures, fixtureFilter, fixtureGroupFilter]);

  const topLeader = scorers[0];

  const renderGroupCard = (grp: string) => {
    const theme = GROUP_THEMES[grp] || defaultGroupTheme;
    const groupTeams = standings
      .filter((s) => s.group === grp)
      .sort((a, b) => {
        if (b.points !== a.points) return b.points - a.points;
        if (b.goalDifference !== a.goalDifference) return b.goalDifference - a.goalDifference;
        if (b.goalsFor !== a.goalsFor) return b.goalsFor - a.goalsFor;
        return a.team.localeCompare(b.team);
      });

    return (
      <div
        key={grp}
        id={`card-group-${grp.toLowerCase().replace(" ", "-")}`}
        className={`bg-surface-card rounded-2xl border-t-4 ${theme.borderTop} border ${theme.cardBorder} overflow-hidden shadow-sm relative flex flex-col transition-all`}
      >
        {/* Subtle Ambient Glow */}
        <div
          className={`absolute -top-12 -right-12 w-48 h-48 ${theme.cardGlow} rounded-full blur-3xl pointer-events-none`}
        />

        {/* Group Header */}
        <div
          className={`px-4 py-3 ${theme.headerBg} border-b border-border-subtle/80 flex items-center justify-between relative z-10`}
        >
          <div className="flex items-center gap-2.5">
            <div
              className={`w-7 h-7 rounded-lg ${theme.badgeStyle} flex items-center justify-center font-black text-xs shadow-xs`}
            >
              {theme.letter}
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-black text-text-primary uppercase tracking-wider font-display leading-tight">
                {grp}
              </h3>
              <span className="text-[10px] text-text-tertiary font-semibold block">
                4 Clubs • Matchday 1
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span
              className={`text-[10px] font-black px-2.5 py-1 rounded-full ${theme.pillBg} ${theme.pillText} border ${theme.pillBorder} uppercase tracking-wider`}
            >
              Top 2 Advance
            </span>
          </div>
        </div>

        {/* Group Table - Resized so all details show clearly */}
        <div className="overflow-x-auto relative z-10 scrollbar-thin">
          <table className="w-full text-left text-xs border-collapse min-w-[580px] sm:min-w-full">
            <thead>
              <tr className="border-b border-border-subtle/70 bg-surface-raised/50 text-[10px] uppercase font-black text-text-tertiary tracking-wider">
                <th className="py-2.5 pl-4 pr-1 w-9 text-center">#</th>
                <th className="py-2.5 px-3 min-w-[170px]">Club</th>
                <th className="py-2.5 px-2 text-center w-9 font-semibold" title="Matches Played">MP</th>
                <th className="py-2.5 px-2 text-center w-9 font-semibold" title="Won">W</th>
                <th className="py-2.5 px-2 text-center w-9 font-semibold" title="Drawn">D</th>
                <th className="py-2.5 px-2 text-center w-9 font-semibold" title="Lost">L</th>
                <th className="py-2.5 px-2 text-center w-9 font-semibold" title="Goals For">GF</th>
                <th className="py-2.5 px-2 text-center w-9 font-semibold" title="Goals Against">GA</th>
                <th className="py-2.5 px-2 text-center w-11 font-bold" title="Goal Difference">GD</th>
                <th className="py-2.5 px-2 text-center w-12 font-black text-text-primary" title="Points">Pts</th>
                <th className="py-2.5 pr-4 pl-2 text-right w-24 font-semibold">Form</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-subtle/30">
              {groupTeams.map((s, idx) => {
                const isTopTwo = idx < 2;
                const badge = getTeamBadge(s.team);

                return (
                  <tr
                    key={s.team}
                    className={`hover:bg-surface-raised/40 transition-colors group ${
                      isTopTwo ? "bg-surface-card" : ""
                    }`}
                  >
                    {/* Position with Qualifier Color Bar */}
                    <td className="py-3 pl-4 pr-1 text-center font-bold relative">
                      {isTopTwo && (
                        <div
                          className={`absolute left-0 top-1.5 bottom-1.5 w-1 rounded-r ${theme.qualifierBar}`}
                        />
                      )}
                      <span
                        className={`text-xs ${
                          isTopTwo ? theme.posText : "text-text-tertiary"
                        }`}
                      >
                        {idx + 1}
                      </span>
                    </td>

                    {/* Club Name - Full width without truncation */}
                    <td className="py-3 px-3">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div
                          className={`w-6 h-6 rounded-md flex items-center justify-center text-[9px] font-black shrink-0 border ${badge.bg} ${badge.text} ${badge.border}`}
                        >
                          {badge.initials}
                        </div>
                        <span className="font-bold text-text-primary text-xs sm:text-sm leading-tight whitespace-nowrap">
                          {s.team}
                        </span>
                      </div>
                    </td>

                    {/* MP, W, D, L, GF, GA */}
                    <td className="py-3 px-2 text-center text-text-secondary text-xs font-medium">
                      {s.played}
                    </td>
                    <td className="py-3 px-2 text-center text-emerald-400 font-semibold text-xs">
                      {s.won}
                    </td>
                    <td className="py-3 px-2 text-center text-amber-400 font-semibold text-xs">
                      {s.drawn}
                    </td>
                    <td className="py-3 px-2 text-center text-rose-400 font-semibold text-xs">
                      {s.lost}
                    </td>
                    <td className="py-3 px-2 text-center text-text-tertiary text-xs font-mono">
                      {s.goalsFor}
                    </td>
                    <td className="py-3 px-2 text-center text-text-tertiary text-xs font-mono">
                      {s.goalsAgainst}
                    </td>

                    {/* GD */}
                    <td
                      className={`py-3 px-2 text-center font-bold font-mono text-xs ${
                        s.goalDifference > 0
                          ? "text-emerald-400 font-black"
                          : s.goalDifference < 0
                          ? "text-rose-400 font-black"
                          : "text-text-secondary"
                      }`}
                    >
                      {s.goalDifference > 0 ? `+${s.goalDifference}` : s.goalDifference}
                    </td>

                    {/* Points */}
                    <td className="py-3 px-2 text-center">
                      <span className="font-black text-xs sm:text-sm text-text-primary font-display px-2 py-1 rounded-md bg-surface-raised border border-border-subtle/80 shadow-xs inline-block min-w-[28px]">
                        {s.points}
                      </span>
                    </td>

                    {/* Form Dots */}
                    <td className="py-3 pr-4 pl-2 text-right">
                      <div className="flex items-center justify-end gap-1">
                        {s.form.length === 0 ? (
                          <span className="text-[10px] text-text-tertiary font-mono">—</span>
                        ) : (
                          s.form.slice(-3).map((res, i) => (
                            <span
                              key={i}
                              title={res === "W" ? "Win" : res === "D" ? "Draw" : "Loss"}
                              className={`w-4 h-4 rounded-full flex items-center justify-center text-[8px] font-black shadow-xs ${
                                res === "W"
                                  ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/40"
                                  : res === "D"
                                  ? "bg-amber-500/20 text-amber-400 border border-amber-500/40"
                                  : "bg-rose-500/20 text-rose-400 border border-rose-500/40"
                              }`}
                            >
                              {res}
                            </span>
                          ))
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Card Footer Indicator */}
        <div className="px-4 py-2 border-t border-border-subtle/60 bg-surface-raised/20 flex items-center justify-between text-[11px] text-text-secondary relative z-10 mt-auto">
          <div className="flex items-center gap-2">
            <span className={`w-2 h-2 rounded-full ${theme.dotColor}`} />
            <span className="font-medium text-text-secondary">Top 2 advance to Quarter-Finals</span>
          </div>
          <span className="text-text-tertiary font-mono text-[10px]">Matchday 1</span>
        </div>
      </div>
    );
  };

  return (
    <div
      id="tournament-hub-root"
      className="min-h-screen w-full bg-app-base text-text-primary font-body pb-24 selection:bg-primary-lime/30"
    >
      {/* 1. TOP MATCH CENTER BAR */}
      <header className="sticky top-0 z-40 bg-surface-card/95 backdrop-blur-md border-b border-border-subtle px-4 py-2.5">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <button
              onClick={() => navigate("/home")}
              className="w-8 h-8 rounded-lg bg-surface-raised border border-border-subtle flex items-center justify-center text-text-secondary hover:text-text-primary transition-colors cursor-pointer"
              title="Return to Home"
            >
              <ChevronLeft size={16} />
            </button>
            <div
              className="flex items-center gap-2 cursor-pointer"
              onClick={() => navigate("/home")}
            >
              <Logo size={24} showText={true} showTagline={false} variant="auto" />
            </div>
            <span className="hidden sm:inline-block text-[10px] font-extrabold uppercase tracking-widest px-2 py-0.5 rounded-md bg-primary-lime/10 text-primary-lime border border-primary-lime/20">
              Match Center
            </span>
          </div>

          <div className="flex items-center gap-2">
            {liveCount > 0 && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-primary-lime/15 text-primary-lime border border-primary-lime/30">
                <span className="w-2 h-2 rounded-full bg-primary-lime animate-pulse" />
                {liveCount} Live
              </span>
            )}
            <button
              onClick={handleShare}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold text-text-primary bg-surface-raised hover:bg-border-subtle border border-border-subtle transition-all cursor-pointer shadow-xs active:scale-95"
            >
              <Share2 size={13} className="text-text-secondary" />
              <span>Share</span>
            </button>
          </div>
        </div>
      </header>

      {/* 2. ATHLETIC HERO PORTAL - Clean & Colorful without excessive wording */}
      <div className="max-w-7xl mx-auto px-3 sm:px-4 pt-4 pb-2">
        <div className="bg-gradient-to-b from-surface-card to-surface-card/90 border border-border-subtle rounded-2xl relative overflow-hidden shadow-lg">
          {/* Top 4-Group Color Spectrum Bar */}
          <div className="h-1.5 w-full grid grid-cols-4">
            <div className="bg-blue-500" />
            <div className="bg-emerald-500" />
            <div className="bg-purple-500" />
            <div className="bg-amber-500" />
          </div>

          {/* Ambient Athletic Glow */}
          <div className="absolute -top-16 -right-16 w-64 h-64 bg-primary-lime/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-16 -left-16 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 p-4 sm:p-5 space-y-3">
            {/* Chips & Micro Metadata */}
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-1.5">
                <span className="px-2.5 py-0.5 rounded-full bg-primary-lime text-black text-[10px] font-black uppercase tracking-wider shadow-xs">
                  Season 2
                </span>
                <span className="px-2 py-0.5 rounded-full bg-surface-raised text-text-secondary border border-border-subtle text-[10px] font-bold">
                  Matchday 2
                </span>
                <span className="px-2 py-0.5 rounded-full bg-surface-raised/80 text-text-tertiary border border-border-subtle text-[10px] font-medium hidden sm:inline-block">
                  4 Groups • 16 Clubs
                </span>
              </div>

              <div className="flex items-center gap-3 text-xs text-text-secondary font-medium">
                <span className="flex items-center gap-1 text-[11px]">
                  <Calendar size={12} className="text-primary-lime" />
                  19 Sept 2026
                </span>
                <span className="flex items-center gap-1 text-[11px]">
                  <MapPin size={12} className="text-primary-lime" />
                  Tal Olympic Arena
                </span>
              </div>
            </div>

            {/* Title - Clean & Punchy */}
            <div>
              <h1
                id="heading-tournament-hub"
                className="text-xl sm:text-2xl font-black text-text-primary uppercase tracking-tight font-display scroll-mt-24"
              >
                WEHAT Championship
              </h1>
              <p className="text-xs text-text-tertiary mt-0.5 font-medium">
                Official Group Stage & Live Match Center
              </p>
            </div>

            {/* 4 Colored Metric Chips */}
            <div className="grid grid-cols-4 gap-2 pt-2 border-t border-border-subtle/70">
              {/* Clubs (Blue Accent) */}
              <div className="bg-surface-raised/40 hover:bg-surface-raised/70 transition-colors rounded-xl p-2 sm:p-2.5 text-center border border-blue-500/25 relative overflow-hidden group">
                <div className="w-2 h-2 rounded-full bg-blue-500 absolute top-2 right-2 shadow-[0_0_6px_rgba(59,130,246,0.6)]" />
                <span className="text-[10px] font-bold uppercase tracking-wider text-text-tertiary block">
                  Clubs
                </span>
                <span className="text-sm sm:text-lg font-black text-blue-400 font-display">
                  {standings.length}
                </span>
              </div>

              {/* Matches (Purple Accent) */}
              <div className="bg-surface-raised/40 hover:bg-surface-raised/70 transition-colors rounded-xl p-2 sm:p-2.5 text-center border border-purple-500/25 relative overflow-hidden group">
                <div className="w-2 h-2 rounded-full bg-purple-500 absolute top-2 right-2 shadow-[0_0_6px_rgba(168,85,247,0.6)]" />
                <span className="text-[10px] font-bold uppercase tracking-wider text-text-tertiary block">
                  Matches
                </span>
                <span className="text-sm sm:text-lg font-black text-purple-400 font-display">
                  {fixtures.length}
                </span>
              </div>

              {/* Goals (Emerald Accent) */}
              <div className="bg-surface-raised/40 hover:bg-surface-raised/70 transition-colors rounded-xl p-2 sm:p-2.5 text-center border border-emerald-500/25 relative overflow-hidden group">
                <div className="w-2 h-2 rounded-full bg-emerald-500 absolute top-2 right-2 shadow-[0_0_6px_rgba(16,185,129,0.6)]" />
                <span className="text-[10px] font-bold uppercase tracking-wider text-text-tertiary block">
                  Goals
                </span>
                <span className="text-sm sm:text-lg font-black text-emerald-400 font-display">
                  {totalGoals}
                </span>
              </div>

              {/* Top Scorer (Amber Accent) */}
              <div className="bg-surface-raised/40 hover:bg-surface-raised/70 transition-colors rounded-xl p-2 sm:p-2.5 text-center border border-amber-500/25 relative overflow-hidden group truncate">
                <div className="w-2 h-2 rounded-full bg-amber-500 absolute top-2 right-2 shadow-[0_0_6px_rgba(245,158,11,0.6)]" />
                <span className="text-[10px] font-bold uppercase tracking-wider text-text-tertiary block truncate">
                  Top Scorer
                </span>
                <span className="text-xs sm:text-sm font-black text-amber-400 truncate block font-display">
                  {topLeader ? `${topLeader.playerName.split(" ")[0]} (${topLeader.goals})` : "—"}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 3. PRIMARY NAVIGATION TABS */}
      <div className="max-w-7xl mx-auto px-3 sm:px-4 sticky top-[53px] z-30 bg-app-base/95 backdrop-blur-md pt-2 pb-3">
        <div
          id="tournament-tabs-bar"
          className="grid grid-cols-4 gap-1 p-1 bg-surface-card border border-border-subtle rounded-xl shadow-xs overflow-x-auto"
        >
          {/* Tab 1: Stands / Table */}
          <button
            id="tab-standings"
            onClick={() => setActiveTab("stands")}
            className={`flex items-center justify-center gap-1.5 py-2 px-2 rounded-lg text-xs sm:text-sm font-bold transition-all cursor-pointer ${
              activeTab === "stands"
                ? "bg-primary-lime text-black font-black shadow-xs"
                : "text-text-secondary hover:text-text-primary hover:bg-surface-raised"
            }`}
          >
            <Trophy
              size={15}
              className={activeTab === "stands" ? "text-black" : "text-text-secondary"}
            />
            <span className="truncate">Standings</span>
          </button>

          {/* Tab 2: Fixtures */}
          <button
            id="tab-fixtures"
            onClick={() => setActiveTab("fixtures")}
            className={`flex items-center justify-center gap-1.5 py-2 px-2 rounded-lg text-xs sm:text-sm font-bold transition-all cursor-pointer ${
              activeTab === "fixtures"
                ? "bg-primary-lime text-black font-black shadow-xs"
                : "text-text-secondary hover:text-text-primary hover:bg-surface-raised"
            }`}
          >
            <Clock
              size={15}
              className={activeTab === "fixtures" ? "text-black" : "text-text-secondary"}
            />
            <span className="truncate">Fixtures</span>
            {liveCount > 0 && (
              <span
                className={`w-1.5 h-1.5 rounded-full ${
                  activeTab === "fixtures" ? "bg-black" : "bg-primary-lime"
                } animate-pulse shrink-0`}
              />
            )}
          </button>

          {/* Tab 3: Goal Scorers */}
          <button
            id="tab-scorers"
            onClick={() => setActiveTab("scorers")}
            className={`flex items-center justify-center gap-1.5 py-2 px-2 rounded-lg text-xs sm:text-sm font-bold transition-all cursor-pointer ${
              activeTab === "scorers"
                ? "bg-primary-lime text-black font-black shadow-xs"
                : "text-text-secondary hover:text-text-primary hover:bg-surface-raised"
            }`}
          >
            <Flame
              size={15}
              className={activeTab === "scorers" ? "text-black" : "text-text-secondary"}
            />
            <span className="truncate">Scorers</span>
          </button>

          {/* Tab 4: Squads / Rosters */}
          <button
            id="tab-rosters"
            onClick={() => setActiveTab("rosters")}
            className={`flex items-center justify-center gap-1.5 py-2 px-2 rounded-lg text-xs sm:text-sm font-bold transition-all cursor-pointer ${
              activeTab === "rosters"
                ? "bg-primary-lime text-black font-black shadow-xs"
                : "text-text-secondary hover:text-text-primary hover:bg-surface-raised"
            }`}
          >
            <Users
              size={15}
              className={activeTab === "rosters" ? "text-black" : "text-text-secondary"}
            />
            <span className="truncate">Squads</span>
          </button>
        </div>
      </div>

      {/* 4. TAB CONTENTS */}
      <main className="max-w-7xl mx-auto px-3 sm:px-4 pt-1">
        {/* ======================================================== */}
        {/* TAB 1: STANDINGS / TABLE */}
        {/* ======================================================== */}
        {activeTab === "stands" && (
          <div id="panel-standings" className="space-y-4 animate-fadeIn scroll-mt-24">
            {/* Group Tabs & View Toggle */}
            <div className="flex flex-wrap items-center justify-between gap-2 px-1">
              <div className="flex items-center gap-1 sm:gap-1.5 bg-surface-card p-1 rounded-xl border border-border-subtle text-xs overflow-x-auto max-w-full">
                {(
                  [
                    { id: "all-groups", label: "All Groups", dot: "bg-primary-lime" },
                    { id: "Group A", label: "Group A", dot: "bg-blue-500" },
                    { id: "Group B", label: "Group B", dot: "bg-emerald-500" },
                    { id: "Group C", label: "Group C", dot: "bg-purple-500" },
                    { id: "Group D", label: "Group D", dot: "bg-amber-500" },
                  ] as const
                ).map((grp) => {
                  const isSelected = groupFilter === grp.id;
                  const theme = grp.id === "all-groups" ? defaultGroupTheme : GROUP_THEMES[grp.id];

                  return (
                    <button
                      key={grp.id}
                      id={`tab-group-${grp.id.toLowerCase().replace(" ", "-")}`}
                      onClick={() => setGroupFilter(grp.id)}
                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-bold text-xs transition-all cursor-pointer whitespace-nowrap ${
                        isSelected
                          ? grp.id === "all-groups"
                            ? "bg-primary-lime text-black font-black shadow-xs"
                            : theme.filterActive
                          : "text-text-secondary hover:text-text-primary hover:bg-surface-raised"
                      }`}
                    >
                      <span
                        className={`w-2 h-2 rounded-full ${grp.dot} ${
                          isSelected && grp.id === "Group D" ? "ring-1 ring-black" : ""
                        }`}
                      />
                      <span>{grp.label}</span>
                    </button>
                  );
                })}
              </div>

              {/* View Layout Toggle (Stack vs Grid) */}
              {groupFilter === "all-groups" && (
                <div className="hidden sm:flex items-center gap-1 bg-surface-card p-1 rounded-xl border border-border-subtle text-xs">
                  <button
                    type="button"
                    onClick={() => setStandingsLayout("stack")}
                    title="Spacious Full Width View"
                    className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                      standingsLayout === "stack"
                        ? "bg-primary-lime text-black font-bold shadow-xs"
                        : "text-text-secondary hover:text-text-primary"
                    }`}
                  >
                    <List size={15} />
                  </button>
                  <button
                    type="button"
                    onClick={() => setStandingsLayout("grid")}
                    title="2-Column Grid View"
                    className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                      standingsLayout === "grid"
                        ? "bg-primary-lime text-black font-bold shadow-xs"
                        : "text-text-secondary hover:text-text-primary"
                    }`}
                  >
                    <LayoutGrid size={15} />
                  </button>
                </div>
              )}
            </div>

            {/* Standings Group Cards - Resized with ample space so all details show cleanly */}
            {groupFilter === "all-groups" ? (
              <div
                className={
                  standingsLayout === "stack"
                    ? "space-y-5 w-full"
                    : "grid grid-cols-1 xl:grid-cols-2 gap-5"
                }
              >
                {GROUPS.map((grp) => renderGroupCard(grp))}
              </div>
            ) : (
              <div className="w-full">
                {renderGroupCard(groupFilter)}
              </div>
            )}
          </div>
        )}

        {/* ======================================================== */}
        {/* TAB 2: FIXTURES */}
        {/* ======================================================== */}
        {activeTab === "fixtures" && (
          <div id="panel-fixtures" className="space-y-3 animate-fadeIn scroll-mt-24">
            {/* Filter Pills */}
            <div className="space-y-2.5">
              <div className="flex flex-wrap items-center justify-between gap-2 px-1">
                {/* Status Filter */}
                <div className="flex items-center gap-1 bg-surface-card p-1 rounded-xl border border-border-subtle text-xs">
                  {(
                    [
                      { id: "all", label: "All" },
                      { id: "finished", label: "Results" },
                      { id: "live", label: "Live" },
                      { id: "upcoming", label: "Upcoming" },
                    ] as { id: FixtureFilter; label: string }[]
                  ).map((f) => (
                    <button
                      key={f.id}
                      onClick={() => setFixtureFilter(f.id)}
                      className={`px-3 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                        fixtureFilter === f.id
                          ? "bg-primary-lime text-black shadow-xs font-black"
                          : "text-text-secondary hover:text-text-primary hover:bg-surface-raised"
                      }`}
                    >
                      {f.label}
                    </button>
                  ))}
                </div>

                <span className="text-[11px] font-semibold text-text-tertiary">
                  {filteredFixtures.length} Matches
                </span>
              </div>

              {/* Group Filter for Fixtures */}
              <div className="flex flex-wrap items-center gap-1.5 px-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-text-tertiary mr-1">
                  Group:
                </span>
                {[
                  { id: "all", label: "All Groups", dot: "bg-primary-lime" },
                  { id: "Group A", label: "Group A", dot: "bg-blue-500" },
                  { id: "Group B", label: "Group B", dot: "bg-emerald-500" },
                  { id: "Group C", label: "Group C", dot: "bg-purple-500" },
                  { id: "Group D", label: "Group D", dot: "bg-amber-500" },
                ].map((g) => {
                  const isSelected = fixtureGroupFilter === g.id;
                  const theme = GROUP_THEMES[g.id];

                  return (
                    <button
                      key={g.id}
                      onClick={() => setFixtureGroupFilter(g.id)}
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                        isSelected
                          ? theme
                            ? theme.filterActive
                            : "bg-primary-lime text-black shadow-xs font-black"
                          : "text-text-secondary hover:text-text-primary bg-surface-card border border-border-subtle"
                      }`}
                    >
                      <span className={`w-1.5 h-1.5 rounded-full ${g.dot}`} />
                      <span>{g.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {loading && fixtures.length === 0 ? (
              <div className="space-y-2.5">
                {[1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className="bg-surface-card rounded-xl border border-border-subtle p-4 h-24 animate-pulse"
                  />
                ))}
              </div>
            ) : filteredFixtures.length === 0 ? (
              <div className="bg-surface-card rounded-xl border border-border-subtle p-8 text-center space-y-3">
                <Clock size={32} className="text-text-secondary mx-auto" />
                <p className="text-xs text-text-secondary">No fixtures found for this filter.</p>
                {fixtures.length === 0 && (
                  <button
                    onClick={handleQuickSeed}
                    className="px-4 py-1.5 rounded-full bg-primary-lime text-black font-black text-xs hover:bg-[#96E600] transition-colors cursor-pointer"
                  >
                    Load Matchday Template
                  </button>
                )}
              </div>
            ) : (
              <div className="space-y-2.5">
                {filteredFixtures.map((f) => (
                  <CleanFixtureCard key={f.id} fixture={f} />
                ))}
              </div>
            )}
          </div>
        )}

        {/* ======================================================== */}
        {/* TAB 3: GOAL SCORERS */}
        {/* ======================================================== */}
        {activeTab === "scorers" && (
          <div id="panel-scorers" className="space-y-3 animate-fadeIn scroll-mt-24">
            <div className="flex items-center justify-between px-1">
              <span className="text-xs font-bold text-text-secondary uppercase tracking-wider">
                Golden Boot Race
              </span>
              <span className="text-[11px] font-semibold text-text-tertiary">
                {scorers.length} Scorers
              </span>
            </div>

            {/* Top Leader Spotlight Card */}
            {topLeader && (
              <div className="bg-gradient-to-r from-surface-card via-amber-950/20 to-surface-card rounded-2xl border border-amber-500/40 p-4 sm:p-5 relative overflow-hidden shadow-lg">
                <div className="absolute top-0 right-0 w-40 h-40 bg-amber-500/10 rounded-full blur-2xl pointer-events-none" />

                <div className="relative z-10 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3.5 min-w-0">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 text-black font-black flex items-center justify-center text-xl shadow-md shadow-amber-500/20 shrink-0">
                      🏆
                    </div>
                    <div className="min-w-0">
                      <span className="text-[10px] font-black uppercase tracking-widest text-amber-400 block">
                        Golden Boot Leader
                      </span>
                      <h3 className="text-base sm:text-lg font-black text-text-primary truncate">
                        {topLeader.playerName}
                      </h3>
                      <p className="text-xs text-text-secondary truncate">{topLeader.teamName}</p>
                    </div>
                  </div>

                  <div className="px-4 py-2 rounded-xl bg-amber-500/15 border border-amber-500/30 text-center shrink-0">
                    <span className="text-2xl font-black text-amber-400 font-display block leading-none">
                      {topLeader.goals}
                    </span>
                    <span className="text-[10px] font-bold text-amber-400/80 uppercase">
                      {topLeader.goals === 1 ? "Goal" : "Goals"}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Scorers List */}
            {loading && scorers.length === 0 ? (
              <div className="space-y-2">
                {[1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className="bg-surface-card rounded-xl border border-border-subtle p-3 h-14 animate-pulse"
                  />
                ))}
              </div>
            ) : scorers.length === 0 ? (
              <div className="bg-surface-card rounded-xl border border-border-subtle p-8 text-center space-y-3">
                <Trophy size={32} className="text-text-secondary mx-auto" />
                <p className="text-xs text-text-secondary">No goals recorded yet.</p>
                <button
                  onClick={handleQuickSeed}
                  className="px-4 py-1.5 rounded-full bg-primary-lime text-black font-black text-xs hover:bg-[#96E600] transition-colors cursor-pointer"
                >
                  Load Matchday Template
                </button>
              </div>
            ) : (
              <div className="bg-surface-card rounded-2xl border border-border-subtle overflow-hidden divide-y divide-border-subtle/50 shadow-sm">
                {scorers.map((s, index) => {
                  const badge = getTeamBadge(s.teamName);
                  const isGold = index === 0;
                  const isSilver = index === 1;
                  const isBronze = index === 2;

                  return (
                    <div
                      key={s.id}
                      className="p-3 sm:p-3.5 flex items-center justify-between gap-3 hover:bg-surface-raised/40 transition-colors"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        {/* Rank */}
                        <div className="w-6 text-center font-black text-xs shrink-0">
                          {isGold ? (
                            <span className="text-base">🥇</span>
                          ) : isSilver ? (
                            <span className="text-base">🥈</span>
                          ) : isBronze ? (
                            <span className="text-base">🥉</span>
                          ) : (
                            <span className="text-text-tertiary">#{index + 1}</span>
                          )}
                        </div>

                        {/* Team Monogram */}
                        <div
                          className={`w-7 h-7 rounded-lg flex items-center justify-center text-[10px] font-black shrink-0 border ${badge.bg} ${badge.text} ${badge.border}`}
                        >
                          {badge.initials}
                        </div>

                        {/* Player & Club */}
                        <div className="min-w-0">
                          <p className="text-xs sm:text-sm font-bold text-text-primary truncate">
                            {s.playerName}
                          </p>
                          <p className="text-[11px] text-text-secondary truncate">{s.teamName}</p>
                        </div>
                      </div>

                      {/* Goal Count */}
                      <div
                        className={`flex items-center gap-1.5 shrink-0 px-2.5 py-1 rounded-lg border ${
                          isGold
                            ? "bg-amber-500/15 border-amber-500/30 text-amber-400"
                            : "bg-surface-raised border-border-subtle text-text-primary"
                        }`}
                      >
                        <Flame
                          size={13}
                          className={
                            isGold
                              ? "text-amber-400"
                              : isSilver
                              ? "text-text-secondary"
                              : "text-primary-lime"
                          }
                        />
                        <span className="text-sm font-black font-display">{s.goals}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ======================================================== */}
        {/* VIEW 4: ROSTERS                                         */}
        {/* ======================================================== */}
        {activeTab === "rosters" && (
          <div className="max-w-7xl mx-auto px-3 sm:px-4 mt-6">
            <TournamentSquads teams={teams} players={players} />
          </div>
        )}
      </main>

      {/* 5. MINIMAL CLEAN FOOTER */}
      <footer className="max-w-7xl mx-auto px-4 pt-10 pb-24 text-center text-xs text-text-tertiary">
        <p className="font-semibold">WEHAT Soccer Championship • Powered by Pitchly</p>
      </footer>

      {/* SHARE MODAL */}
      {shareModalOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4"
          onClick={() => setShareModalOpen(false)}
        >
          <div
            className="bg-surface-card rounded-2xl border border-border-subtle p-5 max-w-sm w-full space-y-4 shadow-2xl relative animate-fadeIn"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-black uppercase tracking-wider text-text-primary">
                Share Tournament
              </h3>
              <button
                onClick={() => setShareModalOpen(false)}
                className="w-7 h-7 rounded-lg bg-surface-raised flex items-center justify-center text-text-secondary hover:text-text-primary"
              >
                <X size={15} />
              </button>
            </div>

            <div className="flex justify-center py-2">
              <div className="bg-white p-3 rounded-xl shadow-xs">
                <QRCodeSVG value={publicUrl} size={150} />
              </div>
            </div>

            <div className="flex items-center gap-2 bg-app-base border border-border-subtle rounded-xl p-1.5 pl-3">
              <span className="text-xs font-mono text-text-secondary truncate flex-1 select-all">
                {publicUrl}
              </span>
              <button
                onClick={copyToClipboard}
                className="px-3 py-1.5 rounded-lg text-xs font-bold bg-primary-lime text-black flex items-center gap-1 shrink-0"
              >
                {copiedLink ? <Check size={13} /> : <Copy size={13} />}
                {copiedLink ? "Copied" : "Copy"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// ==========================================
// SUB-COMPONENT: CLEAN FIXTURE CARD
// ==========================================
const CleanFixtureCard: React.FC<{ fixture: TournamentFixture }> = ({ fixture }) => {
  const isLive = fixture.status === "live";
  const homeBadge = getTeamBadge(fixture.homeTeam);
  const awayBadge = getTeamBadge(fixture.awayTeam);
  const hasScores = fixture.homeScore !== null && fixture.awayScore !== null;
  const hasScorersOrNotes =
    (fixture.homeScorers && fixture.homeScorers.length > 0) ||
    (fixture.awayScorers && fixture.awayScorers.length > 0) ||
    fixture.notes;

  const theme = getGroupTheme(fixture.group || fixture.round);

  return (
    <div
      className={`bg-surface-card rounded-xl border p-3 sm:p-4 transition-all relative overflow-hidden ${
        isLive
          ? "border-primary-lime/60 border-l-4 border-l-primary-lime shadow-[0_0_15px_rgba(168,255,0,0.1)] ring-1 ring-primary-lime/30"
          : `border-border-subtle/80 hover:border-border-subtle border-l-4 ${theme.borderLeft}`
      }`}
    >
      {/* Corner Ambient Tint */}
      <div
        className={`absolute -top-10 -right-10 w-28 h-28 ${
          isLive ? "bg-primary-lime/10" : theme.cardGlow
        } rounded-full blur-2xl pointer-events-none`}
      />

      {/* Top micro metadata */}
      <div className="flex items-center justify-between gap-2 pb-2 text-[10px] text-text-tertiary border-b border-border-subtle/50 relative z-10">
        <div className="flex items-center gap-1.5 min-w-0">
          {fixture.group && (
            <span
              className={`px-2 py-0.5 rounded-full ${theme.pillBg} ${theme.pillText} font-black text-[9px] uppercase border ${theme.pillBorder} shrink-0`}
            >
              {fixture.group}
            </span>
          )}
          <span className="font-semibold truncate">
            {fixture.round || "Matchday"} {fixture.pitchVenue && `• ${fixture.pitchVenue}`}
          </span>
        </div>

        {isLive ? (
          <span className="inline-flex items-center gap-1 font-black text-primary-lime uppercase tracking-wider shrink-0 px-2 py-0.5 rounded-full bg-primary-lime/15 border border-primary-lime/30">
            <span className="w-1.5 h-1.5 rounded-full bg-primary-lime animate-pulse" />
            Live
          </span>
        ) : fixture.status === "finished" ? (
          <span className="font-bold text-text-tertiary uppercase shrink-0 text-[9px] tracking-wider px-1.5 py-0.5 rounded bg-surface-raised border border-border-subtle/60">
            Full Time
          </span>
        ) : (
          <span className="font-semibold text-text-secondary flex items-center gap-1 shrink-0">
            <Clock size={11} />
            {fixture.time}
          </span>
        )}
      </div>

      {/* Main Score & Teams Row */}
      <div className="pt-2.5 flex items-center justify-between gap-3 relative z-10">
        {/* Home Team */}
        <div className="flex-1 flex items-center justify-end gap-2 text-right min-w-0">
          <span className="text-xs sm:text-sm font-bold text-text-primary truncate">
            {fixture.homeTeam}
          </span>
          <div
            className={`w-6 h-6 rounded-md flex items-center justify-center text-[9px] font-black shrink-0 border ${homeBadge.bg} ${homeBadge.text} ${homeBadge.border}`}
          >
            {homeBadge.initials}
          </div>
        </div>

        {/* Center Score or VS */}
        <div className="shrink-0 px-3 py-1 rounded-lg bg-surface-raised border border-border-subtle min-w-[64px] text-center">
          {hasScores ? (
            <div className="flex items-center justify-center gap-1.5 text-sm sm:text-base font-black font-display text-text-primary">
              <span
                className={
                  (fixture.homeScore || 0) > (fixture.awayScore || 0) ? "text-primary-lime" : ""
                }
              >
                {fixture.homeScore}
              </span>
              <span className="text-text-tertiary text-xs">:</span>
              <span
                className={
                  (fixture.awayScore || 0) > (fixture.homeScore || 0) ? "text-primary-lime" : ""
                }
              >
                {fixture.awayScore}
              </span>
            </div>
          ) : (
            <span className="text-[11px] font-black tracking-wider text-text-tertiary">VS</span>
          )}
        </div>

        {/* Away Team */}
        <div className="flex-1 flex items-center justify-start gap-2 text-left min-w-0">
          <div
            className={`w-6 h-6 rounded-md flex items-center justify-center text-[9px] font-black shrink-0 border ${awayBadge.bg} ${awayBadge.text} ${awayBadge.border}`}
          >
            {awayBadge.initials}
          </div>
          <span className="text-xs sm:text-sm font-bold text-text-primary truncate">
            {fixture.awayTeam}
          </span>
        </div>
      </div>

      {/* Goal Scorers & Match Events */}
      {hasScorersOrNotes && (
        <div className="mt-2.5 pt-2 border-t border-border-subtle/40 grid grid-cols-2 gap-3 text-[11px] relative z-10">
          {/* Home Scorers */}
          <div className="text-right space-y-0.5">
            {fixture.homeScorers && fixture.homeScorers.length > 0 ? (
              fixture.homeScorers.map((s, idx) => (
                <div key={idx} className="flex items-center justify-end gap-1 text-text-secondary truncate">
                  <span className="truncate">{s}</span>
                  <span className="text-[10px]">⚽</span>
                </div>
              ))
            ) : (
              <span className="text-[10px] text-text-tertiary">—</span>
            )}
          </div>

          {/* Away Scorers & Cards */}
          <div className="text-left space-y-0.5">
            {fixture.awayScorers && fixture.awayScorers.length > 0 ? (
              fixture.awayScorers.map((s, idx) => (
                <div key={idx} className="flex items-center justify-start gap-1 text-text-secondary truncate">
                  <span className="text-[10px]">⚽</span>
                  <span className="truncate">{s}</span>
                </div>
              ))
            ) : !fixture.notes ? (
              <span className="text-[10px] text-text-tertiary">—</span>
            ) : null}

            {fixture.notes && (
              <div className="flex items-center justify-start gap-1 text-red-400 font-semibold text-[10px] truncate">
                <span>🟥</span>
                <span className="truncate">{fixture.notes}</span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
