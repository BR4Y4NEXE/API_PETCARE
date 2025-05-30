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
    const rootSnapshot = await db.collection("dht11").get();

    const allReadings: DHTReading[] = [];

    for (const doc of rootSnapshot.docs) {
      const subCollectionSnapshot = await db
        .collection("dht11")
        .doc(doc.id)
        .collection("lecturas")
        .orderBy("fechaHora", "desc")
        .get();

      subCollectionSnapshot.forEach(subDoc => {
        const data = subDoc.data();
        allReadings.push({
          temperatura: data.temperatura,
          humedad: data.humedad,
          fechaHora: data.fechaHora,
        });
      });
    }

    // Ordenar todo por fechaHora descendente
    allReadings.sort((a, b) => new Date(b.fechaHora).getTime() - new Date(a.fechaHora).getTime());

    res.status(200).json(allReadings);
  } catch (error) {
    console.error("Error fetching DHT data:", error);
    res.status(500).json({ error: "Internal server error" });
  }
}