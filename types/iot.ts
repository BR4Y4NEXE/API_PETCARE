// types/iot.ts

export interface DHTData {
  temperatura: number;
  humedad: number;
  fechaHora: string;
}

export interface InfraredData {
  disponibilidad: boolean;
}

export interface ServoData {
  fechaHoraAccionado: string;
}
