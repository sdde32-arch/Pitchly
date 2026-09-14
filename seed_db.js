import { initializeApp } from "firebase/app";
import { getFirestore, collection, doc, writeBatch } from "firebase/firestore";
import fs from "fs";

// Load config
const configPath = "firebase-applet-config.json";
if (!fs.existsSync(configPath)) {
    console.error("No config");
    process.exit(1);
}
const configStr = fs.readFileSync(configPath, "utf-8");
const config = JSON.parse(configStr);
if (!config.webConfig) {
    console.error("No webConfig");
    process.exit(1);
}

const app = initializeApp(config.webConfig);
const db = getFirestore(app);

const DEFAULT_WEHAT_FIXTURES = [
  {
    id: "wehat_fix_1",
    tournamentId: "wehat-s2-w1",
    homeTeam: "Baggies FC",
    awayTeam: "Spartans",
    homeScore: 2,
    awayScore: 1,
    time: "10:00 AM",
    date: "12 Sept 2026",
    status: "finished",
    round: "Match 1",
    pitchVenue: "Tal Olympic",
    homeGoalScorers: ["Lule (1)", "Otim (1)"],
    awayGoalScorers: ["Okello (1)"],
  },
  {
    id: "wehat_fix_2",
    tournamentId: "wehat-s2-w1",
    homeTeam: "Tal FC",
    awayTeam: "Strikers",
    homeScore: 3,
    awayScore: 3,
    time: "11:30 AM",
    date: "12 Sept 2026",
    status: "finished",
    round: "Match 2",
    pitchVenue: "Bayern Munyonyo",
    homeGoalScorers: ["Kizza (2)", "Mato (1)"],
    awayGoalScorers: ["Ssebu (3)"],
  },
  {
    id: "wehat_fix_3",
    tournamentId: "wehat-s2-w1",
    homeTeam: "Warriors FC",
    awayTeam: "Panthers",
    homeScore: 1,
    awayScore: 0,
    time: "02:00 PM",
    date: "12 Sept 2026",
    status: "live",
    round: "Match 3",
    pitchVenue: "Tal Olympic",
    homeGoalScorers: ["Kato (1)"],
  },
  {
    id: "wehat_fix_4",
    tournamentId: "wehat-s2-w1",
    homeTeam: "Knights FC",
    awayTeam: "Eagles",
    homeScore: null,
    awayScore: null,
    time: "03:30 PM",
    date: "12 Sept 2026",
    status: "upcoming",
    round: "Match 4",
    pitchVenue: "Bayern Munyonyo",
  },
];

const DEFAULT_WEHAT_SCORERS = [
  { id: "s1", tournamentId: "wehat-s2-w1", playerName: "Ssebu", teamName: "Strikers", goals: 3, appearances: 1 },
  { id: "s2", tournamentId: "wehat-s2-w1", playerName: "Kizza", teamName: "Tal FC", goals: 2, appearances: 1 },
  { id: "s3", tournamentId: "wehat-s2-w1", playerName: "Lule", teamName: "Baggies FC", goals: 1, appearances: 1 },
  { id: "s4", tournamentId: "wehat-s2-w1", playerName: "Otim", teamName: "Baggies FC", goals: 1, appearances: 1 },
  { id: "s5", tournamentId: "wehat-s2-w1", playerName: "Mato", teamName: "Tal FC", goals: 1, appearances: 1 },
  { id: "s6", tournamentId: "wehat-s2-w1", playerName: "Kato", teamName: "Warriors FC", goals: 1, appearances: 1 },
];

const DEFAULT_WEHAT_NOMINEES = [
  { id: "n1", tournamentId: "wehat-s2-w1", playerName: "Ssebu", teamName: "Strikers", position: "Forward", voteCount: 42 },
  { id: "n2", tournamentId: "wehat-s2-w1", playerName: "Kizza", teamName: "Tal FC", position: "Midfielder", voteCount: 38 },
  { id: "n3", tournamentId: "wehat-s2-w1", playerName: "Kato", teamName: "Warriors FC", position: "Defender", voteCount: 15 },
];

async function seed() {
    const batch = writeBatch(db);
    
    DEFAULT_WEHAT_FIXTURES.forEach(fix => {
        batch.set(doc(collection(db, "tournamentFixtures"), fix.id), fix);
    });
    
    DEFAULT_WEHAT_SCORERS.forEach(s => {
        batch.set(doc(collection(db, "tournamentScorers"), s.id), s);
    });
    
    DEFAULT_WEHAT_NOMINEES.forEach(n => {
        batch.set(doc(collection(db, "tournamentNominees"), n.id), n);
    });
    
    await batch.commit();
    console.log("Seeded successfully");
    process.exit(0);
}

seed().catch(e => {
    console.error(e);
    process.exit(1);
});
