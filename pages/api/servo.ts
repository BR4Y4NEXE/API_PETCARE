import type { NextApiRequest, NextApiResponse } from "next";
import { db } from "../../lib/firebase";

type ServoStatus = {
  status: boolean;
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === "GET") {
    try {
      const rootSnapshot = await db.collection("servo_motor").get();
      let latestActivation: any = null;
      let latestTimestamp = 0;

      for (const doc of rootSnapshot.docs) {
        const subSnapshot = await db
          .collection("servo_motor")
          .doc(doc.id)
          .collection("activaciones")
          .orderBy("fechaHoraAccionado", "desc")
          .limit(1)
          .get();

        subSnapshot.forEach((subDoc: FirebaseFirestore.QueryDocumentSnapshot) => {
          const data = subDoc.data();
          if (data?.fechaHoraAccionado) {
            const timestamp = new Date(data.fechaHoraAccionado).getTime();
            if (timestamp > latestTimestamp) {
              latestTimestamp = timestamp;
              latestActivation = data;
            }
          }
        });
      }

      // Determinar el estado basado en la última activación
      // Por simplicidad, asumimos que el servo está "activo" si la última activación fue reciente (últimos 5 segundos)
      const now = Date.now();
      const isActive = latestActivation && (now - latestTimestamp) < 5000;

      res.status(200).json({ status: isActive });
    } catch (err) {
      console.error("Error fetching servo status:", err);
      res.status(500).json({ error: "Internal server error" });
    }
  } else if (req.method === "POST") {
    try {
      const today = new Date().toISOString().split('T')[0];
      const currentDateTime = new Date().toLocaleString('es-ES', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      });

      // Crear nueva activación
      await db
        .collection("servo_motor")
        .doc(today)
        .collection("activaciones")
        .add({
          fechaHoraAccionado: currentDateTime
        });

      res.status(200).json({ status: true });
    } catch (err) {
      console.error("Error activating servo:", err);
      res.status(500).json({ error: "Internal server error" });
    }
  } else {
    res.setHeader("Allow", ["GET", "POST"]);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}