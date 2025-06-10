// lib/firebase.ts
import { getApps, initializeApp, cert } from 'firebase-admin/app';
import { getFirestore, Firestore } from 'firebase-admin/firestore';

const db: Firestore = (() => {
  if (!getApps().length) {
    try {
      // Método 1: JSON completo (método recomendado para Vercel)
      if (process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
        const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY);
        
        // Validar que tenga los campos necesarios
        if (!serviceAccount.project_id || !serviceAccount.private_key || !serviceAccount.client_email) {
          throw new Error('Service account JSON is missing required fields');
        }

        initializeApp({
          credential: cert(serviceAccount),
        });
      }
      // Método 2: Variables individuales (alternativa)
      else if (process.env.FIREBASE_PROJECT_ID && process.env.FIREBASE_PRIVATE_KEY && process.env.FIREBASE_CLIENT_EMAIL) {
        initializeApp({
          credential: cert({
            projectId: process.env.FIREBASE_PROJECT_ID,
            privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
            clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
          }),
        });
      }
      else {
        throw new Error('Firebase credentials not found. Set FIREBASE_SERVICE_ACCOUNT_KEY or individual variables.');
      }
    } catch (error) {
      console.error('❌ Firebase initialization error:', error);
      throw error;
    }
  }

  return getFirestore();
})();

export { db };