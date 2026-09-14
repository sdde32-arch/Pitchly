import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs, query, where } from "firebase/firestore";
import fs from "fs";

const config = JSON.parse(fs.readFileSync("./firebase-applet-config.json", "utf-8"));
const app = initializeApp(config);
const db = getFirestore(app);

async function inspect() {
  const q = query(collection(db, "pitches"), where("status", "==", "ACTIVE"));
  const snap = await getDocs(q);
  snap.forEach(d => {
    const data = d.data();
    console.log(d.id, "=> ownerId:", data.ownerId, "status:", data.status);
  });
  process.exit(0);
}

inspect().catch(console.error);
