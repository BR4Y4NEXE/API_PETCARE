import { getApps, initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

let db;

if (!getApps().length) {
  const rawKey = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;

  if (!rawKey) {
    throw new Error('FIREBASE_SERVICE_ACCOUNT_KEY is not set.');
  }

  let serviceAccount;

  try {
    serviceAccount = JSON.parse(rawKey);
  } catch (error) {
    throw new Error('FIREBASE_SERVICE_ACCOUNT_KEY is not valid JSON.');
  }

  if (!serviceAccount.project_id || !serviceAccount.private_key) {
    throw new Error('Missing fields in FIREBASE_SERVICE_ACCOUNT_KEY');
  }

  // ⬇️ Arreglar saltos de línea
  serviceAccount.private_key = serviceAccount.private_key.replace(/\\n/g, '\n');

  initializeApp({
    credential: cert(serviceAccount),
  });
}

db = getFirestore();
export { db };
