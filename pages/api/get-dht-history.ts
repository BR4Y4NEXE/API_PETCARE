import type { NextApiRequest, NextApiResponse } from 'next';
import { db } from '../../lib/firebase';

type HistorialEntry = {
  timestamp: string;
  temperatura: number;
  humedad: number;
  time: string; // Para mostrar solo la hora en el gráfico
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    // 🔍 Consulta todos los documentos de subcolecciones llamadas "lecturas" del dht11
    const snapshot = await db.collectionGroup("lecturas")
      .where("temperatura", "!=", null) // Filtrar solo documentos de DHT11
      .get();

    const data: HistorialEntry[] = snapshot.docs.map((doc) => {
      const d = doc.data();
      
      // Extraer solo la hora de la fechaHora para el gráfico
      const fechaHora = d.fechaHora || "";
      const time = fechaHora.includes(" ") ? fechaHora.split(" ")[1] : fechaHora;
      
      return {
        timestamp: fechaHora,
        temperatura: d.temperatura || 0,
        humedad: d.humedad || 0,
        time: time.substring(0, 5) // Solo HH:MM para el gráfico
      };
    })
    .filter(entry => entry.timestamp !== "" && entry.temperatura !== 0) // Filtrar entradas inválidas
    .sort((a, b) => {
      // Ordenar por timestamp (cronológicamente)
      const dateA = new Date(a.timestamp.replace(/(\d{2})\/(\d{2})\/(\d{4})/, '$3-$2-$1'));
      const dateB = new Date(b.timestamp.replace(/(\d{2})\/(\d{2})\/(\d{4})/, '$3-$2-$1'));
      return dateA.getTime() - dateB.getTime();
    });

    console.log(`DHT History: Found ${data.length} records`);
    console.log('Sample data:', data.slice(0, 2)); // Mostrar primeros 2 registros para debug

    // ✅ Devuelve todos los datos históricos del DHT11
    res.status(200).json(data);
  } catch (error) {
    console.error("Error fetching DHT history:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
}