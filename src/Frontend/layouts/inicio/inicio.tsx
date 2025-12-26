import React from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "@clerk/clerk-react";
import {
  Check,
  X,
  Flame,
  Plus,
  Trash2,
  MoreVertical,
  Loader2,
  Lock,
  Clock,
  Edit,
  Users,
  Sparkles,
} from "lucide-react";
import { useHabits, Habit as HabitBase } from "../state/HabitsContext";
import NuevoRegistroHabito from "../../components/modals/NuevoRegistroHabito";
import StreakAnimation from "../../components/ui/StreakAnimation";
import EditarHabitoModal from "../../components/modals/EditarHabitoModal";
import { useSubscription } from "../state/SubscriptionContext";

type HabitType = "hacer" | "dejar" | "grupal";
type Habit = Omit<HabitBase, "tipo"> & { tipo: HabitType; disponibleEn?: string };

type TabKey = "hacer" | "dejar" | "grupal";

const labelMap: Record<TabKey, string> = {
  hacer: "Hacer",
  dejar: "Dejar",
  grupal: "Grupales",
};

interface IASuggestions {
  dejar: string[];
  hacer: string[];
}

/* Modal de confirmación genérico */
function ConfirmDialog({
  open,
  title,
  message,
  confirmText = "Eliminar",
  onClose,
  onConfirm,
}: {
  open: boolean;
  title: string;
  message: string;
  confirmText?: string;
  onClose: () => void;
  onConfirm: () => Promise<void>;
}) {
  const [isLoading, setIsLoading] = React.useState(false);

  if (!open) return null;

  const handleConfirm = async () => {
    try {
      setIsLoading(true);
      await onConfirm();
    } catch (error) {
      console.error('Error en confirmación:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      <div className="relative w-full max-w-md rounded-2xl border border-white/10 bg-gray-900 p-6 shadow-xl">
        <h3 className="text-xl font-semibold text-white">{title}</h3>
        <p className="mt-2 text-gray-300">{message}</p>
        <div className="mt-6 flex justify-end gap-3">
          <button
            onClick={onClose}
            disabled={isLoading}
            className="rounded-lg border border-white/15 bg-white/5 px-4 py-2 text-sm text-gray-200 hover:bg-white/10 disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            onClick={handleConfirm}
            disabled={isLoading}
            className="inline-flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-50"
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Trash2 className="h-4 w-4" />
            )}
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}

/* Tarjeta de hábito con menú de 3 puntos */
const HabitCard = ({
  habit,
  onDone,
  onFail,
  onRequestDelete,
  onRequestEdit,
}: {
  habit: Habit;
  onDone: (comentario?: string) => Promise<void>;
  onFail: (comentario?: string) => Promise<void>;
  onRequestDelete: () => Promise<void>;
  onRequestEdit: (newTitle: string) => Promise<void>;
}) => {
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = React.useState(false);
  const [registroOpen, setRegistroOpen] = React.useState(false);
  const [editModalOpen, setEditModalOpen] = React.useState(false);

  const [showAnimation, setShowAnimation] = React.useState(false);
  const [animationStreak, setAnimationStreak] = React.useState<number>(habit.rachas?.actual || 0);
  const [isFirstTimeForAnimation, setIsFirstTimeForAnimation] = React.useState<boolean>((habit.rachas?.actual || 0) === 0);

  const [isLoading, setIsLoading] = React.useState(false);
  const ref = React.useRef<HTMLDivElement | null>(null);

  // cerrar el menú al hacer click fuera
  React.useEffect(() => {
    const onDocClick = (e: MouseEvent) => {
      if (!ref.current) return;
      if (!ref.current.contains(e.target as Node)) {
        // Añadimos un pequeño retraso para permitir que los clics se registren correctamente
        setTimeout(() => {
          setMenuOpen(false);
        }, 100);
      }
    };
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  // si cambia la racha del habit por re-render, ajusta baseline
  React.useEffect(() => {
    const s = habit.rachas?.actual || 0;
    setAnimationStreak(s);
    setIsFirstTimeForAnimation(s === 0);
  }, [habit.rachas?.actual]);

  const currentStreak = habit.rachas?.actual || 0;

  return (
    <div
      className="relative rounded-xl border border-white/10 bg-gray-900/60 p-4 sm:p-5"
      ref={ref}
    >
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs ${
            habit.es_grupal
              ? "bg-blue-500/10 text-blue-300 border border-blue-500/20"
              : habit.tipo === "hacer"
                ? "bg-emerald-500/10 text-emerald-300 border border-emerald-500/20"
                : "bg-purple-500/10 text-purple-300 border border-purple-500/20"
          }`}>
            {habit.es_grupal ? "Grupal" : habit.tipo === "hacer" ? "Hacer" : "Dejar"}
          </span>
          {habit.es_grupal && habit.grupo && (
            <span className="inline-flex items-center gap-1 text-xs text-blue-300">
              <Users className="h-3 w-3" />
              {habit.grupo.nombre}
            </span>
          )}
        </div>

        <button
          onClick={() => setMenuOpen((v) => !v)}
          aria-haspopup="menu"
          aria-expanded={menuOpen}
          className="rounded-full p-1.5 text-gray-300 hover:bg-white/10 hover:text-white"
          title="Opciones"
        >
          <MoreVertical className="h-5 w-5" />
        </button>

        {menuOpen && (
          <div
            role="menu"
            className="absolute right-2 top-10 z-50 w-44 overflow-hidden rounded-xl border border-white/10 bg-gray-900 p-1 shadow-lg"
          >
            <button
              onClick={async () => {
                try {
                  setIsLoading(true);
                  setMenuOpen(false);
                  await onRequestDelete();
                } catch (error) {
                  console.error('Error al eliminar:', error);
                } finally {
                  setIsLoading(false);
                }
              }}
              disabled={isLoading}
              className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-red-300 hover:bg-red-500/10 disabled:opacity-50"
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Trash2 className="h-4 w-4" />
              )}
              Eliminar
            </button>
            <button
              onClick={() => {
                setMenuOpen(false);
                setEditModalOpen(true);
              }}
              className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-blue-300 hover:bg-blue-500/10"
            >
              <Edit className="h-4 w-4" />
              Editar
            </button>
          </div>
        )}
      </div>

      <button 
        onClick={() => navigate(habit.es_grupal 
          ? `/dashboard/grupal/habit/${habit.id}` 
          : `/home/habit/${habit.id}`)}
        className="group block w-full text-left"
      >
        <h3 className="text-lg font-semibold text-white transition-colors group-hover:text-blue-400">
          {habit.titulo}
        </h3>

        <div className="mt-2 flex items-center gap-3 text-sm text-gray-400">
          <div className="inline-flex items-center gap-1">
            <Flame className="h-4 w-4 text-orange-400" />
            <span className="font-medium text-orange-300">
              {currentStreak} días
            </span>
          </div>
          <span>Mejor: {habit.rachas?.mejor || 0} días</span>
        </div>
      </button>

      <div className="mt-4">
        {habit.registro_hoy ? (
          <div className="space-y-2">
            <div className="flex items-center gap-4">
              {habit.registro_hoy.completado ? (
                <>
                  <div className={`inline-flex items-center gap-2 rounded-lg border px-3 py-1.5 text-sm ${
                    habit.registro_hoy.estado === 'exito'
                      ? 'border-emerald-500/20 bg-emerald-500/10 text-emerald-300'
                      : 'border-red-500/20 bg-red-500/10 text-red-300'
                  }`}>
                    {habit.registro_hoy.estado === 'exito' ? (
                      <Check className="h-4 w-4" />
                    ) : (
                      <X className="h-4 w-4" />
                    )}
                    {habit.registro_hoy.estado === 'exito' ? 'Completado hoy' : 'Registrado hoy'}
                  </div>
                  <button
                    onClick={() => {
                      // Vista manual: animación con la racha actual
                      setAnimationStreak(currentStreak);
                      setIsFirstTimeForAnimation(currentStreak === 0);
                      setShowAnimation(true);
                    }}
                    className="mr-2 rounded-full p-2.5 text-orange-300 transition-colors hover:bg-orange-600/20 hover:text-orange-200"
                    title="Ver racha actual"
                  >
                    <Flame className="h-5 w-5" />
                  </button>
                </>
              ) : (
                <button
                  onClick={() => setRegistroOpen(true)}
                  className="inline-flex items-center gap-2 rounded-lg border border-white/10 bg-gray-700/50 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-gray-600 shadow-sm shadow-black/10"
                >
                  <Plus className="h-4 w-4" />
                  Registrar
                </button>
              )}
            </div>
            {habit.registro_hoy.comentario && (
              <div className="rounded-lg border border-white/10 bg-white/5 p-3 text-sm text-gray-300">
                {habit.registro_hoy.comentario}
              </div>
            )}
          </div>
        ) : (
          <div className="flex flex-wrap gap-3">
            {habit.disponibleEn ? (
              <div className="inline-flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-sm text-gray-400">
                <Clock className="h-4 w-4" />
                <span>Disponible {habit.disponibleEn}</span>
              </div>
            ) : (
              <button
                onClick={() => setRegistroOpen(true)}
                disabled={isLoading}
                className="inline-flex items-center gap-2 rounded-lg bg-gray-600 px-4 py-2 font-semibold text-white hover:bg-gray-700 disabled:opacity-50"
              >
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Plus className="h-4 w-4" />
                )}
                Registrar
              </button>
            )}
          </div>
        )}
      </div>

      <NuevoRegistroHabito
        isOpen={registroOpen}
        onClose={() => setRegistroOpen(false)}
        habitId={habit.id}
        habitType={habit.tipo === "grupal" ? "hacer" : habit.tipo}
        habitTitle={habit.titulo}
        onSuccess={async (comentario) => {
          try {
            // 1) Llamamos al endpoint y esperamos confirmación
            await onDone(comentario);

            // 2) Cerramos el modal antes de mostrar la animación
            setRegistroOpen(false);

            // 3) Lanzamos animación con racha +1 (baseline del cierre)
            const nextStreak = (habit.rachas?.actual || 0) + 1;
            setAnimationStreak(nextStreak);
            setIsFirstTimeForAnimation((habit.rachas?.actual || 0) === 0);
            setShowAnimation(true);

            // El estado global refrescará la tarjeta luego
          } catch (error) {
            console.error('❌ Error post-registro (success):', error);
          }
        }}
        onFail={async (comentario) => {
          try {
            await onFail(comentario);
            setRegistroOpen(false);
          } catch (error) {
            console.error('❌ Error post-registro (fail):', error);
          }
        }}
      />

      {showAnimation && (
        <StreakAnimation
          streak={animationStreak}
          isFirstTime={isFirstTimeForAnimation}
          onClose={() => {
            setShowAnimation(false);
          }}
        />
      )}

      <EditarHabitoModal
        isOpen={editModalOpen}
        onClose={() => setEditModalOpen(false)}
        habitId={habit.id}
        currentTitle={habit.titulo}
        onSave={async (newTitle) => {
          try {
            await onRequestEdit(newTitle);
          } catch (error) {
            console.error('Error al editar hábito:', error);
          }
        }}
      />
    </div>
  );
};

const EmptyState = ({
  isLoading = false,
  error = null,
}: {
  isLoading?: boolean;
  error?: string | null;
}) => (
  <div className="col-span-full rounded-2xl border border-white/10 bg-gray-900/40 p-10 text-center">
    <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-white/10 text-white">
      {isLoading ? (
        <Loader2 className="h-6 w-6 animate-spin" />
      ) : error ? (
        <X className="h-6 w-6 text-red-400" />
      ) : (
        <Flame className="h-6 w-6" />
      )}
    </div>
    <h3 className="text-lg font-semibold text-white">
      {isLoading ? "Cargando hábitos..." :
       error ? "Error al cargar hábitos" :
       "No hay hábitos que mostrar"}
    </h3>
    <p className="mt-1 text-gray-400">
      {error ? error :
       !isLoading ? "Crea tu primer hábito con el botón verde de la esquina." :
       "Por favor espera mientras cargamos tus hábitos."}
    </p>
  </div>
);

const TabsPill = ({
  active,
  counts,
  onChange}: {
  active: TabKey;
  counts: Record<TabKey, number>;
  onChange: (tab: TabKey) => void;
  isPremium: boolean;
}) => (
  <div className="rounded-2xl border border-white/10 bg-gray-800/60 p-1">
    <div className="grid grid-cols-3 gap-1">
      {(Object.keys(labelMap) as TabKey[]).map((key) => {
        return (
          <button
            key={key}
            onClick={() => onChange(key)}
            className={`rounded-xl py-3 text-center font-semibold transition relative
              ${
                active === key
                  ? "bg-gray-900 text-emerald-300 shadow-inner"
                  : "text-gray-300 hover:bg-white/5 hover:text-white"
              }`}
          >
            <div className="inline-flex items-center justify-center gap-2">
              {labelMap[key]} ({counts[key]})
            </div>
          </button>
        );
      })}
    </div>
  </div>
);

const Inicio: React.FC = () => {
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const { habits, markDone, markFail, removeHabit, editHabit, isLoading, error } = useHabits();
  const { subscription } = useSubscription();

  const [habitToDelete, setHabitToDelete] = React.useState<Habit | null>(null);
  const initialTab = (params.get("tab") as TabKey) || "hacer";
  const [activeTab, setActiveTab] = React.useState<TabKey>(initialTab);
  
  const [isIAModalOpen, setIsIAModalOpen] = React.useState(false);
  const [iaInput, setIaInput] = React.useState("");
  const [iaLoading, setIaLoading] = React.useState(false);
  const [iaSuggestions, setIaSuggestions] = React.useState<IASuggestions | null>(null);
  const [iaError, setIaError] = React.useState<string | null>(null);
  const [selectedHabits, setSelectedHabits] = React.useState<{ hacer: boolean[]; dejar: boolean[] }>({ hacer: [], dejar: [] });
  const [bulkLoading, setBulkLoading] = React.useState(false);
  const [bulkSuccess, setBulkSuccess] = React.useState<string | null>(null);
  
  const isPremium = !!subscription?.plan?.permite_grupos;

  React.useEffect(() => {
    setParams((p) => {
      if (activeTab === "hacer") {
        p.delete("tab");
      } else {
        p.set("tab", activeTab);
      }
      return p;
    });
  }, [activeTab, setParams]);

  const counts: Record<TabKey, number> = {
    hacer: (habits as Habit[]).filter((h) => h.tipo === "hacer" && !h.es_grupal).length,
    dejar: (habits as Habit[]).filter((h) => h.tipo === "dejar" && !h.es_grupal).length,
    grupal: (habits as Habit[]).filter((h) => h.es_grupal).length,
  };

  const { getToken } = useAuth();

  const handleIASuggestions = async () => {
    if (!iaInput.trim()) return;

    setIaLoading(true);
    setIaError(null);
    try {
      const token = await getToken();
      if (!token) throw new Error('No hay token de autenticación');

      const response = await fetch(`${import.meta.env.VITE_API}/ia-coach/sugerencias-habitos`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ input_usuario: iaInput.trim() })
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Error al obtener sugerencias');
      }

      if (result.success && result.data) {
        setIaSuggestions(result.data);
        // Inicializar checkboxes en false
        setSelectedHabits({
          hacer: new Array(result.data.hacer.length).fill(false),
          dejar: new Array(result.data.dejar.length).fill(false)
        });
      } else {
        throw new Error('Respuesta inválida del servidor');
      }
    } catch (err) {
      setIaError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setIaLoading(false);
    }
  };

  const handleBulkRegister = async () => {
    if (!iaSuggestions) return;

    const selectedHacer = iaSuggestions.hacer.filter((_, index) => selectedHabits.hacer[index]);
    const selectedDejar = iaSuggestions.dejar.filter((_, index) => selectedHabits.dejar[index]);

    if (selectedHacer.length === 0 && selectedDejar.length === 0) {
      setIaError('Selecciona al menos un hábito para registrar');
      return;
    }

    setBulkLoading(true);
    setIaError(null);
    setBulkSuccess(null);

    try {
      const token = await getToken();
      if (!token) throw new Error('No hay token de autenticación');

      const response = await fetch(`${import.meta.env.VITE_API}/habits/bulk`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          hacer: selectedHacer,
          dejar: selectedDejar
        })
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Error al registrar hábitos');
      }

      if (result.success) {
        setBulkSuccess(result.message);
        // Refrescar hábitos después de un delay
        setTimeout(() => {
          window.location.reload(); // O usar el contexto para refrescar
        }, 2000);
      } else {
        throw new Error('Error en la respuesta del servidor');
      }
    } catch (err) {
      setIaError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setBulkLoading(false);
    }
  };

  const resetIAModal = () => {
    setIaInput("");
    setIaSuggestions(null);
    setIaError(null);
    setSelectedHabits({ hacer: [], dejar: [] });
    setBulkSuccess(null);
    setIsIAModalOpen(false);
  };

  // Filtramos según la tab activa
  const filtered = (habits as Habit[]).filter((h) => {
    if (activeTab === 'grupal') {
      return h.es_grupal;
    } else {
      return h.tipo === activeTab && !h.es_grupal;
    }
  });

  // 👇 Solo mostramos estado de "cargando" si todavía no tenemos datos
  const showInitialLoading = isLoading && habits.length === 0;

  return (
    <div className="space-y-6 pb-20 md:pb-0 max-w-full overflow-x-hidden">
      <div className="space-y-4 w-full">
        <div className="flex items-center justify-between w-full">
          <h1 className="text-2xl font-semibold text-white sm:text-3xl">
            Mis Hábitos
          </h1>
          <div className="flex gap-2">
            <button
              onClick={() => isPremium ? navigate("/home/grupal") : null}
              disabled={isLoading || !isPremium}
              className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 font-semibold text-white transition-colors relative group ${
                isPremium 
                  ? "bg-blue-600 hover:bg-blue-700" 
                  : "bg-gray-600 cursor-not-allowed opacity-75"
              } disabled:opacity-50`}
              title={!isPremium ? "Solo disponible para usuarios premium" : ""}
            >
              {isLoading ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <Users className="h-5 w-5" />
              )}
              Grupal
              {!isPremium && <Lock className="h-4 w-4" />}
              {!isPremium && (
                <div className="absolute -top-12 left-1/2 -translate-x-1/2 w-48 bg-gray-800 text-gray-300 text-xs py-2 px-3 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                  Solo disponible para usuarios premium
                </div>
              )}
            </button>
            <button
              onClick={() => navigate("/home/nueva?from=home")}
              disabled={isLoading}
              className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
            >
              {isLoading ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <Plus className="h-5 w-5" />
              )}
              Nuevo
            </button>
            <button
              onClick={() => setIsIAModalOpen(true)}
              disabled={isLoading}
              className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 px-4 py-2 font-semibold text-white transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50"
            >
              <Sparkles className="h-5 w-5" />
              IA Sugerencias
            </button>
          </div>
        </div>
        
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
          <p className="text-lg text-gray-300">
            {new Date().toLocaleDateString('es-ES', {
              day: '2-digit',
              month: '2-digit',
              year: 'numeric'
            })}
          </p>
          <span className="text-sm text-emerald-400/80">
            {new Date().getHours() < 12 
              ? "¡Buenos días! Hoy será un gran día para tus hábitos" 
              : new Date().getHours() < 19 
                ? "¡Buenas tardes! Sigamos con energía" 
                : "¡Buenas noches! Repasemos tus logros de hoy"}
          </span>
        </div>
      </div>

      <TabsPill active={activeTab} counts={counts} onChange={setActiveTab} isPremium={isPremium} />

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
        {showInitialLoading ? (
          <>
            {[...Array(6)].map((_, i) => (
              <div key={i} className="rounded-xl border border-white/10 bg-gray-900/60 p-4 sm:p-5 animate-pulse">
                <div className="mb-4 flex items-center justify-between">
                  <div className="h-6 w-20 rounded-full bg-gray-700"></div>
                  <div className="h-8 w-8 rounded-full bg-gray-700"></div>
                </div>
                <div className="space-y-3">
                  <div className="h-7 w-3/4 rounded-lg bg-gray-700"></div>
                  <div className="flex items-center gap-3">
                    <div className="h-5 w-24 rounded-lg bg-gray-700"></div>
                    <div className="h-5 w-32 rounded-lg bg-gray-700"></div>
                  </div>
                  <div className="mt-4 h-10 w-32 rounded-lg bg-gray-700"></div>
                </div>
              </div>
            ))}
          </>
        ) : error ? (
          <EmptyState error={error} />
        ) : filtered.length === 0 ? (
          <EmptyState />
        ) : (
          filtered.map((h) => (
            <HabitCard
              key={h.id}
              habit={h}
              onDone={async (comentario) => await markDone(h.id, comentario)}
              onFail={async (comentario) => await markFail(h.id, comentario)}
              onRequestDelete={async () => {
                setHabitToDelete(h);
                return Promise.resolve();
              }}
              onRequestEdit={async (newTitle) => await editHabit(h.id, newTitle)}
            />
          ))
        )}
      </div>

      <ConfirmDialog
        open={!!habitToDelete}
        title="Eliminar hábito"
        message={`¿Seguro que deseas eliminar "${habitToDelete?.titulo ?? ""}"? Esta acción no se puede deshacer.`}
        confirmText="Eliminar definitivamente"
        onClose={() => setHabitToDelete(null)}
        onConfirm={async () => {
          if (habitToDelete) {
            try {
              await removeHabit(habitToDelete.id);
              setHabitToDelete(null);
            } catch (error) {
              console.error('Error al eliminar hábito:', error);
            }
          }
        }}
      />

      {/* Modal de Sugerencias IA */}
      {isIAModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
          <div className="bg-gray-900 border border-white/10 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
            <div className="p-6 border-b border-white/10">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Sparkles className="h-6 w-6 text-purple-400" />
                  <h3 className="text-xl font-semibold text-white">Sugerencias de Hábitos con IA</h3>
                </div>
                <button
                  onClick={resetIAModal}
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-6">
              {!iaSuggestions ? (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      ¿Cuál es la meta que quieres lograr ahora mismo?
                    </label>
                    <input
                      type="text"
                      value={iaInput}
                      onChange={(e) => setIaInput(e.target.value)}
                      placeholder="Ej: bajar 10 kg, mejorar mi salud, ser más productivo..."
                      className="w-full px-4 py-3 bg-gray-800 border border-white/10 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      onKeyPress={(e) => e.key === 'Enter' && handleIASuggestions()}
                    />
                  </div>

                  {iaError && (
                    <div className="text-red-400 text-sm bg-red-500/10 border border-red-500/20 rounded-lg p-3">
                      {iaError}
                    </div>
                  )}

                  <div className="flex justify-end">
                    <button
                      onClick={handleIASuggestions}
                      disabled={iaLoading || !iaInput.trim()}
                      className="inline-flex items-center gap-2 px-6 py-2 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 disabled:from-gray-600 disabled:to-gray-600 text-white rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {iaLoading ? (
                        <>
                          <div className="animate-spin h-4 w-4 border-2 border-white rounded-full border-t-transparent"></div>
                          Generando...
                        </>
                      ) : (
                        <>
                          <Sparkles className="h-4 w-4" />
                          Obtener Sugerencias
                        </>
                      )}
                    </button>
                  </div>
                </>
              ) : (
                <div className="space-y-6">
                  <div className="text-center">
                    <p className="text-gray-300 mb-2">Meta: <span className="text-white font-medium">{iaInput}</span></p>
                    <button
                      onClick={() => setIaSuggestions(null)}
                      className="text-sm text-purple-400 hover:text-purple-300 transition-colors"
                    >
                      ← Cambiar meta
                    </button>
                  </div>

                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="space-y-3">
                      <h4 className="text-lg font-semibold text-red-400 flex items-center gap-2">
                        <div className="w-2 h-2 bg-red-400 rounded-full"></div>
                        Hábitos para Dejar
                      </h4>
                      <ul className="space-y-2">
                        {iaSuggestions.dejar.map((sugerencia, index) => (
                          <li key={index} className="flex items-start gap-3 p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
                            <input
                              type="checkbox"
                              checked={selectedHabits.dejar[index] || false}
                              onChange={(e) => {
                                const newSelected = { ...selectedHabits };
                                newSelected.dejar[index] = e.target.checked;
                                setSelectedHabits(newSelected);
                              }}
                              className="mt-0.5 text-red-400 focus:ring-red-500"
                            />
                            <span className="text-gray-300 text-sm">{sugerencia}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="space-y-3">
                      <h4 className="text-lg font-semibold text-emerald-400 flex items-center gap-2">
                        <div className="w-2 h-2 bg-emerald-400 rounded-full"></div>
                        Hábitos para Hacer
                      </h4>
                      <ul className="space-y-2">
                        {iaSuggestions.hacer.map((sugerencia, index) => (
                          <li key={index} className="flex items-start gap-3 p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-lg">
                            <input
                              type="checkbox"
                              checked={selectedHabits.hacer[index] || false}
                              onChange={(e) => {
                                const newSelected = { ...selectedHabits };
                                newSelected.hacer[index] = e.target.checked;
                                setSelectedHabits(newSelected);
                              }}
                              className="mt-0.5 text-emerald-400 focus:ring-emerald-500"
                            />
                            <span className="text-gray-300 text-sm">{sugerencia}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  {bulkSuccess && (
                    <div className="text-emerald-400 text-sm bg-emerald-500/10 border border-emerald-500/20 rounded-lg p-3">
                      {bulkSuccess}
                    </div>
                  )}

                  <div className="flex justify-between items-center pt-4 border-t border-white/10">
                    <p className="text-sm text-gray-400">
                      Selecciona los hábitos que quieres agregar
                    </p>
                    <button
                      onClick={handleBulkRegister}
                      disabled={bulkLoading || (selectedHabits.hacer.filter(Boolean).length === 0 && selectedHabits.dejar.filter(Boolean).length === 0)}
                      className="inline-flex items-center gap-2 px-6 py-2 bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 disabled:from-gray-600 disabled:to-gray-600 text-white rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {bulkLoading ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Registrando...
                        </>
                      ) : (
                        <>
                          <Plus className="h-4 w-4" />
                          Registrar Seleccionados
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Inicio;
