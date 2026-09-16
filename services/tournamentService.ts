import {
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  query,
  where,
  onSnapshot,
  runTransaction,
  writeBatch,
} from "firebase/firestore";
import { db } from "../lib/firebase";
import {
  TournamentFixture,
  TournamentScorer,
  TournamentNominee,
  TournamentPlayer,
  TournamentTeam,
  DEFAULT_TOURNAMENT,
} from "../types/tournament";

const FIXTURES_COLLECTION = "tournamentFixtures";
const SCORERS_COLLECTION = "tournamentScorers";
const NOMINEES_COLLECTION = "tournamentNominees";
const TEAMS_COLLECTION = "tournamentTeams";
const PLAYERS_COLLECTION = "tournamentPlayers";

// Fallback seed data for WEHAT Soccer Tournament (Season 2, Week 1)
const DEFAULT_WEHAT_FIXTURES: TournamentFixture[] = [
  {
    id: "wehat_fix_1",
    tournamentId: "wehat-s2-w1",
    time: "1:00 PM",
    homeTeam: "WEHAT FC",
    awayTeam: "DODGE AMO FC",
    homeScore: 3,
    awayScore: 1,
    status: "finished",
    pitchVenue: "Tal Olympic Stadium",
    round: "Week 1 Results",
    group: "Group A",
    homeScorers: ["Mark", "Doyo", "Raymond"],
    awayScorers: ["Joshua Alom"],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "wehat_fix_2",
    tournamentId: "wehat-s2-w1",
    time: "1:45 PM",
    homeTeam: "GENTLE FC",
    awayTeam: "INVESTORS FC",
    homeScore: 3,
    awayScore: 4,
    status: "finished",
    pitchVenue: "Tal Olympic Stadium",
    round: "Week 1 Results",
    group: "Group A",
    homeScorers: ["Yawe", "Mukisa", "Kibirige"],
    awayScorers: ["Nyanzi Shafik (4)"],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "wehat_fix_3",
    tournamentId: "wehat-s2-w1",
    time: "2:30 PM",
    homeTeam: "BUNGA FC",
    awayTeam: "PRO PERFORMERS FC",
    homeScore: 5,
    awayScore: 3,
    status: "finished",
    pitchVenue: "Tal Olympic Stadium",
    round: "Week 1 Results",
    group: "Group B",
    homeScorers: ["Mark Jordan", "Magala Hassan", "Wasusimbi", "Own goal", "Ssempijja"],
    awayScorers: ["Latif", "Emir", "Shehu"],
    notes: "Heritiers (Red Card)",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "wehat_fix_4",
    tournamentId: "wehat-s2-w1",
    time: "3:15 PM",
    homeTeam: "LEGENDS FC",
    awayTeam: "SENIOR PLAYERS",
    homeScore: 2,
    awayScore: 0,
    status: "finished",
    pitchVenue: "Tal Olympic Stadium",
    round: "Week 1 Results",
    group: "Group B",
    homeScorers: ["Shafik Buranik", "Joshua Aronda"],
    awayScorers: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "wehat_fix_5",
    tournamentId: "wehat-s2-w1",
    time: "4:00 PM",
    homeTeam: "KIRUDDU FC",
    awayTeam: "BUSABALA FC",
    homeScore: 1,
    awayScore: 5,
    status: "finished",
    pitchVenue: "Tal Olympic Stadium",
    round: "Week 1 Results",
    group: "Group C",
    homeScorers: ["Ntege Peter"],
    awayScorers: ["David (2)", "Walele June", "Ssembatya Ashirf", "Bogere Sam"],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "wehat_fix_6",
    tournamentId: "wehat-s2-w1",
    time: "4:45 PM",
    homeTeam: "WEHAT SELECT",
    awayTeam: "BROTHER LOVE FC",
    homeScore: 4,
    awayScore: 0,
    status: "finished",
    pitchVenue: "Tal Olympic Stadium",
    round: "Week 1 Results",
    group: "Group C",
    homeScorers: ["Ladonia", "Jackson (3)"],
    awayScorers: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "wehat_fix_7",
    tournamentId: "wehat-s2-w1",
    time: "5:30 PM",
    homeTeam: "PURE HEARTS",
    awayTeam: "HMK",
    homeScore: 2,
    awayScore: 1,
    status: "finished",
    pitchVenue: "Tal Olympic Stadium",
    round: "Week 1 Results",
    group: "Group D",
    homeScorers: ["Paco", "Elijah"],
    awayScorers: ["Hussein"],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "wehat_fix_8",
    tournamentId: "wehat-s2-w1",
    time: "6:15 PM",
    homeTeam: "GOOD FRIENDS",
    awayTeam: "IMDAD FC",
    homeScore: 0,
    awayScore: 1,
    status: "finished",
    pitchVenue: "Tal Olympic Stadium",
    round: "Week 1 Results",
    group: "Group D",
    homeScorers: [],
    awayScorers: ["Mark"],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

const DEFAULT_WEHAT_SCORERS: TournamentScorer[] = [
  { id: "scr_1", tournamentId: "wehat-s2-w1", playerName: "Nyanzi Shafik", teamName: "INVESTORS FC", goals: 4 },
  { id: "scr_2", tournamentId: "wehat-s2-w1", playerName: "Jackson", teamName: "WEHAT SELECT", goals: 3 },
  { id: "scr_3", tournamentId: "wehat-s2-w1", playerName: "David", teamName: "BUSABALA FC", goals: 2 },
  { id: "scr_4", tournamentId: "wehat-s2-w1", playerName: "Mark", teamName: "WEHAT FC", goals: 1 },
  { id: "scr_5", tournamentId: "wehat-s2-w1", playerName: "Joshua Alom", teamName: "DODGE AMO FC", goals: 1 },
  { id: "scr_6", tournamentId: "wehat-s2-w1", playerName: "Doyo", teamName: "WEHAT FC", goals: 1 },
  { id: "scr_7", tournamentId: "wehat-s2-w1", playerName: "Raymond", teamName: "WEHAT FC", goals: 1 },
  { id: "scr_8", tournamentId: "wehat-s2-w1", playerName: "Yawe", teamName: "GENTLE FC", goals: 1 },
  { id: "scr_9", tournamentId: "wehat-s2-w1", playerName: "Mukisa", teamName: "GENTLE FC", goals: 1 },
  { id: "scr_10", tournamentId: "wehat-s2-w1", playerName: "Kibirige", teamName: "GENTLE FC", goals: 1 },
  { id: "scr_11", tournamentId: "wehat-s2-w1", playerName: "Mark Jordan", teamName: "BUNGA FC", goals: 1 },
  { id: "scr_12", tournamentId: "wehat-s2-w1", playerName: "Magala Hassan", teamName: "BUNGA FC", goals: 1 },
  { id: "scr_13", tournamentId: "wehat-s2-w1", playerName: "Wasusimbi", teamName: "BUNGA FC", goals: 1 },
  { id: "scr_14", tournamentId: "wehat-s2-w1", playerName: "Ssempijja", teamName: "BUNGA FC", goals: 1 },
  { id: "scr_15", tournamentId: "wehat-s2-w1", playerName: "Latif", teamName: "PRO PERFORMERS FC", goals: 1 },
  { id: "scr_16", tournamentId: "wehat-s2-w1", playerName: "Emir", teamName: "PRO PERFORMERS FC", goals: 1 },
  { id: "scr_17", tournamentId: "wehat-s2-w1", playerName: "Shehu", teamName: "PRO PERFORMERS FC", goals: 1 },
  { id: "scr_18", tournamentId: "wehat-s2-w1", playerName: "Shafik Buranik", teamName: "LEGENDS FC", goals: 1 },
  { id: "scr_19", tournamentId: "wehat-s2-w1", playerName: "Joshua Aronda", teamName: "LEGENDS FC", goals: 1 },
  { id: "scr_20", tournamentId: "wehat-s2-w1", playerName: "Ntege Peter", teamName: "KIRUDDU FC", goals: 1 },
  { id: "scr_21", tournamentId: "wehat-s2-w1", playerName: "Walele June", teamName: "BUSABALA FC", goals: 1 },
  { id: "scr_22", tournamentId: "wehat-s2-w1", playerName: "Ssembatya Ashirf", teamName: "BUSABALA FC", goals: 1 },
  { id: "scr_23", tournamentId: "wehat-s2-w1", playerName: "Bogere Sam", teamName: "BUSABALA FC", goals: 1 },
  { id: "scr_24", tournamentId: "wehat-s2-w1", playerName: "Ladonia", teamName: "WEHAT SELECT", goals: 1 },
  { id: "scr_25", tournamentId: "wehat-s2-w1", playerName: "Paco", teamName: "PURE HEARTS", goals: 1 },
  { id: "scr_26", tournamentId: "wehat-s2-w1", playerName: "Elijah", teamName: "PURE HEARTS", goals: 1 },
  { id: "scr_27", tournamentId: "wehat-s2-w1", playerName: "Hussein", teamName: "HMK", goals: 1 },
  { id: "scr_28", tournamentId: "wehat-s2-w1", playerName: "Mark", teamName: "IMDAD FC", goals: 1 },
];

const DEFAULT_WEHAT_NOMINEES: TournamentNominee[] = [
  {
    id: "wehat_motm_1",
    tournamentId: "wehat-s2-w1",
    nomineeName: "Nyanzi Shafik",
    teamName: "INVESTORS FC",
    position: "Striker (4 Goals)",
    photoUrl: "https://images.unsplash.com/photo-1508098682722-e99c43a406b2?w=150&auto=format&fit=crop&q=80",
    voteCount: 38,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "wehat_motm_2",
    tournamentId: "wehat-s2-w1",
    nomineeName: "Jackson",
    teamName: "WEHAT SELECT",
    position: "Forward (Hat-trick)",
    photoUrl: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=150&auto=format&fit=crop&q=80",
    voteCount: 29,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "wehat_motm_3",
    tournamentId: "wehat-s2-w1",
    nomineeName: "David",
    teamName: "BUSABALA FC",
    position: "Forward (2 Goals)",
    photoUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
    voteCount: 21,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "wehat_motm_4",
    tournamentId: "wehat-s2-w1",
    nomineeName: "Mark Jordan",
    teamName: "BUNGA FC",
    position: "Midfielder (1 Goal)",
    photoUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80",
    voteCount: 14,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

// In-memory / local reactive store
const memoryStore = {
  fixtures: new Map<string, TournamentFixture[]>(),
  scorers: new Map<string, TournamentScorer[]>(),
  nominees: new Map<string, TournamentNominee[]>(),
  teams: new Map<string, TournamentTeam[]>(),
  players: new Map<string, TournamentPlayer[]>(),
  fixtureSubscribers: new Map<string, Set<(fixtures: TournamentFixture[]) => void>>(),
  scorerSubscribers: new Map<string, Set<(scorers: TournamentScorer[]) => void>>(),
  nomineeSubscribers: new Map<string, Set<(nominees: TournamentNominee[]) => void>>(),
  teamSubscribers: new Map<string, Set<(teams: TournamentTeam[]) => void>>(),
  playerSubscribers: new Map<string, Set<(players: TournamentPlayer[]) => void>>(),
};

// Initialize default store for wehat-s2-w1
function getLocalFixtures(tournamentId: string): TournamentFixture[] {
  if (!memoryStore.fixtures.has(tournamentId)) {
    // Check localStorage
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem(`tourn_fixtures_${tournamentId}`);
      if (saved && saved.includes("INVESTORS FC")) {
        try {
          memoryStore.fixtures.set(tournamentId, JSON.parse(saved));
        } catch {
          memoryStore.fixtures.set(
            tournamentId,
            tournamentId === "wehat-s2-w1" ? [...DEFAULT_WEHAT_FIXTURES] : []
          );
        }
      } else {
        memoryStore.fixtures.set(
          tournamentId,
          tournamentId === "wehat-s2-w1" ? [...DEFAULT_WEHAT_FIXTURES] : []
        );
        if (tournamentId === "wehat-s2-w1") {
          localStorage.setItem(`tourn_fixtures_${tournamentId}`, JSON.stringify(DEFAULT_WEHAT_FIXTURES));
        }
      }
    } else {
      memoryStore.fixtures.set(
        tournamentId,
        tournamentId === "wehat-s2-w1" ? [...DEFAULT_WEHAT_FIXTURES] : []
      );
    }
  }
  return memoryStore.fixtures.get(tournamentId) || [];
}

function saveLocalFixtures(tournamentId: string, items: TournamentFixture[]) {
  memoryStore.fixtures.set(tournamentId, items);
  if (typeof window !== "undefined") {
    try {
      localStorage.setItem(`tourn_fixtures_${tournamentId}`, JSON.stringify(items));
    } catch {}
  }
  const subs = memoryStore.fixtureSubscribers.get(tournamentId);
  if (subs) {
    subs.forEach((cb) => cb([...items]));
  }
}

function getLocalScorers(tournamentId: string): TournamentScorer[] {
  if (!memoryStore.scorers.has(tournamentId)) {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem(`tourn_scorers_${tournamentId}`);
      if (saved && saved.includes("Nyanzi Shafik")) {
        try {
          memoryStore.scorers.set(tournamentId, JSON.parse(saved));
        } catch {
          memoryStore.scorers.set(
            tournamentId,
            tournamentId === "wehat-s2-w1" ? [...DEFAULT_WEHAT_SCORERS] : []
          );
        }
      } else {
        memoryStore.scorers.set(
          tournamentId,
          tournamentId === "wehat-s2-w1" ? [...DEFAULT_WEHAT_SCORERS] : []
        );
        if (tournamentId === "wehat-s2-w1") {
          localStorage.setItem(`tourn_scorers_${tournamentId}`, JSON.stringify(DEFAULT_WEHAT_SCORERS));
        }
      }
    } else {
      memoryStore.scorers.set(
        tournamentId,
        tournamentId === "wehat-s2-w1" ? [...DEFAULT_WEHAT_SCORERS] : []
      );
    }
  }
  return memoryStore.scorers.get(tournamentId) || [];
}

function saveLocalScorers(tournamentId: string, items: TournamentScorer[]) {
  memoryStore.scorers.set(tournamentId, items);
  if (typeof window !== "undefined") {
    try {
      localStorage.setItem(`tourn_scorers_${tournamentId}`, JSON.stringify(items));
    } catch {}
  }
  const subs = memoryStore.scorerSubscribers.get(tournamentId);
  if (subs) {
    subs.forEach((cb) => cb([...items]));
  }
}

function getLocalNominees(tournamentId: string): TournamentNominee[] {
  if (!memoryStore.nominees.has(tournamentId)) {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem(`tourn_nominees_${tournamentId}`);
      if (saved && saved.includes("Nyanzi Shafik")) {
        try {
          memoryStore.nominees.set(tournamentId, JSON.parse(saved));
        } catch {
          memoryStore.nominees.set(
            tournamentId,
            tournamentId === "wehat-s2-w1" ? [...DEFAULT_WEHAT_NOMINEES] : []
          );
        }
      } else {
        memoryStore.nominees.set(
          tournamentId,
          tournamentId === "wehat-s2-w1" ? [...DEFAULT_WEHAT_NOMINEES] : []
        );
        if (tournamentId === "wehat-s2-w1") {
          localStorage.setItem(`tourn_nominees_${tournamentId}`, JSON.stringify(DEFAULT_WEHAT_NOMINEES));
        }
      }
    } else {
      memoryStore.nominees.set(
        tournamentId,
        tournamentId === "wehat-s2-w1" ? [...DEFAULT_WEHAT_NOMINEES] : []
      );
    }
  }
  return memoryStore.nominees.get(tournamentId) || [];
}

function saveLocalNominees(tournamentId: string, items: TournamentNominee[]) {
  memoryStore.nominees.set(tournamentId, items);
  if (typeof window !== "undefined") {
    try {
      localStorage.setItem(`tourn_nominees_${tournamentId}`, JSON.stringify(items));
    } catch {}
  }
  const subs = memoryStore.nomineeSubscribers.get(tournamentId);
  if (subs) {
    subs.forEach((cb) => cb([...items]));
  }
}

// Teams & Players initial registration data for WEHAT
const DEFAULT_WEHAT_TEAMS: TournamentTeam[] = [
  { id: "tm_1", tournamentId: "wehat-s2-w1", teamName: "WEHAT FC", group: "Group A", managerName: "Coach David", badgeInitials: "WFC" },
  { id: "tm_2", tournamentId: "wehat-s2-w1", teamName: "DODGE AMO FC", group: "Group A", managerName: "Coach Amo", badgeInitials: "DAF" },
  { id: "tm_3", tournamentId: "wehat-s2-w1", teamName: "GENTLE FC", group: "Group A", managerName: "Coach Mukisa", badgeInitials: "GFC" },
  { id: "tm_4", tournamentId: "wehat-s2-w1", teamName: "INVESTORS FC", group: "Group A", managerName: "Coach Shafik", badgeInitials: "IFC" },
  { id: "tm_5", tournamentId: "wehat-s2-w1", teamName: "BUNGA FC", group: "Group B", managerName: "Coach Jordan", badgeInitials: "BFC" },
  { id: "tm_6", tournamentId: "wehat-s2-w1", teamName: "PRO PERFORMERS FC", group: "Group B", managerName: "Coach Brian", badgeInitials: "PPF" },
  { id: "tm_7", tournamentId: "wehat-s2-w1", teamName: "LEGENDS FC", group: "Group B", managerName: "Coach Alex", badgeInitials: "LFC" },
  { id: "tm_8", tournamentId: "wehat-s2-w1", teamName: "SENIOR PLAYERS", group: "Group B", managerName: "Coach Senior", badgeInitials: "SPF" },
  { id: "tm_9", tournamentId: "wehat-s2-w1", teamName: "KIRUDDU FC", group: "Group C", managerName: "Coach Hassan", badgeInitials: "KFC" },
  { id: "tm_10", tournamentId: "wehat-s2-w1", teamName: "BUSABALA FC", group: "Group C", managerName: "Coach David", badgeInitials: "BFC" },
  { id: "tm_11", tournamentId: "wehat-s2-w1", teamName: "WEHAT SELECT", group: "Group C", managerName: "Coach Jackson", badgeInitials: "WS" },
  { id: "tm_12", tournamentId: "wehat-s2-w1", teamName: "BROTHER LOVE FC", group: "Group C", managerName: "Coach Paul", badgeInitials: "BLF" },
  { id: "tm_13", tournamentId: "wehat-s2-w1", teamName: "PURE HEARTS", group: "Group D", managerName: "Coach Joseph", badgeInitials: "PH" },
  { id: "tm_14", tournamentId: "wehat-s2-w1", teamName: "HMK", group: "Group D", managerName: "Coach Hussein", badgeInitials: "HMK" },
  { id: "tm_15", tournamentId: "wehat-s2-w1", teamName: "GOOD FRIENDS", group: "Group D", managerName: "Coach Emma", badgeInitials: "GF" },
  { id: "tm_16", tournamentId: "wehat-s2-w1", teamName: "IMDAD FC", group: "Group D", managerName: "Coach Imdad", badgeInitials: "IFC" },
];

function getLocalTeams(tournamentId: string): TournamentTeam[] {
  if (!memoryStore.teams.has(tournamentId)) {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem(`tourn_teams_${tournamentId}`);
      if (saved) {
        try {
          memoryStore.teams.set(tournamentId, JSON.parse(saved));
        } catch {
          memoryStore.teams.set(tournamentId, [...DEFAULT_WEHAT_TEAMS]);
        }
      } else {
        memoryStore.teams.set(tournamentId, [...DEFAULT_WEHAT_TEAMS]);
        localStorage.setItem(`tourn_teams_${tournamentId}`, JSON.stringify(DEFAULT_WEHAT_TEAMS));
      }
    } else {
      memoryStore.teams.set(tournamentId, [...DEFAULT_WEHAT_TEAMS]);
    }
  }
  return memoryStore.teams.get(tournamentId) || [];
}

