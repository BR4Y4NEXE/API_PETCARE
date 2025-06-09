// pages/api/get-dht.ts
import type { NextApiRequest, NextApiResponse } from "next";
import { db } from "../../lib/firebase";

type DHTReading = {
  temperatura: number;
  humedad: number;
  fechaHora: string;
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    // 🔍 Usar collectionGroup para obtener todas las lecturas del DHT11
    const snapshot = await db.collectionGroup("lecturas")
      .where("temperatura", "!=", null) // Filtrar solo documentos de DHT11
      .get();

    const allReadings: DHTReading[] = snapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        temperatura: data.temperatura || 0,
        humedad: data.humedad || 0,
        fechaHora: data.fechaHora || "",
      };
    })
    .filter(reading => reading.fechaHora !== "" && reading.temperatura !== 0)
    .sort((a, b) => {
      // Ordenar por fechaHora (más recientes primero)
      const dateA = new Date(a.fechaHora.replace(/(\d{2})\/(\d{2})\/(\d{4})/, '$3-$2-$1'));
      const dateB = new Date(b.fechaHora.replace(/(\d{2})\/(\d{2})\/(\d{4})/, '$3-$2-$1'));
      return dateB.getTime() - dateA.getTime();
    });

    console.log(`DHT Current: Found ${allReadings.length} total readings`);

    // Devolver solo los datos más recientes (primer elemento del array ordenado)
    if (allReadings.length > 0) {
      const mostRecent = allReadings[0];
      res.status(200).json({
        temperatura: mostRecent.temperatura,
        humedad: mostRecent.humedad
      });
    } else {
      // Si no hay datos, devolver null para que el frontend maneje el caso
      res.status(200).json(null);
    }
  } catch (err) {
    console.error("Error fetching current DHT data:", err);
    res.status(500).json({ error: "Internal server error" });
  }
}