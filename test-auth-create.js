import { initializeApp } from 'firebase/app';
import { getAuth, createUserWithEmailAndPassword } from 'firebase/auth';
import { readFileSync } from 'fs';

const config = JSON.parse(readFileSync('./firebase-applet-config.json', 'utf-8'));
const app = initializeApp(config);
const auth = getAuth(app);

async function test() {
  try {
    const cred = await createUserWithEmailAndPassword(auth, "test.user.123@test.com", "password123");
    console.log("SUCCESS CREATE", cred.user.uid);
  } catch(e) {
    console.log("FAIL", e.message);
  }
}
test();
