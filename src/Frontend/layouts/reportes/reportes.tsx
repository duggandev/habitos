import React from "react";
import {
  BarChart3,
  TrendingUp,
  Activity,
} from "lucide-react";
import ActivityHeatmapComponent from "../../components/ui/ActivityHeatmapComponent";
import HabitTrendCard from "../../components/habits/HabitTrendCard";
import CoachIASection from "../../components/ui/CoachIASection";
import { useHabitStats } from "../../hooks/useHabitStats";

/* ---------- Página Reportes ---------- */

const Reportes: React.FC = () => {
  const { data, loading, error, getHabitoDetail } = useHabitStats();

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <BarChart3 className="h-5 w-5 text-blue-400" />
          <h1 className="text-3xl font-extrabold tracking-tight">Reportes</h1>
        </div>
      </div>

      {/* Mapa de Actividad - Activo */}
      <section className="space-y-3">
        <div className="flex items-center gap-2">
          <Activity className="h-5 w-5 text-green-400" />
          <h2 className="text-xl font-semibold text-white">Mapa de Actividad</h2>
        </div>
        {loading ? (
          <div className="rounded-2xl border border-white/10 bg-gray-900/60 p-6">
            <div className="space-y-4">
              {[...Array(7)].map((_, i) => (
                <div key={i} className="flex items-center gap-2">
                  <div className="h-4 bg-gray-700/50 rounded w-16 flex-shrink-0"></div>
                  <div className="flex gap-1 flex-wrap">
                    {[...Array(13)].map((_, j) => (
                      <div key={j} className="h-3 w-3 bg-gray-700/50 rounded animate-pulse"></div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="rounded-2xl border border-white/10 bg-gray-900/60 p-6 overflow-x-auto" style={{ direction: 'rtl' }}>
            <div style={{ direction: 'ltr' }}>
              <ActivityHeatmapComponent hideLoadingState={true} />
            </div>
          </div>
        )}
      </section>

      {/* Tendencia de Hábitos - Activo */}
      <section className="space-y-3">
        <div className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-blue-400" />
          <h2 className="text-xl font-semibold text-white">Tendencia de Hábitos</h2>
        </div>

        {loading ? (
          <>
            {/* Skeleton Resumen */}
            <div className="grid grid-cols-2 lg:grid-cols-2 gap-3">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="rounded-xl border border-white/10 bg-gray-900/60 p-4 animate-pulse">
                  <div className="h-3 bg-gray-700/50 rounded w-24 mb-2"></div>
                  <div className="h-8 bg-gray-700/50 rounded w-12"></div>
                </div>
              ))}
            </div>
            {/* Skeleton Lista de Hábitos */}
            <div className="space-y-3">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="rounded-xl border border-white/10 bg-gray-900/60 p-4 animate-pulse">
                  <div className="h-4 bg-gray-700/50 rounded w-1/3 mb-3"></div>
                  <div className="space-y-2">
                    <div className="h-3 bg-gray-700/50 rounded w-full"></div>
                    <div className="h-3 bg-gray-700/50 rounded w-5/6"></div>
                  </div>
                  <div className="flex gap-2 mt-4">
                    <div className="h-8 bg-gray-700/50 rounded w-20"></div>
                    <div className="h-8 bg-gray-700/50 rounded w-20"></div>
                  </div>
                </div>
              ))}
            </div>
          </>
        ) : error ? (
          <div className="rounded-2xl border border-red-400/20 bg-red-900/20 p-6">
            <p className="text-sm text-red-300">{error}</p>
          </div>
        ) : !data || data.habitos.length === 0 ? (
          <div className="rounded-2xl border border-white/10 bg-gray-900/60 p-6 text-center">
            <p className="text-gray-400">
              Aún no tienes hábitos. Crea uno para empezar a registrar tu progreso.
            </p>
          </div>
        ) : (
          <>
            {/* Resumen General */}
            {data.resumen_general && (
              <div className="grid grid-cols-2 lg:grid-cols-2 gap-3">
                <div className="rounded-xl border border-white/10 bg-gray-900/60 p-4">
                  <div className="text-xs text-gray-400 mb-1">Total de Hábitos</div>
                  <div className="text-2xl font-bold text-white">
                    {data.resumen_general.total_habitos}
                  </div>
                </div>

                <div className="rounded-xl border border-white/10 bg-gray-900/60 p-4">
                  <div className="text-xs text-gray-400 mb-1">En Racha</div>
                  <div className="text-2xl font-bold text-orange-400">
                    {data.resumen_general.habitos_activos_con_racha}
                  </div>
                </div>

                <div className="rounded-xl border border-white/10 bg-gray-900/60 p-4">
                  <div className="text-xs text-gray-400 mb-1">Tasa de Éxito Promedio</div>
                  <div className="text-2xl font-bold text-green-400">
                    {data.resumen_general.estadisticas.tasa_exito_promedio.toFixed(0)}%
                  </div>
                </div>

                <div className="rounded-xl border border-white/10 bg-gray-900/60 p-4">
                  <div className="text-xs text-gray-400 mb-1">Total Registros</div>
                  <div className="text-2xl font-bold text-blue-400">
                    {data.resumen_general.estadisticas.total_registros}
                  </div>
                </div>
              </div>
            )}

            {/* Lista de Hábitos */}
            <div className="space-y-3">
              {data.habitos.map((habito) => (
                <HabitTrendCard
                  key={habito.id}
                  habito={habito}
                  onGetDetails={getHabitoDetail}
                />
              ))}
            </div>
          </>
        )}
      </section>
      {/* Coach con IA - Activo */}
      <section className="space-y-3">
        <CoachIASection />
      </section>
    </div>
  );
};

export default Reportes;
