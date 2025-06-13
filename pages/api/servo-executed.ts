import type { NextApiRequest, NextApiResponse } from 'next';
import { verifyApiKey } from '../../middleware/verifyApiKey';
import { db } from '../../lib/firebase';

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  // Agregar encabezados anti-caché
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método no permitido' });
  }

  try {
    const { executed } = req.body;

    if (executed === true) {
      // Marcar el comando como ejecutado
      await db.collection('servo_commands').doc('pending_command').update({
        executed: true,
        executedAt: new Date().toISOString()
      });

      console.log('Comando de servo marcado como ejecutado');
      res.status(200).json({ success: true, message: 'Ejecución confirmada' });
    } else {
      res.status(400).json({ error: 'Parámetro executed requerido' });
    }
    
  } catch (error) {
    console.error('Error confirmando ejecución servo:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

export default verifyApiKey(handler);