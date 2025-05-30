// pages/api/send-dht.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import { verifyApiKey } from '../../middleware/verifyApiKey';
import { db } from '../../lib/firebase';
import { dhtSchema } from '../../lib/validateData';

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método no permitido' });
  }

  const parsed = dhtSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({
      error: 'Datos inválidos',
      issues: parsed.error.issues,
    });
  }

  const { temperatura, humedad, fechaHora } = parsed.data;

  const fechaMatch = fechaHora.match(/^(\d{2})\/(\d{2})\/(\d{4})/);
  const fecha = fechaMatch
    ? `${fechaMatch[3]}-${fechaMatch[2]}-${fechaMatch[1]}`
    : 'unknown';

  try {
    await db
      .collection('dht11')
      .doc(fecha)
      .collection('lecturas')
      .add({
        temperatura,
        humedad,
        fechaHora,
      });

    res.status(200).json({ success: true });
  } catch (error) {
    console.error('Error al guardar en Firestore:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

export default verifyApiKey(handler);
