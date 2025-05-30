import { z } from 'zod';

export const dhtSchema = z.object({
  temperatura: z.number(),
  humedad: z.number(),
  fechaHora: z.string(),
});

export const infraredSchema = z.object({
  disponibilidad: z.boolean(),
});

export const servoSchema = z.object({
  fechaHoraAccionado: z.string(),
});
