// lib/firebase.ts
import { getApps, initializeApp, cert } from 'firebase-admin/app';
import { getFirestore, Firestore } from 'firebase-admin/firestore';

const db: Firestore = (() => {
  if (!getApps().length) {
    const serviceAccount = JSON.parse(
      process.env.FIREBASE_SERVICE_ACCOUNT_KEY || '{}'
    );

    if (!serviceAccount.project_id) {
      throw new Error('FIREBASE_SERVICE_ACCOUNT_KEY is missing or invalid.');
    }

    initializeApp({
      credential: cert(serviceAccount),
    });
  }

  return getFirestore();
})();

export { db };
