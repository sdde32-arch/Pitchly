import { initializeApp } from "firebase/app";
import { getAuth, signInWithEmailAndPassword } from "firebase/auth";
import fs from "fs";

const config = JSON.parse(fs.readFileSync("./firebase-applet-config.json", "utf-8"));
const app = initializeApp(config);
const auth = getAuth(app);

async function testSingle() {
  const cred = await signInWithEmailAndPassword(auth, "admin.test@pitchly.com", "AdminPass123!");
  const token = await cred.user.getIdToken();

  const url = `https://firestore.googleapis.com/v1/projects/${config.projectId}/databases/(default)/documents/pitches/test_pitch_1785092485867`;
  const getRes = await fetch(url, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });
  console.log("Status:", getRes.status);
  const data = await getRes.json();
  console.log("Doc:", data);
}

testSingle().catch(console.error);
