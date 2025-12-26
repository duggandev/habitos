import React, { useState } from "react";
import {
  TrendingUp,
  CheckCircle,
  XCircle,
  Flame,
  Calendar,
  Users,
  ChevronDown,
  Loader,
} from "lucide-react";
import { Habito, HabitoDetalleResponse } from "../../hooks/useHabitStats";

interface HabitTrendProps {
  habito: Habito;
  onGetDetails?: (habitoId: string) => Promise<HabitoDetalleResponse | null>;
}

const HabitTrendCard: React.FC<HabitTrendProps> = ({ habito, onGetDetails }) => {
  const [expanded, setExpanded] = useState(false);
  const [detalle, setDetalle] = useState<HabitoDetalleResponse | null>(null);
  const [loadingDetalle, setLoadingDetalle] = useState(false);

  const handleExpandClick = async () => {
    if (!expanded && !detalle && onGetDetails) {
      setLoadingDetalle(true);
      try {
        const result = await onGetDetails(habito.id);
        setDetalle(result);
      } finally {
        setLoadingDetalle(false);
      }
    }
    setExpanded(!expanded);
  };

  const successRate = habito.estadisticas.tasa_exito;
  const successColor =
    successRate >= 80
      ? "text-green-400"
      : successRate >= 50
        ? "text-yellow-400"
        : "text-red-400";

  const successBgColor =
    successRate >= 80
      ? "bg-green-900/20"
      : successRate >= 50
        ? "bg-yellow-900/20"
        : "bg-red-900/20";

  return (
    <div className="rounded-xl border border-white/10 bg-gray-900/60 overflow-hidden transition-all hover:border-white/20">
      {/* Encabezado clickeable */}
      <button
        onClick={handleExpandClick}
        className="w-full px-4 py-4 flex items-start justify-between hover:bg-white/5 transition-colors"
      >
        <div className="flex-1 text-left">
          <div className="flex items-center gap-2 mb-2">
            <h3 className="text-base font-semibold text-white">{habito.titulo}</h3>
            {habito.es_grupal && (
              <span className="flex items-center gap-1 rounded-full border border-blue-400/30 bg-blue-500/10 px-2 py-0.5 text-xs font-medium text-blue-200">
                <Users className="h-3 w-3" />
                Grupal
              </span>
            )}
            <span
              className={`text-xs font-semibold px-2 py-1 rounded-full ${
                habito.tipo === "hacer"
                  ? "bg-emerald-900/20 text-emerald-300"
                  : "bg-purple-900/20 text-purple-300"
              }`}
            >
              {habito.tipo === "hacer" ? "Hacer" : "Dejar"}
            </span>
          </div>

          <div className="flex flex-wrap gap-3 text-sm">
            {/* Tasa de éxito */}
            <div className="flex items-center gap-1">
              <div className={`w-20 h-6 rounded ${successBgColor} flex items-center justify-center`}>
                <span className={`text-xs font-bold ${successColor}`}>
                  {successRate.toFixed(0)}%
                </span>
              </div>
            </div>

            {/* Racha */}
            <div className="flex items-center gap-1 text-orange-300">
              <Flame className="h-4 w-4" />
              <span className="font-semibold">{habito.rachas.actual}</span>
            </div>

            {/* Mejor racha */}
            <div className="flex items-center gap-1 text-blue-300">
              <TrendingUp className="h-4 w-4" />
              <span className="font-semibold">{habito.rachas.mejor}</span>
            </div>

            {/* Registros */}
            <div className="flex items-center gap-1 text-gray-400 text-xs">
              <Calendar className="h-4 w-4" />
              {habito.estadisticas.total_registros} registros
            </div>
          </div>
        </div>

        <ChevronDown
          className={`h-5 w-5 text-gray-400 transition-transform ${
            expanded ? "rotate-180" : ""
          }`}
        />
      </button>

      {/* Contenido expandible */}
      {expanded && (
        <div className="border-t border-white/10 px-4 py-4 space-y-4 bg-black/20">
          {loadingDetalle ? (
            <div className="flex items-center justify-center py-8">
              <Loader className="h-5 w-5 text-blue-400 animate-spin" />
            </div>
          ) : (
            <>
              {/* Estadísticas detalladas */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="rounded-lg bg-white/5 p-3 text-center">
                  <div className="text-xs text-gray-400 mb-1">Éxitos</div>
                  <div className="flex items-center justify-center gap-1">
                    <CheckCircle className="h-4 w-4 text-green-400" />
                    <span className="text-lg font-bold text-green-400">
                      {habito.estadisticas.total_exitos}
                    </span>
                  </div>
                </div>

                <div className="rounded-lg bg-white/5 p-3 text-center">
                  <div className="text-xs text-gray-400 mb-1">Fallos</div>
                  <div className="flex items-center justify-center gap-1">
                    <XCircle className="h-4 w-4 text-red-400" />
                    <span className="text-lg font-bold text-red-400">
                      {habito.estadisticas.total_fallos}
                    </span>
                  </div>
                </div>

                <div className="rounded-lg bg-white/5 p-3 text-center">
                  <div className="text-xs text-gray-400 mb-1">Racha Act.</div>
                  <div className="flex items-center justify-center gap-1">
                    <Flame className="h-4 w-4 text-orange-400" />
                    <span className="text-lg font-bold text-orange-400">
                      {habito.rachas.actual}
                    </span>
                  </div>
                </div>

                <div className="rounded-lg bg-white/5 p-3 text-center">
                  <div className="text-xs text-gray-400 mb-1">Mejor Racha</div>
                  <div className="flex items-center justify-center gap-1">
                    <TrendingUp className="h-4 w-4 text-blue-400" />
                    <span className="text-lg font-bold text-blue-400">
                      {habito.rachas.mejor}
                    </span>
                  </div>
                </div>
              </div>

              {/* Grupo si es grupal */}
              {habito.es_grupal && habito.grupo && (
                <div className="rounded-lg bg-blue-900/20 border border-blue-400/20 p-3">
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-blue-400" />
                    <div>
                      <div className="text-xs text-gray-400">Grupo</div>
                      <div className="text-sm font-semibold text-blue-200">
                        {habito.grupo.nombre}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Registros recientes */}
              {habito.registros_recientes && habito.registros_recientes.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-xs font-semibold text-gray-300 uppercase tracking-wide">
                    Registros Recientes
                  </h4>
                  <div className="space-y-2 max-h-40 overflow-y-auto">
                    {habito.registros_recientes.map((registro) => (
                      <div
                        key={registro.id}
                        className="flex items-start gap-2 rounded-lg bg-white/5 p-2 text-sm"
                      >
                        {registro.estado === "exito" ? (
                          <CheckCircle className="h-4 w-4 text-green-400 flex-shrink-0 mt-0.5" />
                        ) : (
                          <XCircle className="h-4 w-4 text-red-400 flex-shrink-0 mt-0.5" />
                        )}
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <span
                              className={
                                registro.estado === "exito"
                                  ? "text-green-300"
                                  : "text-red-300"
                              }
                            >
                              {registro.estado === "exito" ? "Éxito" : "Fallo"}
                            </span>
                            <span className="text-xs text-gray-500">
                              {new Date(registro.fecha).toLocaleDateString("es-ES")}
                            </span>
                          </div>
                          {registro.comentario && (
                            <p className="text-xs text-gray-400 mt-1 italic">
                              "{registro.comentario}"
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default HabitTrendCard;
