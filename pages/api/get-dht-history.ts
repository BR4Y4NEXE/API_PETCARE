import type { NextApiRequest, NextApiResponse } from "next";
import { db } from "../../lib/firebase";

type HistorialEntry = {
  timestamp: string;
  temperatura: number;
  humedad: number;
  time: string;
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const rootSnapshot = await db.collection("dht11").get();
    const allReadings: HistorialEntry[] = [];

    for (const doc of rootSnapshot.docs) {
      const subSnapshot = await db
        .collection("dht11")
        .doc(doc.id)
        .collection("lecturas")
        .orderBy("fechaHora", "desc")
        .get();

      subSnapshot.forEach((subDoc: FirebaseFirestore.QueryDocumentSnapshot) => {
        const data = subDoc.data();
        if (data?.temperatura != null && data?.humedad != null && data?.fechaHora) {
          // Convertir fecha al formato ISO para timestamp
          const fecha = new Date(data.fechaHora);
          const timestamp = fecha.toISOString();
          
          // Extraer solo la hora para el gráfico
          const time = fecha.toLocaleTimeString('es-ES', { 
            hour: '2-digit', 
            minute: '2-digit' 
          });

          allReadings.push({
            timestamp: timestamp,
            temperatura: data.temperatura,
            humedad: data.humedad,
            time: time,
          });
        }
      });
    }

    // Ordenar por timestamp (más antiguos primero para el gráfico)
    allReadings.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

    // Filtrar últimas 24 horas
    const twentyFourHoursAgo = Date.now() - (24 * 60 * 60 * 1000);
    const recentReadings = allReadings.filter(reading => 
      new Date(reading.timestamp).getTime() > twentyFourHoursAgo
    );

    res.status(200).json(recentReadings);
  } catch (err) {
    console.error("Error fetching DHT history:", err);
    res.status(500).json({ error: "Internal server error" });
  }
}