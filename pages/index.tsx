import { useEffect, useState } from "react";
import { Thermometer, Droplets, Eye, Settings, Activity, Zap, AlertCircle, RefreshCw } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

// Tipos simplificados
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

type ErrorState = {
  dht: boolean;
  infrared: boolean;
  servo: boolean;
  history: boolean;
};

export default function SimpleDashboard() {
  const [infrared, setInfrared] = useState<InfraredData | null>(null);
  const [servoStatus, setServoStatus] = useState<boolean | null>(null);
  const [dht, setDht] = useState<DhtData | null>(null);
  const [dhtHistory, setDhtHistory] = useState<DhtHistoryData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<string>("");
  const [errors, setErrors] = useState<ErrorState>({
    dht: false,
    infrared: false,
    servo: false,
    history: false
  });

  // Función mejorada para hacer peticiones con mejor manejo de errores
  const fetchWithTimeout = async (url: string, timeout = 10000) => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);
    
    try {
      const response = await fetch(url, {
        signal: controller.signal,
        method: 'GET',
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        },
        // Forzar nueva petición añadiendo timestamp
        cache: 'no-store'
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      clearTimeout(timeoutId);
      throw error;
    }
  };

  // Función para obtener todos los datos con mejor manejo de errores
  const fetchData = async (showLoader = false) => {
    if (showLoader) {
      setIsRefreshing(true);
    }

    const newErrors: ErrorState = {
      dht: false,
      infrared: false,
      servo: false,
      history: false
    };

    try {
      // Hacer peticiones con timestamp para evitar caché
      const timestamp = new Date().getTime();
      
      // DHT Data
      try {
        const dhtData = await fetchWithTimeout(`/api/get-dht?t=${timestamp}`);
        console.log('DHT Data received:', dhtData);
        setDht(dhtData);
      } catch (error) {
        console.error("Error fetching DHT data:", error);
        newErrors.dht = true;
        setDht({ temperatura: null, humedad: null });
      }

      // Infrared Data
      try {
        const infraredData = await fetchWithTimeout(`/api/get-infrared?t=${timestamp}`);
        console.log('Infrared Data received:', infraredData);
        setInfrared(infraredData);
      } catch (error) {
        console.error("Error fetching infrared data:", error);
        newErrors.infrared = true;
        setInfrared({ estado: false, fechaHora: null });
      }

      // Servo Status
      try {
        const servoData = await fetchWithTimeout(`/api/servo?t=${timestamp}`);
        console.log('Servo Data received:', servoData);
        setServoStatus(servoData.status);
      } catch (error) {
        console.error("Error fetching servo data:", error);
        newErrors.servo = true;
        setServoStatus(null);
      }

      // DHT History
      try {
        const dhtHistoryData = await fetchWithTimeout(`/api/get-dht-history?t=${timestamp}`);
        console.log('DHT History Data received:', dhtHistoryData);
        setDhtHistory(dhtHistoryData.data || []);
      } catch (error) {
        console.error("Error fetching DHT history:", error);
        newErrors.history = true;
        setDhtHistory([]);
      }

      setLastUpdate(new Date().toLocaleTimeString('es-ES'));
      setErrors(newErrors);
      
    } catch (error) {
      console.error("General error fetching data:", error);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    console.log('Dashboard mounted, fetching initial data...');
    fetchData(true);
    
    // Actualizar datos cada 15 segundos (reducido para testing)
    const interval = setInterval(() => {
      console.log('Auto-refresh triggered');
      fetchData();
    }, 15000);
    
    return () => clearInterval(interval);
  }, []);

  const toggleServo = async () => {
    try {
      setIsRefreshing(true);
      const response = await fetch("/api/servo", { 
        method: "POST",
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache'
        }
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('Servo activation response:', data);
      setServoStatus(data.status);
      
      // Actualizar después de dispensar
      setTimeout(() => fetchData(), 2000);
    } catch (error) {
      console.error("Error toggling servo:", error);
    } finally {
      setIsRefreshing(false);
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
          <p className="text-cyan-300 mb-2">Cargando datos...</p>
          <p className="text-slate-400 text-sm">Conectando con sensores</p>
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
          {isRefreshing && (
            <RefreshCw className="w-6 h-6 text-yellow-400 animate-spin" />
          )}
        </div>
        <p className="text-slate-400 text-sm">
          Última actualización: {lastUpdate || "Nunca"}
        </p>
        {/* Mostrar errores de conexión */}
        {(errors.dht || errors.infrared || errors.servo || errors.history) && (
          <div className="mt-2 flex items-center justify-center space-x-2 text-yellow-400 text-sm">
            <AlertCircle className="w-4 h-4" />
            <span>Algunos sensores no responden correctamente</span>
          </div>
        )}
      </div>

      {/* Cards Grid */}
      <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        
        {/* Temperatura y Humedad */}
        <div className={`bg-slate-800/50 backdrop-blur-sm border rounded-2xl p-6 transition-all ${
          errors.dht ? 'border-red-500/30 hover:border-red-400/50' : 'border-white/10 hover:border-cyan-400/30'
        }`}>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-cyan-300">Ambiente</h2>
            <div className="flex items-center space-x-2">
              {errors.dht && <AlertCircle className="w-4 h-4 text-red-400" />}
              <Thermometer className="w-6 h-6 text-cyan-400" />
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Thermometer className="w-4 h-4 text-red-400" />
                <span className="text-sm text-slate-300">Temperatura</span>
              </div>
              <span className={`text-xl font-bold ${errors.dht ? 'text-red-400' : ''}`}>
                {dht?.temperatura !== null ? `${dht?.temperatura}°C` : "--"}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Droplets className="w-4 h-4 text-blue-400" />
                <span className="text-sm text-slate-300">Humedad</span>
              </div>
              <span className={`text-xl font-bold ${errors.dht ? 'text-red-400' : ''}`}>
                {dht?.humedad !== null ? `${dht?.humedad}%` : "--"}
              </span>
            </div>
          </div>
          
          {errors.dht && (
            <div className="mt-3 text-xs text-red-400">
              Error al conectar con sensor DHT
            </div>
          )}
        </div>

        {/* Sensor Infrarrojo */}
        <div className={`bg-slate-800/50 backdrop-blur-sm border rounded-2xl p-6 transition-all ${
          errors.infrared ? 'border-red-500/30 hover:border-red-400/50' : 'border-white/10 hover:border-purple-400/30'
        }`}>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-purple-300">Detección</h2>
            <div className="flex items-center space-x-2">
              {errors.infrared && <AlertCircle className="w-4 h-4 text-red-400" />}
              <Eye className="w-6 h-6 text-purple-400" />
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-300">Estado</span>
              <div className={`flex items-center space-x-2 px-3 py-1 rounded-full text-sm ${
                errors.infrared 
                  ? 'bg-red-500/20 text-red-400'
                  : infrared?.estado 
                    ? 'bg-green-500/20 text-green-400' 
                    : 'bg-gray-500/20 text-gray-400'
              }`}>
                <div className={`w-2 h-2 rounded-full ${
                  errors.infrared 
                    ? 'bg-red-400'
                    : infrared?.estado ? 'bg-green-400 animate-pulse' : 'bg-gray-400'
                }`}></div>
                <span>
                  {errors.infrared ? "Error" : infrared?.estado ? "Detectado" : "Libre"}
                </span>
              </div>
            </div>

            {infrared?.fechaHora && !errors.infrared && (
              <div>
                <span className="text-xs text-slate-400">Última detección:</span>
                <p className="text-sm font-mono mt-1">
                  {infrared.fechaHora}
                </p>
              </div>
            )}
          </div>
          
          {errors.infrared && (
            <div className="mt-3 text-xs text-red-400">
              Error al conectar con sensor infrarrojo
            </div>
          )}
        </div>

        {/* Control del Servo */}
        <div className={`bg-slate-800/50 backdrop-blur-sm border rounded-2xl p-6 transition-all ${
          errors.servo ? 'border-red-500/30 hover:border-red-400/50' : 'border-white/10 hover:border-emerald-400/30'
        }`}>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-emerald-300">Dispensador</h2>
            <div className="flex items-center space-x-2">
              {errors.servo && <AlertCircle className="w-4 h-4 text-red-400" />}
              <Settings className="w-6 h-6 text-emerald-400" />
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-300">Estado</span>
              <div className={`flex items-center space-x-2 px-3 py-1 rounded-full text-sm ${
                errors.servo 
                  ? 'bg-red-500/20 text-red-400'
                  : servoStatus 
                    ? 'bg-green-500/20 text-green-400' 
                    : 'bg-red-500/20 text-red-400'
              }`}>
                <div className={`w-2 h-2 rounded-full ${
                  errors.servo 
                    ? 'bg-red-400'
                    : servoStatus ? 'bg-green-400' : 'bg-red-400'
                }`}></div>
                <span>
                  {errors.servo ? "Error" : servoStatus ? "Activo" : "Inactivo"}
                </span>
              </div>
            </div>

            <button
              onClick={toggleServo}
              disabled={isRefreshing || errors.servo}
              className={`w-full px-4 py-3 transition-all duration-300 rounded-xl font-semibold shadow-lg flex items-center justify-center space-x-2 ${
                isRefreshing || errors.servo
                  ? 'bg-gray-600 cursor-not-allowed opacity-50'
                  : 'bg-gradient-to-r from-emerald-600 to-cyan-600 hover:from-emerald-500 hover:to-cyan-500 hover:shadow-emerald-500/25 hover:scale-105'
              }`}
            >
              {isRefreshing ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <Zap className="w-4 h-4" />
              )}
              <span>
                {isRefreshing ? "Dispensando..." : "Dispensar Alimento"}
              </span>
            </button>
          </div>
          
          {errors.servo && (
            <div className="mt-3 text-xs text-red-400">
              Error al conectar con dispensador
            </div>
          )}
        </div>
      </div>

      {/* Gráfica de Temperatura y Humedad */}
      <div className="max-w-4xl mx-auto">
        <div className={`bg-slate-800/30 backdrop-blur-sm border rounded-2xl p-6 ${
          errors.history ? 'border-red-500/20' : 'border-white/5'
        }`}>
          <h3 className="text-lg font-semibold text-slate-300 mb-6 flex items-center space-x-2">
            <Activity className="w-5 h-5 text-cyan-400" />
            <span>Historial de Temperatura y Humedad</span>
            {errors.history && <AlertCircle className="w-4 h-4 text-red-400" />}
          </h3>
          
          {errors.history ? (
            <div className="h-80 flex items-center justify-center">
              <div className="text-center text-red-400">
                <AlertCircle className="w-12 h-12 mx-auto mb-4" />
                <p>Error al cargar datos históricos</p>
                <p className="text-sm mt-2">Revisa la conexión con la base de datos</p>
              </div>
            </div>
          ) : dhtHistory.length > 0 ? (
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
          onClick={() => fetchData(true)}
          disabled={isRefreshing}
          className={`backdrop-blur-sm border border-white/20 rounded-full p-3 transition-all ${
            isRefreshing 
              ? 'bg-slate-700/80 cursor-not-allowed' 
              : 'bg-slate-800/80 hover:bg-slate-700/80'
          }`}
          title="Actualizar datos"
        >
          <Activity className={`w-5 h-5 text-cyan-400 ${isRefreshing ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Debug info (solo en desarrollo) */}
      {process.env.NODE_ENV === 'development' && (
        <div className="fixed bottom-6 left-6 bg-black/80 rounded-lg p-3 text-xs text-green-400 font-mono max-w-sm">
          <p>Debug Info:</p>
          <p>DHT: {dht?.temperatura}°C, {dht?.humedad}%</p>
          <p>Infrared: {infrared?.estado ? 'ON' : 'OFF'}</p>
          <p>Servo: {servoStatus ? 'ACTIVE' : 'INACTIVE'}</p>
          <p>History: {dhtHistory.length} records</p>
          <p className="text-red-400">
            Errors: {Object.values(errors).filter(Boolean).length}
          </p>
        </div>
      )}
    </div>
  );
}