import type { NextApiRequest, NextApiResponse } from 'next';
import { db } from '../../lib/firebase';

type ServoLog = {
  timestamp: string;
  status: string;
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    const snapshot = await db.collection("servo_log").get();
    const data: ServoLog[] = snapshot.docs.map((doc) => {
      const d = doc.data() as ServoLog;
      return {
        timestamp: d.timestamp,
        status: d.status,
      };
    });

    res.status(200).json(data[0] || {});
  } catch (error) {
    console.error("Error fetching servo logs:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
}