import React, { useEffect, useState } from "react";
import { useAuth } from "@clerk/clerk-react";
import {
  CalendarDays,
  BarChart3,
  Flame,
  CheckCircle2,
  Crown,
  RefreshCw,
  Dot
} from "lucide-react";

interface DashboardData {
  habitos: Array<{
    id: string;
    titulo: string;
    tipo: string;
    es_grupal: boolean;
    rachas: {
      actual: number;
      mejor: number;
    };
    ultimo_registro: {
      hora: any;
      fecha: string;
      estado: string;
      comentario: string;
      dias_desde_ultimo: number;
    };
    estadisticas: {
      total_registros: number;
      total_exitos: number;
      total_fallos: number;
      tasa_exito: number;
    };
    registro_hoy: {
      completado: boolean;
      estado: string;
      comentario: string;
      puede_registrar: boolean;
      fecha_local_usuario: string;
    };
    fecha_creacion: string;
  }>;
  resumen: {
    total_habitos: number;
    habitos_con_racha_activa: number;
    habitos_registrados_hoy: number;
    fecha_local_usuario: string;
  };
}

interface WeeklyProgressData {
  semana_actual: {
    fecha_inicio: string;
    fecha_fin: string;
    dias: Array<{
      fecha: string;
      dia_semana: string;
      exitos: number;
      fallos: number;
      pendientes: number;
      total: number;
      es_hoy: boolean;
    }>;
  };
}

/* ---------- Pequeños componentes de UI ---------- */

const StatCard = ({
  title,
  value,
  subtitle,
  tone,
  icon: Icon,
}: {
  title: string;
  value: string;
  subtitle?: string;
  tone: "green" | "blue" | "orange" | "purple";
  icon: React.ElementType;
}) => {
  const theme = {
    green: {
      chip: "bg-emerald-500/15 text-emerald-200 border-emerald-500/20",
      icon: "text-emerald-300",
    },
    blue: {
      chip: "bg-blue-500/15 text-blue-200 border-blue-500/20",
      icon: "text-blue-300",
    },
    orange: {
      chip: "bg-orange-500/15 text-orange-200 border-orange-500/20",
      icon: "text-orange-300",
    },
    purple: {
      chip: "bg-purple-500/15 text-purple-200 border-purple-500/20",
      icon: "text-purple-300",
    },
  }[tone];

  return (
    <div className="rounded-2xl border border-white/10 bg-gray-900/60 p-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-gray-300">
          <Icon className={`h-4 w-4 ${theme.icon}`} />
          <span className="text-sm">{title}</span>
        </div>
        <span className={`text-xs px-2 py-0.5 rounded-full border ${theme.chip}`}>Hoy</span>
      </div>
      <div className="mt-3 text-3xl font-extrabold text-white">{value}</div>
      {subtitle && <div className="mt-1 text-sm text-gray-400">{subtitle}</div>}
    </div>
  );
};

const SectionCard: React.FC<React.PropsWithChildren<{ title: string; right?: React.ReactNode }>> = ({
  title,
  right,
  children,
}) => (
  <div className="rounded-2xl border border-white/10 bg-gray-900/60 p-6">
    <div className="mb-6 flex items-center justify-between">
      <h3 className="text-lg font-semibold text-white">{title}</h3>
      {right}
    </div>
    {children}
  </div>
);

/* ---------- Página Dashboard ---------- */

