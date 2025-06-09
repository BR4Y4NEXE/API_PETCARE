import type { NextApiRequest, NextApiResponse } from "next";
import { db } from "../../lib/firebase";

type InfraredReading = {
  estado: boolean;
  fechaHora: string;
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const rootSnapshot = await db.collection("sensor_infrarrojo").get();
    let latestReading: InfraredReading | null = null;
    let latestTimestamp = 0;

    for (const doc of rootSnapshot.docs) {
      const subSnapshot = await db
        .collection("sensor_infrarrojo")
        .doc(doc.id)
        .collection("lecturas")
        .orderBy("timestamp", "desc")
        .limit(1)
        .get();

      subSnapshot.forEach((subDoc: FirebaseFirestore.QueryDocumentSnapshot) => {
        const data = subDoc.data();
        if (data?.disponibilidad != null && data?.timestamp) {
          const timestamp = new Date(data.timestamp).getTime();
          if (timestamp > latestTimestamp) {
            latestTimestamp = timestamp;
            latestReading = {
              estado: data.disponibilidad,
              fechaHora: data.timestamp,
            };
          }
        }
      });
    }

    if (latestReading) {
      res.status(200).json(latestReading);
    } else {
      res.status(404).json({ error: "No infrared data found" });
    }
  } catch (err) {
    console.error("Error fetching infrared data:", err);
    res.status(500).json({ error: "Internal server error" });
  }
}