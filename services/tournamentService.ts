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
import { db, handleFirestoreError, OperationType } from "../lib/firebase";
import {
  TournamentFixture,
  TournamentScorer,
  TournamentNominee,
  TournamentPlayer,
  TournamentTeam,
  TournamentTeamStanding,
  DEFAULT_TOURNAMENT,
} from "../types/tournament";

const FIXTURES_COLLECTION = "tournamentFixtures";
const SCORERS_COLLECTION = "tournamentScorers";
const NOMINEES_COLLECTION = "tournamentNominees";
const TEAMS_COLLECTION = "tournamentTeams";
const PLAYERS_COLLECTION = "tournamentPlayers";
const STANDINGS_COLLECTION = "tournamentStandings";

// Comprehensive data for WEHAT Soccer Tournament (Season 2, Matchdays 1 & 2 Results + Matchday 3 Upcoming)
const DEFAULT_WEHAT_FIXTURES: TournamentFixture[] = [
  // --- MATCHDAY 1 RESULTS ---
  {
    id: "wehat_fix_1",
    tournamentId: "wehat-s2-w2",
    time: "1:00 PM",
    homeTeam: "WEHAT FC",
    awayTeam: "DODGE AMO FC",
    homeScore: 3,
    awayScore: 1,
    status: "finished",
    pitchVenue: "Tal Olympic Stadium",
    round: "Matchday 1 • Group C",
    group: "Group C",
    homeScorers: ["Raymond Junior", "Kavuma Dennis", "Isaac"],
    awayScorers: ["Joshua"],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "wehat_fix_2",
    tournamentId: "wehat-s2-w2",
    time: "1:45 PM",
    homeTeam: "GENTLE STAR FC",
    awayTeam: "INVESTORS FC",
    homeScore: 3,
    awayScore: 4,
    status: "finished",
    pitchVenue: "Tal Olympic Stadium",
    round: "Matchday 1 • Group D",
    group: "Group D",
    homeScorers: ["Yawe", "Mukisa", "Kibirige"],
    awayScorers: ["Nyanzi Shafik (4)"],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "wehat_fix_3",
    tournamentId: "wehat-s2-w2",
    time: "2:30 PM",
    homeTeam: "BUNGA FC",
    awayTeam: "PRO PERFORMERS FC",
    homeScore: 5,
    awayScore: 3,
    status: "finished",
    pitchVenue: "Tal Olympic Stadium",
    round: "Matchday 1 • Group B",
    group: "Group B",
    homeScorers: ["Mark Jordan", "Magala Hassan", "Walusimbi", "Ssempijja", "Own goal"],
    awayScorers: ["Latif", "Emir", "Shehu"],
    notes: "Heritiers (Red Card)",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "wehat_fix_4",
    tournamentId: "wehat-s2-w2",
    time: "3:15 PM",
    homeTeam: "LEGENDS FC",
    awayTeam: "SENIOR PLAYERS",
    homeScore: 2,
    awayScore: 0,
    status: "finished",
    pitchVenue: "Tal Olympic Stadium",
    round: "Matchday 1 • Group B",
    group: "Group B",
    homeScorers: ["Bwanika Shafik", "Aronda Joshua"],
    awayScorers: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "wehat_fix_5",
    tournamentId: "wehat-s2-w2",
    time: "4:00 PM",
    homeTeam: "KIRUDDU HOSP FC",
    awayTeam: "BUSABALA UNITED FC",
    homeScore: 1,
    awayScore: 5,
    status: "finished",
    pitchVenue: "Tal Olympic Stadium",
    round: "Matchday 1 • Group A",
    group: "Group A",
    homeScorers: ["Ntege Peter"],
    awayScorers: ["David (2)", "Walele Tabani", "Ssembatya Sharif", "Bogere Sam"],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "wehat_fix_6",
    tournamentId: "wehat-s2-w2",
    time: "4:45 PM",
    homeTeam: "WEHAT SELECT",
    awayTeam: "BROTHER LOVE FC",
    homeScore: 4,
    awayScore: 0,
    status: "finished",
    pitchVenue: "Tal Olympic Stadium",
    round: "Matchday 1 • Group A",
    group: "Group A",
    homeScorers: ["Ladin", "Jackson (3)"],
    awayScorers: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "wehat_fix_7",
    tournamentId: "wehat-s2-w2",
    time: "5:30 PM",
    homeTeam: "PURE HEARTS FC",
    awayTeam: "HMK",
    homeScore: 2,
    awayScore: 1,
    status: "finished",
    pitchVenue: "Tal Olympic Stadium",
    round: "Matchday 1 • Group D",
    group: "Group D",
    homeScorers: ["Paco", "Elijah"],
    awayScorers: ["Hussein"],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "wehat_fix_8",
    tournamentId: "wehat-s2-w2",
    time: "6:15 PM",
    homeTeam: "GOOD FRIENDS",
    awayTeam: "IMDAD FC",
    homeScore: 0,
    awayScore: 1,
    status: "finished",
    pitchVenue: "Tal Olympic Stadium",
    round: "Matchday 1 • Group C",
    group: "Group C",
    homeScorers: [],
    awayScorers: ["Mark"],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },

  // --- MATCHDAY 2 RESULTS (DERIVED FROM OFFICIAL GOAL STANDS) ---
  {
    id: "wehat_fix_9",
    tournamentId: "wehat-s2-w2",
    time: "1:00 PM",
    homeTeam: "WEHAT FC",
    awayTeam: "GOOD FRIENDS",
    homeScore: 4,
    awayScore: 0,
    status: "finished",
    pitchVenue: "Tal Olympic Stadium",
    round: "Matchday 2 • Group C",
    group: "Group C",
    homeScorers: ["Raymond Junior (3)", "Johnmark"],
    awayScorers: [],
    notes: "Raymond Junior hat-trick powers WEHAT FC",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "wehat_fix_10",
    tournamentId: "wehat-s2-w2",
    time: "1:45 PM",
    homeTeam: "INVESTORS FC",
    awayTeam: "HMK",
    homeScore: 5,
    awayScore: 0,
    status: "finished",
    pitchVenue: "Tal Olympic Stadium",
    round: "Matchday 2 • Group D",
    group: "Group D",
    homeScorers: ["Lukoye Sam", "Luyonde Johan"],
    awayScorers: [],
    notes: "Dominant 5-goal performance by Investors FC",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "wehat_fix_11",
    tournamentId: "wehat-s2-w2",
    time: "2:30 PM",
    homeTeam: "BUNGA FC",
    awayTeam: "LEGENDS FC",
    homeScore: 0,
    awayScore: 0,
    status: "finished",
    pitchVenue: "Tal Olympic Stadium",
    round: "Matchday 2 • Group B",
    group: "Group B",
    homeScorers: [],
    awayScorers: [],
    notes: "Intense tactical deadlock between group frontrunners",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "wehat_fix_12",
    tournamentId: "wehat-s2-w2",
    time: "3:15 PM",
    homeTeam: "PRO PERFORMERS FC",
    awayTeam: "SENIOR PLAYERS",
    homeScore: 2,
    awayScore: 0,
    status: "finished",
    pitchVenue: "Tal Olympic Stadium",
    round: "Matchday 2 • Group B",
    group: "Group B",
    homeScorers: ["Shehu", "Salim"],
    awayScorers: [],
    notes: "Shehu and Salim secure crucial 3 points for Pro Performers",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "wehat_fix_13",
    tournamentId: "wehat-s2-w2",
    time: "4:00 PM",
    homeTeam: "WEHAT SELECT",
    awayTeam: "KIRUDDU HOSP FC",
    homeScore: 4,
    awayScore: 0,
    status: "finished",
    pitchVenue: "Tal Olympic Stadium",
    round: "Matchday 2 • Group A",
    group: "Group A",
    homeScorers: ["Nsubuga Mark (4)"],
    awayScorers: [],
    notes: "Sensational 4-goal masterclass by Nsubuga Mark",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "wehat_fix_14",
    tournamentId: "wehat-s2-w2",
    time: "4:45 PM",
    homeTeam: "BUSABALA UNITED FC",
    awayTeam: "BROTHER LOVE FC",
    homeScore: 2,
    awayScore: 2,
    status: "finished",
    pitchVenue: "Tal Olympic Stadium",
    round: "Matchday 2 • Group A",
    group: "Group A",
    homeScorers: ["Bwite David", "Ultra Nkolo"],
    awayScorers: ["Rodger", "Ssali Arafat"],
    notes: "Spirited second-half fightback by Brother Love",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "wehat_fix_15",
    tournamentId: "wehat-s2-w2",
    time: "5:30 PM",
    homeTeam: "PURE HEARTS FC",
    awayTeam: "GENTLE STAR FC",
    homeScore: 2,
    awayScore: 0,
    status: "finished",
    pitchVenue: "Tal Olympic Stadium",
    round: "Matchday 2 • Group D",
    group: "Group D",
    homeScorers: ["Nico (2)"],
    awayScorers: [],
    notes: "Pure Hearts victory in Group D clash",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "wehat_fix_16",
    tournamentId: "wehat-s2-w2",
    time: "6:15 PM",
    homeTeam: "IMDAD FC",
    awayTeam: "DODGE AMO FC",
    homeScore: 3,
    awayScore: 0,
    status: "finished",
    pitchVenue: "Tal Olympic Stadium",
    round: "Matchday 2 • Group C",
    group: "Group C",
    homeScorers: ["Rodney (2)", "Ebong Mark"],
    awayScorers: [],
    notes: "Imdad FC clinical in Group C contest",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },

  // --- MATCHDAY 3 OFFICIAL FIXTURES RESULTS (SATURDAY 26TH SEPT 2026) ---
  {
    id: "wehat_fix_md3_17",
    tournamentId: "wehat-s2-w2",
    time: "2:00 PM",
    homeTeam: "SENIOR PLAYERS",
    awayTeam: "BUNGA FC",
    homeScore: 1,
    awayScore: 3,
    status: "finished",
    pitchVenue: "Tal Olympic Park / Bayern Munyonyo",
    round: "Matchday 3 • Group B",
    group: "Group B",
    homeScorers: ["Senior Player"],
    awayScorers: ["Semalulu Paul (2)", "Mark Jordan"],
    notes: "Opening clash of Matchday 3: Bunga FC claims 3-1 victory",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "wehat_fix_md3_18",
    tournamentId: "wehat-s2-w2",
    time: "3:00 PM",
    homeTeam: "GENTLE STAR FC",
    awayTeam: "PURE HEARTS FC",
    homeScore: 1,
    awayScore: 4,
    status: "finished",
    pitchVenue: "Tal Olympic Park / Bayern Munyonyo",
    round: "Matchday 3 • Group D",
    group: "Group D",
    homeScorers: ["Yawe"],
    awayScorers: ["Paco (2)", "Nico", "Travis"],
    notes: "Pure Hearts cruise with 4-1 victory to seal qualification",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "wehat_fix_md3_19",
    tournamentId: "wehat-s2-w2",
    time: "4:00 PM",
    homeTeam: "HMK",
    awayTeam: "INVESTORS FC",
    homeScore: 0,
    awayScore: 7,
    status: "finished",
    pitchVenue: "Tal Olympic Park / Bayern Munyonyo",
    round: "Matchday 3 • Group D",
    group: "Group D",
    homeScorers: [],
    awayScorers: ["Nyanzi Shafik (5)", "Bacola", "Boyz"],
    notes: "Investors FC rampage with 7-0 blowout powered by Shafik masterclass",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "wehat_fix_md3_20",
    tournamentId: "wehat-s2-w2",
    time: "5:00 PM",
    homeTeam: "GOOD FRIENDS",
    awayTeam: "DODGE AMO FC",
    homeScore: 0,
    awayScore: 0,
    status: "finished",
    pitchVenue: "Tal Olympic Park / Bayern Munyonyo",
    round: "Matchday 3 • Group C",
    group: "Group C",
    homeScorers: [],
    awayScorers: [],
    notes: "Deadlock in Group C clash",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "wehat_fix_md3_21",
    tournamentId: "wehat-s2-w2",
    time: "6:00 PM",
    homeTeam: "PRO PERFORMERS FC",
    awayTeam: "LEGENDS FC",
    homeScore: 0,
    awayScore: 2,
    status: "finished",
    pitchVenue: "Tal Olympic Park / Bayern Munyonyo",
    round: "Matchday 3 • Group B",
    group: "Group B",
    homeScorers: [],
    awayScorers: ["Bwanika Shafik", "Muguza Collin"],
    notes: "Legends FC clinical 2-0 under floodlights to secure Quarter-Finals",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "wehat_fix_md3_22",
    tournamentId: "wehat-s2-w2",
    time: "7:00 PM",
    homeTeam: "IMDAD FC",
    awayTeam: "WEHAT FC",
    homeScore: 1,
    awayScore: 1,
    status: "finished",
    pitchVenue: "Tal Olympic Park / Bayern Munyonyo",
    round: "Matchday 3 • Group C",
    group: "Group C",
    homeScorers: ["Ebong Mark"],
    awayScorers: ["Raymond Junior"],
    notes: "Thrilling 1-1 heavyweight stalemate as both sides advance",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "wehat_fix_md3_23",
    tournamentId: "wehat-s2-w2",
    time: "8:00 PM",
    homeTeam: "WEHAT SELECT",
    awayTeam: "BUSABALA UNITED FC",
    homeScore: 2,
    awayScore: 2,
    status: "finished",
    pitchVenue: "Tal Olympic Park / Bayern Munyonyo",
    round: "Matchday 3 • Group A",
    group: "Group A",
    homeScorers: ["Jackson", "Kabenge"],
    awayScorers: ["David", "Ssembatya Sharif"],
    notes: "4-goal thriller ends 2-2 as both Group A giants punch ticket to QFs",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "wehat_fix_md3_24",
    tournamentId: "wehat-s2-w2",
    time: "9:00 PM",
    homeTeam: "KIRUDDU HOSP FC",
    awayTeam: "BROTHER LOVE FC",
    homeScore: 1,
    awayScore: 2,
    status: "finished",
    pitchVenue: "Tal Olympic Park / Bayern Munyonyo",
    round: "Matchday 3 • Group A",
    group: "Group A",
    homeScorers: ["Ntege Peter"],
    awayScorers: ["Rodger", "Ssali Arafat"],
    notes: "Brother Love edges 2-1 in Group A finale",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },

  // --- UPCOMING QUARTER-FINALS (SATURDAY 3RD OCTOBER 2026) ---
  {
    id: "wehat_fix_qf_1",
    tournamentId: "wehat-s2-w2",
    time: "2:00 PM",
    homeTeam: "WEHAT SELECT",
    awayTeam: "LEGENDS FC",
    homeScore: null,
    awayScore: null,
    status: "upcoming",
    pitchVenue: "Tal Olympic Park / Bayern Munyonyo",
    round: "Quarter-Final 1",
    group: "Quarter-Finals",
    notes: "QF 1: Group A Winners vs Group B Runners-up (3rd Oct 2026)",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "wehat_fix_qf_2",
    tournamentId: "wehat-s2-w2",
    time: "3:00 PM",
    homeTeam: "BUSABALA UNITED FC",
    awayTeam: "BUNGA FC",
    homeScore: null,
    awayScore: null,
    status: "upcoming",
    pitchVenue: "Tal Olympic Park / Bayern Munyonyo",
    round: "Quarter-Final 2",
    group: "Quarter-Finals",
    notes: "QF 2: Group A Runners-up vs Group B Winners (3rd Oct 2026)",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "wehat_fix_qf_3",
    tournamentId: "wehat-s2-w2",
    time: "4:00 PM",
    homeTeam: "WEHAT FC",
    awayTeam: "PURE HEARTS FC",
    homeScore: null,
    awayScore: null,
    status: "upcoming",
    pitchVenue: "Tal Olympic Park / Bayern Munyonyo",
    round: "Quarter-Final 3",
    group: "Quarter-Finals",
    notes: "QF 3: Group C Winners vs Group D Runners-up (3rd Oct 2026)",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "wehat_fix_qf_4",
    tournamentId: "wehat-s2-w2",
    time: "5:00 PM",
    homeTeam: "IMDAD FC",
    awayTeam: "INVESTORS FC",
    homeScore: null,
    awayScore: null,
    status: "upcoming",
    pitchVenue: "Tal Olympic Park / Bayern Munyonyo",
    round: "Quarter-Final 4",
    group: "Quarter-Finals",
    notes: "QF 4: Group C Runners-up vs Group D Winners (3rd Oct 2026)",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

// Official 37 Scorers from WEHAT Soccer Tournament Season 2 Top Scorers List
const DEFAULT_WEHAT_SCORERS: TournamentScorer[] = [
  { id: "scr_1", tournamentId: "wehat-s2-w2", playerName: "Nyanzi Shafik", teamName: "INVESTORS FC", goals: 9 },
  { id: "scr_2", tournamentId: "wehat-s2-w2", playerName: "Raymond Junior", teamName: "WEHAT FC", goals: 5 },
  { id: "scr_3", tournamentId: "wehat-s2-w2", playerName: "Nsubuga Mark", teamName: "WEHAT SELECT", goals: 4 },
  { id: "scr_4", tournamentId: "wehat-s2-w2", playerName: "Jackson", teamName: "WEHAT SELECT", goals: 4 },
  { id: "scr_5", tournamentId: "wehat-s2-w2", playerName: "Rodney", teamName: "IMDAD FC", goals: 3 },
  { id: "scr_6", tournamentId: "wehat-s2-w2", playerName: "Ebong Mark", teamName: "IMDAD FC", goals: 3 },
  { id: "scr_7", tournamentId: "wehat-s2-w2", playerName: "Paco", teamName: "PURE HEARTS FC", goals: 3 },
  { id: "scr_8", tournamentId: "wehat-s2-w2", playerName: "Nico", teamName: "PURE HEARTS FC", goals: 2 },
  { id: "scr_9", tournamentId: "wehat-s2-w2", playerName: "David", teamName: "BUSABALA UNITED FC", goals: 2 },
  { id: "scr_10", tournamentId: "wehat-s2-w2", playerName: "Lukoye Sam", teamName: "INVESTORS FC", goals: 2 },
  { id: "scr_11", tournamentId: "wehat-s2-w2", playerName: "Luyonde Johan", teamName: "INVESTORS FC", goals: 2 },
  { id: "scr_12", tournamentId: "wehat-s2-w2", playerName: "Elijah", teamName: "PURE HEARTS FC", goals: 2 },
  { id: "scr_13", tournamentId: "wehat-s2-w2", playerName: "Semalulu Paul", teamName: "BUNGA FC", goals: 3 },
  { id: "scr_14", tournamentId: "wehat-s2-w2", playerName: "Ssempijja", teamName: "BUNGA FC", goals: 1 },
  { id: "scr_15", tournamentId: "wehat-s2-w2", playerName: "Latif", teamName: "PRO PERFORMERS FC", goals: 1 },
  { id: "scr_16", tournamentId: "wehat-s2-w2", playerName: "Magala Hassan", teamName: "BUNGA FC", goals: 1 },
  { id: "scr_17", tournamentId: "wehat-s2-w2", playerName: "Emir", teamName: "PRO PERFORMERS FC", goals: 1 },
  { id: "scr_18", tournamentId: "wehat-s2-w2", playerName: "Bwanika Shafik", teamName: "LEGENDS FC", goals: 1 },
  { id: "scr_19", tournamentId: "wehat-s2-w2", playerName: "Aronda Joshua", teamName: "LEGENDS FC", goals: 1 },
  { id: "scr_20", tournamentId: "wehat-s2-w2", playerName: "Ladin", teamName: "WEHAT SELECT", goals: 1 },
  { id: "scr_21", tournamentId: "wehat-s2-w2", playerName: "Mark Jordan", teamName: "BUNGA FC", goals: 1 },
  { id: "scr_22", tournamentId: "wehat-s2-w2", playerName: "Walusimbi", teamName: "BUNGA FC", goals: 1 },
  { id: "scr_23", tournamentId: "wehat-s2-w2", playerName: "Boyz", teamName: "INVESTORS FC", goals: 1 },
  { id: "scr_24", tournamentId: "wehat-s2-w2", playerName: "Bacola", teamName: "INVESTORS FC", goals: 1 },
  { id: "scr_25", tournamentId: "wehat-s2-w2", playerName: "Walele Tabani", teamName: "BUSABALA UNITED FC", goals: 1 },
  { id: "scr_26", tournamentId: "wehat-s2-w2", playerName: "Ssembatya Sharif", teamName: "BUSABALA UNITED FC", goals: 1 },
  { id: "scr_27", tournamentId: "wehat-s2-w2", playerName: "Bogere Sam", teamName: "BUSABALA UNITED FC", goals: 1 },
  { id: "scr_28", tournamentId: "wehat-s2-w2", playerName: "Salim", teamName: "PRO PERFORMERS FC", goals: 1 },
  { id: "scr_29", tournamentId: "wehat-s2-w2", playerName: "Muguza Collin", teamName: "LEGENDS FC", goals: 1 },
  { id: "scr_30", tournamentId: "wehat-s2-w2", playerName: "Travis", teamName: "PURE HEARTS FC", goals: 1 },
  { id: "scr_31", tournamentId: "wehat-s2-w2", playerName: "Derrick", teamName: "IMDAD FC", goals: 1 },
  { id: "scr_32", tournamentId: "wehat-s2-w2", playerName: "Kavuma Dennis", teamName: "WEHAT FC", goals: 1 },
  { id: "scr_33", tournamentId: "wehat-s2-w2", playerName: "Bwite David", teamName: "BUSABALA UNITED FC", goals: 1 },
  { id: "scr_34", tournamentId: "wehat-s2-w2", playerName: "Ultra Nkolo", teamName: "BUSABALA UNITED FC", goals: 1 },
  { id: "scr_35", tournamentId: "wehat-s2-w2", playerName: "Kabenge", teamName: "WEHAT SELECT", goals: 1 },
  { id: "scr_36", tournamentId: "wehat-s2-w2", playerName: "Isaac", teamName: "WEHAT FC", goals: 1 },
  { id: "scr_37", tournamentId: "wehat-s2-w2", playerName: "Johnmark", teamName: "WEHAT FC", goals: 1 },
];

const DEFAULT_WEHAT_NOMINEES: TournamentNominee[] = [
  {
    id: "wehat_motm_1",
    tournamentId: "wehat-s2-w2",
    nomineeName: "Nyanzi Shafik",
    teamName: "INVESTORS FC",
    position: "Forward (9 Goals • Leading Scorer & Golden Boot Frontrunner)",
    photoUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80",
    voteCount: 78,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "wehat_motm_2",
    tournamentId: "wehat-s2-w2",
    nomineeName: "Raymond Junior",
    teamName: "WEHAT FC",
    position: "Striker (5 Goals • 2nd Leading Scorer)",
    photoUrl: "https://images.unsplash.com/photo-1508098682722-e99c43a406b2?w=150&auto=format&fit=crop&q=80",
    voteCount: 54,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "wehat_motm_3",
    tournamentId: "wehat-s2-w2",
    nomineeName: "Nsubuga Mark",
    teamName: "WEHAT SELECT",
    position: "Forward (4 Goals)",
    photoUrl: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=150&auto=format&fit=crop&q=80",
    voteCount: 47,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "wehat_motm_4",
    tournamentId: "wehat-s2-w2",
    nomineeName: "Jackson",
    teamName: "WEHAT SELECT",
    position: "Forward (4 Goals)",
    photoUrl: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80",
    voteCount: 39,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "wehat_motm_5",
    tournamentId: "wehat-s2-w2",
    nomineeName: "Semalulu Paul",
    teamName: "BUNGA FC",
    position: "Striker (3 Goals)",
    photoUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
    voteCount: 33,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "wehat_motm_6",
    tournamentId: "wehat-s2-w2",
    nomineeName: "Paco",
    teamName: "PURE HEARTS FC",
    position: "Forward (3 Goals)",
    photoUrl: "https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=150&auto=format&fit=crop&q=80",
    voteCount: 26,
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
  standings: new Map<string, TournamentTeamStanding[]>(),
  fixtureSubscribers: new Map<string, Set<(fixtures: TournamentFixture[]) => void>>(),
  scorerSubscribers: new Map<string, Set<(scorers: TournamentScorer[]) => void>>(),
  nomineeSubscribers: new Map<string, Set<(nominees: TournamentNominee[]) => void>>(),
  teamSubscribers: new Map<string, Set<(teams: TournamentTeam[]) => void>>(),
  playerSubscribers: new Map<string, Set<(players: TournamentPlayer[]) => void>>(),
  standingSubscribers: new Map<string, Set<(standings: TournamentTeamStanding[]) => void>>(),
};

// Helper to check if tournament is WEHAT Season 2
function isWehatSeason2(tournamentId: string): boolean {
  return tournamentId.startsWith("wehat-s2") || tournamentId === "wehat-s2-w2" || tournamentId === "wehat-s2-w1";
}

// Initialize default store for tournament fixtures
function getLocalFixtures(tournamentId: string): TournamentFixture[] {
  if (!memoryStore.fixtures.has(tournamentId)) {
    const isWehat = isWehatSeason2(tournamentId);
    const defaults = isWehat
      ? DEFAULT_WEHAT_FIXTURES.map((f) => ({ ...f, tournamentId }))
      : [];

    if (typeof window !== "undefined") {
      const saved = localStorage.getItem(`tourn_fixtures_${tournamentId}`);
      // If saved data is missing official Quarter-Finals or Matchday 3 finished scores, refresh to defaults
      if (saved && saved.includes("wehat_fix_qf_1") && saved.includes("wehat_fix_md3_24") && saved.includes('"homeScore":1,"awayScore":3')) {
        try {
          memoryStore.fixtures.set(tournamentId, JSON.parse(saved));
        } catch {
          memoryStore.fixtures.set(tournamentId, defaults);
        }
      } else {
        memoryStore.fixtures.set(tournamentId, defaults);
        if (isWehat) {
          try {
            localStorage.setItem(`tourn_fixtures_${tournamentId}`, JSON.stringify(defaults));
          } catch {}
        }
      }
    } else {
      memoryStore.fixtures.set(tournamentId, defaults);
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
    const isWehat = isWehatSeason2(tournamentId);
    const defaults = isWehat
      ? DEFAULT_WEHAT_SCORERS.map((s) => ({ ...s, tournamentId }))
      : [];

    if (typeof window !== "undefined") {
      const saved = localStorage.getItem(`tourn_scorers_${tournamentId}`);
      // Check if saved list contains Semalulu Paul and Nyanzi Shafik with 9 goals
      if (saved && saved.includes("Semalulu Paul") && saved.includes('"playerName":"Nyanzi Shafik"') && saved.includes('"goals":9')) {
        try {
          memoryStore.scorers.set(tournamentId, JSON.parse(saved));
        } catch {
          memoryStore.scorers.set(tournamentId, defaults);
        }
      } else {
        memoryStore.scorers.set(tournamentId, defaults);
        if (isWehat) {
          try {
            localStorage.setItem(`tourn_scorers_${tournamentId}`, JSON.stringify(defaults));
          } catch {}
        }
      }
    } else {
      memoryStore.scorers.set(tournamentId, defaults);
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
    const isWehat = isWehatSeason2(tournamentId);
    const defaults = isWehat
      ? DEFAULT_WEHAT_NOMINEES.map((n) => ({ ...n, tournamentId }))
      : [];

    if (typeof window !== "undefined") {
      const saved = localStorage.getItem(`tourn_nominees_${tournamentId}`);
      if (saved && saved.includes("Raymond Junior")) {
        try {
          memoryStore.nominees.set(tournamentId, JSON.parse(saved));
        } catch {
          memoryStore.nominees.set(tournamentId, defaults);
        }
      } else {
        memoryStore.nominees.set(tournamentId, defaults);
        if (isWehat) {
          try {
            localStorage.setItem(`tourn_nominees_${tournamentId}`, JSON.stringify(defaults));
          } catch {}
        }
      }
    } else {
      memoryStore.nominees.set(tournamentId, defaults);
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

// Teams & Players initial registration data for WEHAT (Official 4 Groups)
const DEFAULT_WEHAT_TEAMS: TournamentTeam[] = [
  // Group A
  { id: "tm_1", tournamentId: "wehat-s2-w2", teamName: "WEHAT SELECT", group: "Group A", managerName: "Coach Jackson", badgeInitials: "WS" },
  { id: "tm_2", tournamentId: "wehat-s2-w2", teamName: "BUSABALA UNITED FC", group: "Group A", managerName: "Coach David", badgeInitials: "BUF" },
  { id: "tm_3", tournamentId: "wehat-s2-w2", teamName: "BROTHER LOVE FC", group: "Group A", managerName: "Coach Paul", badgeInitials: "BLF" },
  { id: "tm_4", tournamentId: "wehat-s2-w2", teamName: "KIRUDDU HOSP FC", group: "Group A", managerName: "Coach Hassan", badgeInitials: "KHF" },

  // Group B
  { id: "tm_5", tournamentId: "wehat-s2-w2", teamName: "BUNGA FC", group: "Group B", managerName: "Coach Jordan", badgeInitials: "BFC" },
  { id: "tm_6", tournamentId: "wehat-s2-w2", teamName: "LEGENDS FC", group: "Group B", managerName: "Coach Alex", badgeInitials: "LFC" },
  { id: "tm_7", tournamentId: "wehat-s2-w2", teamName: "PRO PERFORMERS FC", group: "Group B", managerName: "Coach Brian", badgeInitials: "PPF" },
  { id: "tm_8", tournamentId: "wehat-s2-w2", teamName: "SENIOR PLAYERS", group: "Group B", managerName: "Coach Senior", badgeInitials: "SPF" },

  // Group C
  { id: "tm_9", tournamentId: "wehat-s2-w2", teamName: "WEHAT FC", group: "Group C", managerName: "Coach David", badgeInitials: "WFC" },
  { id: "tm_10", tournamentId: "wehat-s2-w2", teamName: "IMDAD FC", group: "Group C", managerName: "Coach Mark", badgeInitials: "IFC" },
  { id: "tm_11", tournamentId: "wehat-s2-w2", teamName: "GOOD FRIENDS", group: "Group C", managerName: "Coach Emma", badgeInitials: "GF" },
  { id: "tm_12", tournamentId: "wehat-s2-w2", teamName: "DODGE AMO FC", group: "Group C", managerName: "Coach Amo", badgeInitials: "DAF" },

  // Group D
  { id: "tm_13", tournamentId: "wehat-s2-w2", teamName: "INVESTORS FC", group: "Group D", managerName: "Coach Shafik", badgeInitials: "IFC" },
  { id: "tm_14", tournamentId: "wehat-s2-w2", teamName: "PURE HEARTS FC", group: "Group D", managerName: "Coach Joseph", badgeInitials: "PHF" },
  { id: "tm_15", tournamentId: "wehat-s2-w2", teamName: "GENTLE STAR FC", group: "Group D", managerName: "Coach Mukisa", badgeInitials: "GSF" },
  { id: "tm_16", tournamentId: "wehat-s2-w2", teamName: "HMK", group: "Group D", managerName: "Coach Hussein", badgeInitials: "HMK" },
];

function getLocalTeams(tournamentId: string): TournamentTeam[] {
  if (!memoryStore.teams.has(tournamentId)) {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem(`tourn_teams_${tournamentId}`);
      if (saved && saved.includes("WEHAT SELECT")) {
        try {
          const parsed = JSON.parse(saved);
          if (parsed.some((t: any) => t.teamName === "WEHAT SELECT" && t.group === "Group A")) {
            memoryStore.teams.set(tournamentId, parsed);
          } else {
            memoryStore.teams.set(tournamentId, [...DEFAULT_WEHAT_TEAMS]);
            localStorage.setItem(`tourn_teams_${tournamentId}`, JSON.stringify(DEFAULT_WEHAT_TEAMS));
          }
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

// Normalize team names for aliases and historical names from tournament posters
export function normalizeTournamentTeam(name: string): string {
  if (!name) return "";
  const trimmed = name.trim();
  if (trimmed === "GENTLE FC" || trimmed === "GENTLER STAR") return "GENTLE STAR FC";
  if (trimmed === "KIRUDDU FC" || trimmed === "KIRUNDU FC") return "KIRUDDU HOSP FC";
  if (trimmed === "BUSABALA FC" || trimmed === "BUSABALA UNITED") return "BUSABALA UNITED FC";
  if (trimmed === "PURE HEARTS") return "PURE HEARTS FC";
  if (trimmed === "INVESTOR FC") return "INVESTORS FC";
  if (trimmed === "GOODFRIENDS") return "GOOD FRIENDS";
  if (trimmed === "DODGE FC") return "DODGE AMO FC";
  if (trimmed === "PRO PERFORMERS") return "PRO PERFORMERS FC";
  if (trimmed === "LEGENDS") return "LEGENDS FC";
  if (trimmed === "IMDAD") return "IMDAD FC";
  if (trimmed === "BROTHER LOVE") return "BROTHER LOVE FC";
  if (trimmed === "HMK FC") return "HMK";
  return trimmed;
}

export function slugifyTournament(text: string): string {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

// Sort standings dynamically based on Points, Goal Difference, and Wins
export function sortStandingsByPointsGdWins(
  standings: TournamentTeamStanding[]
): TournamentTeamStanding[] {
  const sorted = [...standings].sort((a, b) => {
    // 1. Points (descending)
    if (b.points !== a.points) {
      return b.points - a.points;
    }
    // 2. Goal Difference (descending)
    if (b.goalDifference !== a.goalDifference) {
      return b.goalDifference - a.goalDifference;
    }
    // 3. Wins (descending)
    if (b.won !== a.won) {
      return b.won - a.won;
    }
    // 4. Goals For (descending)
    if (b.goalsFor !== a.goalsFor) {
      return b.goalsFor - a.goalsFor;
    }
    // 5. Goals Against (ascending)
    if (a.goalsAgainst !== b.goalsAgainst) {
      return a.goalsAgainst - b.goalsAgainst;
    }
    // 6. Alphabetical
    return a.team.localeCompare(b.team);
  });

  return sorted.map((s, idx) => ({
    ...s,
    position: idx + 1,
  }));
}

// Aggregate standings dynamically from match fixtures
export function aggregateStandingsFromFixtures(
  fixtures: TournamentFixture[],
  tournamentId: string = DEFAULT_TOURNAMENT.id
): TournamentTeamStanding[] {
  const teamsMap = new Map<string, TournamentTeamStanding>();

  DEFAULT_WEHAT_TEAMS.forEach((t) => {
    const norm = normalizeTournamentTeam(t.teamName);
    teamsMap.set(norm, {
      id: `${tournamentId}_${slugifyTournament(norm)}`,
      tournamentId,
      position: 0,
      team: norm,
      group: t.group,
      played: 0,
      won: 0,
      drawn: 0,
      lost: 0,
      goalsFor: 0,
      goalsAgainst: 0,
      goalDifference: 0,
      points: 0,
      winRate: 0,
      form: [],
      updatedAt: new Date().toISOString(),
    });
  });

  fixtures.forEach((f) => {
    if (
      (f.status === "finished" || f.status === "live") &&
      f.homeScore !== null &&
      f.awayScore !== null
    ) {
      const homeNorm = normalizeTournamentTeam(f.homeTeam);
      const awayNorm = normalizeTournamentTeam(f.awayTeam);

      let home = teamsMap.get(homeNorm);
      if (!home) {
        home = {
          id: `${tournamentId}_${slugifyTournament(homeNorm)}`,
          tournamentId,
          position: 0,
          team: homeNorm,
          group: f.group || "Group A",
          played: 0,
          won: 0,
          drawn: 0,
          lost: 0,
          goalsFor: 0,
          goalsAgainst: 0,
          goalDifference: 0,
          points: 0,
          winRate: 0,
          form: [],
          updatedAt: new Date().toISOString(),
        };
        teamsMap.set(homeNorm, home);
      }

      let away = teamsMap.get(awayNorm);
      if (!away) {
        away = {
          id: `${tournamentId}_${slugifyTournament(awayNorm)}`,
          tournamentId,
          position: 0,
          team: awayNorm,
          group: f.group || "Group A",
          played: 0,
          won: 0,
          drawn: 0,
          lost: 0,
          goalsFor: 0,
          goalsAgainst: 0,
          goalDifference: 0,
          points: 0,
          winRate: 0,
          form: [],
          updatedAt: new Date().toISOString(),
        };
        teamsMap.set(awayNorm, away);
      }

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

  const list = Array.from(teamsMap.values()).map((t) => ({
    ...t,
    goalDifference: t.goalsFor - t.goalsAgainst,
    winRate: t.played > 0 ? Math.round((t.won / t.played) * 100) : 0,
    form: t.form.slice(0, 5),
  }));

  return sortStandingsByPointsGdWins(list);
}

function getLocalStandings(tournamentId: string): TournamentTeamStanding[] {
  if (!memoryStore.standings.has(tournamentId)) {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem(`tourn_standings_${tournamentId}`);
      if (saved) {
        try {
          memoryStore.standings.set(tournamentId, JSON.parse(saved));
        } catch {
          const fixtures = getLocalFixtures(tournamentId);
          memoryStore.standings.set(tournamentId, aggregateStandingsFromFixtures(fixtures, tournamentId));
        }
      } else {
        const fixtures = getLocalFixtures(tournamentId);
        const computed = aggregateStandingsFromFixtures(fixtures, tournamentId);
        memoryStore.standings.set(tournamentId, computed);
        localStorage.setItem(`tourn_standings_${tournamentId}`, JSON.stringify(computed));
      }
    } else {
      const fixtures = getLocalFixtures(tournamentId);
      memoryStore.standings.set(tournamentId, aggregateStandingsFromFixtures(fixtures, tournamentId));
    }
  }
  return memoryStore.standings.get(tournamentId) || [];
}

function saveLocalStandings(tournamentId: string, items: TournamentTeamStanding[]) {
  memoryStore.standings.set(tournamentId, items);
  if (typeof window !== "undefined") {
    try {
      localStorage.setItem(`tourn_standings_${tournamentId}`, JSON.stringify(items));
    } catch {}
  }
  const subs = memoryStore.standingSubscribers.get(tournamentId);
  if (subs) {
    subs.forEach((cb) => cb([...items]));
  }
}

export const tournamentService = {
  // ==========================================
  // 1. TOURNAMENT FIXTURES (LIVE SCORES)
  // ==========================================
  async getFixtures(tournamentId: string): Promise<TournamentFixture[]> {
    try {
      const q = query(
        collection(db, FIXTURES_COLLECTION),
        where("tournamentId", "==", tournamentId)
      );
      const snapshot = await getDocs(q);
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
        return fixtures;
      }
    } catch (e) {
      console.warn("getFixtures fallback to local:", e);
    }
    return getLocalFixtures(tournamentId);
  },

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
      tournamentService.syncStandingsToFirestore(fixture.tournamentId);
    } catch (e) {
      console.warn("Firestore sync warning on addFixture (local state preserved):", e);
    }

    return fixtureId;
  },

  async updateFixture(
    id: string,
    updates: Partial<TournamentFixture>
  ): Promise<void> {
    let affectedTournamentId: string | null = null;
    // Update local state
    for (const [tId, fixtures] of memoryStore.fixtures.entries()) {
      const idx = fixtures.findIndex((f) => f.id === id);
      if (idx !== -1) {
        affectedTournamentId = tId;
        const next = [...fixtures];
        next[idx] = { ...next[idx], ...updates, updatedAt: new Date().toISOString() };
        saveLocalFixtures(tId, next);
        break;
      }
    }

    try {
      const fixtureRef = doc(db, FIXTURES_COLLECTION, id);
      await setDoc(
        fixtureRef,
        {
          ...updates,
          updatedAt: new Date().toISOString(),
        },
        { merge: true }
      );
      if (affectedTournamentId) {
        tournamentService.syncStandingsToFirestore(affectedTournamentId);
      }
    } catch (e) {
      console.warn("Firestore sync warning on updateFixture:", e);
    }
  },

  async deleteFixture(id: string): Promise<void> {
    let affectedTournamentId: string | null = null;
    for (const [tId, fixtures] of memoryStore.fixtures.entries()) {
      const idx = fixtures.findIndex((f) => f.id === id);
      if (idx !== -1) {
        affectedTournamentId = tId;
        const next = fixtures.filter((f) => f.id !== id);
        saveLocalFixtures(tId, next);
        break;
      }
    }

    try {
      const fixtureRef = doc(db, FIXTURES_COLLECTION, id);
      await deleteDoc(fixtureRef);
      if (affectedTournamentId) {
        tournamentService.syncStandingsToFirestore(affectedTournamentId);
      }
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
      await setDoc(
        scorerRef,
        {
          ...updates,
          updatedAt: new Date().toISOString(),
        },
        { merge: true }
      );
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
    const fixturesWithId = DEFAULT_WEHAT_FIXTURES.map((f) => ({ ...f, tournamentId }));
    const scorersWithId = DEFAULT_WEHAT_SCORERS.map((s) => ({ ...s, tournamentId }));
    const nomineesWithId = DEFAULT_WEHAT_NOMINEES.map((n) => ({ ...n, tournamentId }));

    // Reset local store with default seed
    saveLocalFixtures(tournamentId, fixturesWithId);
    saveLocalScorers(tournamentId, scorersWithId);
    saveLocalNominees(tournamentId, nomineesWithId);

    try {
      const batch = writeBatch(db);
      fixturesWithId.forEach((f) => {
        const docRef = doc(db, FIXTURES_COLLECTION, f.id);
        batch.set(docRef, f);
      });
      scorersWithId.forEach((s) => {
        const docRef = doc(db, SCORERS_COLLECTION, s.id);
        batch.set(docRef, s);
      });
      nomineesWithId.forEach((n) => {
        const docRef = doc(db, NOMINEES_COLLECTION, n.id);
        batch.set(docRef, n);
      });
      await batch.commit();

      // Seed/sync dynamic standings to Firestore
      await tournamentService.syncStandingsToFirestore(tournamentId);
    } catch (e) {
      console.warn("Firestore batch seed warning (local seed active):", e);
    }

    return {
      fixturesCount: fixturesWithId.length,
      scorersCount: scorersWithId.length,
      nomineesCount: nomineesWithId.length,
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

  // ==========================================
  // 7. TOURNAMENT LEADERBOARD & DYNAMIC AGGREGATION
  // ==========================================
  /**
   * Subscribes to live aggregated team standings and leaderboard from Firestore.
   * Dynamically sorted based on Points (desc), Goal Difference (desc), and Wins (desc).
   */
  subscribeToLeaderboard(
    tournamentId: string,
    callback: (standings: TournamentTeamStanding[]) => void,
    onError?: (error: Error) => void
  ): () => void {
    // Initial emit from local cache immediately
    const initial = getLocalStandings(tournamentId);
    callback(initial);

    if (!memoryStore.standingSubscribers.has(tournamentId)) {
      memoryStore.standingSubscribers.set(tournamentId, new Set());
    }
    const subs = memoryStore.standingSubscribers.get(tournamentId)!;
    subs.add(callback);

    let unsubFirestore: (() => void) | null = null;
    try {
      const q = query(
        collection(db, STANDINGS_COLLECTION),
        where("tournamentId", "==", tournamentId)
      );

      unsubFirestore = onSnapshot(
        q,
        (snapshot) => {
          if (!snapshot.empty) {
            const list: TournamentTeamStanding[] = [];
            snapshot.forEach((docSnap) => {
              list.push({
                id: docSnap.id,
                ...(docSnap.data() as Omit<TournamentTeamStanding, "id">),
              });
            });

            // Dynamically sort based on Points -> Goal Difference -> Wins
            const sorted = sortStandingsByPointsGdWins(list);
            saveLocalStandings(tournamentId, sorted);
          } else {
            // If collection is empty in Firestore, automatically aggregate from fixtures and seed
            tournamentService.syncStandingsToFirestore(tournamentId);
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

  /**
   * Aggregates tournament fixtures and writes the updated standings directly to Firestore.
   */
  async syncStandingsToFirestore(
    tournamentId: string,
    customStandings?: TournamentTeamStanding[]
  ): Promise<TournamentTeamStanding[]> {
    const fixtures = getLocalFixtures(tournamentId);
    const standings =
      customStandings || aggregateStandingsFromFixtures(fixtures, tournamentId);
    const sorted = sortStandingsByPointsGdWins(standings);

    saveLocalStandings(tournamentId, sorted);

    try {
      const batch = writeBatch(db);
      sorted.forEach((standing) => {
        const docId = standing.id || `${tournamentId}_${slugifyTournament(standing.team)}`;
        const docRef = doc(db, STANDINGS_COLLECTION, docId);
        batch.set(docRef, {
          ...standing,
          id: docId,
          tournamentId,
          updatedAt: new Date().toISOString(),
        });
      });
      await batch.commit();
    } catch (e) {
      console.warn("Firestore sync warning on syncStandingsToFirestore:", e);
    }

    return sorted;
  },

  /**
   * Fetches the latest leaderboard dynamically from Firestore (or local aggregate fallback).
   */
  async getLeaderboard(tournamentId: string): Promise<TournamentTeamStanding[]> {
    try {
      const q = query(
        collection(db, STANDINGS_COLLECTION),
        where("tournamentId", "==", tournamentId)
      );
      const snapshot = await getDocs(q);
      if (!snapshot.empty) {
        const list: TournamentTeamStanding[] = [];
        snapshot.forEach((docSnap) => {
          list.push({
            id: docSnap.id,
            ...(docSnap.data() as Omit<TournamentTeamStanding, "id">),
          });
        });
        const sorted = sortStandingsByPointsGdWins(list);
        saveLocalStandings(tournamentId, sorted);
        return sorted;
      }
    } catch (err) {
      console.warn("Firestore getDocs warning on getLeaderboard:", err);
    }

    // Fallback: aggregate from fixtures
    return tournamentService.syncStandingsToFirestore(tournamentId);
  },
};
