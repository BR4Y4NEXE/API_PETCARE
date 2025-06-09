// pages/api/get-dht-history.ts
import { NextApiRequest, NextApiResponse } from 'next';
import { db } from '../../lib/firebase';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const today = new Date().toLocaleDateString('en-CA'); // Formato: YYYY-MM-DD
    const dhtRef = db.collection('dht11').doc(today).collection('lecturas');
    
    // Obtener las últimas 20 lecturas para la gráfica
    const snapshot = await dhtRef.orderBy('fechaHora', 'desc').limit(20).get();
    
    if (snapshot.empty) {
      return res.status(200).json({ data: [] });
    }

    const readings = snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        temperatura: data.temperatura,
        humedad: data.humedad,
        fechaHora: data.fechaHora,
        // Extraer solo la hora para mostrar en la gráfica
        hora: data.fechaHora ? data.fechaHora.split(' ')[1]?.substring(0, 5) : ''
      };
    }).reverse(); // Invertir para mostrar cronológicamente

    res.status(200).json({ data: readings });
  } catch (error) {
    console.error('Error fetching DHT history:', error);
    res.status(500).json({ error: 'Failed to fetch DHT history' });
  }
}