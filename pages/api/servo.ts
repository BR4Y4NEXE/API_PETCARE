// pages/api/servo.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import { db } from '../../lib/firebase';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    if (req.method === 'GET') {
      const doc = await db.collection('servo').doc('estado_actual').get();
      if (!doc.exists) return res.status(404).json({ error: 'Sin datos' });
      return res.status(200).json(doc.data());
    }

    if (req.method === 'POST') {
      const { status } = req.body;
      const timestamp = new Date().toISOString();

      await db.collection('servo').doc('estado_actual').set({ status, updatedAt: timestamp });

      await db.collection('servo_log').add({ status, timestamp });

      return res.status(200).json({ success: true, status, timestamp });
    }

    res.status(405).json({ error: 'Método no permitido' });
  } catch (error) {
    console.error('Error con servo:', error);
    res.status(500).json({ error: 'Error interno' });
  }
}
