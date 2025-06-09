import type { NextApiRequest, NextApiResponse } from "next";
import { db } from "../../lib/firebase";

type LogEntry = {
  status: boolean;
  timestamp: string;
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const rootSnapshot = await db.collection("servo_motor").get();
    const allActivations: LogEntry[] = [];

    for (const doc of rootSnapshot.docs) {
      const subSnapshot = await db
        .collection("servo_motor")
        .doc(doc.id)
        .collection("activaciones")
        .orderBy("fechaHoraAccionado", "desc")
        .get();

      subSnapshot.forEach((subDoc: FirebaseFirestore.QueryDocumentSnapshot) => {
        const data = subDoc.data();
        if (data?.fechaHoraAccionado) {
          // Agregar entrada de activación (abierto)
          allActivations.push({
            status: true,
            timestamp: data.fechaHoraAccionado,
          });
          
          // Simular entrada de cierre 5 segundos después
          const closeTime = new Date(new Date(data.fechaHoraAccionado).getTime() + 5000);
          allActivations.push({
            status: false,
            timestamp: closeTime.toLocaleString('es-ES', {
              day: '2-digit',
              month: '2-digit',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
              second: '2-digit'
            }),
          });
        }
      });
    }

    // Ordenar por timestamp (más recientes primero)
    allActivations.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    res.status(200).json(allActivations.slice(0, 20)); // Limitar a últimas 20 entradas
  } catch (err) {
    console.error("Error fetching servo log:", err);
    res.status(500).json({ error: "Internal server error" });
  }
}