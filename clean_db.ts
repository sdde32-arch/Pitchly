import { initializeApp } from "firebase/app";
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword } from "firebase/auth";
import { getFirestore, collection, getDocs, deleteDoc, doc, setDoc } from "firebase/firestore";
import fs from "fs";

const config = JSON.parse(fs.readFileSync("./firebase-applet-config.json", "utf-8"));
const app = initializeApp(config);
const auth = getAuth(app);
const db = getFirestore(app);

async function clean() {
  console.log("Starting cleanup check...");
  // Let's create or sign in with test user
  let user;
  try {
    const cred = await signInWithEmailAndPassword(auth, "admin.test@pitchly.com", "AdminPass123!");
    user = cred.user;
  } catch {
    const cred = await createUserWithEmailAndPassword(auth, "admin.test@pitchly.com", "AdminPass123!");
    user = cred.user;
  }
  console.log("Logged in user:", user.uid);

  // Check pitches
  const snap = await getDocs(collection(db, "pitches"));
  console.log(`Found ${snap.docs.length} pitches in Firestore.`);
  for (const d of snap.docs) {
    console.log("Pitch:", d.id, d.data().name);
  }
}

clean().catch(console.error);
