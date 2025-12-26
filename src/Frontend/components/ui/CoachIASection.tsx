import React from "react";
import { Lightbulb, RotateCw, AlertCircle, Zap } from "lucide-react";
import ConsejoCard from "./ConsejoCard";
import { useCoachIA } from "../../hooks/useCoachIA";

const CoachIASection: React.FC = () => {
  const { consejos, loading, error, fecha, registrarInteraccion, recargarConsejos, actualizarConsejos } =
    useCoachIA();
  const [actualizando, setActualizando] = React.useState(false);

  const handleActualizarConsejos = async () => {
    setActualizando(true);
    try {
      await actualizarConsejos();
    } finally {
      setActualizando(false);
    }
  };

  const SkeletonLoader = () => (
    <div className="space-y-4">
      {[...Array(3)].map((_, i) => (
        <div key={i} className="rounded-xl border border-white/10 bg-gray-900/60 p-4 animate-pulse">
          <div className="h-6 bg-gray-700/50 rounded w-3/4 mb-3"></div>
          <div className="space-y-2">
            <div className="h-4 bg-gray-700/50 rounded w-full"></div>
            <div className="h-4 bg-gray-700/50 rounded w-5/6"></div>
          </div>
          <div className="flex gap-2 mt-4">
            <div className="h-8 bg-gray-700/50 rounded w-24"></div>
            <div className="h-8 bg-gray-700/50 rounded w-24"></div>
          </div>
        </div>
      ))}
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Lightbulb className="h-6 w-6 text-yellow-400" />
          <div>
            <h2 className="text-2xl font-bold text-white">Coach con IA</h2>
            <p className="text-sm text-gray-400">
              Consejos personalizados basados en tu progreso
            </p>
          </div>
        </div>

      </div>

      {/* Botones de Acción */}
      <div className="grid grid-cols-2 gap-2">
        <button
          onClick={handleActualizarConsejos}
          disabled={loading || actualizando}
          className="flex items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 disabled:opacity-50 disabled:cursor-not-allowed px-4 py-2 text-sm font-semibold text-white transition-colors"
          title="Generar nuevos consejos"
        >
          <Zap className={`h-4 w-4 ${actualizando ? "animate-pulse" : ""}`} />
          {actualizando ? "Generando..." : "Nuevo Consejo"}
        </button>

        <button
          onClick={recargarConsejos}
          disabled={loading || actualizando}
          className="flex items-center justify-center gap-2 rounded-lg bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed px-4 py-2 text-sm font-semibold text-white transition-colors"
          title="Recargar consejos"
        >
          <RotateCw className={`h-4 w-4 ${loading || actualizando ? "animate-spin" : ""}`} />
          {loading || actualizando ? "Cargando..." : "Recargar"}
        </button>
      </div>

      {/* Estado de carga - Skeleton */}
      {loading && !error && <SkeletonLoader />}

      {/* Mostrar error */}
      {error && (
        <div className="rounded-xl border border-red-400/20 bg-red-900/20 p-4 flex gap-3">
          <AlertCircle className="h-5 w-5 text-red-400 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="font-semibold text-red-300">Error al cargar los consejos</h3>
            <p className="text-sm text-red-200 mt-1">{error}</p>
          </div>
        </div>
      )}

      {/* Sin consejos */}
      {!loading && !error && consejos.length === 0 && (
        <div className="rounded-2xl border border-white/10 bg-gray-900/60 p-8 text-center">
          <Zap className="h-12 w-12 text-gray-500 mx-auto mb-4 opacity-50" />
          <p className="text-gray-400 mb-4">No hay consejos disponibles en este momento</p>
          <button
            onClick={recargarConsejos}
            className="inline-flex items-center gap-2 rounded-lg bg-blue-600 hover:bg-blue-700 px-4 py-2 text-sm font-semibold text-white transition-colors"
          >
            <RotateCw className="h-4 w-4" />
            Generar consejos
          </button>
        </div>
      )}

      {/* Mostrar consejos con paginación */}
      {!loading && consejos.length > 0 && (
        <>
          {/* Información de la fecha */}
          {fecha && (
            <div className="rounded-lg bg-blue-900/20 border border-blue-400/20 px-4 py-2">
              <p className="text-sm text-blue-300">
                Consejos generados para{" "}
                <span className="font-semibold">
                  {new Date(fecha + "T00:00:00").toLocaleDateString("es-ES", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </span>
              </p>
            </div>
          )}

          {/* Grid de consejos */}
          <div className="space-y-4">
            {consejos.map((consejo) => (
              <ConsejoCard
                key={consejo.id}
                consejo={consejo}
                onAccion={(accion) => registrarInteraccion(consejo.id, accion)}
              />
            ))}
          </div>

          {/* Resumen */}
          <div className="rounded-lg bg-gray-900/60 border border-white/10 p-4">
            <p className="text-sm text-gray-300">
              <span className="font-semibold">{consejos.length}</span> consejo
              {consejos.length !== 1 ? "s" : ""} disponible
              {consejos.length !== 1 ? "s" : ""} •{" "}
              <span className="font-semibold">
                {consejos.filter((c) => c.leido).length}
              </span>{" "}
              leído{consejos.filter((c) => c.leido).length !== 1 ? "s" : ""}
            </p>
          </div>
        </>
      )}

      {/* Información útil */}
      <div className="rounded-2xl border border-white/10 bg-gray-900/60 p-6">
        <h3 className="text-base font-semibold text-white mb-3">💡 Consejos del Coach</h3>
        <ul className="space-y-2 text-sm text-gray-300">
          <li className="flex gap-2">
            <span className="text-blue-400">•</span>
            <span>Los consejos se generan diariamente basándose en tu progreso</span>
          </li>
          <li className="flex gap-2">
            <span className="text-blue-400">•</span>
            <span>Marca los consejos como leídos para llevar un registro</span>
          </li>
          <li className="flex gap-2">
            <span className="text-blue-400">•</span>
            <span>Sigue los consejos que te ayuden a mejorar tus hábitos</span>
          </li>
          <li className="flex gap-2">
            <span className="text-blue-400">•</span>
            <span>Tus interacciones nos ayudan a personalizar mejor los consejos</span>
          </li>
        </ul>
      </div>
    </div>
  );
};

export default CoachIASection;
