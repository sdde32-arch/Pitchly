import { initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import fs from "fs";

const config = JSON.parse(fs.readFileSync("./firebase-applet-config.json", "utf-8"));

try {
  const app = initializeApp({
    projectId: config.projectId,
  });
  const db = getFirestore(app);
  console.log("Testing getFirestore()...");
  const snap = await db.collection("pitches").get();
  console.log("Admin SDK SUCCESS! Pitch count:", snap.size);
  snap.forEach(d => console.log("Found pitch:", d.id, d.data().name));
  process.exit(0);
} catch (err: any) {
  console.error("Admin SDK failed:", err.message);
  process.exit(1);
}
