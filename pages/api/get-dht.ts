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
    allReadings.sort((a, b) => {
      const dateA = new Date(a.fechaHora.replace(/(\d{2})\/(\d{2})\/(\d{4})/, '$3-$2-$1'));
      const dateB = new Date(b.fechaHora.replace(/(\d{2})\/(\d{2})\/(\d{4})/, '$3-$2-$1'));
      return dateB.getTime() - dateA.getTime();
    });

    console.log(`DHT Data: Found ${allReadings.length} total readings`);

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
    console.error("Error fetching DHT data:", err);
    res.status(500).json({ error: "Internal server error" });
  }
}