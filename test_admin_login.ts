import { initializeApp } from "firebase/app";
import { getAuth, signInWithEmailAndPassword } from "firebase/auth";
import { getFirestore, collection, getDocs } from "firebase/firestore";
import fs from "fs";

const config = JSON.parse(fs.readFileSync("./firebase-applet-config.json", "utf-8"));
const app = initializeApp(config);
const auth = getAuth(app);
const db = getFirestore(app);

async function test() {
  const cred = await signInWithEmailAndPassword(auth, "admin.test@pitchly.com", "AdminPass123!");
  console.log("Logged in as UID:", cred.user.uid);
  const snap = await getDocs(collection(db, "pitches"));
  console.log(`Found ${snap.size} pitches:`);
  snap.forEach(d => console.log(d.id, "=>", d.data().name, "status:", d.data().status));
  process.exit(0);
}

test().catch(e => {
  console.error("Test failed:", e);
  process.exit(1);
});
