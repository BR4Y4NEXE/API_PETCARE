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
      const subSnapshot = await db
        .collection("dht11")
        .doc(doc.id)
        .collection("lecturas")
        .orderBy("fechaHora", "desc")
        .get();

      subSnapshot.forEach((subDoc: FirebaseFirestore.QueryDocumentSnapshot) => {
        const data = subDoc.data();
        if (data?.temperatura != null && data?.humedad != null && data?.fechaHora) {
          allReadings.push({
            temperatura: data.temperatura,
            humedad: data.humedad,
            fechaHora: data.fechaHora,
          });
        }
      });
    }

    // Ordenar todas las lecturas por fechaHora (más recientes primero)
    allReadings.sort((a, b) => new Date(b.fechaHora).getTime() - new Date(a.fechaHora).getTime());

    res.status(200).json(allReadings);
  } catch (err) {
    console.error("Error fetching DHT data:", err);
    res.status(500).json({ error: "Internal server error" });
  }
}