function saveLocalTeams(tournamentId: string, items: TournamentTeam[]) {
  memoryStore.teams.set(tournamentId, items);
  if (typeof window !== "undefined") {
    try {
      localStorage.setItem(`tourn_teams_${tournamentId}`, JSON.stringify(items));
    } catch {}
  }
  const subs = memoryStore.teamSubscribers.get(tournamentId);
  if (subs) {
    subs.forEach((cb) => cb([...items]));
  }
}

function getLocalPlayers(tournamentId: string): TournamentPlayer[] {
  if (!memoryStore.players.has(tournamentId)) {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem(`tourn_players_${tournamentId}`);
      if (saved) {
        try {
          memoryStore.players.set(tournamentId, JSON.parse(saved));
        } catch {
          memoryStore.players.set(tournamentId, []);
        }
      } else {
        memoryStore.players.set(tournamentId, []);
      }
    } else {
      memoryStore.players.set(tournamentId, []);
    }
  }
  return memoryStore.players.get(tournamentId) || [];
}

function saveLocalPlayers(tournamentId: string, items: TournamentPlayer[]) {
  memoryStore.players.set(tournamentId, items);
  if (typeof window !== "undefined") {
    try {
      localStorage.setItem(`tourn_players_${tournamentId}`, JSON.stringify(items));
    } catch {}
  }
  const subs = memoryStore.playerSubscribers.get(tournamentId);
  if (subs) {
    subs.forEach((cb) => cb([...items]));
  }
}

