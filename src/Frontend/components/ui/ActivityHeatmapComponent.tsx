import React, { useMemo } from "react";
import { Loader2 } from "lucide-react";
import { useActivityHeatmap } from "../../hooks/useActivityHeatmap";

const DAYS_OF_WEEK = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];

const getActivityColor = (value: string | number): string => {
  const numValue = parseInt(String(value), 10);

  if (numValue === 0) return "bg-gray-700/40";
  if (numValue === 1) return "bg-green-900/60";
  if (numValue === 2) return "bg-green-700/80";
  if (numValue >= 3) return "bg-green-500/90";

  return "bg-gray-700/40";
};

const StatCard: React.FC<{ label: string; value: string | number }> = ({ label, value }) => (
  <div className="flex flex-col rounded-lg border border-white/10 bg-white/5 px-3 py-2">
    <span className="text-xs text-gray-400">{label}</span>
    <span className="text-lg font-semibold text-white">{value}</span>
  </div>
);

const ActivityHeatmapComponent: React.FC<{ hideLoadingState?: boolean }> = ({ hideLoadingState = false }) => {
  const { data, loading, error } = useActivityHeatmap();
  const scrollContainerRef = React.useRef<HTMLDivElement>(null);

  // Hacer scroll a la derecha cuando los datos se cargan
  React.useEffect(() => {
    if (scrollContainerRef.current && data?.heatmap && !loading) {
      setTimeout(() => {
        if (scrollContainerRef.current) {
          scrollContainerRef.current.scrollLeft = scrollContainerRef.current.scrollWidth;
        }
      }, 100);
    }
  }, [data, loading]);

  const { weeks } = useMemo(() => {
    if (!data?.heatmap) return { weeks: [] };

    const allWeeks = data.heatmap;

    return {
      weeks: allWeeks,
    };
  }, [data]);

  if (loading && !hideLoadingState) {
    return (
      <div className="flex items-center justify-center rounded-lg border border-white/10 bg-white/5 p-8">
        <Loader2 className="h-6 w-6 animate-spin text-blue-400" />
        <span className="ml-2 text-sm text-gray-300">Cargando mapa de actividad...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-4">
        <p className="text-sm text-red-300">Error: {error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Estadísticas */}
      {data?.estadisticas && (
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
          <StatCard label="Días activos" value={data.estadisticas.dias_con_actividad} />
          <StatCard label="Total de éxitos" value={data.estadisticas.total_exitos} />
          <StatCard
            label="Actividad %"
            value={`${(data.estadisticas.porcentaje_actividad * 100).toFixed(1)}%`}
          />
          <StatCard label="Promedio diario" value={data.estadisticas.promedio_diario} />
          <StatCard label="Mejor día" value={DAYS_OF_WEEK[parseInt(data.estadisticas.mejor_dia, 10)]} />
          <StatCard label="Total días" value={data.estadisticas.total_dias} />
        </div>
      )}

      {/* Heatmap - Estilo GitHub */}
      <div 
        ref={scrollContainerRef}
        className="overflow-x-auto rounded-lg border border-white/10 bg-gray-950/40 p-4"
      >
        <div className="inline-block min-w-full">
          {/* Encabezados de meses */}
          <div className="mb-3 flex pl-8 text-[10px] font-medium text-gray-500">
            {weeks.map((week, idx) => {
              const firstDay = week.days[0];
              const date = new Date(firstDay.date);
              const isFirstWeekOfMonth = idx === 0 || new Date(weeks[idx - 1].days[0].date).getMonth() !== date.getMonth();

              if (!isFirstWeekOfMonth) return null;

              return (
                <span key={`month-${week.week_index}`} className="mr-10">
                  {date.toLocaleString("en-US", { month: "short" })}
                </span>
              );
            })}
          </div>

          {/* Grid de actividad */}
          <div className="flex gap-1">
            {/* Días de semana */}
            <div className="flex flex-col justify-between">
              {[0, 2, 4].map((dayIdx) => (
                <div key={`day-${dayIdx}`} className="h-3 text-[10px] font-medium text-gray-500">
                  {DAYS_OF_WEEK[dayIdx]}
                </div>
              ))}
            </div>

            {/* Semanas y días */}
            <div className="flex gap-0.5">
              {weeks.map((week) => (
                <div key={week.week_index} className="flex flex-col gap-0.5">
                  {week.days.map((day) => (
                    <div
                      key={day.date}
                      className={`h-3 w-3 rounded-[2px] transition-all hover:ring-1 hover:ring-blue-300 ${getActivityColor(day.value)} cursor-pointer`}
                      title={`${day.date}: ${day.value} actividad${parseInt(day.value, 10) !== 1 ? "s" : ""}`}
                    />
                  ))}
                </div>
              ))}
            </div>
          </div>

          {/* Leyenda */}
          <div className="mt-4 flex items-center gap-2 pl-8 text-[10px]">
            <span className="text-gray-500">Less</span>
            <div className="flex gap-0.5">
              <div className="h-2 w-2 rounded-[2px] bg-gray-700/40" />
              <div className="h-2 w-2 rounded-[2px] bg-green-900/60" />
              <div className="h-2 w-2 rounded-[2px] bg-green-700/80" />
              <div className="h-2 w-2 rounded-[2px] bg-green-500/90" />
            </div>
            <span className="text-gray-500">More</span>
          </div>
        </div>
      </div>

      {/* Rango de fechas */}
      {data?.rango_fechas && (
        <div className="text-center text-xs text-gray-500">
          {data.rango_fechas.inicio} — {data.rango_fechas.fin}
        </div>
      )}
    </div>
  );
};

export default ActivityHeatmapComponent;
