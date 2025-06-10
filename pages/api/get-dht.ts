import { NextApiRequest, NextApiResponse } from 'next';
import { db } from '../../lib/firebase'; // Usando tu configuración existente

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Agregar encabezados anti-caché
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');

  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const today = new Date().toLocaleDateString('en-CA'); // Formato: YYYY-MM-DD
    const dhtRef = db.collection('dht11').doc(today).collection('lecturas');
    const snapshot = await dhtRef.orderBy('fechaHora', 'desc').limit(1).get();
    
    if (snapshot.empty) {
      return res.status(200).json({ temperatura: null, humedad: null });
    }

    const latestReading = snapshot.docs[0].data();
    
    res.status(200).json({
      temperatura: latestReading.temperatura,
      humedad: latestReading.humedad,
      fechaHora: latestReading.fechaHora
    });
  } catch (error) {
    console.error('Error fetching DHT data:', error);
    res.status(500).json({ error: 'Failed to fetch DHT data' });
  }
}