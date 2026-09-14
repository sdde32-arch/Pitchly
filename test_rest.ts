import { initializeApp } from "firebase/app";
import { getAuth, signInWithEmailAndPassword } from "firebase/auth";
import fs from "fs";

const config = JSON.parse(fs.readFileSync("./firebase-applet-config.json", "utf-8"));
const app = initializeApp(config);
const auth = getAuth(app);

async function testRest() {
  const cred = await signInWithEmailAndPassword(auth, "admin.test@pitchly.com", "AdminPass123!");
  const token = await cred.user.getIdToken();

  const url = `https://firestore.googleapis.com/v1/projects/${config.projectId}/databases/(default)/documents/pitches`;
  const getRes = await fetch(url, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });
  const data = await getRes.json();
  console.log("REST GET status:", getRes.status);
  console.log("Response JSON:", JSON.stringify(data, null, 2));
}

testRest().catch(console.error);
