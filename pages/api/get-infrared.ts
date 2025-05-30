// pages/api/get-infrared.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import { db } from '../../lib/firebase';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const doc = await db.collection('infrared').doc('estado_actual').get();
    if (!doc.exists) {
      return res.status(404).json({ error: 'No hay datos del sensor IR' });
    }

    res.status(200).json(doc.data());
  } catch (error) {
    console.error('Error al obtener sensor IR:', error);
    res.status(500).json({ error: 'Error al obtener sensor IR' });
  }
}
