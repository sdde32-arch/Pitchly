const { initializeApp } = require("firebase/app");
const { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword } = require("firebase/auth");
const { getFirestore, collection, doc, getDoc } = require("firebase/firestore");

const firebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY,
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: process.env.VITE_FIREBASE_PROJECT_ID + ".appspot.com",
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

async function run() {
  const email = `test_admin_${Date.now()}@pitchly.com`;
  const password = "password123";
  try {
    await createUserWithEmailAndPassword(auth, email, password);
  } catch (e) {}

  const d = await getDoc(doc(db, "users", "0uVlAOWTy7dpqAW5tsgxQVs4PW43"));
  if (d.exists()) {
    console.log(JSON.stringify({ id: d.id, ...d.data() }, null, 2));
  } else {
    console.log("No document for hardcoded admin uid");
  }
  process.exit(0);
}

run().catch(e => {
  console.error(e);
  process.exit(1);
});
