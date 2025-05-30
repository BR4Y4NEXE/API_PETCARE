// pages/api/get-dht.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import { db } from '../../lib/firebase';
import type { QueryDocumentSnapshot } from 'firebase-admin/firestore';

// Tipo de datos esperados desde Firestore
type DHTReading = {
  temperature: number;
  humidity: number;
  timestamp: string; // o Date si prefieres
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const today = new Date().toISOString().split('T')[0]; // Formato YYYY-MM-DD

    const snapshot = await db
      .collection('dht11')
      .doc(today)
      .collection('lecturas')
      .orderBy('timestamp', 'desc')
      .limit(50)
      .get();

    const data: DHTReading[] = snapshot.docs.map(
      (doc: QueryDocumentSnapshot<DHTReading>) => doc.data()
    );

    res.status(200).json(data);
  } catch (error) {
    console.error('Error al obtener datos DHT:', error);
    res.status(500).json({ error: 'Error al obtener datos DHT' });
  }
}
