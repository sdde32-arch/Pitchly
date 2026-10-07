import React, { useState, useEffect, useMemo, useRef } from "react";
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
  Search,
  ChevronRight,
  SlidersHorizontal,
  Plus,
  Minus,
  Save,
  Zap,
  KeyRound,
  RefreshCw,
} from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { motion, AnimatePresence } from "motion/react";
import { useUser } from "../../context/UserContext";
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
import { TournamentLeaderboard } from "../../components/tournament/TournamentLeaderboard";

type ActiveTab = "fixtures" | "stands" | "scorers" | "rosters";
type FixtureFilter = "all" | "live" | "upcoming" | "finished";
type RoundFilter = "all" | "live" | "qf" | "md3" | "previous" | "md2" | "md1";
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

// Official Day 3 Standings from tournament poster
export interface OfficialDay3Standing {
  team: string;
  group: "Group A" | "Group B" | "Group C" | "Group D";
  played: number;
  won: number;
  drawn: number;
  lost: number;
  goalDifference: number;
  points: number;
}

export const OFFICIAL_DAY3_STANDINGS: OfficialDay3Standing[] = [
  // Group A
  { team: "WEHAT SELECT", group: "Group A", played: 3, won: 2, drawn: 1, lost: 0, goalDifference: 8, points: 7 },
  { team: "BUSABALA UNITED FC", group: "Group A", played: 3, won: 1, drawn: 2, lost: 0, goalDifference: 4, points: 5 },
  { team: "BROTHER LOVE FC", group: "Group A", played: 3, won: 1, drawn: 1, lost: 1, goalDifference: -3, points: 4 },
  { team: "KIRUDDU HOSP FC", group: "Group A", played: 3, won: 0, drawn: 0, lost: 3, goalDifference: -9, points: 0 },

  // Group B
  { team: "BUNGA FC", group: "Group B", played: 3, won: 2, drawn: 1, lost: 0, goalDifference: 4, points: 7 },
  { team: "LEGENDS FC", group: "Group B", played: 3, won: 2, drawn: 1, lost: 0, goalDifference: 4, points: 7 },
  { team: "PRO PERFORMERS FC", group: "Group B", played: 3, won: 1, drawn: 0, lost: 2, goalDifference: -2, points: 3 },
  { team: "SENIOR PLAYERS", group: "Group B", played: 3, won: 0, drawn: 0, lost: 3, goalDifference: -6, points: 0 },

  // Group C
  { team: "WEHAT FC", group: "Group C", played: 3, won: 2, drawn: 1, lost: 0, goalDifference: 6, points: 7 },
  { team: "IMDAD FC", group: "Group C", played: 3, won: 2, drawn: 1, lost: 0, goalDifference: 4, points: 7 },
  { team: "GOOD FRIENDS", group: "Group C", played: 3, won: 0, drawn: 1, lost: 2, goalDifference: -5, points: 1 },
  { team: "DODGE AMO FC", group: "Group C", played: 3, won: 0, drawn: 1, lost: 2, goalDifference: -5, points: 1 },

  // Group D
  { team: "INVESTORS FC", group: "Group D", played: 3, won: 3, drawn: 0, lost: 0, goalDifference: 13, points: 9 },
  { team: "PURE HEARTS FC", group: "Group D", played: 3, won: 2, drawn: 0, lost: 1, goalDifference: 5, points: 6 },
  { team: "GENTLE STAR FC", group: "Group D", played: 3, won: 1, drawn: 0, lost: 2, goalDifference: -4, points: 3 },
  { team: "HMK", group: "Group D", played: 3, won: 0, drawn: 0, lost: 3, goalDifference: -14, points: 0 },
];

// Team name normalizer for historical or short forms from tournament posters
export const normalizeTeamName = (name: string): string => {
  if (!name) return "";
  const trimmed = name.trim();
  if (trimmed === "GENTLE FC" || trimmed === "GENTLER STAR" || trimmed === "GENTLE STAR") return "GENTLE STAR FC";
  if (trimmed === "KIRUDDU FC" || trimmed === "KIRUNDU FC" || trimmed === "KIRUDDU HOSP") return "KIRUDDU HOSP FC";
  if (trimmed === "BUSABALA FC" || trimmed === "BUSABALA UNITED") return "BUSABALA UNITED FC";
  if (trimmed === "PURE HEARTS" || trimmed === "PURE HEART FC" || trimmed === "PURE HEART") return "PURE HEARTS FC";
  if (trimmed === "INVESTOR FC" || trimmed === "INVESTOR") return "INVESTORS FC";
  if (trimmed === "GOODFRIENDS" || trimmed === "GOOD FRIEND FC" || trimmed === "GOOD FRIEND") return "GOOD FRIENDS";
  if (trimmed === "DODGE FC" || trimmed === "DODGE") return "DODGE AMO FC";
  if (trimmed === "PRO PERFORMERS" || trimmed === "PRO PERFORMWERS FC" || trimmed === "PRO PERFORMWERS") return "PRO PERFORMERS FC";
  if (trimmed === "LEGENDS" || trimmed === "LEGEND FC" || trimmed === "LEGEND") return "LEGENDS FC";
  if (trimmed === "SENIOR PLAYERS FC" || trimmed === "SENIOR PLAYERS") return "SENIOR PLAYERS";
  if (trimmed === "IMDAD") return "IMDAD FC";
  if (trimmed === "BROTHER LOVE") return "BROTHER LOVE FC";
  if (trimmed === "HMK FC") return "HMK";
  return trimmed;
};

// Official 16 Teams across the 4 Groups (Updated to Official Day 3 Layout)
export const OFFICIAL_WEHAT_TEAMS: { name: string; group: "Group A" | "Group B" | "Group C" | "Group D" }[] = [
  // Group A
  { name: "WEHAT SELECT", group: "Group A" },
  { name: "BUSABALA UNITED FC", group: "Group A" },
  { name: "BROTHER LOVE FC", group: "Group A" },
  { name: "KIRUDDU HOSP FC", group: "Group A" },

  // Group B
  { name: "BUNGA FC", group: "Group B" },
  { name: "LEGENDS FC", group: "Group B" },
  { name: "PRO PERFORMERS FC", group: "Group B" },
  { name: "SENIOR PLAYERS", group: "Group B" },

  // Group C
  { name: "WEHAT FC", group: "Group C" },
  { name: "IMDAD FC", group: "Group C" },
  { name: "GOOD FRIENDS", group: "Group C" },
  { name: "DODGE AMO FC", group: "Group C" },

  // Group D
  { name: "INVESTORS FC", group: "Group D" },
  { name: "PURE HEARTS FC", group: "Group D" },
  { name: "GENTLE STAR FC", group: "Group D" },
  { name: "HMK", group: "Group D" },
];

// Team Monogram & Color helper
const getTeamBadge = (name: string) => {
  const normName = normalizeTeamName(name);
  const initials = normName
    .split(" ")
    .map((w) => w[0])
    .join("")
    .substring(0, 3)
    .toUpperCase();

  const colorMap: Record<string, { bg: string; text: string; border: string }> = {
    // Group A
    "WEHAT SELECT": { bg: "bg-indigo-600/15", text: "text-indigo-400", border: "border-indigo-500/30" },
    "BUSABALA UNITED FC": { bg: "bg-sky-600/15", text: "text-sky-400", border: "border-sky-500/30" },
    "BUSABALA FC": { bg: "bg-sky-600/15", text: "text-sky-400", border: "border-sky-500/30" },
    "BROTHER LOVE FC": { bg: "bg-pink-600/15", text: "text-pink-400", border: "border-pink-500/30" },
    "KIRUDDU HOSP FC": { bg: "bg-fuchsia-600/15", text: "text-fuchsia-400", border: "border-fuchsia-500/30" },
    "KIRUDDU FC": { bg: "bg-fuchsia-600/15", text: "text-fuchsia-400", border: "border-fuchsia-500/30" },

    // Group B
    "BUNGA FC": { bg: "bg-emerald-600/15", text: "text-emerald-400", border: "border-emerald-500/30" },
    "LEGENDS FC": { bg: "bg-yellow-500/15", text: "text-yellow-400", border: "border-yellow-500/30" },
    "PRO PERFORMERS FC": { bg: "bg-purple-600/15", text: "text-purple-400", border: "border-purple-500/30" },
    "SENIOR PLAYERS": { bg: "bg-orange-600/15", text: "text-orange-400", border: "border-orange-500/30" },

    // Group C
    "WEHAT FC": { bg: "bg-blue-600/15", text: "text-blue-400", border: "border-blue-500/30" },
    "IMDAD FC": { bg: "bg-cyan-600/15", text: "text-cyan-400", border: "border-cyan-500/30" },
    "GOOD FRIENDS": { bg: "bg-teal-500/15", text: "text-teal-300", border: "border-teal-500/30" },
    "DODGE AMO FC": { bg: "bg-red-600/15", text: "text-red-400", border: "border-red-500/30" },

    // Group D
    "INVESTORS FC": { bg: "bg-rose-600/15", text: "text-rose-400", border: "border-rose-500/30" },
    "PURE HEARTS FC": { bg: "bg-lime-500/15", text: "text-lime-400", border: "border-lime-500/30" },
    "PURE HEARTS": { bg: "bg-lime-500/15", text: "text-lime-400", border: "border-lime-500/30" },
    "GENTLE STAR FC": { bg: "bg-amber-600/15", text: "text-amber-400", border: "border-amber-500/30" },
    "GENTLE FC": { bg: "bg-amber-600/15", text: "text-amber-400", border: "border-amber-500/30" },
    "HMK": { bg: "bg-violet-600/15", text: "text-violet-400", border: "border-violet-500/30" },
  };

  const style = colorMap[normName] || colorMap[name] || {
    bg: "bg-surface-raised",
    text: "text-primary-lime",
    border: "border-border-subtle",
  };

  return { initials, ...style };
};

