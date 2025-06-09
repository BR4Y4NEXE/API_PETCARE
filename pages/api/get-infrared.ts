import { db } from '../../lib/firebase';
import { NextApiRequest, NextApiResponse } from 'next';


export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const today = new Date().toLocaleDateString('en-CA');
    const infraredRef = db.collection('sensor_infrarrojo').doc(today).collection('lecturas');
    const snapshot = await infraredRef.orderBy('timestamp', 'desc').limit(1).get();
    
    if (snapshot.empty) {
      return res.status(200).json({ estado: false, fechaHora: null });
    }

    const latestReading = snapshot.docs[0].data();
    
    // Convertir timestamp ISO a formato legible
    const fechaHora = new Date(latestReading.timestamp).toLocaleString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });

    res.status(200).json({
      estado: latestReading.disponibilidad,
      fechaHora: fechaHora
    });
  } catch (error) {
    console.error('Error fetching infrared data:', error);
    res.status(500).json({ error: 'Failed to fetch infrared data' });
  }
}