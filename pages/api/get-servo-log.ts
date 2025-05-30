import type { NextApiRequest, NextApiResponse } from 'next';
import { db } from '../../lib/firebase';
import type { QueryDocumentSnapshot } from 'firebase-admin/firestore';

// Define el tipo de datos del log del servo
type ServoLog = {
  timestamp: string; // o Date si así está en Firestore
  status: string; // o boolean, dependiendo de cómo guardes el estado del servo
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const snapshot = await db
      .collection('servo_log')
      .orderBy('timestamp', 'desc')
      .limit(1)
      .get();

    const data: ServoLog[] = snapshot.docs.map(
      (doc: QueryDocumentSnapshot<ServoLog>) => doc.data()
    );

    res.status(200).json(data[0] || {});
  } catch (error) {
    console.error('Error al obtener log del servo:', error);
    res.status(500).json({ error: 'Error al obtener log del servo' });
  }
}
