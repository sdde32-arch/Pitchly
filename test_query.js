const { initializeApp, applicationDefault, cert } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');
const fs = require('fs');

async function run() {
  const serviceAccount = JSON.parse(fs.readFileSync('firebase-applet-config.json', 'utf8'));

  initializeApp({
    credential: cert(serviceAccount)
  });

  const db = getFirestore();
  const snapshot = await db.collection('users').where('role', 'in', ['admin', 'ADMIN', 'super_admin']).get();
  
  const results = [];
  snapshot.forEach(doc => {
    results.push({ id: doc.id, ...doc.data() });
  });
  
  console.log(JSON.stringify(results, null, 2));
}

run().catch(console.error);
