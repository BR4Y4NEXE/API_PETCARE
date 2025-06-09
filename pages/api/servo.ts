import { db } from '../../lib/firebase';
import { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const today = new Date().toLocaleDateString('en-CA');
  
  if (req.method === 'GET') {
    try {
      const servoRef = db.collection('servo_motor').doc(today).collection('activaciones');
      const snapshot = await servoRef.orderBy('fechaHoraAccionado', 'desc').limit(1).get();
      
      // Para simplificar, consideramos que si hay una activación reciente (últimos 5 segundos), está "abierto"
      let status = false;
      if (!snapshot.empty) {
        const latestActivation = snapshot.docs[0].data();
        const activationTime = new Date(latestActivation.fechaHoraAccionado.replace(/(\d{2})\/(\d{2})\/(\d{4})/, '$3-$2-$1'));
        const now = new Date();
        const timeDiff = (now.getTime() - activationTime.getTime()) / 1000; // diferencia en segundos
        status = timeDiff < 5; // Considera "abierto" si fue activado hace menos de 5 segundos
      }

      res.status(200).json({ status });
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
        fechaHoraAccionado: fechaHoraAccionado
      });

      res.status(200).json({ 
        status: true, 
        message: 'Servo activated',
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