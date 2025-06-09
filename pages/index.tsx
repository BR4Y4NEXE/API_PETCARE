import { useEffect, useState } from "react";
import { Thermometer, Droplets, Eye, Settings, Activity, Zap } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

// Tipos simplificados
type DhtData = {
  temperatura: number;
  humedad: number;
};

type InfraredData = {
  estado: boolean;
  fechaHora: string;
};

type DhtHistoryData = {
  temperatura: number;
  humedad: number;
  fechaHora: string;
  hora: string;
};

export default function SimpleDashboard() {
  const [infrared, setInfrared] = useState<InfraredData | null>(null);
  const [servoStatus, setServoStatus] = useState<boolean | null>(null);
  const [dht, setDht] = useState<DhtData | null>(null);
  const [dhtHistory, setDhtHistory] = useState<DhtHistoryData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<string>("");

  // Función para obtener todos los datos
  const fetchData = async () => {
    try {
      const [dhtRes, infraredRes, servoRes, dhtHistoryRes] = await Promise.all([
        fetch("/api/get-dht"),
        fetch("/api/get-infrared"),
        fetch("/api/servo"),
        fetch("/api/get-dht-history")
      ]);

      const [dhtData, infraredData, servoData, dhtHistoryData] = await Promise.all([
        dhtRes.json(),
        infraredRes.json(),
        servoRes.json(),
        dhtHistoryRes.json()
      ]);

      setDht(dhtData);
      setInfrared(infraredData);
      setServoStatus(servoData.status);
      setDhtHistory(dhtHistoryData.data || []);
      setLastUpdate(new Date().toLocaleTimeString());
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    // Actualizar datos cada 30 segundos
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, []);

  const toggleServo = async () => {
    try {
      const res = await fetch("/api/servo", { method: "POST" });
      const data = await res.json();
      setServoStatus(data.status);
      // Actualizar después de dispensar
      setTimeout(fetchData, 1000);
    } catch (error) {
      console.error("Error toggling servo:", error);
    }
  };

  // Componente personalizado para el tooltip de la gráfica
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-slate-800/90 backdrop-blur-sm border border-white/20 rounded-lg p-3 shadow-lg">
          <p className="text-slate-300 text-sm mb-2">{`Hora: ${label}`}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} className="text-sm" style={{ color: entry.color }}>
              {`${entry.dataKey === 'temperatura' ? 'Temperatura' : 'Humedad'}: ${entry.value}${entry.dataKey === 'temperatura' ? '°C' : '%'}`}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 to-purple-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-cyan-400 border-t-transparent mx-auto mb-4"></div>
          <p className="text-cyan-300">Cargando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-purple-900 text-white p-4">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="flex items-center justify-center space-x-3 mb-2">
          <Activity className="w-8 h-8 text-cyan-400" />
          <h1 className="text-3xl font-bold text-cyan-400">PetCare Monitor</h1>
        </div>
        <p className="text-slate-400 text-sm">
          Última actualización: {lastUpdate}
        </p>
      </div>

      {/* Cards Grid */}
      <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        
        {/* Temperatura y Humedad */}
        <div className="bg-slate-800/50 backdrop-blur-sm border border-white/10 rounded-2xl p-6 hover:border-cyan-400/30 transition-all">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-cyan-300">Ambiente</h2>
            <Thermometer className="w-6 h-6 text-cyan-400" />
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Thermometer className="w-4 h-4 text-red-400" />
                <span className="text-sm text-slate-300">Temperatura</span>
              </div>
              <span className="text-xl font-bold">
                {dht?.temperatura ?? "--"}°C
              </span>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Droplets className="w-4 h-4 text-blue-400" />
                <span className="text-sm text-slate-300">Humedad</span>
              </div>
              <span className="text-xl font-bold">
                {dht?.humedad ?? "--"}%
              </span>
            </div>
          </div>
        </div>

        {/* Sensor Infrarrojo */}
        <div className="bg-slate-800/50 backdrop-blur-sm border border-white/10 rounded-2xl p-6 hover:border-purple-400/30 transition-all">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-purple-300">Detección</h2>
            <Eye className="w-6 h-6 text-purple-400" />
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-300">Estado</span>
              <div className={`flex items-center space-x-2 px-3 py-1 rounded-full text-sm ${
                infrared?.estado 
                  ? 'bg-green-500/20 text-green-400' 
                  : 'bg-gray-500/20 text-gray-400'
              }`}>
                <div className={`w-2 h-2 rounded-full ${
                  infrared?.estado ? 'bg-green-400 animate-pulse' : 'bg-gray-400'
                }`}></div>
                <span>{infrared?.estado ? "Detectado" : "Libre"}</span>
              </div>
            </div>

            {infrared?.fechaHora && (
              <div>
                <span className="text-xs text-slate-400">Última detección:</span>
                <p className="text-sm font-mono mt-1">
                  {infrared.fechaHora}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Control del Servo */}
        <div className="bg-slate-800/50 backdrop-blur-sm border border-white/10 rounded-2xl p-6 hover:border-emerald-400/30 transition-all">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-emerald-300">Dispensador</h2>
            <Settings className="w-6 h-6 text-emerald-400" />
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-300">Estado</span>
              <div className={`flex items-center space-x-2 px-3 py-1 rounded-full text-sm ${
                servoStatus 
                  ? 'bg-green-500/20 text-green-400' 
                  : 'bg-red-500/20 text-red-400'
              }`}>
                <div className={`w-2 h-2 rounded-full ${
                  servoStatus ? 'bg-green-400' : 'bg-red-400'
                }`}></div>
                <span>{servoStatus ? "Activo" : "Inactivo"}</span>
              </div>
            </div>

            <button
              onClick={toggleServo}
              className="w-full px-4 py-3 bg-gradient-to-r from-emerald-600 to-cyan-600 hover:from-emerald-500 hover:to-cyan-500 transition-all duration-300 rounded-xl font-semibold shadow-lg hover:shadow-emerald-500/25 hover:scale-105 flex items-center justify-center space-x-2"
            >
              <Zap className="w-4 h-4" />
              <span>Dispensar Alimento</span>
            </button>
          </div>
        </div>
      </div>

      {/* Gráfica de Temperatura y Humedad */}
      <div className="max-w-4xl mx-auto">
        <div className="bg-slate-800/30 backdrop-blur-sm border border-white/5 rounded-2xl p-6">
          <h3 className="text-lg font-semibold text-slate-300 mb-6 flex items-center space-x-2">
            <Activity className="w-5 h-5 text-cyan-400" />
            <span>Historial de Temperatura y Humedad</span>
          </h3>
          
          {dhtHistory.length > 0 ? (
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={dhtHistory} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis 
                    dataKey="hora" 
                    stroke="#9CA3AF"
                    fontSize={12}
                  />
                  <YAxis 
                    stroke="#9CA3AF"
                    fontSize={12}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend />
                  <Line 
                    type="monotone" 
                    dataKey="temperatura" 
                    stroke="#EF4444" 
                    strokeWidth={2}
                    dot={{ fill: '#EF4444', strokeWidth: 2, r: 4 }}
                    name="Temperatura (°C)"
                  />
                  <Line 
                    type="monotone" 
                    dataKey="humedad" 
                    stroke="#3B82F6" 
                    strokeWidth={2}
                    dot={{ fill: '#3B82F6', strokeWidth: 2, r: 4 }}
                    name="Humedad (%)"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-80 flex items-center justify-center">
              <div className="text-center text-slate-400">
                <Activity className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>No hay datos históricos disponibles</p>
                <p className="text-sm mt-2">Los datos aparecerán aquí una vez que se registren lecturas</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Botón de actualización manual */}
      <div className="fixed bottom-6 right-6">
        <button
          onClick={fetchData}
          className="bg-slate-800/80 backdrop-blur-sm border border-white/20 rounded-full p-3 hover:bg-slate-700/80 transition-all"
          title="Actualizar datos"
        >
          <Activity className="w-5 h-5 text-cyan-400" />
        </button>
      </div>
    </div>
  );
}