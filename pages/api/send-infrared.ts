// pages/api/send-infrared.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import { verifyApiKey } from '../../middleware/verifyApiKey';
import { db } from '../../lib/firebase';
import { infraredSchema } from '../../lib/validateData';

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Método no permitido' });

  const parsed = infraredSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: 'Datos inválidos', issues: parsed.error.issues });
  }

  const { disponibilidad } = parsed.data;
  const fecha = new Date().toISOString().split('T')[0]; // YYYY-MM-DD

  try {
    await db
      .collection('sensor_infrarrojo')
      .doc(fecha)
      .collection('lecturas')
      .add({
        disponibilidad,
        timestamp: new Date().toISOString(),
      });

    res.status(200).json({ success: true });
  } catch (error) {
    console.error('Error al guardar en Firestore:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

export default verifyApiKey(handler);
