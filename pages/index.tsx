import { useEffect, useState } from "react";
import { Thermometer, Droplets, Eye, Settings, Activity, Clock, Zap, TrendingUp } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

// Tipos definidos para los estados
type DhtData = {
  temperatura: number;
  humedad: number;
};

type InfraredData = {
  estado: boolean;
  fechaHora: string;
};

type ServoLogEntry = {
  timestamp: string;
  status: boolean;
};

type HistorialEntry = {
  timestamp: string;
  temperatura: number;
  humedad: number;
  time: string; // Para mostrar solo la hora en el gráfico
};

export default function Home() {
  const [infrared, setInfrared] = useState<InfraredData | null>(null);
  const [servoStatus, setServoStatus] = useState<boolean | null>(null);
  const [dht, setDht] = useState<DhtData | null>(null);
  const [servoLog, setServoLog] = useState<ServoLogEntry[]>([]);
  const [historialDht, setHistorialDht] = useState<HistorialEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Función para obtener el historial de DHT desde la API
  const fetchDhtHistory = async () => {
    try {
      const response = await fetch('/api/get-dht-history');
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error fetching DHT history:', error);
      return [];
    }
  };

  // Función para obtener los datos más recientes del DHT
  const fetchDhtCurrent = async () => {
    try {
      const response = await fetch('/api/get-dht');
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error fetching current DHT data:', error);
      return null;
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [infraredRes, servoRes, servoLogRes] = await Promise.all([
          fetch("/api/get-infrared"),
          fetch("/api/servo"),
          fetch("/api/get-servo-log")
        ]);

        const [infraredData, servoData, servoLogData] = await Promise.all([
          infraredRes.json(),
          servoRes.json(),
          servoLogRes.json()
        ]);

        setInfrared(infraredData);
        setServoStatus(servoData.status);
        setServoLog(servoLogData);
        
        // Obtener datos actuales del DHT (más recientes)
        const currentDhtData = await fetchDhtCurrent();
        setDht(currentDhtData);
        
        // Obtener historial completo de DHT para el gráfico
        const historialData = await fetchDhtHistory();
        setHistorialDht(historialData);
      } catch (error) {
        console.error("Error fetching data:", error);
        // En caso de error, usar datos vacíos
        setHistorialDht([]);
        setServoLog([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  const toggleServo = async () => {
    try {
      const res = await fetch("/api/servo", { method: "POST" });
      const data = await res.json();
      setServoStatus(data.status);
    } catch (error) {
      console.error("Error toggling servo:", error);
    }
  };

  // Tipos para el tooltip personalizado
  interface TooltipPayload {
    color: string;
    name: string;
    value: number;
  }

  interface CustomTooltipProps {
    active?: boolean;
    payload?: TooltipPayload[];
    label?: string;
  }

  // Componente personalizado para el tooltip
  const CustomTooltip = ({ active, payload, label }: CustomTooltipProps) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-slate-800/95 backdrop-blur-sm border border-white/20 rounded-xl p-4 shadow-xl">
          <p className="text-slate-300 text-sm mb-2">{`Hora: ${label}`}</p>
          {payload.map((entry, index) => (
            <p key={index} className="text-sm font-medium" style={{ color: entry.color }}>
              {entry.name}: {entry.value}{entry.name === 'Temperatura' ? '°C' : '%'}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-cyan-400 border-t-transparent mx-auto mb-4"></div>
          <p className="text-cyan-300 text-lg">Cargando datos del sistema...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white">
      {/* Header */}
      <div className="backdrop-blur-sm bg-black/20 border-b border-white/10 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-gradient-to-r from-cyan-500 to-purple-500 rounded-xl">
              <Activity className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">
                PetCare Dashboard
              </h1>
              <p className="text-slate-400 text-sm">Monitoreo en tiempo real del sistema</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Status Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {/* DHT Sensor Card */}
          <div className="group relative bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-sm border border-white/10 rounded-3xl p-6 hover:border-cyan-400/30 transition-all duration-300 hover:scale-105">
            <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 to-transparent rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity"></div>
            <div className="relative">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-cyan-300">Sensor DHT</h2>
                <div className="p-2 bg-cyan-500/20 rounded-xl">
                  <Thermometer className="w-6 h-6 text-cyan-400" />
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Thermometer className="w-4 h-4 text-red-400" />
                    <span className="text-slate-300">Temperatura</span>
                  </div>
                  <span className="text-2xl font-bold text-white">
                    {dht?.temperatura ?? "..."}<span className="text-lg text-slate-400">°C</span>
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Droplets className="w-4 h-4 text-blue-400" />
                    <span className="text-slate-300">Humedad</span>
                  </div>
                  <span className="text-2xl font-bold text-white">
                    {dht?.humedad ?? "..."}<span className="text-lg text-slate-400">%</span>
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Infrared Sensor Card */}
          <div className="group relative bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-sm border border-white/10 rounded-3xl p-6 hover:border-purple-400/30 transition-all duration-300 hover:scale-105">
            <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-transparent rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity"></div>
            <div className="relative">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-purple-300">Sensor Infrarrojo</h2>
                <div className="p-2 bg-purple-500/20 rounded-xl">
                  <Eye className="w-6 h-6 text-purple-400" />
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-slate-300">Estado</span>
                  <div className={`flex items-center space-x-2 px-3 py-1 rounded-full ${
                    infrared?.estado 
                      ? 'bg-green-500/20 text-green-400' 
                      : 'bg-red-500/20 text-red-400'
                  }`}>
                    <div className={`w-2 h-2 rounded-full ${
                      infrared?.estado ? 'bg-green-400' : 'bg-red-400'
                    } animate-pulse`}></div>
                    <span className="text-sm font-medium">
                      {infrared?.estado ? "Detectado" : "Sin detección"}
                    </span>
                  </div>
                </div>

                <div>
                  <span className="text-slate-400 text-sm">Última detección:</span>
                  <p className="text-white font-mono text-sm mt-1">
                    {infrared?.fechaHora ?? "Sin registros"}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Servo Control Card */}
          <div className="group relative bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-sm border border-white/10 rounded-3xl p-6 hover:border-emerald-400/30 transition-all duration-300 hover:scale-105">
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-transparent rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity"></div>
            <div className="relative">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-emerald-300">Control Servomotor</h2>
                <div className="p-2 bg-emerald-500/20 rounded-xl">
                  <Settings className="w-6 h-6 text-emerald-400" />
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-slate-300">Estado actual</span>
                  <div className={`flex items-center space-x-2 px-3 py-1 rounded-full ${
                    servoStatus 
                      ? 'bg-green-500/20 text-green-400' 
                      : 'bg-red-500/20 text-red-400'
                  }`}>
                    <div className={`w-2 h-2 rounded-full ${
                      servoStatus ? 'bg-green-400' : 'bg-red-400'
                    }`}></div>
                    <span className="text-sm font-medium">
                      {servoStatus ? "Abierto" : "Cerrado"}
                    </span>
                  </div>
                </div>

                <button
                  onClick={toggleServo}
                  className="w-full mt-4 px-4 py-3 bg-gradient-to-r from-emerald-600 to-cyan-600 hover:from-emerald-500 hover:to-cyan-500 transition-all duration-300 rounded-xl font-semibold text-white shadow-lg hover:shadow-emerald-500/25 hover:scale-105 flex items-center justify-center space-x-2"
                >
                  <Zap className="w-4 h-4" />
                  <span>Cambiar Estado</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Activity Log - AHORA MUESTRA SERVO LOG */}
        <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-sm border border-white/10 rounded-3xl p-6 mb-8">
          <div className="flex items-center space-x-3 mb-6">
            <div className="p-2 bg-amber-500/20 rounded-xl">
              <Clock className="w-6 h-6 text-amber-400" />
            </div>
            <h2 className="text-2xl font-semibold text-amber-300">Historial de Actividad</h2>
          </div>

          <div className="space-y-3 max-h-96 overflow-y-auto custom-scrollbar">
            {servoLog?.length > 0 ? (
              servoLog.map((entry, idx) => (
                <div 
                  key={idx} 
                  className="flex items-center justify-between p-4 bg-slate-800/30 rounded-xl border border-white/5 hover:border-white/10 transition-colors"
                >
                  <div className="flex items-center space-x-3">
                    <div className={`w-3 h-3 rounded-full ${
                      entry.status ? 'bg-green-400' : 'bg-red-400'
                    }`}></div>
                    <span className="text-slate-300 font-mono text-sm">
                      {entry.timestamp}
                    </span>
                  </div>
                  <div className={`flex items-center space-x-2 px-3 py-1 rounded-full text-sm ${
                    entry.status 
                      ? 'bg-green-500/20 text-green-400' 
                      : 'bg-red-500/20 text-red-400'
                  }`}>
                    <span>{entry.status ? "Activado" : "Desactivado"}</span>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-12">
                <Clock className="w-12 h-12 text-slate-500 mx-auto mb-4" />
                <p className="text-slate-400">No hay historial disponible aún</p>
              </div>
            )}
          </div>
        </div>

        {/* Temperature & Humidity Chart - USA GET-DHT-HISTORY */}
        <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-sm border border-white/10 rounded-3xl p-6">
          <div className="flex items-center space-x-3 mb-6">
            <div className="p-2 bg-gradient-to-r from-cyan-500/20 to-blue-500/20 rounded-xl">
              <TrendingUp className="w-6 h-6 text-cyan-400" />
            </div>
            <div>
              <h2 className="text-2xl font-semibold bg-gradient-to-r from-cyan-300 to-blue-300 bg-clip-text text-transparent">
                Historial de Temperatura y Humedad
              </h2>
              <p className="text-slate-400 text-sm">Historial completo de lecturas</p>
            </div>
          </div>

          <div className="bg-slate-900/30 rounded-2xl p-4 border border-white/5">
            {historialDht.length > 0 ? (
              <ResponsiveContainer width="100%" height={400}>
                <LineChart data={historialDht} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(148, 163, 184, 0.1)" />
                  <XAxis 
                    dataKey="time" 
                    stroke="#94a3b8"
                    fontSize={12}
                    tick={{ fill: '#94a3b8' }}
                  />
                  <YAxis 
                    stroke="#94a3b8"
                    fontSize={12}
                    tick={{ fill: '#94a3b8' }}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend 
                    wrapperStyle={{ color: '#94a3b8' }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="temperatura" 
                    stroke="#ef4444"
                    strokeWidth={2}
                    name="Temperatura"
                    dot={{ fill: '#ef4444', strokeWidth: 2, r: 4 }}
                    activeDot={{ r: 6, stroke: '#ef4444', strokeWidth: 2, fill: '#1e293b' }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="humedad" 
                    stroke="#3b82f6"
                    strokeWidth={2}
                    name="Humedad"
                    dot={{ fill: '#3b82f6', strokeWidth: 2, r: 4 }}
                    activeDot={{ r: 6, stroke: '#3b82f6', strokeWidth: 2, fill: '#1e293b' }}
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-center py-12">
                <TrendingUp className="w-12 h-12 text-slate-500 mx-auto mb-4" />
                <p className="text-slate-400">No hay datos suficientes para mostrar el gráfico</p>
                <p className="text-slate-500 text-sm mt-2">Se necesitan al menos 2 lecturas para generar el gráfico</p>
              </div>
            )}
          </div>
        </div>
      </div>

      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(51, 65, 85, 0.3);
          border-radius: 3px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(99, 102, 241, 0.5);
          border-radius: 3px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(99, 102, 241, 0.7);
        }
      `}</style>
    </div>
  );
}