import { NextApiRequest, NextApiResponse } from 'next';
import { db } from '../../lib/firebase';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');

  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    // Formato YYYY-MM-DD garantizado
    const today = new Date();
    const formattedDate = `${today.getFullYear()}-${(today.getMonth() + 1)
      .toString()
      .padStart(2, '0')}-${today.getDate().toString().padStart(2, '0')}`;

    const dhtRef = db.collection('dht11').doc(formattedDate).collection('lecturas');
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
        hora: data.fechaHora ? data.fechaHora.split(' ')[1]?.substring(0, 5) : ''
      };
    }).reverse();

    res.status(200).json({ data: readings });
  } catch (error) {
    console.error('Error fetching DHT history:', error);
    res.status(500).json({ error: 'Failed to fetch DHT history' });
  }
}