const Dashboard: React.FC = () => {
  const { isLoaded, isSignedIn, getToken } = useAuth();
  const [data, setData] = useState<DashboardData | null>(null);
  const [weeklyData, setWeeklyData] = useState<WeeklyProgressData | null>(null);
  const [loading, setLoading] = useState(true);
  const [weeklyLoading, setWeeklyLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [weeklyError, setWeeklyError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const habitsPerPage = 4; 

  if (!isLoaded) {
    return <div className="text-white text-center py-8">Cargando autenticación...</div>;
  }

  if (!isSignedIn) {
    return <div className="text-red-500 text-center py-8">Debes iniciar sesión para ver el dashboard</div>;
  }

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const token = await getToken();
      if (!token) throw new Error('No hay token de autenticación');

      const response = await fetch(`${import.meta.env.VITE_API}/habits/dashboard`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const dashboardData = await response.json();

      if (!response.ok) {
        throw new Error('Error al cargar los datos');
      }

      setData(dashboardData);
      setError(null);
      
      // Clear refresh flag after successful data fetch
      sessionStorage.removeItem('refreshHabits');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setLoading(false);
    }
  };

  const fetchWeeklyProgressData = async () => {
    setWeeklyLoading(true);
    try {
      const token = await getToken();
      if (!token) throw new Error('No hay token de autenticación');

      const response = await fetch(`${import.meta.env.VITE_API}/habits/weekly-progress`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const weeklyProgressData = await response.json();

      if (!response.ok) {
        throw new Error('Error al cargar el progreso semanal');
      }

      setWeeklyData(weeklyProgressData);
      setWeeklyError(null);
    } catch (err) {
      setWeeklyError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setWeeklyLoading(false);
    }
  };

  useEffect(() => {
    // Check if we need to refresh the habits (e.g., after accepting a group invitation)
    const needsRefresh = sessionStorage.getItem('refreshHabits') === 'true';
    
    fetchDashboardData();
    fetchWeeklyProgressData();
    
    // Set up periodic refresh (every 3 minutes) if the refresh flag is set
    // This ensures that newly joined group habits will appear even if API takes time to update
    if (needsRefresh) {
      const refreshInterval = setInterval(() => {
        fetchDashboardData();
        fetchWeeklyProgressData();
        
        // After 3 refreshes, clear the interval regardless of result
        setTimeout(() => {
          clearInterval(refreshInterval);
        }, 3 * 60 * 1000); // Stop refreshing after 3 minutes
      }, 60 * 1000); // Refresh every minute
      
      return () => clearInterval(refreshInterval);
    }
  }, []);

  const handleRefresh = () => {
    fetchDashboardData();
    fetchWeeklyProgressData();
  };

  const formattedDate = new Date().toLocaleDateString("es-ES", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });

  useEffect(() => {
    // Centrar el día actual en el contenedor de progreso semanal
    const centerCurrentDay = () => {
      const container = document.getElementById('weekProgressContainer');
      if (container && weeklyData) {
        // Encontrar el índice del día actual
        const todayIndex = weeklyData.semana_actual.dias.findIndex(dia => dia.es_hoy);
        if (todayIndex !== -1) {
          const dayWidth = 104; // 6.5rem = 104px
          const gap = 12; // 3px gap
          const scrollPosition = ((todayIndex) * (dayWidth + gap)) - ((container.clientWidth - dayWidth) / 2);
          container.scrollLeft = scrollPosition;
        }
      }
    };

    setTimeout(centerCurrentDay, 100);

    window.addEventListener('resize', centerCurrentDay);
    return () => window.removeEventListener('resize', centerCurrentDay);
  }, [weeklyData]);

  if (loading || weeklyLoading) {
    return (
      <div className="space-y-6 animate-pulse p-6">
        {/* Skeleton Header */}
        <div className="flex items-start justify-between">
          <div>
            <div className="h-8 w-48 bg-gray-700 rounded-lg"></div>
            <div className="mt-2 h-4 w-72 bg-gray-700 rounded-lg"></div>
          </div>
          <div className="h-10 w-28 bg-gray-700 rounded-lg"></div>
        </div>

        {/* Skeleton Stats */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="rounded-2xl border border-white/10 bg-gray-900/60 p-5">
              <div className="flex items-center justify-between">
                <div className="h-4 w-24 bg-gray-700 rounded-full"></div>
                <div className="h-4 w-12 bg-gray-700 rounded-full"></div>
              </div>
              <div className="mt-3 h-8 w-16 bg-gray-700 rounded-lg"></div>
              <div className="mt-1 h-4 w-32 bg-gray-700 rounded-lg"></div>
            </div>
          ))}
        </div>

        {/* Skeleton Weekly Progress and Streaks */}
        <div className="grid grid-cols-1 gap-4">
          {/* Skeleton Progreso de la Semana */}
          <div className="rounded-2xl border border-white/10 bg-gray-900/60 p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="h-6 w-48 bg-gray-700 rounded-lg"></div>
              <div className="flex items-center gap-4">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="flex items-center gap-1.5">
                    <div className="h-2.5 w-2.5 rounded-full bg-gray-700"></div>
                    <div className="h-4 w-16 bg-gray-700 rounded-lg"></div>
                  </div>
                ))}
              </div>
            </div>
            <div className="space-y-4">
              <div className="flex gap-2 justify-between">
                {[...Array(7)].map((_, i) => (
                  <div key={i} className="h-[120px] w-[104px] bg-gray-700 rounded-lg"></div>
                ))}
              </div>
            </div>
          </div>
          
          {/* Skeleton Mejores Rachas */}
          <div className="rounded-2xl border border-white/10 bg-gray-900/60 p-5">
            <div className="h-6 w-48 bg-gray-700 rounded-lg mb-4"></div>
            <div className="grid gap-3">
              <div className="grid grid-cols-3 gap-2">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="h-[140px] bg-gray-700 rounded-lg"></div>
                ))}
              </div>
              <div className="grid grid-cols-2 gap-2">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="h-12 bg-gray-700 rounded-lg"></div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Skeleton Recent Activity */}
        <div className="rounded-2xl border border-white/10 bg-gray-900/60 p-5">
          <div className="h-6 w-48 bg-gray-700 rounded-lg mb-4"></div>
          <div className="space-y-2">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-16 bg-gray-700 rounded-lg"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }
  if (error) return <div className="text-red-500 text-center py-8">{error}</div>;
  if (!data) return null;

  return (
    <div className="space-y-6">
      {/* Encabezado */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-white">Dashboard</h1>
          <p className="mt-1 flex items-center gap-2 text-gray-400">
            <CalendarDays className="h-4 w-4" />
            <span>Resumen de tu progreso y estadísticas · {formattedDate}</span>
          </p>
        </div>

        <button
          onClick={handleRefresh}
          className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-3 py-2 text-sm font-semibold text-white hover:bg-emerald-700"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          Actualizar
        </button>
      </div>

      {/* Tarjetas métricas */}
      <div className="grid grid-cols-2 gap-4">
        <StatCard
          title="Total Hábitos"
          value={data.resumen.total_habitos.toString()}
          subtitle="hábitos activos"
          tone="green"
          icon={BarChart3}
        />
        <StatCard
          title="Completados"
          value={data.resumen.habitos_registrados_hoy.toString()}
          subtitle={`de ${data.resumen.total_habitos} hábitos`}
          tone="blue"
          icon={CheckCircle2}
        />
        <StatCard
          title="Rachas Activas"
          value={data.resumen.habitos_con_racha_activa.toString()}
          subtitle="hábitos en racha"
          tone="orange"
          icon={Flame}
        />
        <StatCard
          title="Mejor Racha"
          value={Math.max(...data.habitos.map(h => h.rachas.mejor)).toString()}
          subtitle="días consecutivos"
          tone="purple"
          icon={Crown}
        />
      </div>

      {/* Sección de Progreso y Rachas */}
      <div className="grid grid-cols-1 gap-4">
        <SectionCard
          title="Progreso de la Semana"
          right={
            <div className="hidden md:flex items-center gap-4">
              <div className="flex items-center gap-1.5">
                <div className="h-2.5 w-2.5 rounded-full bg-emerald-400"></div>
                <span className="text-xs text-emerald-400">Completado</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="h-2.5 w-2.5 rounded-full bg-orange-400"></div>
                <span className="text-xs text-orange-400">En progreso</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="h-2.5 w-2.5 rounded-full bg-red-400"></div>
                <span className="text-xs text-red-400">Con fallos</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="h-2.5 w-2.5 rounded-full bg-gray-400"></div>
                <span className="text-xs text-gray-400">Pendiente</span>
              </div>
            </div>
          }
        >
          <div className="md:hidden flex flex-wrap gap-4 mb-4 justify-center">
            <div className="flex items-center gap-1.5">
              <div className="h-2.5 w-2.5 rounded-full bg-emerald-400"></div>
              <span className="text-xs text-emerald-400">Completado</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="h-2.5 w-2.5 rounded-full bg-orange-400"></div>
              <span className="text-xs text-orange-400">En progreso</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="h-2.5 w-2.5 rounded-full bg-red-400"></div>
              <span className="text-xs text-red-400">Con fallos</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="h-2.5 w-2.5 rounded-full bg-gray-400"></div>
              <span className="text-xs text-gray-400">Pendiente</span>
            </div>
          </div>

          {/** === Un solo scroll sincronizado === */}
          <div 
            className="overflow-x-auto pb-4 cursor-grab active:cursor-grabbing select-none relative scrollbar-hide" 
            id="weekProgressContainer"
            onMouseDown={(e) => {
              const ele = e.currentTarget;
              const startPos = {
                left: ele.scrollLeft,
                x: e.clientX,
              };

              const onMouseMove = (e: MouseEvent) => {
                const dx = e.clientX - startPos.x;
                ele.scrollLeft = startPos.left - dx;
              };

              const onMouseUp = () => {
                document.removeEventListener('mousemove', onMouseMove);
                document.removeEventListener('mouseup', onMouseUp);
              };

              document.addEventListener('mousemove', onMouseMove);
              document.addEventListener('mouseup', onMouseUp);
            }}
          >
            {weeklyLoading ? (
              <div className="flex justify-center w-full py-4">
                <div className="animate-spin h-6 w-6 border-2 border-emerald-500 rounded-full border-t-transparent"></div>
              </div>
            ) : weeklyError ? (
              <div className="text-center py-4 text-red-400">
                <p>Error al cargar el progreso semanal</p>
                <p className="text-sm">{weeklyError}</p>
              </div>
            ) : weeklyData ? (
              <div className="inline-grid grid-rows-[auto,1fr] grid-flow-col auto-cols-[6.5rem] gap-3 px-1">
                {weeklyData.semana_actual.dias.map((dia, i) => {
                  const isToday = dia.es_hoy;
                  const habitosCompletados = dia.exitos;
                  const habitosFallados = dia.fallos;
                  const totalHabitos = dia.total;

                  let estado: "success" | "partial" | "pending" | "failed" = "pending";
                  if (habitosFallados > 0) {
                    estado = "failed";
                  } else if (habitosCompletados > 0) {
                    estado = habitosCompletados === totalHabitos ? "success" : "partial";
                  }

                  return (
                    <React.Fragment key={i}>
                      {/* Fila 1: etiqueta del día */}
                      <div className="text-center font-medium text-sm text-gray-400 mb-2">
                        {dia.dia_semana.slice(0, 3)}
                      </div>

                      {/* Fila 2: tarjeta del día */}
                      <div
                        className={`rounded-xl border px-4 py-5 text-center transition-all ${
                          estado === "success"
                            ? "bg-emerald-600/20 border-emerald-500/30 text-white hover:bg-emerald-600/30"
                            : estado === "partial"
                              ? "bg-orange-600/20 border-orange-500/30 text-white hover:bg-orange-600/30"
                              : estado === "failed"
                                ? "bg-red-600/20 border-red-500/30 text-white hover:bg-red-600/30"
                                : "bg-gray-800/60 border-white/10 text-gray-300 hover:bg-gray-800/80"
                          } ${
                            isToday 
                              ? "ring-2 ring-emerald-400 ring-offset-2 ring-offset-gray-900 shadow-lg shadow-emerald-500/20" 
                              : "hover:scale-105"
                          } transition-transform duration-200`}
                      >
                        <div
                          className={`text-2xl font-bold mb-2 ${
                            estado === "success"
                              ? "text-emerald-400"
                              : estado === "partial"
                                ? "text-orange-400"
                                : estado === "failed"
                                  ? "text-red-400"
                                  : "text-gray-400"
                          }`}
                        >
                          {dia.fecha.split('-')[2]}
                        </div>

                        <div className={`text-sm font-medium ${
                          isToday ? "text-white" : "text-gray-400"
                        }`}>
                          {habitosCompletados}/{totalHabitos}
                        </div>

                        <div className="mt-1 text-xs">
                          {estado === "success" && <span className="text-emerald-400">¡Completado!</span>}
                          {estado === "partial" && <span className="text-orange-400">{dia.pendientes === 0 ? "Completado parcialmente" : "En progreso"}</span>}
                          {estado === "failed" && <span className="text-red-400">Con fallos</span>}
                          {estado === "pending" && <span className="text-gray-400">Pendiente</span>}
                        </div>
                      </div>
                    </React.Fragment>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-4 text-gray-400">
                No hay datos de progreso semanal disponibles
              </div>
            )}
          </div>
        </SectionCard>

        <SectionCard title="Mejores Rachas Actuales">
          <div className="grid gap-3">
            {/* Top 3 con diseño destacado */}
            <div className="grid grid-cols-3 gap-2">
              {data.habitos
                .sort((a, b) => b.rachas.actual - a.rachas.actual)
                .slice(0, 3)
                .map((habito, index) => {
                  const positions = [
                    { bg: 'bg-gradient-to-b from-yellow-500/20 to-yellow-900/20', border: 'border-yellow-500/30', text: 'text-yellow-300' },
                    { bg: 'bg-gradient-to-b from-gray-400/20 to-gray-600/20', border: 'border-gray-400/30', text: 'text-gray-300' },
                    { bg: 'bg-gradient-to-b from-orange-700/20 to-orange-900/20', border: 'border-orange-700/30', text: 'text-orange-300' }
                  ];
                  return (
                    <div
                      key={habito.id}
                      className={`${positions[index].bg} border ${positions[index].border} rounded-lg p-3 flex flex-col items-center justify-between gap-2 transition-transform hover:scale-105`}
                    >
                      <div className="text-center">
                        <div className={`text-lg font-bold ${positions[index].text} flex items-center gap-1`}>
                          <Crown className={`h-4 w-4 ${index === 0 ? 'text-yellow-300' : 'hidden'}`} />
                          #{index + 1}
                        </div>
                        <div className="text-sm text-white font-medium truncate max-w-[120px]">{habito.titulo}</div>
                      </div>
                      <div className={`flex items-center gap-1 ${positions[index].text}`}>
                        <Flame className="h-5 w-5 animate-pulse" />
                        <span className="text-xl font-bold">{habito.rachas.actual}</span>
                      </div>
                      <div className="text-xs text-gray-400">Récord: {habito.rachas.mejor}</div>
                    </div>
                  );
                })}
            </div>

            {/* Lista del resto de hábitos con paginación */}
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-2">
                {data.habitos
                  .sort((a, b) => b.rachas.actual - a.rachas.actual)
                  .slice(3 + (currentPage - 1) * habitsPerPage, 3 + currentPage * habitsPerPage)
                  .map((habito) => (
                    <div
                      key={habito.id}
                      className="bg-gray-800/40 border border-white/5 rounded-lg p-2 flex items-center justify-between"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="text-sm text-white truncate">{habito.titulo}</div>
                        <div className="text-xs text-gray-400">{habito.tipo === 'hacer' ? 'Hacer' : 'Dejar'}</div>
                      </div>
                      <div className="flex items-center gap-1 text-orange-400/80 pl-2">
                        <Flame className="h-4 w-4" />
                        <span className="text-sm font-semibold">{habito.rachas.actual}</span>
                      </div>
                    </div>
                  ))}
              </div>
              
              {data.habitos.length > 7 && (
                <div className="flex items-center justify-end gap-2">
                  <button
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    disabled={currentPage === 1}
                    className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 bg-gray-800/60 text-sm text-gray-400 hover:bg-gray-700 hover:text-white disabled:opacity-50"
                  >
                    ←
                  </button>
                  <span className="text-sm text-gray-400">
                    Página {currentPage} de {Math.ceil((data.habitos.length - 3) / habitsPerPage)}
                  </span>
                  <button
                    onClick={() => setCurrentPage(prev => Math.min(Math.ceil((data.habitos.length - 3) / habitsPerPage), prev + 1))}
                    disabled={currentPage >= Math.ceil((data.habitos.length - 3) / habitsPerPage)}
                    className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 bg-gray-800/60 text-sm text-gray-400 hover:bg-gray-700 hover:text-white disabled:opacity-50"
                  >
                    →
                  </button>
                </div>
              )}
            </div>
          </div>
        </SectionCard>
      </div>

      {/* Actividad reciente */}
      <SectionCard title="Actividad Reciente" right={<span className="text-xs text-gray-400">Hoy</span>}>
        <ul className="space-y-2">
          {data.habitos
            .filter(habito => habito.registro_hoy.completado)
            .sort((a, b) => {
              // Convertir las horas a objetos Date para comparar
              const timeA = new Date(`${a.ultimo_registro.fecha} ${a.ultimo_registro.hora}`);
              const timeB = new Date(`${b.ultimo_registro.fecha} ${b.ultimo_registro.hora}`);
              return timeB.getTime() - timeA.getTime(); // Ordenar del más reciente al más antiguo
            })
            .map(habito => (
              <li key={habito.id} className="flex items-center justify-between rounded-lg border border-white/10 bg-gray-800/50 px-3 py-2">
                <div className="flex items-center gap-2">
                  <Dot className={`h-5 w-5 ${habito.registro_hoy.estado === 'exito' ? 'text-emerald-400' : 'text-red-400'
                    }`} />
                  <div>
                    <div className="text-sm text-white">{habito.titulo}</div>
                    <div className="text-xs text-gray-400">
                      {habito.tipo === 'hacer' ? 'Hacer' : 'Dejar'} · {habito.ultimo_registro.hora}
                      {habito.registro_hoy.comentario && (
                        <span className="ml-1 text-gray-500">- {habito.registro_hoy.comentario}</span>
                      )}
                    </div>
                  </div>
                </div>
                <span className={`rounded-full border px-2 py-0.5 text-xs ${habito.registro_hoy.estado === 'exito'
                    ? 'border-emerald-500/20 bg-emerald-500/10 text-emerald-300'
                    : 'border-red-500/20 bg-red-500/10 text-red-300'
                  }`}>
                  {habito.registro_hoy.estado === 'exito' ? 'Completado' : 'Fallado'}
                </span>
              </li>
            ))}
        </ul>
      </SectionCard>
    </div>
  );
};

export default Dashboard;
