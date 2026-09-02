const admin = require('firebase-admin');

// Parse command line arguments
const args = process.argv.slice(2);
let uid = null;
let email = null;

for (let i = 0; i < args.length; i++) {
  if (args[i] === '--uid' && args[i + 1]) {
    uid = args[i + 1];
    i++;
  } else if (args[i] === '--email' && args[i + 1]) {
    email = args[i + 1];
    i++;
  }
}

if (!uid || !email) {
  console.error('Usage: GOOGLE_APPLICATION_CREDENTIALS=./serviceAccountKey.json node scripts/promoteAdmin.js --uid "USER_UID" --email "admin@example.com"');
  process.exit(1);
}

// 1. Ensure GOOGLE_APPLICATION_CREDENTIALS is set
if (!process.env.GOOGLE_APPLICATION_CREDENTIALS) {
  console.error('\nERROR: GOOGLE_APPLICATION_CREDENTIALS environment variable is not set.');
  console.log('\nPlease set it to point to your Firebase service account JSON file:');
  console.log('export GOOGLE_APPLICATION_CREDENTIALS="/path/to/serviceAccountKey.json"\n');
  process.exit(1);
}

const promoteAdmin = async () => {
  try {
    console.log(`Initializing Firebase Admin SDK...`);
    admin.initializeApp();
    
    const db = admin.firestore();
    
    console.log(`Promoting UID: ${uid} (Email: ${email}) to ADMIN...`);
    
    const userRef = db.collection('users').doc(uid);
    const userSnap = await userRef.get();
    
    // Default safe data
    const adminData = {
      email: email,
      name: "System Admin",
      role: "ADMIN",
      hasCompletedOnboarding: true,
      isActive: true,
      isVerified: true,
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    };
    
    // Optionally preserve the user's explicit name if it exists, but the requirements 
    // say: name: "System Admin", so we will just write what's requested and merge it, 
    // or just use set {merge: true}.
    await userRef.set(adminData, { merge: true });
    
    console.log(`\n✅ SUCCESS: User ${uid} has been promoted to ADMIN.`);
    console.log(`They can now log in and access the /admin dashboard.`);
    
    // Also log how they can confirm
    console.log(`\nTo confirm this in the app:`);
    console.log(`1. Log in with the email: ${email}`);
    console.log(`2. They should be redirected to /admin`);
    console.log(`3. Check their profile page to see the Account Type badge as "ADMIN"`);
    
  } catch (error) {
    console.error(`\n❌ ERROR: Failed to promote admin.`, error);
  } finally {
    process.exit(0);
  }
};

promoteAdmin();
