import React from "react";
import { useNavigate } from "react-router-dom";
import { BadgeInfo, ArrowLeft, LineChart, Loader2 } from "lucide-react";
import { HabitType, useHabits } from "../../layouts/state/HabitsContext";
import { useSubscription } from "../../hooks/useSubscription";

const NuevaActividadPage: React.FC = () => {
  const navigate = useNavigate();
  const { habits, addHabit } = useHabits();
  const { subscription } = useSubscription();

  const [title, setTitle] = React.useState("");
  const [type, setType] = React.useState<HabitType>("hacer");
  const [error, setError] = React.useState<string | null>(null);
  const [isLoading, setIsLoading] = React.useState(false);

  const total = habits.length;
  const isPremium = subscription?.plan.codigo === 'premium';
  const maxHabits = subscription?.plan.max_habitos ?? 5;
  const percent = isPremium || maxHabits === null 
    ? 0 
    : Math.min(100, Math.round((total / maxHabits) * 100));
  const full = !isPremium && maxHabits !== null && total >= maxHabits;

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    const name = title.trim();
    if (!name) {
      setError("Escribe un título para tu hábito.");
      setIsLoading(false);
      return;
    }

    try {
      const res = await addHabit(name, type);
      if (!res.ok) {
        setError(res.reason === "limit" ? "Has alcanzado el límite de hábitos de tu plan." : "No se pudo crear el hábito.");
        setIsLoading(false);
        return;
      }
      navigate("/home");
    } catch (err) {
      setError("Ocurrió un error al crear el hábito. Por favor intenta de nuevo.");
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate(-1)}
          className="rounded-lg border border-white/10 bg-white/5 px-2.5 py-1.5 text-gray-300 hover:bg-white/10"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-white">Nueva Actividad</h1>
          <p className="text-gray-400">Crea un nuevo hábito para mejorar tu vida</p>
        </div>
      </div>

      {/* Card */}
      <form onSubmit={onSubmit} className="rounded-2xl border border-white/10 bg-gray-900/60 p-5 sm:p-6 space-y-6">
        {/* Plan + progreso */}
        <div className={`rounded-xl border p-3 ${
          isPremium 
            ? 'border-purple-500/30 bg-purple-500/10' 
            : 'border-blue-500/30 bg-blue-500/10'
        }`}>
          <div className="flex items-center justify-between text-sm">
            <span className={isPremium ? 'text-purple-200' : 'text-blue-200'}>
              Hábitos actuales: {total} {isPremium || maxHabits === null ? (
                <span className="text-purple-300">/ ∞</span>
              ) : (
                `/${maxHabits}`
              )}
            </span>
            <span className={`font-semibold ${
              isPremium ? 'text-purple-200' : 'text-blue-200'
            }`}>
              {subscription?.plan.nombre ?? 'Cargando...'}
            </span>
          </div>
          {(!isPremium && maxHabits !== null) && (
            <div className="mt-2 h-2 rounded-full bg-blue-900/40 overflow-hidden">
              <div
                className={`h-full bg-gradient-to-r ${
                  isPremium
                    ? 'from-purple-500 to-pink-400'
                    : 'from-blue-500 to-blue-400'
                }`}
                style={{ width: `${percent}%` }}
              />
            </div>
          )}
        </div>

        {/* Título */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">Título del hábito</label>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Ej. Leer 10 minutos, Ejercicio matutino, Meditar..."
            className="w-full rounded-lg border border-white/10 bg-gray-800 px-4 py-3 text-white placeholder:text-gray-500 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
          />
        </div>

        {/* Tipo de hábito */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-3">Tipo de hábito</label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setType("hacer")}
              className={`rounded-xl border p-4 text-left transition
                ${
                  type === "hacer"
                    ? "border-emerald-500 bg-emerald-500/10"
                    : "border-white/10 bg-white/5 hover:bg-white/10"
                }`}
            >
              <div className="flex items-center gap-2 text-emerald-300">
                <LineChart className="w-5 h-5" />
                <span className="font-semibold">Hacer</span>
              </div>
              <div className="text-gray-400 text-sm">Hábito a formar</div>
            </button>

            <button
              type="button"
              onClick={() => setType("dejar")}
              className={`rounded-xl border p-4 text-left transition
                ${
                  type === "dejar"
                    ? "border-rose-500 bg-rose-500/10"
                    : "border-white/10 bg-white/5 hover:bg-white/10"
                }`}
            >
              <div className="flex items-center gap-2 text-rose-300">
                <BadgeInfo className="w-5 h-5" />
                <span className="font-semibold">Dejar</span>
              </div>
              <div className="text-gray-400 text-sm">Hábito a evitar</div>
            </button>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-200">
            {error}
          </div>
        )}

        {/* Acciones */}
        <div className="flex flex-col sm:flex-row gap-3 sm:justify-end">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="rounded-lg border border-white/10 bg-white/5 px-4 py-2.5 text-gray-200 hover:bg-white/10"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={full || !title.trim() || isLoading}
            className={`rounded-lg px-4 py-2.5 font-semibold flex items-center justify-center gap-2
              ${
                full || !title.trim() || isLoading
                  ? "bg-emerald-600/40 text-white/70 cursor-not-allowed"
                  : "bg-emerald-600 hover:bg-emerald-700 text-white"
              }`}
          >
            {isLoading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              full ? `Límite alcanzado (${maxHabits})` : "Crear hábito"
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default NuevaActividadPage;
