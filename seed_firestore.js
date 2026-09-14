import { initializeApp } from "firebase/app";
import { getFirestore, collection, doc, writeBatch } from "firebase/firestore";
import fs from "fs";

// Using the same config as the frontend
const firebaseConfig = {
  apiKey: "dummy",
  projectId: "pitchly-wehat",
};

// Wait, I don't have the webConfig if it's stored in env or not initialized.
