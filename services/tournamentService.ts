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
  DEFAULT_TOURNAMENT,
} from "../types/tournament";

const FIXTURES_COLLECTION = "tournamentFixtures";
const SCORERS_COLLECTION = "tournamentScorers";
const NOMINEES_COLLECTION = "tournamentNominees";

// Fallback seed data for WEHAT Soccer Tournament (Season 2, Week 1)
const DEFAULT_WEHAT_FIXTURES: TournamentFixture[] = [
  {
    id: "wehat_fix_1",
    tournamentId: "wehat-s2-w1",
    time: "1:30 PM",
    homeTeam: "Tal Olympic FC",
    awayTeam: "Bayern Munyonyo",
    homeScore: 2,
    awayScore: 1,
    status: "finished",
    pitchVenue: "Tal Olympic - Pitch 1",
    round: "Group A • Match 1",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "wehat_fix_2",
    tournamentId: "wehat-s2-w1",
    time: "2:30 PM",
    homeTeam: "Kabalagala Kings",
    awayTeam: "Nsambya United",
    homeScore: 3,
    awayScore: 2,
    status: "live",
    pitchVenue: "Tal Olympic - Pitch 2",
    round: "Group A • Match 2",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "wehat_fix_3",
    tournamentId: "wehat-s2-w1",
    time: "3:45 PM",
    homeTeam: "Munyonyo Strikers",
    awayTeam: "Muyenga Lions",
    homeScore: null,
    awayScore: null,
    status: "upcoming",
    pitchVenue: "Tal Olympic - Pitch 1",
    round: "Group B • Match 1",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "wehat_fix_4",
    tournamentId: "wehat-s2-w1",
    time: "5:00 PM",
    homeTeam: "Makindye All-Stars",
    awayTeam: "Ggaba Waves",
    homeScore: null,
    awayScore: null,
    status: "upcoming",
    pitchVenue: "Tal Olympic - Pitch 2",
    round: "Group B • Match 2",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

const DEFAULT_WEHAT_SCORERS: TournamentScorer[] = [
  {
    id: "wehat_scr_1",
    tournamentId: "wehat-s2-w1",
    playerName: "Hakim 'Kaka' Ssekandi",
    teamName: "Kabalagala Kings",
    goals: 4,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "wehat_scr_2",
    tournamentId: "wehat-s2-w1",
    playerName: "Denis Mukasa",
    teamName: "Tal Olympic FC",
    goals: 3,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "wehat_scr_3",
    tournamentId: "wehat-s2-w1",
    playerName: "Brian Otim",
    teamName: "Nsambya United",
    goals: 2,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "wehat_scr_4",
    tournamentId: "wehat-s2-w1",
    playerName: "Ivan 'Hazard' Kato",
    teamName: "Bayern Munyonyo",
    goals: 1,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "wehat_scr_5",
    tournamentId: "wehat-s2-w1",
    playerName: "Paul Mugisha",
    teamName: "Kabalagala Kings",
    goals: 1,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

const DEFAULT_WEHAT_NOMINEES: TournamentNominee[] = [
  {
    id: "wehat_motm_1",
    tournamentId: "wehat-s2-w1",
    nomineeName: "Hakim 'Kaka' Ssekandi",
    teamName: "Kabalagala Kings",
    position: "Attacking Midfielder",
    photoUrl: "https://images.unsplash.com/photo-1508098682722-e99c43a406b2?w=150&auto=format&fit=crop&q=80",
    voteCount: 22,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "wehat_motm_2",
    tournamentId: "wehat-s2-w1",
    nomineeName: "Denis Mukasa",
    teamName: "Tal Olympic FC",
    position: "Striker",
    photoUrl: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=150&auto=format&fit=crop&q=80",
    voteCount: 17,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "wehat_motm_3",
    tournamentId: "wehat-s2-w1",
    nomineeName: "Emmanuel Kigozi",
    teamName: "Bayern Munyonyo",
    position: "Goalkeeper",
    photoUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
    voteCount: 11,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "wehat_motm_4",
    tournamentId: "wehat-s2-w1",
    nomineeName: "Brian Otim",
    teamName: "Nsambya United",
    position: "Winger",
    photoUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80",
    voteCount: 8,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

// In-memory / local reactive store
const memoryStore = {
  fixtures: new Map<string, TournamentFixture[]>(),
  scorers: new Map<string, TournamentScorer[]>(),
  nominees: new Map<string, TournamentNominee[]>(),
  fixtureSubscribers: new Map<string, Set<(fixtures: TournamentFixture[]) => void>>(),
  scorerSubscribers: new Map<string, Set<(scorers: TournamentScorer[]) => void>>(),
  nomineeSubscribers: new Map<string, Set<(nominees: TournamentNominee[]) => void>>(),
};

// Initialize default store for wehat-s2-w1
function getLocalFixtures(tournamentId: string): TournamentFixture[] {
  if (!memoryStore.fixtures.has(tournamentId)) {
    // Check localStorage
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem(`tourn_fixtures_${tournamentId}`);
      if (saved) {
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
      if (saved) {
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
      if (saved) {
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
};