export const tournamentService = {
  // ==========================================
  // 1. TOURNAMENT FIXTURES (LIVE SCORES)
  // ==========================================
  subscribeToFixtures(
    tournamentId: string,
    callback: (fixtures: TournamentFixture[]) => void,
    onError?: (error: Error) => void
  ): () => void {
    // Initial emit from local cache immediately
    const initial = getLocalFixtures(tournamentId);
    callback(initial);

    // Register local listener
    if (!memoryStore.fixtureSubscribers.has(tournamentId)) {
      memoryStore.fixtureSubscribers.set(tournamentId, new Set());
    }
    const subs = memoryStore.fixtureSubscribers.get(tournamentId)!;
    subs.add(callback);

    let unsubFirestore: (() => void) | null = null;
    try {
      const q = query(
        collection(db, FIXTURES_COLLECTION),
        where("tournamentId", "==", tournamentId)
      );

      unsubFirestore = onSnapshot(
        q,
        (snapshot) => {
          if (!snapshot.empty) {
            const fixtures: TournamentFixture[] = [];
            snapshot.forEach((docSnap) => {
              fixtures.push({
                id: docSnap.id,
                ...(docSnap.data() as Omit<TournamentFixture, "id">),
              });
            });

            fixtures.sort((a, b) => {
              const statusPriority = { live: 0, upcoming: 1, finished: 2 };
              const priorityDiff =
                (statusPriority[a.status] ?? 1) - (statusPriority[b.status] ?? 1);
              if (priorityDiff !== 0) return priorityDiff;
              return (a.time || "").localeCompare(b.time || "");
            });

            saveLocalFixtures(tournamentId, fixtures);
          }
        },
        (error) => {
          // Gracefully fallback to local storage
          onError?.(error);
        }
      );
    } catch (e: any) {
      onError?.(e);
    }

    return () => {
      subs.delete(callback);
      if (unsubFirestore) unsubFirestore();
    };
  },

  async addFixture(
    fixture: Omit<TournamentFixture, "id" | "createdAt" | "updatedAt">
  ): Promise<string> {
    const fixtureId = `fix_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const now = new Date().toISOString();

    const data: TournamentFixture = {
      ...fixture,
      id: fixtureId,
      createdAt: now,
      updatedAt: now,
    };

    // Optimistic local update
    const current = getLocalFixtures(fixture.tournamentId);
    const updated = [...current, data];
    saveLocalFixtures(fixture.tournamentId, updated);

    // Persist to Firestore
    try {
      const fixtureRef = doc(db, FIXTURES_COLLECTION, fixtureId);
      await setDoc(fixtureRef, data);
    } catch (e) {
      console.warn("Firestore sync warning on addFixture (local state preserved):", e);
    }

    return fixtureId;
  },

  async updateFixture(
    id: string,
    updates: Partial<TournamentFixture>
  ): Promise<void> {
    // Update local state
    for (const [tId, fixtures] of memoryStore.fixtures.entries()) {
      const idx = fixtures.findIndex((f) => f.id === id);
      if (idx !== -1) {
        const next = [...fixtures];
        next[idx] = { ...next[idx], ...updates, updatedAt: new Date().toISOString() };
        saveLocalFixtures(tId, next);
        break;
      }
    }

    try {
      const fixtureRef = doc(db, FIXTURES_COLLECTION, id);
      await updateDoc(fixtureRef, {
        ...updates,
        updatedAt: new Date().toISOString(),
      });
    } catch (e) {
      console.warn("Firestore sync warning on updateFixture:", e);
    }
  },

  async deleteFixture(id: string): Promise<void> {
    for (const [tId, fixtures] of memoryStore.fixtures.entries()) {
      const idx = fixtures.findIndex((f) => f.id === id);
      if (idx !== -1) {
        const next = fixtures.filter((f) => f.id !== id);
        saveLocalFixtures(tId, next);
        break;
      }
    }

    try {
      const fixtureRef = doc(db, FIXTURES_COLLECTION, id);
      await deleteDoc(fixtureRef);
    } catch (e) {
      console.warn("Firestore sync warning on deleteFixture:", e);
    }
  },

  // ==========================================
  // 2. TOURNAMENT SCORERS (GOLDEN BOOT)
  // ==========================================
  subscribeToScorers(
    tournamentId: string,
    callback: (scorers: TournamentScorer[]) => void,
    onError?: (error: Error) => void
  ): () => void {
    const initial = getLocalScorers(tournamentId);
    callback(initial);

    if (!memoryStore.scorerSubscribers.has(tournamentId)) {
      memoryStore.scorerSubscribers.set(tournamentId, new Set());
    }
    const subs = memoryStore.scorerSubscribers.get(tournamentId)!;
    subs.add(callback);

    let unsubFirestore: (() => void) | null = null;
    try {
      const q = query(
        collection(db, SCORERS_COLLECTION),
        where("tournamentId", "==", tournamentId)
      );

      unsubFirestore = onSnapshot(
        q,
        (snapshot) => {
          if (!snapshot.empty) {
            const scorers: TournamentScorer[] = [];
            snapshot.forEach((docSnap) => {
              scorers.push({
                id: docSnap.id,
                ...(docSnap.data() as Omit<TournamentScorer, "id">),
              });
            });

            scorers.sort((a, b) => {
              if (b.goals !== a.goals) {
                return (b.goals || 0) - (a.goals || 0);
              }
              return (a.playerName || "").localeCompare(b.playerName || "");
            });

            saveLocalScorers(tournamentId, scorers);
          }
        },
        (error) => {
          onError?.(error);
        }
      );
    } catch (e: any) {
      onError?.(e);
    }

    return () => {
      subs.delete(callback);
      if (unsubFirestore) unsubFirestore();
    };
  },

  async addScorer(
    scorer: Omit<TournamentScorer, "id" | "createdAt" | "updatedAt">
  ): Promise<string> {
    const scorerId = `scr_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const now = new Date().toISOString();

    const data: TournamentScorer = {
      ...scorer,
      id: scorerId,
      goals: Number(scorer.goals) || 0,
      createdAt: now,
      updatedAt: now,
    };

    const current = getLocalScorers(scorer.tournamentId);
    const updated = [...current, data].sort((a, b) => (b.goals || 0) - (a.goals || 0));
    saveLocalScorers(scorer.tournamentId, updated);

    try {
      const scorerRef = doc(db, SCORERS_COLLECTION, scorerId);
      await setDoc(scorerRef, data);
    } catch (e) {
      console.warn("Firestore sync warning on addScorer:", e);
    }

    return scorerId;
  },

  async updateScorer(
    id: string,
    updates: Partial<TournamentScorer>
  ): Promise<void> {
    for (const [tId, scorers] of memoryStore.scorers.entries()) {
      const idx = scorers.findIndex((s) => s.id === id);
      if (idx !== -1) {
        const next = [...scorers];
        next[idx] = { ...next[idx], ...updates, updatedAt: new Date().toISOString() };
        next.sort((a, b) => (b.goals || 0) - (a.goals || 0));
        saveLocalScorers(tId, next);
        break;
      }
    }

    try {
      const scorerRef = doc(db, SCORERS_COLLECTION, id);
      await updateDoc(scorerRef, {
        ...updates,
        updatedAt: new Date().toISOString(),
      });
    } catch (e) {
      console.warn("Firestore sync warning on updateScorer:", e);
    }
  },

  async incrementScorerGoals(id: string, delta: number): Promise<void> {
    for (const [tId, scorers] of memoryStore.scorers.entries()) {
      const idx = scorers.findIndex((s) => s.id === id);
      if (idx !== -1) {
        const next = [...scorers];
        const newGoals = Math.max(0, (next[idx].goals || 0) + delta);
        next[idx] = { ...next[idx], goals: newGoals, updatedAt: new Date().toISOString() };
        next.sort((a, b) => (b.goals || 0) - (a.goals || 0));
        saveLocalScorers(tId, next);
        break;
      }
    }

    try {
      const scorerRef = doc(db, SCORERS_COLLECTION, id);
      await runTransaction(db, async (transaction) => {
        const docSnap = await transaction.get(scorerRef);
        if (docSnap.exists()) {
          const currentGoals = docSnap.data().goals || 0;
          const newGoals = Math.max(0, currentGoals + delta);
          transaction.update(scorerRef, {
            goals: newGoals,
            updatedAt: new Date().toISOString(),
          });
        }
      });
    } catch (e) {
      console.warn("Firestore sync warning on incrementScorerGoals:", e);
    }
  },

  async deleteScorer(id: string): Promise<void> {
    for (const [tId, scorers] of memoryStore.scorers.entries()) {
      const idx = scorers.findIndex((s) => s.id === id);
      if (idx !== -1) {
        const next = scorers.filter((s) => s.id !== id);
        saveLocalScorers(tId, next);
        break;
      }
    }

    try {
      const scorerRef = doc(db, SCORERS_COLLECTION, id);
      await deleteDoc(scorerRef);
    } catch (e) {
      console.warn("Firestore sync warning on deleteScorer:", e);
    }
  },

  // ==========================================
  // 3. TOURNAMENT NOMINEES (MAN OF THE MATCH)
  // ==========================================
  subscribeToNominees(
    tournamentId: string,
    callback: (nominees: TournamentNominee[]) => void,
    onError?: (error: Error) => void
  ): () => void {
    const initial = getLocalNominees(tournamentId);
    callback(initial);

    if (!memoryStore.nomineeSubscribers.has(tournamentId)) {
      memoryStore.nomineeSubscribers.set(tournamentId, new Set());
    }
    const subs = memoryStore.nomineeSubscribers.get(tournamentId)!;
    subs.add(callback);

    let unsubFirestore: (() => void) | null = null;
    try {
      const q = query(
        collection(db, NOMINEES_COLLECTION),
        where("tournamentId", "==", tournamentId)
      );

      unsubFirestore = onSnapshot(
        q,
        (snapshot) => {
          if (!snapshot.empty) {
            const nominees: TournamentNominee[] = [];
            snapshot.forEach((docSnap) => {
              nominees.push({
                id: docSnap.id,
                ...(docSnap.data() as Omit<TournamentNominee, "id">),
              });
            });

            nominees.sort((a, b) => {
              if (b.voteCount !== a.voteCount) {
                return (b.voteCount || 0) - (a.voteCount || 0);
              }
              return (a.nomineeName || "").localeCompare(b.nomineeName || "");
            });

            saveLocalNominees(tournamentId, nominees);
          }
        },
        (error) => {
          onError?.(error);
        }
      );
    } catch (e: any) {
      onError?.(e);
    }

    return () => {
      subs.delete(callback);
      if (unsubFirestore) unsubFirestore();
    };
  },

  async addNominee(
    nominee: Omit<TournamentNominee, "id" | "createdAt" | "updatedAt" | "voteCount"> & {
      voteCount?: number;
    }
  ): Promise<string> {
    const nomineeId = `motm_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const now = new Date().toISOString();

    const data: TournamentNominee = {
      ...nominee,
      id: nomineeId,
      voteCount: Number(nominee.voteCount) || 0,
      createdAt: now,
      updatedAt: now,
    };

    const current = getLocalNominees(nominee.tournamentId);
    const updated = [...current, data].sort((a, b) => (b.voteCount || 0) - (a.voteCount || 0));
    saveLocalNominees(nominee.tournamentId, updated);

    try {
      const nomineeRef = doc(db, NOMINEES_COLLECTION, nomineeId);
      await setDoc(nomineeRef, data);
    } catch (e) {
      console.warn("Firestore sync warning on addNominee:", e);
    }

    return nomineeId;
  },

  async updateNominee(
    id: string,
    updates: Partial<TournamentNominee>
  ): Promise<void> {
    for (const [tId, nominees] of memoryStore.nominees.entries()) {
      const idx = nominees.findIndex((n) => n.id === id);
      if (idx !== -1) {
        const next = [...nominees];
        next[idx] = { ...next[idx], ...updates, updatedAt: new Date().toISOString() };
        next.sort((a, b) => (b.voteCount || 0) - (a.voteCount || 0));
        saveLocalNominees(tId, next);
        break;
      }
    }

    try {
      const nomineeRef = doc(db, NOMINEES_COLLECTION, id);
      await updateDoc(nomineeRef, {
        ...updates,
        updatedAt: new Date().toISOString(),
      });
    } catch (e) {
      console.warn("Firestore sync warning on updateNominee:", e);
    }
  },

  async deleteNominee(id: string): Promise<void> {
    for (const [tId, nominees] of memoryStore.nominees.entries()) {
      const idx = nominees.findIndex((n) => n.id === id);
      if (idx !== -1) {
        const next = nominees.filter((n) => n.id !== id);
        saveLocalNominees(tId, next);
        break;
      }
    }

    try {
      const nomineeRef = doc(db, NOMINEES_COLLECTION, id);
      await deleteDoc(nomineeRef);
    } catch (e) {
      console.warn("Firestore sync warning on deleteNominee:", e);
    }
  },

  // 1 vote per browser enforcement via localStorage key + Firestore atomic transaction
  getVotedNomineeId(tournamentId: string): string | null {
    if (typeof window === "undefined") return null;
    return localStorage.getItem(`voted_${tournamentId}`);
  },

  hasUserVoted(tournamentId: string): boolean {
    if (typeof window === "undefined") return false;
    return !!localStorage.getItem(`voted_${tournamentId}`);
  },

  async voteForNominee(tournamentId: string, nomineeId: string): Promise<number> {
    const storageKey = `voted_${tournamentId}`;
    if (typeof window !== "undefined" && localStorage.getItem(storageKey)) {
      throw new Error("You have already voted in this tournament.");
    }

    let updatedCount = 0;

    // Optimistic local update
    const nominees = getLocalNominees(tournamentId);
    const nomineeIdx = nominees.findIndex((n) => n.id === nomineeId);
    if (nomineeIdx !== -1) {
      const next = [...nominees];
      updatedCount = (next[nomineeIdx].voteCount || 0) + 1;
      next[nomineeIdx] = {
        ...next[nomineeIdx],
        voteCount: updatedCount,
        updatedAt: new Date().toISOString(),
      };
      next.sort((a, b) => (b.voteCount || 0) - (a.voteCount || 0));
      saveLocalNominees(tournamentId, next);
    }

    if (typeof window !== "undefined") {
      localStorage.setItem(storageKey, nomineeId);
    }

    // Persist to Firestore
    try {
      const nomineeRef = doc(db, NOMINEES_COLLECTION, nomineeId);
      await runTransaction(db, async (transaction) => {
        const nomineeDoc = await transaction.get(nomineeRef);
        if (nomineeDoc.exists()) {
          const currentVotes = nomineeDoc.data().voteCount || 0;
          updatedCount = currentVotes + 1;
          transaction.update(nomineeRef, {
            voteCount: updatedCount,
            updatedAt: new Date().toISOString(),
          });
        }
      });
    } catch (e) {
      console.warn("Firestore sync warning on voteForNominee:", e);
    }

    return updatedCount;
  },

  // ==========================================
  // 4. SEED WEHAT SOCCER TOURNAMENT DATA
  // ==========================================
  async seedWehatTournament(
    tournamentId: string = DEFAULT_TOURNAMENT.id
  ): Promise<{ fixturesCount: number; scorersCount: number; nomineesCount: number }> {
    // Reset local store with default seed
    saveLocalFixtures(tournamentId, [...DEFAULT_WEHAT_FIXTURES]);
    saveLocalScorers(tournamentId, [...DEFAULT_WEHAT_SCORERS]);
    saveLocalNominees(tournamentId, [...DEFAULT_WEHAT_NOMINEES]);

    try {
      const batch = writeBatch(db);
      DEFAULT_WEHAT_FIXTURES.forEach((f) => {
        const docRef = doc(db, FIXTURES_COLLECTION, f.id);
        batch.set(docRef, f);
      });
      DEFAULT_WEHAT_SCORERS.forEach((s) => {
        const docRef = doc(db, SCORERS_COLLECTION, s.id);
        batch.set(docRef, s);
      });
      DEFAULT_WEHAT_NOMINEES.forEach((n) => {
        const docRef = doc(db, NOMINEES_COLLECTION, n.id);
        batch.set(docRef, n);
      });
      await batch.commit();
    } catch (e) {
      console.warn("Firestore batch seed warning (local seed active):", e);
    }

    return {
      fixturesCount: DEFAULT_WEHAT_FIXTURES.length,
      scorersCount: DEFAULT_WEHAT_SCORERS.length,
      nomineesCount: DEFAULT_WEHAT_NOMINEES.length,
    };
  },

  // ==========================================
  // 5. TOURNAMENT TEAMS REGISTRATION
  // ==========================================
  subscribeToTeams(
    tournamentId: string,
    callback: (teams: TournamentTeam[]) => void,
    onError?: (error: Error) => void
  ): () => void {
    const initial = getLocalTeams(tournamentId);
    callback(initial);

    if (!memoryStore.teamSubscribers.has(tournamentId)) {
      memoryStore.teamSubscribers.set(tournamentId, new Set());
    }
    const subs = memoryStore.teamSubscribers.get(tournamentId)!;
    subs.add(callback);

    let unsubFirestore: (() => void) | null = null;
    try {
      const q = query(
        collection(db, TEAMS_COLLECTION),
        where("tournamentId", "==", tournamentId)
      );
      unsubFirestore = onSnapshot(
        q,
        (snapshot) => {
          if (!snapshot.empty) {
            const teams: TournamentTeam[] = [];
            snapshot.forEach((docSnap) => {
              teams.push({
                id: docSnap.id,
                ...(docSnap.data() as Omit<TournamentTeam, "id">),
              });
            });
            saveLocalTeams(tournamentId, teams);
          }
        },
        (error) => onError?.(error)
      );
    } catch (e: any) {
      onError?.(e);
    }

    return () => {
      subs.delete(callback);
      if (unsubFirestore) unsubFirestore();
    };
  },

  async addTeam(team: Omit<TournamentTeam, "id" | "createdAt" | "updatedAt">): Promise<string> {
    const teamId = `tm_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const now = new Date().toISOString();
    const data: TournamentTeam = {
      ...team,
      id: teamId,
      createdAt: now,
      updatedAt: now,
    };

    const current = getLocalTeams(team.tournamentId);
    saveLocalTeams(team.tournamentId, [...current, data]);

    try {
      await setDoc(doc(db, TEAMS_COLLECTION, teamId), data);
    } catch (e) {
      console.warn("Firestore sync warning on addTeam:", e);
    }
    return teamId;
  },

  async updateTeam(teamId: string, updates: Partial<TournamentTeam>): Promise<void> {
    const now = new Date().toISOString();
    for (const [tId, list] of memoryStore.teams.entries()) {
      const idx = list.findIndex((t) => t.id === teamId);
      if (idx !== -1) {
        const updated = [...list];
        updated[idx] = { ...updated[idx], ...updates, updatedAt: now };
        saveLocalTeams(tId, updated);
        break;
      }
    }

    try {
      await updateDoc(doc(db, TEAMS_COLLECTION, teamId), {
        ...updates,
        updatedAt: now,
      });
    } catch (e) {
      console.warn("Firestore sync warning on updateTeam:", e);
    }
  },

  async deleteTeam(teamId: string): Promise<void> {
    for (const [tId, list] of memoryStore.teams.entries()) {
      if (list.some((t) => t.id === teamId)) {
        saveLocalTeams(tId, list.filter((t) => t.id !== teamId));
        break;
      }
    }

    try {
      await deleteDoc(doc(db, TEAMS_COLLECTION, teamId));
    } catch (e) {
      console.warn("Firestore sync warning on deleteTeam:", e);
    }
  },

  // ==========================================
  // 6. TOURNAMENT PLAYERS REGISTRATION
  // ==========================================
  subscribeToPlayers(
    tournamentId: string,
    callback: (players: TournamentPlayer[]) => void,
    onError?: (error: Error) => void
  ): () => void {
    const initial = getLocalPlayers(tournamentId);
    callback(initial);

    if (!memoryStore.playerSubscribers.has(tournamentId)) {
      memoryStore.playerSubscribers.set(tournamentId, new Set());
    }
    const subs = memoryStore.playerSubscribers.get(tournamentId)!;
    subs.add(callback);

    let unsubFirestore: (() => void) | null = null;
    try {
      const q = query(
        collection(db, PLAYERS_COLLECTION),
        where("tournamentId", "==", tournamentId)
      );
      unsubFirestore = onSnapshot(
        q,
        (snapshot) => {
          if (!snapshot.empty) {
            const players: TournamentPlayer[] = [];
            snapshot.forEach((docSnap) => {
              players.push({
                id: docSnap.id,
                ...(docSnap.data() as Omit<TournamentPlayer, "id">),
              });
            });
            saveLocalPlayers(tournamentId, players);
          }
        },
        (error) => onError?.(error)
      );
    } catch (e: any) {
      onError?.(e);
    }

    return () => {
      subs.delete(callback);
      if (unsubFirestore) unsubFirestore();
    };
  },

  async addPlayer(player: Omit<TournamentPlayer, "id" | "createdAt" | "updatedAt">): Promise<string> {
    const playerId = `ply_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const now = new Date().toISOString();
    const data: TournamentPlayer = {
      ...player,
      id: playerId,
      createdAt: now,
      updatedAt: now,
    };

    const current = getLocalPlayers(player.tournamentId);
    saveLocalPlayers(player.tournamentId, [...current, data]);

    try {
      await setDoc(doc(db, PLAYERS_COLLECTION, playerId), data);
    } catch (e) {
      console.warn("Firestore sync warning on addPlayer:", e);
    }
    return playerId;
  },

  async updatePlayer(playerId: string, updates: Partial<TournamentPlayer>): Promise<void> {
    const now = new Date().toISOString();
    for (const [tId, list] of memoryStore.players.entries()) {
      const idx = list.findIndex((p) => p.id === playerId);
      if (idx !== -1) {
        const updated = [...list];
        updated[idx] = { ...updated[idx], ...updates, updatedAt: now };
        saveLocalPlayers(tId, updated);
        break;
      }
    }

    try {
      await updateDoc(doc(db, PLAYERS_COLLECTION, playerId), {
        ...updates,
        updatedAt: now,
      });
    } catch (e) {
      console.warn("Firestore sync warning on updatePlayer:", e);
    }
  },

  async deletePlayer(playerId: string): Promise<void> {
    for (const [tId, list] of memoryStore.players.entries()) {
      if (list.some((p) => p.id === playerId)) {
        saveLocalPlayers(tId, list.filter((p) => p.id !== playerId));
        break;
      }
    }

    try {
      await deleteDoc(doc(db, PLAYERS_COLLECTION, playerId));
    } catch (e) {
      console.warn("Firestore sync warning on deletePlayer:", e);
    }
  },
};
