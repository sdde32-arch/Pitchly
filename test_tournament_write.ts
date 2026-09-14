import { initializeApp } from 'firebase/app';
import { getFirestore, doc, setDoc } from 'firebase/firestore';
import { readFileSync } from 'fs';

const config = JSON.parse(readFileSync('./firebase-applet-config.json', 'utf-8'));
const app = initializeApp(config);
const db = getFirestore(app);

async function test() {
  try {
    await setDoc(doc(db, "tournamentFixtures", "test_fixture"), { test: true });
    console.log("SUCCESSFULLY WROTE TO tournamentFixtures!");
  } catch (e: any) {
    console.error("FAILED tournamentFixtures write:", e.message);
  }
  process.exit(0);
}

test();
