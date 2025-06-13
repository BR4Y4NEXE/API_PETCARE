// pages/api/servo.ts
import { db } from '../../lib/firebase';
import { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Evitar caché
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');

  const today = new Date().toLocaleDateString('en-CA'); // formato YYYY-MM-DD

  if (req.method === 'GET') {
    try {
      const servoRef = db.collection('servo_motor').doc(today).collection('activaciones');
      
      // Opción A: Solo usar where sin orderBy
      const snapshot = await servoRef
        .where('procesado', '==', false)
        .limit(10) // Aumentamos el límite para obtener más documentos
        .get();

      if (!snapshot.empty) {
        // Ordenamos en memoria y tomamos el más reciente
        const docs = snapshot.docs.sort((a, b) => {
          const dateA = new Date(a.data().fechaHoraAccionado);
          const dateB = new Date(b.data().fechaHoraAccionado);
          return dateB.getTime() - dateA.getTime(); // Orden descendente
        });

        const doc = docs[0];
        const data = doc.data();

        // Marcar como procesado
        if (doc.exists) {
          await doc.ref.set({ ...data, procesado: true }, { merge: true });
        }

        res.status(200).json({ 
          hasNewActivation: true,
          fechaHoraAccionado: data.fechaHoraAccionado 
        });
      } else {
        res.status(200).json({ 
          hasNewActivation: false,
          fechaHoraAccionado: null 
        });
      }
    } catch (error) {
      console.error('Error fetching servo status:', error);
      res.status(500).json({ error: 'Failed to fetch servo status' });
    }
  } 
  
  else if (req.method === 'POST') {
    try {
      const now = new Date();
      const fechaHoraAccionado = now.toLocaleString('es-ES', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      }).replace(',', '');

      const servoRef = db.collection('servo_motor').doc(today).collection('activaciones');
      await servoRef.add({
        fechaHoraAccionado: fechaHoraAccionado,
        procesado: false
      });

      res.status(200).json({ 
        status: true, 
        message: 'Servo activation queued',
        fechaHoraAccionado: fechaHoraAccionado
      });
    } catch (error) {
      console.error('Error activating servo:', error);
      res.status(500).json({ error: 'Failed to activate servo' });
    }
  } 
  
  else {
    res.status(405).json({ message: 'Method not allowed' });
  }
}