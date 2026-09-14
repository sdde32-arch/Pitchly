import { initializeApp } from "firebase/app";
import { getAuth, signInWithEmailAndPassword } from "firebase/auth";
import { getFirestore, collection, getDocs, query, where } from "firebase/firestore";
import fs from "fs";

const config = JSON.parse(fs.readFileSync("./firebase-applet-config.json", "utf-8"));
const app = initializeApp(config);
const auth = getAuth(app);
const db = getFirestore(app);

async function test() {
  const q = query(collection(db, "pitches"), where("status", "==", "ACTIVE"));
  const snap = await getDocs(q);
  console.log(`Active pitches count: ${snap.size}`);
  snap.forEach(d => console.log(d.id, "=>", d.data().name));
  process.exit(0);
}

test().catch(e => {
  console.error("Test failed:", e);
  process.exit(1);
});
