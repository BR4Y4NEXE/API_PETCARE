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
    // Crear un nuevo comando para activar el servo
    await db.collection('servo_commands').doc('pending_command').set({
      activate: true,
      executed: false,
      createdAt: new Date().toISOString(),
      triggeredBy: 'dashboard'
    });

    console.log('Comando de servo creado desde dashboard');
    res.status(200).json({ 
      success: true, 
      message: 'Comando enviado al dispositivo IoT' 
    });
    
  } catch (error) {
    console.error('Error creando comando servo:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

export default verifyApiKey(handler);
