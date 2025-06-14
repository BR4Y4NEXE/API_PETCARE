import { useEffect, useState } from "react";
import { Thermometer, Droplets, Eye, Settings, Activity, Zap, RefreshCw } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

// Tipos más robustos
type DhtData = {
  temperatura: number | null;
  humedad: number | null;
  fechaHora?: string;
};

type InfraredData = {
  estado: boolean;
  fechaHora: string | null;
};

type DhtHistoryData = {
  temperatura: number;
  humedad: number;
  fechaHora: string;
  hora: string;
};

export default function SimpleDashboard() {
  const [infrared, setInfrared] = useState<InfraredData>({ estado: false, fechaHora: null });
  const [servoStatus, setServoStatus] = useState<boolean>(false);
  const [dht, setDht] = useState<DhtData>({ temperatura: null, humedad: null });
  const [dhtHistory, setDhtHistory] = useState<DhtHistoryData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isActivatingServo, setIsActivatingServo] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<string>("");

  // Función para obtener datos DHT
  const fetchDhtData = async () => {
    try {
      const response = await fetch("/api/get-dht", {
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        console.log("DHT Data:", data);
        setDht({
          temperatura: data.temperatura,
          humedad: data.humedad,
          fechaHora: data.fechaHora
        });
      }
    } catch (error) {
      console.error("Error fetching DHT data:", error);
    }
  };

  // Función para obtener datos del sensor infrarrojo
  const fetchInfraredData = async () => {
    try {
      const response = await fetch("/api/get-infrared", {
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        console.log("Infrared Data:", data);
        setInfrared({
          estado: Boolean(data.estado),
          fechaHora: data.fechaHora
        });
      }
    } catch (error) {
      console.error("Error fetching infrared data:", error);
    }
  };

  // Función para obtener estado del servo
  const fetchServoStatus = async () => {
    try {
      const response = await fetch("/api/servo", {
        method: 'GET',
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        console.log("Servo Status:", data);
        setServoStatus(Boolean(data.status));
      }
    } catch (error) {
      console.error("Error fetching servo status:", error);
    }
  };

  // Función para obtener historial DHT
  const fetchDhtHistory = async () => {
    try {
      const response = await fetch("/api/get-dht-history", {
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        console.log("DHT History:", data);
        
        if (data.data && Array.isArray(data.data)) {
          setDhtHistory(data.data);
        } else {
          setDhtHistory([]);
        }
      }
    } catch (error) {
      console.error("Error fetching DHT history:", error);
      setDhtHistory([]);
    }
  };

  // Función principal para obtener todos los datos
  const fetchAllData = async (showRefresh = false) => {
    if (showRefresh) setIsRefreshing(true);
    
    try {
      await Promise.all([
        fetchDhtData(),
        fetchInfraredData(),
        fetchServoStatus(),
        fetchDhtHistory()
      ]);
      
      setLastUpdate(new Date().toLocaleTimeString('es-ES'));
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setIsLoading(false);
      if (showRefresh) setIsRefreshing(false);
    }
  };

  // Cargar datos iniciales y configurar actualización automática
  useEffect(() => {
    fetchAllData();
    
    // Actualizar cada 15 segundos
    const interval = setInterval(() => {
      fetchAllData();
    }, 15000);
    
    return () => clearInterval(interval);
  }, []);

  // Activar servo usando el nuevo endpoint trigger-servo
  const activateServo = async () => {
  if (isActivatingServo) return;
  
  setIsActivatingServo(true);
  
  try {
    const response = await fetch("/api/trigger-servo", { 
      method: "POST",
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache',
        // Agregar la API key aquí
        'X-API-Key': '0a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b'
      }
    });
    
    if (response.ok) {
      const data = await response.json();
      console.log("Servo command sent:", data);
      
      setServoStatus(true);
      
      setTimeout(() => {
        fetchAllData();
      }, 3000);
      
      setTimeout(() => {
        setServoStatus(false);
      }, 8000);
      
    } else {
      const errorData = await response.json();
      console.error("Error response:", errorData);
      alert("Error al enviar comando: " + (errorData.error || "Error desconocido"));
    }
  } catch (error) {
    console.error("Error activating servo:", error);
    alert("Error de conexión al activar el servo");
  } finally {
    setIsActivatingServo(false);
  }
};

  // Componente para tooltip personalizado
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-slate-800/95 backdrop-blur-sm border border-white/20 rounded-lg p-3 shadow-xl">
          <p className="text-slate-300 text-sm mb-2 font-medium">{`Hora: ${label}`}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} className="text-sm font-medium" style={{ color: entry.color }}>
              {`${entry.dataKey === 'temperatura' ? 'Temperatura' : 'Humedad'}: ${entry.value}${entry.dataKey === 'temperatura' ? '°C' : '%'}`}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  // Pantalla de carga
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 to-purple-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-cyan-400 border-t-transparent mx-auto mb-4"></div>
          <p className="text-cyan-300 text-lg">Cargando datos del sistema...</p>
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
        <div className="flex items-center justify-center space-x-2 text-slate-400 text-sm">
          <span>Última actualización: {lastUpdate}</span>
          {isRefreshing && (
            <RefreshCw className="w-4 h-4 animate-spin text-cyan-400" />
          )}
        </div>
      </div>

      {/* Cards Grid */}
      <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        
        {/* Temperatura y Humedad */}
        <div className="bg-slate-800/50 backdrop-blur-sm border border-white/10 rounded-2xl p-6 hover:border-cyan-400/30 transition-all duration-300">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-cyan-300">Ambiente</h2>
            <Thermometer className="w-6 h-6 text-cyan-400" />
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Thermometer className="w-4 h-4 text-red-400" />
                <span className="text-sm text-slate-300">Temperatura</span>
              </div>
              <span className="text-2xl font-bold text-red-400">
                {dht.temperatura !== null ? `${dht.temperatura}°C` : "--"}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Droplets className="w-4 h-4 text-blue-400" />
                <span className="text-sm text-slate-300">Humedad</span>
              </div>
              <span className="text-2xl font-bold text-blue-400">
                {dht.humedad !== null ? `${dht.humedad}%` : "--"}
              </span>
            </div>
          </div>
        </div>

        {/* Sensor Infrarrojo */}
<div className="bg-slate-800/50 backdrop-blur-sm border border-white/10 rounded-2xl p-6 hover:border-purple-400/30 transition-all duration-300">
  <div className="flex items-center justify-between mb-4">
    <h2 className="text-lg font-semibold text-purple-300">Comida disponible</h2>
    <Eye className="w-6 h-6 text-purple-400" />
  </div>

  <div className="space-y-4">
    <div className="flex items-center justify-between">
      <span className="text-sm text-slate-300">Disponibilidad</span>
      <div className={`flex items-center space-x-2 px-3 py-2 rounded-full text-sm font-medium ${
        infrared.estado 
          ? 'bg-green-500/20 text-green-400 border border-green-500/30'  // DISPONIBLE = Verde
          : 'bg-red-500/20 text-red-400 border border-red-500/30'        // OCUPADO = Rojo
      }`}>
        <div className={`w-2 h-2 rounded-full ${
          infrared.estado ? 'bg-green-400' : 'bg-red-400 animate-pulse'
        }`}></div>
        <span>{infrared.estado ? "No hay comida" : "Hay comida"}</span>
      </div>
    </div>

    {/* Explicación clara del estado */}
    <div className="bg-slate-700/30 rounded-lg p-3">
      <span className="text-xs text-slate-400 block mb-1">Estado actual:</span>
      <p className="text-sm text-slate-300">
        {infrared.estado 
          ? "🟢 El comedero está libre para usar" 
          : "🔴 Mascota está comiendo actualmente"}
      </p>
    </div>

    {infrared.fechaHora && (
      <div className="bg-slate-700/30 rounded-lg p-3">
        <span className="text-xs text-slate-400 block">Última actualización:</span>
        <p className="text-sm font-mono text-slate-300 mt-1">
          {infrared.fechaHora}
        </p>
      </div>
    )}

    {/* Indicador de falta de datos */}
    {!infrared.fechaHora && (
      <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-3">
        <span className="text-xs text-yellow-400 block">⚠️ Sin datos recientes</span>
        <p className="text-sm text-yellow-300 mt-1">
          Esperando datos del sensor...
        </p>
      </div>
    )}
  </div>
</div>

        {/* Control del Servo */}
        <div className="bg-slate-800/50 backdrop-blur-sm border border-white/10 rounded-2xl p-6 hover:border-emerald-400/30 transition-all duration-300">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-emerald-300">Dispensador</h2>
            <Settings className="w-6 h-6 text-emerald-400" />
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-300">Estado</span>
              <div className={`flex items-center space-x-2 px-3 py-2 rounded-full text-sm font-medium ${
                servoStatus 
                  ? 'bg-green-500/20 text-green-400 border border-green-500/30' 
                  : 'bg-red-500/20 text-red-400 border border-red-500/30'
              }`}>
                <div className={`w-2 h-2 rounded-full ${
                  servoStatus ? 'bg-green-400 animate-pulse' : 'bg-red-400'
                }`}></div>
                <span>{servoStatus ? "Activo" : "Inactivo"}</span>
              </div>
            </div>

            <button
              onClick={activateServo}
              disabled={isActivatingServo}
              className={`w-full px-4 py-3 transition-all duration-300 rounded-xl font-semibold shadow-lg flex items-center justify-center space-x-2 active:scale-95 ${
                isActivatingServo 
                  ? 'bg-gradient-to-r from-slate-600 to-slate-700 cursor-not-allowed opacity-70' 
                  : 'bg-gradient-to-r from-emerald-600 to-cyan-600 hover:from-emerald-500 hover:to-cyan-500 hover:shadow-emerald-500/25 hover:scale-105'
              }`}
            >
              {isActivatingServo ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Enviando comando...</span>
                </>
              ) : (
                <>
                  <Zap className="w-4 h-4" />
                  <span>Dispensar Alimento</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Gráfica de Temperatura y Humedad */}
      <div className="max-w-6xl mx-auto">
        <div className="bg-slate-800/30 backdrop-blur-sm border border-white/5 rounded-2xl p-6">
          <h3 className="text-lg font-semibold text-slate-300 mb-6 flex items-center space-x-2">
            <Activity className="w-5 h-5 text-cyan-400" />
            <span>Historial de Temperatura y Humedad</span>
            <span className="text-sm text-slate-500">({dhtHistory.length} lecturas)</span>
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
                    connectNulls={false}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="humedad" 
                    stroke="#3B82F6" 
                    strokeWidth={2}
                    dot={{ fill: '#3B82F6', strokeWidth: 2, r: 4 }}
                    name="Humedad (%)"
                    connectNulls={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-80 flex items-center justify-center">
              <div className="text-center text-slate-400">
                <Activity className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p className="text-lg font-medium">No hay datos históricos disponibles</p>
                <p className="text-sm mt-2">Los datos aparecerán aquí una vez que se registren lecturas</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Botón de actualización manual */}
      <div className="fixed bottom-6 right-6">
        <button
          onClick={() => fetchAllData(true)}
          disabled={isRefreshing}
          className="bg-slate-800/80 backdrop-blur-sm border border-white/20 rounded-full p-3 hover:bg-slate-700/80 transition-all shadow-lg hover:shadow-cyan-500/25 disabled:opacity-50"
          title="Actualizar datos"
        >
          <RefreshCw className={`w-5 h-5 text-cyan-400 ${isRefreshing ? 'animate-spin' : ''}`} />
        </button>
      </div>
    </div>
  );
}