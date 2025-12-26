// src/Frontend/layouts/state/HabitsContext.tsx
import React, { createContext, useContext, useEffect, useState } from "react";
import { useAuth } from "@clerk/clerk-react";
import { HabitoControl } from "../../../Backend/Controlador/HabitoControl";
import { useSubscription } from "./SubscriptionContext";
import NotificationService, { NotificationType } from "../../services/NotificationService";

export type HabitType = "hacer" | "dejar";

interface RegistroHoy {
  completado: boolean;
  estado: 'exito' | 'fallo';
  comentario?: string;
  puede_registrar: boolean;
  fecha_local_usuario: string;
}

interface Grupo {
  id: string;
  nombre: string;
}

export interface Activity {
  id: string;
  habitoId: string;
  habitoNombre: string;
  nombre: string;
  fecha: string;
  completado: boolean;
  comentario?: string;
}

export interface Habit {
  streak: number;
  id: string;
  titulo: string;
  tipo: HabitType;
  archivado: boolean;
  es_grupal: boolean;
  rachas?: {
    actual: number;
    mejor: number;
  };
  registro_hoy?: RegistroHoy;
  grupo?: Grupo;
}

type Ctx = {
  habits: Habit[];
  activities: Activity[];
  isLoading: boolean;
  error: string | null;
  addHabit: (titulo: string, tipo: HabitType) => Promise<{ ok: boolean; reason?: "limit" }>;
  addGroupHabit: (titulo: string, tipo: HabitType, id_grupo: string) => Promise<{ ok: boolean; reason?: "limit" | "not_premium" }>;
  removeHabit: (id: string) => Promise<void>;
  editHabit: (id: string, titulo: string) => Promise<void>;
  markDone: (id: string, comentario?: string) => Promise<void>;
  markFail: (id: string, comentario?: string) => Promise<void>;
  refetchHabits: () => Promise<void>;
};

const HabitsContext = createContext<Ctx | null>(null);
export const useHabits = () => {
  const ctx = useContext(HabitsContext);
  if (!ctx) throw new Error("useHabits must be used within HabitsProvider");
  return ctx;
};

export const HabitsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { getToken } = useAuth();
  const [habits, setHabits] = useState<Habit[]>([]);
  const [activities] = useState<Activity[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const habitoControl = new HabitoControl();
  const { subscription } = useSubscription();

  useEffect(() => {
    refetchHabits();
  }, []); 

  const refetchHabits = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const token = await getToken();
      if (!token) throw new Error('No hay token de autenticación');
      
      const habitosData = await habitoControl.listarHabitos(token);
      const mappedHabits = habitosData.map(h => {
        // Ensure grupo property is properly formatted for group habits
        if (h.es_grupal && h.grupo) {
          return {
            ...h,
            streak: h.rachas?.actual ?? 0,
            grupo: {
              id: h.grupo.id,
              nombre: h.grupo.nombre
            }
          };
        }
        return {
          ...h,
          streak: h.rachas?.actual ?? 0
        };
      });
      
      setHabits(mappedHabits);
      
      try {
        const notificationService = NotificationService.getInstance();
        if (notificationService.isInitialized() && notificationService.isNotificationEnabled(NotificationType.STREAK)) {
          mappedHabits.forEach(habit => {
            if (habit.rachas && habit.rachas.actual > 0 && habit.rachas.mejor > 0) {
              if (habit.rachas.actual + 1 === habit.rachas.mejor) {
                notificationService.scheduleStreakNotification(
                  habit.rachas.actual,
                  habit.rachas.mejor
                );
              }
            }
          });
        }
      } catch (notifError) {
        console.warn('No se pudieron programar notificaciones:', notifError);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar los hábitos');
    } finally {
      setIsLoading(false);
    }
  };

  const addHabit: Ctx["addHabit"] = async (titulo, tipo) => {
    const token = await getToken();
    if (!token) {
      throw new Error('No hay token de autenticación. Por favor, inicia sesión nuevamente.');
    }
    
    await habitoControl.crearHabito({ titulo, tipo }, token);
    await refetchHabits();
    
    return { ok: true };
  };

  const addGroupHabit: Ctx["addGroupHabit"] = async (titulo, tipo, id_grupo) => {
    const token = await getToken();
    if (!token) {
      throw new Error('No hay token de autenticación. Por favor, inicia sesión nuevamente.');
    }

    // Verificar si el usuario tiene una suscripción premium
    if (!subscription || !subscription.plan.permite_grupos) {
      return { ok: false, reason: "not_premium" };
    }
    
    await habitoControl.crearHabito({ titulo, tipo, id_grupo }, token);
    await refetchHabits();
    
    return { ok: true };
  };

  const removeHabit: Ctx["removeHabit"] = async (id) => {
    const token = await getToken();
    if (!token) throw new Error('No hay token de autenticación');

    await habitoControl.eliminarHabito(id, token);
    await refetchHabits();
  };

  const markDone: Ctx["markDone"] = async (id, comentario) => {
    const token = await getToken();
    if (!token) throw new Error('No hay token de autenticación');

    const registro = {
      estado: 'exito' as const,
      comentario
    };

    await habitoControl.registrarProgreso(id, registro, token);
    await refetchHabits();
  };

  const markFail: Ctx["markFail"] = async (id, comentario) => {
    const token = await getToken();
    if (!token) throw new Error('No hay token de autenticación');

    const registro = {
      estado: 'fallo' as const,
      comentario
    };

    await habitoControl.registrarProgreso(id, registro, token);
    await refetchHabits();
  };

  const editHabit: Ctx["editHabit"] = async (id, titulo) => {
    const token = await getToken();
    if (!token) throw new Error('No hay token de autenticación');

    await habitoControl.editarHabito(id, titulo, token);
    await refetchHabits();
  };

  return (
    <HabitsContext.Provider
      value={{ 
        habits,
        activities,
        isLoading, 
        error, 
        addHabit, 
        addGroupHabit,
        removeHabit, 
        editHabit,
        markDone, 
        markFail, 
        refetchHabits
      }}
    >
      {children}
    </HabitsContext.Provider>
  );
};
