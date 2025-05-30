// pages/api/get-dht.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import { db } from '../../lib/firebase';

// Define el tipo de lectura del sensor DHT
type DHTReading = {
  temperature: number;
  humidity: number;
  timestamp: string;
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    const snapshot = await db.collection("dht").get();

    const data: DHTReading[] = snapshot.docs.map((doc) => {
      const rawData = doc.data();

      return {
        temperature: rawData.temperature,
        humidity: rawData.humidity,
        timestamp: rawData.timestamp,
      };
    });

    res.status(200).json(data);
  } catch (error) {
    console.error("Error fetching DHT data:", error);
    res.status(500).json({ error: "Internal server error" });
  }
}