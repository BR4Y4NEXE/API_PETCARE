import type { NextApiRequest, NextApiResponse } from 'next';
import { db } from '../../lib/firebase';

type ServoLog = {
  timestamp: string;
  status: boolean;
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    // 🔍 Consulta todos los documentos de subcolecciones llamadas "activaciones"
    const snapshot = await db.collectionGroup("activaciones").get();

    const data: ServoLog[] = snapshot.docs.map((doc) => {
      const d = doc.data();
      return {
        // Asegúrate que sea una ISO string para el frontend
        timestamp: d.fechaHoraAccionado || "",

        // Si `status` no existe, puedes asumir algo o manejarlo con lógica adicional
        status: true, // o puedes agregar d.status si lo tienes
      };
    });

    // ✅ Devuelve todos los logs, no solo uno
    res.status(200).json(data);
  } catch (error) {
    console.error("Error fetching servo logs:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
}
