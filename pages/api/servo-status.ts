import type { NextApiRequest, NextApiResponse } from 'next';
import { verifyApiKey } from '../../middleware/verifyApiKey';
import { db } from '../../lib/firebase';

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  // Agregar encabezados anti-caché
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Método no permitido' });
  }

  try {
    // Consultar si hay un comando pendiente en Firestore
    const commandRef = db.collection('servo_commands').doc('pending_command');
    const commandDoc = await commandRef.get();

    if (commandDoc.exists) {
      const data = commandDoc.data();
      const shouldActivate = data?.activate === true && data?.executed === false;
      
      if (shouldActivate) {
        console.log('Comando de servo pendiente encontrado');
        return res.status(200).json({ activate: true });
      }
    }

    // No hay comando pendiente
    return res.status(200).json({ activate: false });
    
  } catch (error) {
    console.error('Error consultando comando servo:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

export default verifyApiKey(handler);