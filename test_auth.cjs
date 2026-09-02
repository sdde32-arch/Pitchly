const { initializeApp } = require("firebase/app");
const { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword } = require("firebase/auth");
const { getFirestore, collection, query, where, getDocs } = require("firebase/firestore");

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
  const email = `test_${Date.now()}@pitchly.com`;
  const password = "password123";
  try {
    await createUserWithEmailAndPassword(auth, email, password);
  } catch (e) {
    if (e.code === 'auth/email-already-in-use') {
      await signInWithEmailAndPassword(auth, email, password);
    } else {
      throw e;
    }
  }

  const q1 = query(collection(db, "users"), where("role", "==", "ADMIN"));
  const q2 = query(collection(db, "users"), where("role", "==", "admin"));
  const q3 = query(collection(db, "users"), where("role", "==", "super_admin"));
  
  const results = [];
  
  const [s1, s2, s3] = await Promise.all([getDocs(q1), getDocs(q2), getDocs(q3)]);
  s1.forEach(d => results.push({ id: d.id, ...d.data() }));
  s2.forEach(d => results.push({ id: d.id, ...d.data() }));
  s3.forEach(d => results.push({ id: d.id, ...d.data() }));
  
  console.log(JSON.stringify(results, null, 2));
  process.exit(0);
}

run().catch(e => {
  console.error(e);
  process.exit(1);
});
