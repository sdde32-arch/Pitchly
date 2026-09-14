import { initializeApp } from 'firebase/app';
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';
import { getFirestore, doc, deleteDoc } from 'firebase/firestore';
import { readFileSync } from 'fs';

const config = JSON.parse(readFileSync('./firebase-applet-config.json', 'utf-8'));
const app = initializeApp(config);
const auth = getAuth(app);
const db = getFirestore(app);

async function test() {
  try {
    const cred = await signInWithEmailAndPassword(auth, "test.user.123@test.com", "password123");
    console.log("Logged in UID:", cred.user.uid);
    await deleteDoc(doc(db, "pitches", "pitch_leaflet_1785092941602"));
    console.log("DELETED SUCCESSFULLY!");
  } catch(e: any) {
    console.log("FAIL:", e.message);
  }
  process.exit(0);
}
test();
