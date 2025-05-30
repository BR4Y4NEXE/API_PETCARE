// pages/api/send-servo.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import { verifyApiKey } from '../../middleware/verifyApiKey';
import { db } from '../../lib/firebase';
import { servoSchema } from '../../lib/validateData';

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Método no permitido' });

  const parsed = servoSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: 'Datos inválidos', issues: parsed.error.issues });
  }

  const { fechaHoraAccionado } = parsed.data;

  const fechaMatch = fechaHoraAccionado.match(/^(\d{2})\/(\d{2})\/(\d{4})/);
  const fecha = fechaMatch ? `${fechaMatch[3]}-${fechaMatch[2]}-${fechaMatch[1]}` : 'unknown';

  try {
    await db
      .collection('servo_motor')
      .doc(fecha)
      .collection('activaciones')
      .add({
        fechaHoraAccionado,
      });

    res.status(200).json({ success: true });
  } catch (error) {
    console.error('Error al guardar en Firestore:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

export default verifyApiKey(handler);
