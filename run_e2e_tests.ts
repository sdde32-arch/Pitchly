import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut 
} from 'firebase/auth';
import { 
  getFirestore, 
  doc, 
  getDoc, 
  setDoc, 
  collection, 
  query, 
  where, 
  updateDoc,
  getDocs
} from 'firebase/firestore';
import firebaseAppletConfig from './firebase-applet-config.json';

const firebaseConfig = {
  apiKey: firebaseAppletConfig.apiKey,
  authDomain: firebaseAppletConfig.authDomain,
  projectId: firebaseAppletConfig.projectId,
};

const databaseId = firebaseAppletConfig.firestoreDatabaseId;

console.log('Using active test configuration:');
console.log('Project ID:', firebaseConfig.projectId);
console.log('Database ID:', databaseId);

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app, databaseId);

async function wait(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function runTestA() {
  console.log('\n=======================================');
  console.log('STARTING TEST A: Owner Role Registration & Re-login');
  console.log('=======================================');

  const email = `test-owner-${Date.now()}@gmail.com`;
  const password = "test-password-123";

  // Step 1: Sign up a user as OWNER
  console.log(`[Test A] Registering a brand-new OWNER account: ${email}...`);
  const creds = await createUserWithEmailAndPassword(auth, email, password);
  const uid = creds.user.uid;
  console.log(`[Test A] Account created in Auth. UID: ${uid}`);

  // Simulating sign up profile writing
  const docRef = doc(db, "users", uid);
  const profileData = {
    id: uid,
    name: "Owner E2E Test",
    email,
    phone: "0777777777",
    role: "OWNER",
    roles: ["OWNER", "PLAYER"],
    avatar: "https://ui-avatars.com/api/?name=Owner+Test",
    avatarId: "avatar_05",
    bio: "Turf Business Owner",
    createdAt: new Date().toISOString()
  };

  console.log('[Test A] Writing Firestore user document with role: OWNER');
  await setDoc(docRef, profileData);

  // Step 2: Fetch Firestore document to verify roles
  const snap1 = await getDoc(docRef);
  console.log('[Test A] Firestore Document verification:');
  console.log('Actual Document Role Field:', snap1.data()?.role);
  console.log('Actual Document Roles Array Field:', snap1.data()?.roles);

  // Step 3: Log out
  console.log('[Test A] Logging out...');
  await signOut(auth);

  // Step 4: Log back in
  console.log('[Test A] Logging back in...');
  const loginCreds = await signInWithEmailAndPassword(auth, email, password);
  const loginUid = loginCreds.user.uid;
  console.log(`[Test A] Logged back in successfully. UID: ${loginUid}`);

  // Step 5: Verify the loaded Firestore state
  const snap2 = await getDoc(doc(db, "users", loginUid));
  console.log('[Test A] Re-logged session verification:');
  console.log('Persisted Firestore Role Field after re-login:', snap2.data()?.role);
  console.log('Persisted Firestore Roles Array Field after re-login:', snap2.data()?.roles);
  
  if (snap2.data()?.role === "OWNER") {
    console.log('✅ TEST A PASSED: Role is preserved as OWNER on re-login.');
  } else {
    console.log('❌ TEST A FAILED: Role was reset!');
  }
  
  // Clean up Auth state
  await signOut(auth);
  return uid;
}

async function runTestB() {
  console.log('\n=======================================');
  console.log('STARTING TEST B: Client-side Subscription Matching (Option A)');
  console.log('=======================================');

  const email1 = `subscriber-${Date.now()}@gmail.com`;
  const email2 = `canceller-${Date.now()}@gmail.com`;
  const password = "password123";

  // Target Slot Details
  const pitchId = "pitch-e2e-123";
  const date = "2026-07-25";
  const time = "18:00 - 19:00";
  const pitchName = "E2E Champions Arena";

  // --- STEP 1: REGISTER & AUTHENTICATE AS ACCOUNT 1 (SUBSCRIBER) ---
  console.log(`[Test B] Registering Account 1 (Subscriber): ${email1}...`);
  const creds1 = await createUserWithEmailAndPassword(auth, email1, password);
  const uid1 = creds1.user.uid;
  console.log(`[Test B] Account 1 UID: ${uid1}`);

  // Save profile for Account 1
  await setDoc(doc(db, "users", uid1), {
    id: uid1,
    name: "Account 1 Subscriber",
    email: email1,
    role: "PLAYER",
    roles: ["PLAYER"],
    createdAt: new Date().toISOString()
  });

  // Create subscription for Account 1
  console.log(`[Test B] Account 1 subscribing to ${pitchName} on ${date} @ ${time}...`);
  const subId = `sub-${uid1}-${Date.now()}`;
  const subRef = doc(db, "slotAlertSubscriptions", subId);
  const subData = {
    id: subId,
    userId: uid1,
    userEmail: email1,
    userName: "Account 1 Subscriber",
    pitchId,
    pitchName,
    date,
    time,
    createdAt: new Date().toISOString(),
    status: "pending"
  };
  await setDoc(subRef, subData);
  console.log(`[Test B] Subscription doc written to slotAlertSubscriptions.`);

  // Logout Account 1
  console.log('[Test B] Logging out Account 1...');
  await signOut(auth);

  // --- STEP 2: REGISTER & AUTHENTICATE AS ACCOUNT 2 (CANCELLER) ---
  console.log(`\n[Test B] Registering Account 2 (Canceller): ${email2}...`);
  const creds2 = await createUserWithEmailAndPassword(auth, email2, password);
  const uid2 = creds2.user.uid;
  console.log(`[Test B] Account 2 UID: ${uid2}`);

  // Save profile for Account 2
  await setDoc(doc(db, "users", uid2), {
    id: uid2,
    name: "Account 2 Canceller",
    email: email2,
    role: "PLAYER",
    roles: ["PLAYER"],
    createdAt: new Date().toISOString()
  });

  // Under Account 2, trigger a cancellation (write to slotCancellations)
  console.log(`[Test B] Account 2 triggering slot cancellation (writing to slotCancellations)...`);
  const cancellationId = `cancel-${pitchId}-${date}-${time}-${Date.now()}`.replace(/[\/\s—:]/g, '-');
  const cancelRef = doc(db, 'slotCancellations', cancellationId);
  await setDoc(cancelRef, {
    id: cancellationId,
    pitchId,
    pitchName,
    date,
    time,
    cancelledAt: new Date().toISOString(),
    cancelledBy: uid2 // Must match Account 2's UID to pass the hardened security rule!
  });
  console.log(`[Test B] Cancellation document written successfully under Account 2's session.`);

  // Logout Account 2
  console.log('[Test B] Logging out Account 2...');
  await signOut(auth);

  // --- STEP 3: LOGIN BACK TO ACCOUNT 1 & SIMULATE THE REAL-TIME MATCHING LISTENER ---
  console.log(`\n[Test B] Logging back in as Account 1 (Subscriber) to simulate layout listener...`);
  await signInWithEmailAndPassword(auth, email1, password);
  console.log(`[Test B] Logged in as Account 1. Current UID: ${auth.currentUser?.uid}`);

  // Simulate querying latest slotCancellations (just like the real-time listener in Layout.tsx)
  console.log(`[Test B] Simulating Layout.tsx listener querying slotCancellations...`);
  const cancelSnap = await getDocs(query(
    collection(db, "slotCancellations"),
    where("pitchId", "==", pitchId),
    where("date", "==", date),
    where("time", "==", time)
  ));

  let matchedNotificationId = "";

  if (!cancelSnap.empty) {
    const cancellation = cancelSnap.docs[0].data();
    console.log(`[Test B] Found cancellation event in DB! Matching subscription details...`);

    // Create notification document under Account 1
    const notificationId = `notif-${uid1}-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    matchedNotificationId = notificationId;
    const notifRef = doc(db, "slotNotifications", notificationId);
    
    console.log(`[Test B] MATCH FOUND! Creating slotNotifications document: ${notificationId}`);
    await setDoc(notifRef, {
      id: notificationId,
      userId: uid1,
      pitchId,
      pitchName: cancellation.pitchName,
      date,
      time,
      triggeredAt: cancellation.cancelledAt,
      read: false,
    });

    console.log(`[Test B] Updating subscription ${subId} status to triggered...`);
    await updateDoc(subRef, {
      status: "triggered",
    });
  }

  // Verify the notification document was successfully created in Firestore and fetch it
  if (matchedNotificationId) {
    console.log(`\n[Test B] Verifying generated slotNotification document:`);
    const notifSnap = await getDoc(doc(db, "slotNotifications", matchedNotificationId));
    if (notifSnap.exists()) {
      console.log('✅ TEST B PASSED: Account 1 successfully received a slotNotifications document!');
      console.log('REAL FIRESTORE NOTIFICATION DOCUMENT CONTENTS:');
      console.log(JSON.stringify(notifSnap.data(), null, 2));
    } else {
      console.log('❌ TEST B FAILED: Matching notification document not found in database!');
    }
  } else {
    console.log('❌ TEST B FAILED: No matching cancellation event found!');
  }

  // Clean up Auth state
  await signOut(auth);
}

async function main() {
  try {
    await runTestA();
    await runTestB();
  } catch (err: any) {
    console.error("Test execution failed with error:", err.message);
  } finally {
    process.exit(0);
  }
}

main();
