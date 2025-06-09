import type { NextApiRequest, NextApiResponse } from "next";
import { db } from "../../lib/firebase";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === "POST") {
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

      res.status(200).json({ success: true, message: "Servo activated successfully" });
    } catch (err) {
      console.error("Error activating servo:", err);
      res.status(500).json({ error: "Internal server error" });
    }
  } else {
    res.setHeader("Allow", ["POST"]);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
