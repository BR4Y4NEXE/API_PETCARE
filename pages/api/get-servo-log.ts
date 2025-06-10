import { db } from '../../lib/firebase';
import { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Agregar encabezados anti-caché
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');

  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const today = new Date().toLocaleDateString('en-CA');
    const servoRef = db.collection('servo_motor').doc(today).collection('activaciones');
    const snapshot = await servoRef.orderBy('fechaHoraAccionado', 'desc').limit(10).get();
    
    if (snapshot.empty) {
      return res.status(200).json([]);
    }

    const logData = snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        status: true, // Las activaciones siempre son true
        timestamp: data.fechaHoraAccionado
      };
    });

    res.status(200).json(logData);
  } catch (error) {
    console.error('Error fetching servo log:', error);
    res.status(500).json({ error: 'Failed to fetch servo log' });
  }
}