// Compute League & Group Standings dynamically from match fixtures or Day 3 official poster
function computeStandings(fixtures: TournamentFixture[]): TournamentTeamStanding[] {
  // If we have finished fixtures from Day 3, calculate dynamically; otherwise default to official Day 3 poster results
  const finishedFixtures = fixtures.filter(
    (f) =>
      f.status === "finished" &&
      f.homeScore !== null &&
      f.awayScore !== null &&
      !f.round?.toLowerCase().includes("quarter") &&
      f.group !== "Quarter-Finals"
  );
  
  // Use official Day 3 poster standings as source of truth
  const officialMap = new Map<string, OfficialDay3Standing>();
  OFFICIAL_DAY3_STANDINGS.forEach((s) => officialMap.set(normalizeTeamName(s.team), s));

  // Initialize with official poster data
  const teamsMap = new Map<string, TournamentTeamStanding>();
  OFFICIAL_DAY3_STANDINGS.forEach((s) => {
    const norm = normalizeTeamName(s.team);
    teamsMap.set(norm, {
      position: 1,
      team: norm,
      group: s.group,
      played: s.played,
      won: s.won,
      drawn: s.drawn,
      lost: s.lost,
      goalsFor: 0,
      goalsAgainst: 0,
      goalDifference: s.goalDifference,
      points: s.points,
      form: ["W"],
    });
  });

  // If there are additional or edited fixtures, apply them
  if (finishedFixtures.length > 16) {
    const dynamicMap = new Map<string, TournamentTeamStanding>();
    OFFICIAL_WEHAT_TEAMS.forEach(({ name, group }) => {
      dynamicMap.set(name, {
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

    finishedFixtures.forEach((f) => {
      const hNorm = normalizeTeamName(f.homeTeam);
      const aNorm = normalizeTeamName(f.awayTeam);
      const home = dynamicMap.get(hNorm);
      const away = dynamicMap.get(aNorm);
      if (home && away && f.homeScore !== null && f.awayScore !== null) {
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
    });

    const dynamicStandings = Array.from(dynamicMap.values()).map((t) => ({
      ...t,
      goalDifference: t.goalsFor - t.goalsAgainst,
      form: t.form.slice(0, 5),
    }));

    dynamicStandings.sort((a, b) => {
      if (b.points !== a.points) return b.points - a.points;
      if (b.goalDifference !== a.goalDifference) return b.goalDifference - a.goalDifference;
      if (b.won !== a.won) return b.won - a.won;
      return a.team.localeCompare(b.team);
    });

    dynamicStandings.forEach((item, idx) => {
      item.position = idx + 1;
    });

    return dynamicStandings;
  }

  const standings = Array.from(teamsMap.values());
  standings.sort((a, b) => {
    if (b.points !== a.points) return b.points - a.points;
    if (b.goalDifference !== a.goalDifference) return b.goalDifference - a.goalDifference;
    if (b.won !== a.won) return b.won - a.won;
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
  const { user, isAdmin, userProfile, signInWithGoogle } = useUser();

  const [pitchsideAuth, setPitchsideAuth] = useState<boolean>(() => {
    if (typeof window !== "undefined") {
      return (
        localStorage.getItem("pitchly_organizer_access") === "true" ||
        sessionStorage.getItem("pitchly_organizer_access") === "true"
      );
    }
    return false;
  });

  const canManageTournament =
    isAdmin ||
    pitchsideAuth ||
    user?.email?.toLowerCase() === "sdde32@gmail.com" ||
    userProfile?.email?.toLowerCase() === "sdde32@gmail.com" ||
    userProfile?.role === "admin" ||
    userProfile?.role === "ADMIN" ||
    userProfile?.role === "super_admin";

  const [organizerModalOpen, setOrganizerModalOpen] = useState<boolean>(false);
  const [organizerPasscode, setOrganizerPasscode] = useState<string>("");
  const [organizerPasscodeError, setOrganizerPasscodeError] = useState<string>("");

  const [activeTab, setActiveTab] = useState<ActiveTab>("fixtures");
  const [fixtures, setFixtures] = useState<TournamentFixture[]>([]);
  const [scorers, setScorers] = useState<TournamentScorer[]>([]);
  const [teams, setTeams] = useState<TournamentTeam[]>([]);
  const [players, setPlayers] = useState<TournamentPlayer[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Filters
  const [roundFilter, setRoundFilter] = useState<RoundFilter>("all");
  const [fixtureFilter, setFixtureFilter] = useState<FixtureFilter>("all");
  const [fixtureGroupFilter, setFixtureGroupFilter] = useState<string>("all");
  const [fixtureSearch, setFixtureSearch] = useState<string>("");
  const [groupFilter, setGroupFilter] = useState<GroupFilter>("all-groups");
  const [standingsLayout, setStandingsLayout] = useState<"stack" | "grid">("stack");
  const [standingsSubView, setStandingsSubView] = useState<"leaderboard" | "groups">("groups");

  const handleFixtureFilterChange = (filter: FixtureFilter) => {
    setFixtureFilter(filter);
    if (filter === "finished" && (roundFilter === "qf" || roundFilter === "live")) {
      setRoundFilter("md3");
    } else if (filter === "upcoming" && (roundFilter === "md1" || roundFilter === "md2" || roundFilter === "md3" || roundFilter === "previous" || roundFilter === "live")) {
      setRoundFilter("qf");
    } else if (filter === "live") {
      setRoundFilter("all");
    }
  };

  const handleRoundFilterChange = (rf: RoundFilter) => {
    setRoundFilter(rf);
    if (rf === "qf" && fixtureFilter === "finished") {
      setFixtureFilter("all");
    } else if (rf === "md3" && fixtureFilter === "upcoming") {
      setFixtureFilter("all");
    } else if ((rf === "md1" || rf === "md2" || rf === "previous") && fixtureFilter === "upcoming") {
      setFixtureFilter("all");
    } else if (rf === "live") {
      setFixtureFilter("all");
    }
  };

  // Scorers Search & Goal Count Filter
  const [scorerSearch, setScorerSearch] = useState<string>("");
  const [scorerGoalFilter, setScorerGoalFilter] = useState<string>("all");

  // Share Modal
  const [shareModalOpen, setShareModalOpen] = useState<boolean>(false);
  const [copiedLink, setCopiedLink] = useState<boolean>(false);

  // Admin Quick Score Updater Modal
  const [adminModalOpen, setAdminModalOpen] = useState<boolean>(false);
  const [selectedFixtureToUpdate, setSelectedFixtureToUpdate] = useState<TournamentFixture | null>(null);
  const [updatingScore, setUpdatingScore] = useState<{
    homeScore: number;
    awayScore: number;
    status: FixtureStatus;
    time: string;
    homeScorersText: string;
    awayScorersText: string;
    notes: string;
  }>({
    homeScore: 0,
    awayScore: 0,
    status: "live",
    time: "LIVE",
    homeScorersText: "",
    awayScorersText: "",
    notes: "",
  });
  const [isSavingScore, setIsSavingScore] = useState<boolean>(false);
  const [updateToast, setUpdateToast] = useState<string | null>(null);

  // Real-time animation tracking for dynamic score updates
  const [recentlyUpdatedIds, setRecentlyUpdatedIds] = useState<Set<string>>(new Set());
  const prevFixturesMapRef = useRef<Map<string, string>>(new Map());
  const isInitialLoadRef = useRef(true);
  const [isRefreshingScores, setIsRefreshingScores] = useState<boolean>(false);

  // Subtle web audio chime for live goal updates
  const playGoalChime = () => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(587.33, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.15);
      gain.gain.setValueAtTime(0.12, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.36);
    } catch {
      // Audio playback may be restricted before interaction; ignore silently
    }
  };

  const handleManualRefresh = async () => {
    setIsRefreshingScores(true);
    try {
      const freshFixtures = await tournamentService.getFixtures(tournamentId);
      if (freshFixtures && freshFixtures.length > 0) {
        setFixtures(freshFixtures);
      }
      setUpdateToast("Scores synchronized with live database");
      setTimeout(() => setUpdateToast(null), 2500);
    } catch {
      // Ignore
    } finally {
      setTimeout(() => setIsRefreshingScores(false), 600);
    }
  };

  const openEditModal = (fixture: TournamentFixture) => {
    setSelectedFixtureToUpdate(fixture);
    setUpdatingScore({
      homeScore: fixture.homeScore ?? 0,
      awayScore: fixture.awayScore ?? 0,
      status: fixture.status,
      time: fixture.time || (fixture.status === "live" ? "LIVE" : "2:30 PM"),
      homeScorersText: fixture.homeScorers ? fixture.homeScorers.join(", ") : "",
      awayScorersText: fixture.awayScorers ? fixture.awayScorers.join(", ") : "",
      notes: fixture.notes || "",
    });
    setAdminModalOpen(true);
  };

  const handleSaveScoreUpdate = async () => {
    if (!selectedFixtureToUpdate) return;
    setIsSavingScore(true);
    try {
      const homeScorers = updatingScore.homeScorersText
        ? updatingScore.homeScorersText.split(",").map((s) => s.trim()).filter(Boolean)
        : [];
      const awayScorers = updatingScore.awayScorersText
        ? updatingScore.awayScorersText.split(",").map((s) => s.trim()).filter(Boolean)
        : [];

      await tournamentService.updateFixture(selectedFixtureToUpdate.id, {
        homeScore: updatingScore.status === "upcoming" ? null : updatingScore.homeScore,
        awayScore: updatingScore.status === "upcoming" ? null : updatingScore.awayScore,
        status: updatingScore.status,
        time: updatingScore.time,
        homeScorers,
        awayScorers,
        notes: updatingScore.notes,
      });

      // Highlight updated fixture immediately with animated pulse & chime
      setRecentlyUpdatedIds((prev) => new Set(prev).add(selectedFixtureToUpdate.id));
      playGoalChime();
      setTimeout(() => {
        setRecentlyUpdatedIds((prev) => {
          const next = new Set(prev);
          next.delete(selectedFixtureToUpdate.id);
          return next;
        });
      }, 4500);

      setUpdateToast(`Score updated: ${selectedFixtureToUpdate.homeTeam} ${updatingScore.homeScore} - ${updatingScore.awayScore} ${selectedFixtureToUpdate.awayTeam}`);
      setTimeout(() => setUpdateToast(null), 3500);
      setAdminModalOpen(false);
    } catch (err: any) {
      alert("Failed to update score: " + (err?.message || "Unknown error"));
    } finally {
      setIsSavingScore(false);
    }
  };

  const publicUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}/#/tournament`
      : "/#/tournament";

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

    // Safety timeout ensures page NEVER freezes indefinitely
    const safetyTimer = setTimeout(() => {
      setLoading(false);
    }, 2500);

    const unsubFixtures = tournamentService.subscribeToFixtures(
      tournamentId,
      (data) => {
        // Detect dynamically updated scores from admin in real-time
        if (!isInitialLoadRef.current && prevFixturesMapRef.current.size > 0) {
          const changedIds = new Set<string>();
          data.forEach((f) => {
            const signature = `${f.homeScore}-${f.awayScore}-${f.status}-${(f.homeScorers || []).join()}-${(f.awayScorers || []).join()}`;
            const oldSig = prevFixturesMapRef.current.get(f.id);
            if (oldSig && oldSig !== signature) {
              changedIds.add(f.id);
              if (f.homeScore !== null && f.awayScore !== null) {
                playGoalChime();
                setUpdateToast(`⚡ Live Score Update: ${f.homeTeam} ${f.homeScore} - ${f.awayScore} ${f.awayTeam}`);
                setTimeout(() => setUpdateToast(null), 4000);
              }
            }
          });

          if (changedIds.size > 0) {
            setRecentlyUpdatedIds((prev) => {
              const next = new Set(prev);
              changedIds.forEach((id) => next.add(id));
              return next;
            });
            setTimeout(() => {
              setRecentlyUpdatedIds((prev) => {
                const next = new Set(prev);
                changedIds.forEach((id) => next.delete(id));
                return next;
              });
            }, 4500);
          }
        }

        const newMap = new Map<string, string>();
        data.forEach((f) => {
          newMap.set(f.id, `${f.homeScore}-${f.awayScore}-${f.status}-${(f.homeScorers || []).join()}-${(f.awayScorers || []).join()}`);
        });
        prevFixturesMapRef.current = newMap;
        isInitialLoadRef.current = false;

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
      clearTimeout(safetyTimer);
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
    if (roundFilter === "md1") {
      list = list.filter(
        (f) =>
          f.round?.toLowerCase().includes("matchday 1") ||
          f.round?.toLowerCase().includes("week 1")
      );
    } else if (roundFilter === "md2") {
      list = list.filter(
        (f) =>
          f.round?.toLowerCase().includes("matchday 2") ||
          f.round?.toLowerCase().includes("week 2")
      );
    } else if (roundFilter === "qf") {
      list = list.filter(
        (f) =>
          f.round?.toLowerCase().includes("quarter") ||
          f.group === "Quarter-Finals"
      );
    } else if (roundFilter === "md3") {
      list = list.filter(
        (f) =>
          f.round?.toLowerCase().includes("matchday 3") ||
          f.round?.toLowerCase().includes("week 3")
      );
    } else if (roundFilter === "previous") {
      list = list.filter(
        (f) =>
          f.round?.toLowerCase().includes("matchday 1") ||
          f.round?.toLowerCase().includes("week 1") ||
          f.round?.toLowerCase().includes("matchday 2") ||
          f.round?.toLowerCase().includes("week 2") ||
          f.round?.toLowerCase().includes("matchday 3") ||
          f.round?.toLowerCase().includes("week 3") ||
          f.status === "finished"
      );
    } else if (roundFilter === "live") {
      list = list.filter((f) => f.status === "live");
    }
    if (fixtureSearch.trim()) {
      const q = fixtureSearch.trim().toLowerCase();
      list = list.filter(
        (f) =>
          f.homeTeam.toLowerCase().includes(q) ||
          f.awayTeam.toLowerCase().includes(q) ||
          (f.group && f.group.toLowerCase().includes(q)) ||
          (f.round && f.round.toLowerCase().includes(q))
      );
    }
    return list;
  }, [fixtures, fixtureFilter, fixtureGroupFilter, roundFilter, fixtureSearch]);

  // Group fixtures into organized matchday buckets
  const { liveMatches, qfMatches, md3Matches, md2Matches, md1Matches, otherMatches } = useMemo(() => {
    const live = fixtures.filter((f) => f.status === "live");
    const qf = filteredFixtures.filter(
      (f) => f.round?.toLowerCase().includes("quarter") || f.group === "Quarter-Finals"
    );
    const md3 = filteredFixtures.filter(
      (f) => f.round?.toLowerCase().includes("matchday 3") || f.round?.toLowerCase().includes("week 3")
    );
    const md2 = filteredFixtures.filter(
      (f) => f.round?.toLowerCase().includes("matchday 2") || f.round?.toLowerCase().includes("week 2")
    );
    const md1 = filteredFixtures.filter(
      (f) => f.round?.toLowerCase().includes("matchday 1") || f.round?.toLowerCase().includes("week 1")
    );
    const knownIds = new Set([
      ...qf.map((f) => f.id),
      ...md3.map((f) => f.id),
      ...md2.map((f) => f.id),
      ...md1.map((f) => f.id),
    ]);
    const other = filteredFixtures.filter((f) => !knownIds.has(f.id));
    return { liveMatches: live, qfMatches: qf, md3Matches: md3, md2Matches: md2, md1Matches: md1, otherMatches: other };
  }, [fixtures, filteredFixtures]);

  const scorerCounts = useMemo(() => {
    return {
      all: scorers.length,
      g9: scorers.filter((s) => s.goals >= 9).length,
      g5: scorers.filter((s) => s.goals === 5).length,
      g4: scorers.filter((s) => s.goals === 4).length,
      g3: scorers.filter((s) => s.goals === 3).length,
      g2: scorers.filter((s) => s.goals === 2).length,
      g1: scorers.filter((s) => s.goals === 1).length,
    };
  }, [scorers]);

  const filteredScorers = useMemo(() => {
    let list = scorers;
    if (scorerGoalFilter === "9") {
      list = list.filter((s) => s.goals >= 9);
    } else if (scorerGoalFilter === "5") {
      list = list.filter((s) => s.goals === 5);
    } else if (scorerGoalFilter === "4") {
      list = list.filter((s) => s.goals === 4);
    } else if (scorerGoalFilter === "3") {
      list = list.filter((s) => s.goals === 3);
    } else if (scorerGoalFilter === "2") {
      list = list.filter((s) => s.goals === 2);
    } else if (scorerGoalFilter === "1") {
      list = list.filter((s) => s.goals === 1);
    } else if (scorerGoalFilter === "3+") {
      list = list.filter((s) => s.goals >= 3);
    }
    if (scorerSearch.trim()) {
      const q = scorerSearch.toLowerCase().trim();
      list = list.filter(
        (s) =>
          s.playerName.toLowerCase().includes(q) ||
          s.teamName.toLowerCase().includes(q)
      );
    }
    return list;
  }, [scorers, scorerGoalFilter, scorerSearch]);

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
        className="bg-surface-card rounded-xl border border-border-subtle overflow-hidden flex flex-col"
      >
        {/* Minimal Group Header */}
        <div className="px-3.5 py-2.5 bg-surface-raised/40 border-b border-border-subtle flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-text-primary tracking-wide">
              {grp}
            </span>
          </div>
          <span className="text-[10px] text-text-tertiary">
            Top 2 advance
          </span>
        </div>

        {/* Group Table - Clean & uncluttered */}
        <div className="w-full overflow-hidden">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-border-subtle/50 text-[10px] uppercase font-medium text-text-tertiary">
                <th className="py-2 pl-3 pr-1 w-7 text-center">#</th>
                <th className="py-2 px-2">Club</th>
                <th className="py-2 px-1 text-center w-8" title="Played">P</th>
                <th className="py-2 px-1 text-center w-8 hidden sm:table-cell" title="Won">W</th>
                <th className="py-2 px-1 text-center w-8 hidden sm:table-cell" title="Drawn">D</th>
                <th className="py-2 px-1 text-center w-8 hidden sm:table-cell" title="Lost">L</th>
                <th className="py-2 px-1 text-center w-10" title="Goal Difference">GD</th>
                <th className="py-2 pr-3 pl-1 text-center w-10 font-bold text-text-primary" title="Points">Pts</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-subtle/25">
              {groupTeams.map((s, idx) => {
                const isTopTwo = idx < 2;
                const badge = getTeamBadge(s.team);

                return (
                  <tr
                    key={s.team}
                    className="hover:bg-surface-raised/30 transition-colors"
                  >
                    {/* Position */}
                    <td className="py-2 pl-3 pr-1 text-center text-xs">
                      <span
                        className={isTopTwo ? "font-semibold text-primary-lime" : "text-text-tertiary"}
                      >
                        {idx + 1}
                      </span>
                    </td>

                    {/* Club */}
                    <td className="py-2 px-2 min-w-0">
                      <div className="flex items-center gap-2 min-w-0">
                        <div
                          className={`w-5 h-5 rounded flex items-center justify-center text-[8px] font-bold shrink-0 border ${badge.bg} ${badge.text} ${badge.border}`}
                        >
                          {badge.initials}
                        </div>
                        <span className="font-medium text-text-primary text-xs truncate">
                          {s.team}
                        </span>
                      </div>
                    </td>

                    {/* P */}
                    <td className="py-2 px-1 text-center text-text-secondary text-xs">
                      {s.played}
                    </td>

                    {/* W, D, L (hidden on mobile) */}
                    <td className="py-2 px-1 text-center text-text-secondary text-xs hidden sm:table-cell">
                      {s.won}
                    </td>
                    <td className="py-2 px-1 text-center text-text-secondary text-xs hidden sm:table-cell">
                      {s.drawn}
                    </td>
                    <td className="py-2 px-1 text-center text-text-secondary text-xs hidden sm:table-cell">
                      {s.lost}
                    </td>

                    {/* GD */}
                    <td
                      className={`py-2 px-1 text-center text-xs font-mono ${
                        s.goalDifference > 0
                          ? "text-primary-lime font-medium"
                          : s.goalDifference < 0
                          ? "text-rose-400 font-medium"
                          : "text-text-tertiary"
                      }`}
                    >
                      {s.goalDifference > 0 ? `+${s.goalDifference}` : s.goalDifference}
                    </td>

                    {/* Pts */}
                    <td className="py-2 pr-3 pl-1 text-center">
                      <span className="font-bold text-xs text-text-primary">
                        {s.points}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  return (
    <div
      id="tournament-hub-root"
      className="min-h-screen w-full overflow-x-hidden bg-app-base text-text-primary font-body pb-24 selection:bg-primary-lime/30"
    >
      {/* 1. TOP MATCH CENTER BAR */}
      <header className="sticky top-0 z-40 bg-surface-card/95 backdrop-blur-md border-b border-border-subtle px-3 sm:px-4 py-2">
        <div className="max-w-4xl mx-auto flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <button
              onClick={() => navigate("/home")}
              className="w-7 h-7 rounded-lg bg-surface-raised border border-border-subtle flex items-center justify-center text-text-secondary hover:text-text-primary transition-colors cursor-pointer"
              title="Return to Home"
            >
              <ChevronLeft size={15} />
            </button>
            <div
              className="flex items-center gap-2 cursor-pointer"
              onClick={() => navigate("/home")}
            >
              <Logo size={22} showText={true} showTagline={false} variant="auto" />
            </div>
            <span className="hidden sm:inline-block text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-primary-lime/10 text-primary-lime border border-primary-lime/20">
              Tournament
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => {
                if (canManageTournament) {
                  navigate("/admin/tournaments");
                } else {
                  setOrganizerModalOpen(true);
                }
              }}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold text-black bg-primary-lime hover:bg-[#96E600] transition-colors cursor-pointer"
              title="Admin Score Portal"
            >
              <SlidersHorizontal size={12} />
              <span>Admin</span>
            </button>

            {liveCount > 0 && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-rose-500/15 text-rose-400 border border-rose-500/30">
                <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" />
                {liveCount} Live
              </span>
            )}

            <button
              onClick={handleShare}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium text-text-primary bg-surface-raised hover:bg-border-subtle border border-border-subtle transition-colors cursor-pointer"
              title="Share Link"
            >
              <Share2 size={12} className="text-primary-lime" />
              <span className="hidden sm:inline">Share</span>
            </button>
          </div>
        </div>
      </header>

      {/* 2. STREAMLINED HEADER */}
      <div className="max-w-4xl mx-auto px-4 pt-4 pb-2">
        <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-1">
          <div>
            <h1
              id="heading-tournament-hub"
              className="text-lg sm:text-xl font-bold text-text-primary tracking-tight"
            >
              WEHAT Soccer Tournament
            </h1>
            <p className="text-xs text-text-tertiary mt-0.5">
              Season 2 · Matchday 3 · Tal Olympic Park / Bayern Munyonyo
            </p>
          </div>
          <p className="text-xs text-text-secondary sm:text-right">
            16 Clubs · 4 Groups · 24 Matches
          </p>
        </div>
      </div>

      {/* 3. PRIMARY NAVIGATION TABS */}
      <div className="max-w-4xl mx-auto px-4 sticky top-[45px] z-30 bg-app-base/95 backdrop-blur-md py-2 border-b border-border-subtle/50">
        <div
          id="tournament-tabs-bar"
          className="flex items-center gap-1 p-1 bg-surface-card border border-border-subtle rounded-xl"
        >
          {/* Tab 1: Matches */}
          <button
            id="tab-fixtures"
            onClick={() => setActiveTab("fixtures")}
            className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              activeTab === "fixtures"
                ? "bg-surface-raised text-text-primary border border-border-subtle shadow-xs font-bold"
                : "text-text-secondary hover:text-text-primary"
            }`}
          >
            <Clock
              size={13}
              className={activeTab === "fixtures" ? "text-primary-lime" : "text-text-tertiary"}
            />
            <span>Matches</span>
            {liveCount > 0 && (
              <span className="w-1.5 h-1.5 rounded-full bg-primary-lime animate-pulse shrink-0" />
            )}
          </button>

          {/* Tab 2: Standings */}
          <button
            id="tab-standings"
            onClick={() => setActiveTab("stands")}
            className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              activeTab === "stands"
                ? "bg-surface-raised text-text-primary border border-border-subtle shadow-xs font-bold"
                : "text-text-secondary hover:text-text-primary"
            }`}
          >
            <Trophy
              size={13}
              className={activeTab === "stands" ? "text-primary-lime" : "text-text-tertiary"}
            />
            <span>Standings</span>
          </button>

          {/* Tab 3: Goal Scorers */}
          <button
            id="tab-scorers"
            onClick={() => setActiveTab("scorers")}
            className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              activeTab === "scorers"
                ? "bg-surface-raised text-text-primary border border-border-subtle shadow-xs font-bold"
                : "text-text-secondary hover:text-text-primary"
            }`}
          >
            <Flame
              size={13}
              className={activeTab === "scorers" ? "text-primary-lime" : "text-text-tertiary"}
            />
            <span>Scorers</span>
          </button>

          {/* Tab 4: Squads */}
          <button
            id="tab-rosters"
            onClick={() => setActiveTab("rosters")}
            className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              activeTab === "rosters"
                ? "bg-surface-raised text-text-primary border border-border-subtle shadow-xs font-bold"
                : "text-text-secondary hover:text-text-primary"
            }`}
          >
            <Users
              size={13}
              className={activeTab === "rosters" ? "text-primary-lime" : "text-text-tertiary"}
            />
            <span>Squads</span>
          </button>
        </div>
      </div>

      {/* 4. TAB CONTENTS */}
      <main className="max-w-4xl mx-auto px-3 sm:px-4 pt-1">
        {/* ======================================================== */}
        {/* TAB 1: STANDINGS / LEADERBOARD */}
        {/* ======================================================== */}
        {activeTab === "stands" && (
          <div id="panel-standings" className="space-y-3 animate-fadeIn scroll-mt-24">
            {/* View Switcher & Minimal notice */}
            <div className="flex items-center justify-between gap-2 px-1">
              <div className="flex items-center gap-1 bg-surface-card p-0.5 rounded-lg border border-border-subtle text-xs">
                <button
                  id="btn-subview-groups"
                  onClick={() => setStandingsSubView("groups")}
                  className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs transition-all cursor-pointer ${
                    standingsSubView === "groups"
                      ? "bg-surface-raised text-text-primary font-bold border border-border-subtle shadow-xs"
                      : "text-text-secondary hover:text-text-primary"
                  }`}
                >
                  <LayoutGrid size={12} />
                  <span>Groups</span>
                </button>
                <button
                  id="btn-subview-leaderboard"
                  onClick={() => setStandingsSubView("leaderboard")}
                  className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs transition-all cursor-pointer ${
                    standingsSubView === "leaderboard"
                      ? "bg-surface-raised text-text-primary font-bold border border-border-subtle shadow-xs"
                      : "text-text-secondary hover:text-text-primary"
                  }`}
                >
                  <Trophy size={12} />
                  <span>Overall Table</span>
                </button>
              </div>

              <span className="text-[11px] text-text-tertiary">
                Top 2 advance to Knockouts
              </span>
            </div>

            {/* Sub-view Content */}
            {standingsSubView === "leaderboard" ? (
              <TournamentLeaderboard
                tournamentId={tournamentId}
                fixtures={fixtures}
                onNavigateToFixtures={() => setActiveTab("fixtures")}
              />
            ) : (
              <>
                {/* Group Selector */}
                <div className="flex items-center gap-1 overflow-x-auto scrollbar-none pb-0.5">
                  {(
                    [
                      { id: "all-groups", label: "All Groups" },
                      { id: "Group A", label: "Group A" },
                      { id: "Group B", label: "Group B" },
                      { id: "Group C", label: "Group C" },
                      { id: "Group D", label: "Group D" },
                    ] as const
                  ).map((grp) => {
                    const isSelected = groupFilter === grp.id;

                    return (
                      <button
                        key={grp.id}
                        id={`tab-group-${grp.id.toLowerCase().replace(" ", "-")}`}
                        onClick={() => setGroupFilter(grp.id)}
                        className={`px-2.5 py-1 rounded-lg text-xs transition-all cursor-pointer whitespace-nowrap ${
                          isSelected
                            ? "bg-surface-raised text-text-primary font-bold border border-border-subtle shadow-xs"
                            : "text-text-secondary hover:text-text-primary hover:bg-surface-raised/50"
                        }`}
                      >
                        {grp.label}
                      </button>
                    );
                  })}
                </div>

                {/* Standings Group Cards */}
                {groupFilter === "all-groups" ? (
                  <div className="space-y-3.5 w-full">
                    {GROUPS.map((grp) => renderGroupCard(grp))}
                  </div>
                ) : (
                  <div className="w-full">
                    {renderGroupCard(groupFilter)}
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* ======================================================== */}
        {/* TAB 2: FIXTURES */}
        {/* ======================================================== */}
        {activeTab === "fixtures" && (
          <div id="panel-fixtures" className="space-y-3.5 animate-fadeIn scroll-mt-24">
            {/* Clean Match Controls */}
            <div className="flex items-center justify-between gap-2 pb-1">
              <div className="flex items-center gap-1 overflow-x-auto scrollbar-none">
                {[
                  { id: "all", label: "All" },
                  { id: "md3", label: "Matchday 3" },
                  { id: "previous", label: "Results" },
                  { id: "live", label: `Live${liveMatches.length > 0 ? ` (${liveMatches.length})` : ""}` },
                ].map((m) => (
                  <button
                    key={m.id}
                    onClick={() => handleRoundFilterChange(m.id as RoundFilter)}
                    className={`px-2.5 py-1 rounded-lg text-xs transition-all cursor-pointer whitespace-nowrap ${
                      roundFilter === m.id
                        ? "bg-surface-raised text-text-primary font-bold border border-border-subtle shadow-xs"
                        : "text-text-secondary hover:text-text-primary"
                    }`}
                  >
                    {m.label}
                  </button>
                ))}
              </div>

              <div className="relative w-36 sm:w-48 shrink-0">
                <Search
                  size={12}
                  className="absolute left-2.5 top-1/2 -translate-y-1/2 text-text-tertiary"
                />
                <input
                  type="text"
                  placeholder="Filter club..."
                  value={fixtureSearch}
                  onChange={(e) => setFixtureSearch(e.target.value)}
                  className="w-full h-7 pl-7 pr-6 rounded-lg bg-surface-card border border-border-subtle text-xs text-text-primary placeholder:text-text-tertiary focus:outline-none focus:border-primary-lime/50 transition-colors"
                />
                {fixtureSearch && (
                  <button
                    onClick={() => setFixtureSearch("")}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-text-tertiary hover:text-text-primary"
                  >
                    <X size={10} />
                  </button>
                )}
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
              <div className="bg-surface-card rounded-xl border border-border-subtle p-8 text-center space-y-4 shadow-xs">
                <Clock size={32} className="text-text-secondary mx-auto" />
                <div className="space-y-1">
                  <p className="text-sm font-bold text-text-primary">No fixtures found for current filter</p>
                  <p className="text-xs text-text-secondary max-w-md mx-auto">
                    Try clearing your search or switching to Previous Results to explore all completed Matchday 1 and 2 scores.
                  </p>
                </div>
                <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
                  <button
                    onClick={() => {
                      setRoundFilter("all");
                      setFixtureFilter("all");
                      setFixtureGroupFilter("all");
                      setFixtureSearch("");
                    }}
                    className="px-4 py-2 rounded-xl bg-primary-lime text-black font-black text-xs hover:bg-[#96E600] transition-colors cursor-pointer shadow-xs active:scale-95"
                  >
                    View All 24 Matches
                  </button>
                  <button
                    onClick={() => {
                      setRoundFilter("previous");
                      setFixtureFilter("all");
                      setFixtureGroupFilter("all");
                      setFixtureSearch("");
                    }}
                    className="px-4 py-2 rounded-xl bg-surface-raised border border-border-subtle text-text-primary font-bold text-xs hover:bg-border-subtle transition-colors cursor-pointer active:scale-95"
                  >
                    View Previous Results (MD 1 & 2)
                  </button>
                  {fixtures.length === 0 && (
                    <button
                      onClick={handleQuickSeed}
                      className="px-4 py-2 rounded-xl bg-primary-lime text-black font-black text-xs hover:bg-[#96E600] transition-colors cursor-pointer"
                    >
                      Load Matchday Template
                    </button>
                  )}
                </div>
              </div>
            ) : (
              <div className="space-y-5">
                {/* 0. LIVE MATCHES (Only shown when a match is actually live or filtered to live) */}
                {liveMatches.length > 0 && (roundFilter === "all" || roundFilter === "live" || fixtureFilter === "live") && (
                  <div className="space-y-2 pb-1">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
                        <span className="text-xs font-bold text-rose-400 uppercase tracking-wider">Live Now</span>
                      </div>
                      <span className="text-[11px] text-text-tertiary">{liveMatches.length} in play</span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      {liveMatches.map((f) => (
                        <CleanFixtureCard
                          key={f.id}
                          fixture={f}
                          isLiveSection={true}
                          isRecentlyUpdated={recentlyUpdatedIds.has(f.id)}
                          canManage={canManageTournament}
                          onQuickEdit={() => openEditModal(f)}
                        />
                      ))}
                    </div>
                  </div>
                )}

                {/* 1. MATCHDAY 3 SECTION (UPCOMING GAMES) */}
                {(roundFilter === "all" || roundFilter === "md3") && md3Matches.length > 0 && (
                  <div className="space-y-2">
                    <div className="flex items-baseline justify-between pt-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-text-primary">Matchday 3</span>
                        <span className="text-[11px] text-text-tertiary">· Sat 26 Sept</span>
                      </div>
                      <span className="text-[11px] text-text-tertiary">{md3Matches.length} upcoming</span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      {md3Matches.map((f, idx) => (
                        <CleanFixtureCard
                          key={f.id}
                          fixture={f}
                          matchNumber={idx + 1}
                          isRecentlyUpdated={recentlyUpdatedIds.has(f.id)}
                          canManage={canManageTournament}
                          onQuickEdit={() => openEditModal(f)}
                        />
                      ))}
                    </div>
                  </div>
                )}

                {/* 2. MATCHDAY 2 SECTION (RESULTS) */}
                {(roundFilter === "all" || roundFilter === "previous" || roundFilter === "md2") && md2Matches.length > 0 && (
                  <div className="space-y-2 pt-2">
                    <div className="flex items-baseline justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-text-primary">Matchday 2</span>
                        <span className="text-[11px] text-text-tertiary">· Completed Results</span>
                      </div>
                      <span className="text-[11px] text-text-tertiary">{md2Matches.length} played</span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      {md2Matches.map((f) => (
                        <CleanFixtureCard
                          key={f.id}
                          fixture={f}
                          isRecentlyUpdated={recentlyUpdatedIds.has(f.id)}
                          canManage={canManageTournament}
                          onQuickEdit={() => openEditModal(f)}
                        />
                      ))}
                    </div>
                  </div>
                )}

                {/* 3. MATCHDAY 1 SECTION (RESULTS) */}
                {(roundFilter === "all" || roundFilter === "previous" || roundFilter === "md1") && md1Matches.length > 0 && (
                  <div className="space-y-2 pt-2">
                    <div className="flex items-baseline justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-text-primary">Matchday 1</span>
                        <span className="text-[11px] text-text-tertiary">· Opening Round</span>
                      </div>
                      <span className="text-[11px] text-text-tertiary">{md1Matches.length} played</span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      {md1Matches.map((f) => (
                        <CleanFixtureCard
                          key={f.id}
                          fixture={f}
                          isRecentlyUpdated={recentlyUpdatedIds.has(f.id)}
                          canManage={canManageTournament}
                          onQuickEdit={() => openEditModal(f)}
                        />
                      ))}
                    </div>
                  </div>
                )}

                {/* 4. OTHER FIXTURES / STAGES */}
                {otherMatches.length > 0 && (
                  <div className="space-y-2 pt-2">
                    <div className="flex items-baseline justify-between">
                      <span className="text-xs font-bold text-text-primary">Additional Fixtures</span>
                      <span className="text-[11px] text-text-tertiary">{otherMatches.length} matches</span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      {otherMatches.map((f) => (
                        <CleanFixtureCard
                          key={f.id}
                          fixture={f}
                          isRecentlyUpdated={recentlyUpdatedIds.has(f.id)}
                          canManage={canManageTournament}
                          onQuickEdit={() => openEditModal(f)}
                        />
                      ))}
                    </div>
                  </div>
                )}
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
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-text-primary">Top Scorers</span>
                <span className="text-[11px] text-text-tertiary">· Season 2</span>
              </div>
              <span className="text-[11px] text-text-tertiary">
                {scorers.length} Players · 64 Goals
              </span>
            </div>

            {/* Clean Search & Goal Filter Bar */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2">
              <div className="relative flex-1 sm:max-w-xs">
                <Search
                  size={12}
                  className="absolute left-2.5 top-1/2 -translate-y-1/2 text-text-tertiary"
                />
                <input
                  type="text"
                  value={scorerSearch}
                  onChange={(e) => setScorerSearch(e.target.value)}
                  placeholder="Filter player or club..."
                  className="w-full bg-surface-card border border-border-subtle rounded-lg pl-7 pr-7 py-1 text-xs text-text-primary placeholder:text-text-tertiary focus:outline-none focus:border-primary-lime/50 transition-colors"
                />
                {scorerSearch && (
                  <button
                    onClick={() => setScorerSearch("")}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-text-tertiary hover:text-text-primary p-0.5"
                  >
                    <X size={10} />
                  </button>
                )}
              </div>

              {/* Goal Count Filter (Segmented) */}
              <div className="flex items-center gap-1 overflow-x-auto scrollbar-none">
                {[
                  { id: "all", label: `All (${scorerCounts.all})` },
                  { id: "5", label: `5G (${scorerCounts.g5})` },
                  { id: "4", label: `4G (${scorerCounts.g4})` },
                  { id: "3", label: `3G (${scorerCounts.g3})` },
                  { id: "2", label: `2G (${scorerCounts.g2})` },
                  { id: "1", label: `1G (${scorerCounts.g1})` },
                ].map((pill) => (
                  <button
                    key={pill.id}
                    onClick={() => setScorerGoalFilter(pill.id)}
                    className={`px-2 py-0.5 rounded-md text-xs transition-all cursor-pointer whitespace-nowrap ${
                      scorerGoalFilter === pill.id
                        ? "bg-surface-raised text-text-primary font-bold border border-border-subtle shadow-xs"
                        : "text-text-secondary hover:text-text-primary hover:bg-surface-raised/50"
                    }`}
                  >
                    {pill.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Scorers List */}
            {loading && scorers.length === 0 ? (
              <div className="space-y-2">
                {[1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className="bg-surface-card rounded-lg border border-border-subtle p-3 h-12 animate-pulse"
                  />
                ))}
              </div>
            ) : filteredScorers.length === 0 ? (
              <div className="bg-surface-card rounded-xl border border-border-subtle p-6 text-center space-y-2">
                <p className="text-xs text-text-secondary">
                  {scorers.length === 0
                    ? "No goals recorded yet."
                    : "No scorers match your search."}
                </p>
              </div>
            ) : (
              <div className="bg-surface-card rounded-xl border border-border-subtle overflow-hidden shadow-xs">
                {/* Table Header */}
                <div className="px-3.5 py-2 bg-surface-raised/40 border-b border-border-subtle text-[10px] font-bold uppercase tracking-wider text-text-tertiary flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <span className="w-5 text-center">#</span>
                    <span>Player &amp; Club</span>
                  </div>
                  <span>Goals</span>
                </div>

                <div className="divide-y divide-border-subtle/30">
                  {filteredScorers.map((s, index) => {
                    const badge = getTeamBadge(s.teamName);
                    const isGold = index === 0 && !scorerSearch && scorerGoalFilter === "all";
                    const isSilver = index === 1 && !scorerSearch && scorerGoalFilter === "all";
                    const isBronze = index === 2 && !scorerSearch && scorerGoalFilter === "all";

                    return (
                      <div
                        key={s.id}
                        className="px-3.5 py-2.5 flex items-center justify-between gap-3 hover:bg-surface-raised/30 transition-colors"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          {/* Rank */}
                          <div className="w-5 text-center font-bold text-xs shrink-0 text-text-tertiary">
                            {isGold ? (
                              <span className="text-amber-400 font-bold">1</span>
                            ) : isSilver ? (
                              <span className="text-slate-300 font-bold">2</span>
                            ) : isBronze ? (
                              <span className="text-amber-600 font-bold">3</span>
                            ) : (
                              <span>{index + 1}</span>
                            )}
                          </div>

                          {/* Monogram */}
                          <div
                            className={`w-6 h-6 rounded flex items-center justify-center text-[9px] font-bold shrink-0 border ${badge.bg} ${badge.text} ${badge.border}`}
                          >
                            {badge.initials}
                          </div>

                          {/* Player & Club */}
                          <div className="min-w-0">
                            <p className="text-xs font-semibold text-text-primary truncate">
                              {s.playerName}
                            </p>
                            <p className="text-[10px] text-text-tertiary truncate">{s.teamName}</p>
                          </div>
                        </div>

                        {/* Goal Count */}
                        <div className="flex items-center gap-1 shrink-0 px-2 py-0.5 rounded-md bg-surface-raised border border-border-subtle text-text-primary text-xs font-bold">
                          <Flame size={12} className="text-primary-lime" />
                          <span>{s.goals}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ======================================================== */}
        {/* VIEW 4: ROSTERS                                         */}
        {/* ======================================================== */}
        {activeTab === "rosters" && (
          <div className="max-w-4xl mx-auto mt-4">
            <TournamentSquads teams={teams} players={players} />
          </div>
        )}
      </main>

      {/* 5. MINIMAL CLEAN FOOTER */}
      <footer className="max-w-4xl mx-auto px-4 pt-8 pb-20 text-center text-xs text-text-tertiary space-y-1">
        <p className="font-semibold text-text-secondary">
          One Tournament, One Family • Football Unites Us
        </p>
        <p className="text-[11px] text-text-tertiary">
          Respect • Fair Play • Team Spirit • Great Games
        </p>
        <p className="text-[11px] text-text-tertiary pt-1">
          WEHAT Soccer Tournament • Second Edition 2026 • Powered by Pitchly
        </p>
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
                className="px-3 py-1.5 rounded-lg text-xs font-bold bg-primary-lime text-black flex items-center gap-1 shrink-0 cursor-pointer active:scale-95"
              >
                {copiedLink ? <Check size={13} /> : <Copy size={13} />}
                {copiedLink ? "Copied" : "Copy"}
              </button>
            </div>

            <button
              onClick={() => {
                const text = encodeURIComponent(
                  `🏆 Follow WEHAT Soccer Tournament Season 2 Live Scores, Upcoming Games & Results on Pitchly:\n${publicUrl}`
                );
                window.open(`https://api.whatsapp.com/send?text=${text}`, "_blank");
              }}
              className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer shadow-xs active:scale-95"
            >
              <Share2 size={14} />
              <span>Share to WhatsApp</span>
            </button>
          </div>
        </div>
      )}

      {/* ORGANIZER SCORE UPDATE ACCESS MODAL */}
      {organizerModalOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn"
          onClick={() => setOrganizerModalOpen(false)}
        >
          <div
            className="bg-surface-card rounded-2xl border border-border-subtle p-5 max-w-sm w-full space-y-4 shadow-2xl relative"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-border-subtle pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-primary-lime/15 border border-primary-lime/30 text-primary-lime flex items-center justify-center">
                  <KeyRound size={16} />
                </div>
                <div>
                  <h3 className="text-xs font-black uppercase text-text-primary">
                    Organizer Score Access
                  </h3>
                  <p className="text-[10px] text-text-secondary">
                    Authorized for sdde32@gmail.com
                  </p>
                </div>
              </div>
              <button
                onClick={() => setOrganizerModalOpen(false)}
                className="w-7 h-7 rounded-lg bg-surface-raised flex items-center justify-center text-text-secondary hover:text-text-primary cursor-pointer"
              >
                <X size={14} />
              </button>
            </div>

            {organizerPasscodeError && (
              <p className="text-[11px] font-bold text-[#EF4444] bg-[#EF4444]/10 p-2 rounded-lg border border-[#EF4444]/20">
                {organizerPasscodeError}
              </p>
            )}

            <form
              onSubmit={(e) => {
                e.preventDefault();
                const code = organizerPasscode.trim().toLowerCase();
                if (code === "wehat2026" || code === "admin" || code === "sdde32" || code === "pitchly") {
                  try {
                    localStorage.setItem("pitchly_organizer_access", "true");
                    sessionStorage.setItem("pitchly_organizer_access", "true");
                  } catch {}
                  setPitchsideAuth(true);
                  setOrganizerModalOpen(false);
                  navigate("/admin/tournaments");
                } else {
                  setOrganizerPasscodeError("Incorrect passcode. Try 'wehat2026' or sign in with Google.");
                }
              }}
              className="space-y-3"
            >
              <div>
                <label className="block text-[10px] font-bold text-text-secondary uppercase mb-1">
                  Pitchside Organizer Passcode
                </label>
                <input
                  type="password"
                  value={organizerPasscode}
                  onChange={(e) => {
                    setOrganizerPasscode(e.target.value);
                    setOrganizerPasscodeError("");
                  }}
                  placeholder="Enter passcode (e.g. wehat2026)"
                  className="w-full h-10 px-3 bg-app-base border border-border-subtle rounded-xl text-xs text-text-primary focus:border-primary-lime text-center tracking-wider"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2.5 rounded-xl bg-primary-lime hover:bg-[#96E600] text-black font-black text-xs uppercase tracking-wider transition-colors cursor-pointer shadow-xs"
              >
                Unlock Organizer Portal
              </button>
            </form>

            <div className="relative flex items-center justify-center">
              <div className="border-t border-border-subtle w-full" />
              <span className="bg-surface-card px-2 text-[9px] uppercase font-bold text-text-tertiary absolute">
                Or Sign In
              </span>
            </div>

            <button
              type="button"
              onClick={async () => {
                try {
                  await signInWithGoogle();
                  setOrganizerModalOpen(false);
                  navigate("/admin/tournaments");
                } catch (err: any) {
                  setOrganizerPasscodeError(err?.message || "Google sign-in failed");
                }
              }}
              className="w-full py-2.5 rounded-xl bg-surface-raised hover:bg-border-subtle border border-border-subtle text-text-primary font-bold text-xs flex items-center justify-center gap-2 cursor-pointer transition-colors"
            >
              <span>Sign In with Google</span>
            </button>
          </div>
        </div>
      )}

      {/* 6. ADMIN MATCH RESULT UPDATER MODAL */}
      {adminModalOpen && selectedFixtureToUpdate && (
        <div
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-fadeIn"
          onClick={() => setAdminModalOpen(false)}
        >
          <div
            className="bg-surface-card rounded-2xl border border-border-subtle p-4 sm:p-5 max-w-md w-full space-y-4 shadow-2xl relative"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-border-subtle pb-3">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-primary-lime/20 text-primary-lime flex items-center justify-center">
                  <Zap size={15} />
                </div>
                <div>
                  <h3 className="text-xs sm:text-sm font-bold text-text-primary">
                    Update Match Score &amp; Live Result
                  </h3>
                  <p className="text-[10px] text-text-tertiary">
                    Instant sync to fans • Season 2 Match Center
                  </p>
                </div>
              </div>
              <button
                onClick={() => setAdminModalOpen(false)}
                className="w-7 h-7 rounded-lg bg-surface-raised flex items-center justify-center text-text-secondary hover:text-text-primary cursor-pointer"
              >
                <X size={15} />
              </button>
            </div>

            {/* Match Select dropdown */}
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-text-tertiary uppercase tracking-wider block">
                Select Fixture to Update
              </label>
              <select
                value={selectedFixtureToUpdate.id}
                onChange={(e) => {
                  const match = fixtures.find((f) => f.id === e.target.value);
                  if (match) openEditModal(match);
                }}
                className="w-full h-9 bg-surface-raised border border-border-subtle rounded-xl px-3 text-xs text-text-primary font-semibold focus:border-primary-lime cursor-pointer"
              >
                {fixtures.map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.round || "Match"} • {f.homeTeam} vs {f.awayTeam} ({f.time || f.status})
                  </option>
                ))}
              </select>
            </div>

            {/* Match Status Selector */}
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-text-tertiary uppercase tracking-wider block">
                Match Status
              </label>
              <div className="grid grid-cols-3 gap-1.5 p-1 bg-surface-raised rounded-xl border border-border-subtle">
                {(
                  [
                    { id: "upcoming", label: "Upcoming" },
                    { id: "live", label: "🔴 LIVE" },
                    { id: "finished", label: "Full Time (FT)" },
                  ] as { id: FixtureStatus; label: string }[]
                ).map((st) => (
                  <button
                    key={st.id}
                    type="button"
                    onClick={() => {
                      setUpdatingScore((prev) => ({
                        ...prev,
                        status: st.id,
                        time:
                          st.id === "live"
                            ? "LIVE"
                            : st.id === "finished"
                            ? "FT"
                            : selectedFixtureToUpdate.time || "2:30 PM",
                      }));
                    }}
                    className={`py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      updatingScore.status === st.id
                        ? "bg-primary-lime text-black font-black shadow-xs"
                        : "text-text-secondary hover:text-text-primary"
                    }`}
                  >
                    {st.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Score Steppers */}
            <div className="bg-surface-raised/60 p-3 rounded-xl border border-border-subtle space-y-2.5">
              <div className="flex items-center justify-between gap-3">
                {/* Home Team Stepper */}
                <div className="flex-1 text-center min-w-0">
                  <span className="text-[11px] font-bold text-text-primary truncate block mb-1">
                    {selectedFixtureToUpdate.homeTeam}
                  </span>
                  <div className="flex items-center justify-center gap-1.5">
                    <button
                      type="button"
                      onClick={() =>
                        setUpdatingScore((prev) => ({
                          ...prev,
                          homeScore: Math.max(0, prev.homeScore - 1),
                        }))
                      }
                      className="w-8 h-8 rounded-lg bg-surface-card border border-border-subtle hover:bg-surface-raised flex items-center justify-center font-bold text-text-primary cursor-pointer active:scale-95"
                    >
                      <Minus size={13} />
                    </button>
                    <input
                      type="number"
                      min="0"
                      value={updatingScore.homeScore}
                      onChange={(e) =>
                        setUpdatingScore((prev) => ({
                          ...prev,
                          homeScore: Math.max(0, parseInt(e.target.value, 10) || 0),
                        }))
                      }
                      className="w-12 h-9 text-center bg-surface-card border border-border-subtle rounded-lg font-black text-sm text-text-primary focus:border-primary-lime"
                    />
                    <button
                      type="button"
                      onClick={() =>
                        setUpdatingScore((prev) => ({
                          ...prev,
                          homeScore: prev.homeScore + 1,
                        }))
                      }
                      className="w-8 h-8 rounded-lg bg-surface-card border border-border-subtle hover:bg-surface-raised flex items-center justify-center font-bold text-text-primary cursor-pointer active:scale-95"
                    >
                      <Plus size={13} />
                    </button>
                  </div>
                </div>

                <span className="text-xs font-bold text-text-tertiary mt-4">:</span>

                {/* Away Team Stepper */}
                <div className="flex-1 text-center min-w-0">
                  <span className="text-[11px] font-bold text-text-primary truncate block mb-1">
                    {selectedFixtureToUpdate.awayTeam}
                  </span>
                  <div className="flex items-center justify-center gap-1.5">
                    <button
                      type="button"
                      onClick={() =>
                        setUpdatingScore((prev) => ({
                          ...prev,
                          awayScore: Math.max(0, prev.awayScore - 1),
                        }))
                      }
                      className="w-8 h-8 rounded-lg bg-surface-card border border-border-subtle hover:bg-surface-raised flex items-center justify-center font-bold text-text-primary cursor-pointer active:scale-95"
                    >
                      <Minus size={13} />
                    </button>
                    <input
                      type="number"
                      min="0"
                      value={updatingScore.awayScore}
                      onChange={(e) =>
                        setUpdatingScore((prev) => ({
                          ...prev,
                          awayScore: Math.max(0, parseInt(e.target.value, 10) || 0),
                        }))
                      }
                      className="w-12 h-9 text-center bg-surface-card border border-border-subtle rounded-lg font-black text-sm text-text-primary focus:border-primary-lime"
                    />
                    <button
                      type="button"
                      onClick={() =>
                        setUpdatingScore((prev) => ({
                          ...prev,
                          awayScore: prev.awayScore + 1,
                        }))
                      }
                      className="w-8 h-8 rounded-lg bg-surface-card border border-border-subtle hover:bg-surface-raised flex items-center justify-center font-bold text-text-primary cursor-pointer active:scale-95"
                    >
                      <Plus size={13} />
                    </button>
                  </div>
                </div>
              </div>

              {/* Match Minute / Time text */}
              <div className="pt-2 border-t border-border-subtle/50 flex items-center gap-2">
                <span className="text-[10px] text-text-tertiary font-bold uppercase shrink-0">
                  Clock / Time:
                </span>
                <input
                  type="text"
                  placeholder="e.g. 45', HT, 78', FT, or 2:00 PM"
                  value={updatingScore.time}
                  onChange={(e) =>
                    setUpdatingScore((prev) => ({ ...prev, time: e.target.value }))
                  }
                  className="flex-1 h-7 bg-surface-card border border-border-subtle rounded-lg px-2 text-xs font-mono text-text-primary"
                />
              </div>
            </div>

            {/* Scorers input */}
            <div className="space-y-2 text-xs">
              <div>
                <label className="text-[10px] font-bold text-text-tertiary uppercase tracking-wider block mb-0.5">
                  {selectedFixtureToUpdate.homeTeam} Goal Scorers (Comma separated)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Raymond Junior 23', Raymond Junior 68'"
                  value={updatingScore.homeScorersText}
                  onChange={(e) =>
                    setUpdatingScore((prev) => ({
                      ...prev,
                      homeScorersText: e.target.value,
                    }))
                  }
                  className="w-full h-8 bg-surface-raised border border-border-subtle rounded-lg px-2.5 text-xs text-text-primary"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-text-tertiary uppercase tracking-wider block mb-0.5">
                  {selectedFixtureToUpdate.awayTeam} Goal Scorers (Comma separated)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Nyanzi Shafik 41'"
                  value={updatingScore.awayScorersText}
                  onChange={(e) =>
                    setUpdatingScore((prev) => ({
                      ...prev,
                      awayScorersText: e.target.value,
                    }))
                  }
                  className="w-full h-8 bg-surface-raised border border-border-subtle rounded-lg px-2.5 text-xs text-text-primary"
                />
              </div>
            </div>

            {/* Submit & Links */}
            <div className="pt-2 space-y-2">
              <button
                type="button"
                onClick={handleSaveScoreUpdate}
                disabled={isSavingScore}
                className="w-full py-2.5 rounded-xl bg-primary-lime hover:bg-[#96E600] text-black font-black text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-xs active:scale-95 disabled:opacity-50"
              >
                <Save size={14} />
                <span>{isSavingScore ? "Broadcasting Update..." : "Publish Live Score"}</span>
              </button>

              <div className="flex items-center justify-between text-[11px] pt-1 text-text-tertiary">
                <span>Broadcasts immediately to fans.</span>
                <button
                  type="button"
                  onClick={() => {
                    setAdminModalOpen(false);
                    navigate("/admin/tournaments");
                  }}
                  className="text-primary-lime hover:underline inline-flex items-center gap-0.5 cursor-pointer font-bold"
                >
                  <span>Admin Console</span>
                  <ExternalLink size={10} />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* UPDATE TOAST NOTIFICATION */}
      {updateToast && (
        <div className="fixed bottom-6 right-6 z-50 bg-primary-lime text-black font-bold text-xs px-4 py-2.5 rounded-xl shadow-lg flex items-center gap-2 animate-bounce">
          <Check size={16} />
          <span>{updateToast}</span>
        </div>
      )}
    </div>
  );
};

// ==========================================
// SUB-COMPONENT: CLEAN FIXTURE CARD
// ==========================================
const CleanFixtureCard: React.FC<{
  fixture: TournamentFixture;
  matchNumber?: number;
  canManage?: boolean;
  onQuickEdit?: () => void;
  isRecentlyUpdated?: boolean;
  isLiveSection?: boolean;
}> = ({ fixture, canManage, onQuickEdit, isRecentlyUpdated, isLiveSection }) => {
  const isLive = fixture.status === "live";
  const homeBadge = getTeamBadge(fixture.homeTeam);
  const awayBadge = getTeamBadge(fixture.awayTeam);
  const hasScores = fixture.homeScore !== null && fixture.awayScore !== null;
  const homeWon = (fixture.homeScore || 0) > (fixture.awayScore || 0);
  const awayWon = (fixture.awayScore || 0) > (fixture.homeScore || 0);
  const hasScorers = (fixture.homeScorers && fixture.homeScorers.length > 0) || (fixture.awayScorers && fixture.awayScorers.length > 0);

  return (
    <div
      className={`rounded-xl border bg-surface-card p-3 transition-colors ${
        isLive || isLiveSection
          ? "border-rose-500/40"
          : isRecentlyUpdated
          ? "border-primary-lime ring-1 ring-primary-lime/40"
          : "border-border-subtle hover:border-border-prominent"
      }`}
    >
      {/* Top Header Row: Group/Round & Time */}
      <div className="flex items-center justify-between text-[11px] text-text-tertiary mb-2">
        <div className="flex items-center gap-1.5 truncate">
          {fixture.group && (
            <span className="font-semibold text-text-secondary">{fixture.group}</span>
          )}
          {fixture.group && <span>·</span>}
          <span className="truncate">{fixture.round || "Match"}</span>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {canManage && onQuickEdit && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onQuickEdit();
              }}
              className="text-[10px] text-primary-lime hover:underline font-medium cursor-pointer"
            >
              Edit
            </button>
          )}

          {isLive || isLiveSection ? (
            <span className="inline-flex items-center gap-1 font-semibold text-rose-400 text-[10px] uppercase">
              <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" />
              <span>{fixture.time && fixture.time !== "LIVE" ? fixture.time : "Live"}</span>
            </span>
          ) : fixture.status === "finished" ? (
            <span className="text-[10px] text-text-tertiary font-medium">FT</span>
          ) : (
            <span className="text-[10px] text-text-secondary font-medium">{fixture.time}</span>
          )}
        </div>
      </div>

      {/* Clubs & Scores (Vertical 2-row layout prevents any truncation or collision) */}
      <div className="space-y-1.5 py-0.5">
        {/* Home Team */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <div
              className={`w-5 h-5 rounded flex items-center justify-center text-[8px] font-bold shrink-0 border ${homeBadge.bg} ${homeBadge.text} ${homeBadge.border}`}
            >
              {homeBadge.initials}
            </div>
            <span
              className={`text-xs truncate ${
                homeWon ? "font-bold text-text-primary" : "text-text-secondary"
              }`}
            >
              {fixture.homeTeam}
            </span>
          </div>
          <span
            className={`text-xs font-mono font-bold shrink-0 min-w-[20px] text-right ${
              hasScores ? (homeWon ? "text-primary-lime font-black" : "text-text-primary") : "text-text-tertiary"
            }`}
          >
            {hasScores ? fixture.homeScore : "-"}
          </span>
        </div>

        {/* Away Team */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <div
              className={`w-5 h-5 rounded flex items-center justify-center text-[8px] font-bold shrink-0 border ${awayBadge.bg} ${awayBadge.text} ${awayBadge.border}`}
            >
              {awayBadge.initials}
            </div>
            <span
              className={`text-xs truncate ${
                awayWon ? "font-bold text-text-primary" : "text-text-secondary"
              }`}
            >
              {fixture.awayTeam}
            </span>
          </div>
          <span
            className={`text-xs font-mono font-bold shrink-0 min-w-[20px] text-right ${
              hasScores ? (awayWon ? "text-primary-lime font-black" : "text-text-primary") : "text-text-tertiary"
            }`}
          >
            {hasScores ? fixture.awayScore : "-"}
          </span>
        </div>
      </div>

      {/* Scorers footer only if available */}
      {hasScorers && (
        <div className="mt-2 pt-1.5 border-t border-border-subtle/30 text-[10px] text-text-tertiary flex items-center justify-between gap-2">
          <span className="truncate flex-1">
            {fixture.homeScorers && fixture.homeScorers.length > 0 && fixture.homeScorers.join(", ")}
          </span>
          <span className="truncate flex-1 text-right">
            {fixture.awayScorers && fixture.awayScorers.length > 0 && fixture.awayScorers.join(", ")}
          </span>
        </div>
      )}
    </div>
  );
};
