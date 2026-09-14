import { initializeApp } from "firebase/app";
import { getAuth, signInWithEmailAndPassword } from "firebase/auth";
import { getFirestore, doc, deleteDoc } from "firebase/firestore";
import fs from "fs";

const config = JSON.parse(fs.readFileSync("./firebase-applet-config.json", "utf-8"));
const app = initializeApp(config);
const auth = getAuth(app);

async function test() {
  const cred = await signInWithEmailAndPassword(auth, "admin.test@pitchly.com", "AdminPass123!");
  console.log("Logged in UID:", cred.user.uid);
  const token = await cred.user.getIdToken();
  console.log("Token obtained length:", token.length);

  const db = getFirestore(app);
  try {
    await deleteDoc(doc(db, "pitches", "test_pitch_1785092485867"));
    console.log("SUCCESSFULLY DELETED test_pitch_1785092485867");
  } catch (e: any) {
    console.error("Delete failed:", e.message);
  }
  process.exit(0);
}

test().catch(console.error);
