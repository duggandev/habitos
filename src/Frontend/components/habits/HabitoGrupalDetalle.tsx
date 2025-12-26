import React, { useState, useEffect, ReactNode } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@clerk/clerk-react';
import { 
  Loader2, 
  ArrowLeft, 
  Users, 
  Calendar, 
  CheckCircle, 
  XCircle, 
  Flame,
  MessageSquare,
  Clock,
  CalendarDays,
  BarChart,
  UserMinus,
  AlertCircle,
  UserPlus,
  X,
  Search,
  Settings
} from 'lucide-react';
import { HabitoControl } from '../../../Backend/Controlador/HabitoControl';
import { GrupoControl } from '../../../Backend/Controlador/GrupoControl';

// Interface para invitaciones
interface InvitacionPendiente {
  fecha_creacion: string | number | Date;
  rol: ReactNode;
  correo_invitado: ReactNode;
  id: string;
  id_grupo: string;
  correo: string;
  estado: string;
  fecha_invitacion: string;
  fecha_respuesta?: string;
  expira_en?: string;
}

interface Racha {
  actual: number;
  mejor: number;
}

interface RegistroHoy {
  comentario: string | null;
  completado: boolean;
  estado: string | null;
}

interface RegistroReciente {
  fecha: string;
  estado: string;
  comentario: string | null;
}

interface Progreso {
  rachas: Racha;
  registro_hoy: RegistroHoy;
  registros_recientes: RegistroReciente[];
  tasa_exito: number;
  total_exitos: number;
  total_fallos: number;
  total_registros: number;
}

interface MiembroProgreso {
  id_clerk: string;
  nombre: string;
  progreso: Progreso;
  rol: string;
}

interface Grupo {
  id: string;
  nombre: string;
  descripcion: string | null;
}

interface DetallesHabitoGrupal {
  id: string;
  titulo: string;
  tipo: 'hacer' | 'dejar';
  es_grupal: boolean;
  archivado: boolean;
  fecha_creacion: string;
  id_propietario: string;
  mi_progreso: Progreso;
  mi_rol_en_grupo: string;
  progreso_miembros: MiembroProgreso[];
  grupo: Grupo;
}

const HabitoGrupalDetalle: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { getToken, userId } = useAuth();
  
  const [habito, setHabito] = useState<DetallesHabitoGrupal | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [memberToDelete, setMemberToDelete] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [showLeaveModal, setShowLeaveModal] = useState(false);
  const [isLeaving, setIsLeaving] = useState(false);
  const [leaveError, setLeaveError] = useState<string | null>(null);
  const [emailInput, setEmailInput] = useState('');
  const [emails, setEmails] = useState<string[]>([]);
  const [isInviting, setIsInviting] = useState(false);
  const [inviteError, setInviteError] = useState<string | null>(null);
  const [inviteSuccess, setInviteSuccess] = useState(false);
  const [invitationRole, setInvitationRole] = useState<'miembro' | 'administrador'>('miembro');

  // Estados para invitaciones pendientes
  const [invitaciones, setInvitaciones] = useState<InvitacionPendiente[]>([]);
  const [, setIsLoadingInvitaciones] = useState(false);
  const [, setInvitacionesError] = useState<string | null>(null);
  const [showInvitacionesModal, setShowInvitacionesModal] = useState(false);

  // Estado para el buscador de miembros
  const [searchTerm, setSearchTerm] = useState('');

  // Estados para cambio de rol
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [memberToChangeRole, setMemberToChangeRole] = useState<string | null>(null);
  const [newRole, setNewRole] = useState<'miembro' | 'administrador'>('miembro');
  const [isChangingRole, setIsChangingRole] = useState(false);
  const [roleChangeError, setRoleChangeError] = useState<string | null>(null);

  // Estados para vistas móviles
  const [showMobileInviteView, setShowMobileInviteView] = useState(false);
  const [showMobileInvitationsView, setShowMobileInvitationsView] = useState(false);

  // Detectar si estamos en mobile
  const isMobile = () => {
    return window.innerWidth < 768; // md breakpoint
  };

  useEffect(() => {
    const fetchHabitoDetalle = async () => {
      if (!id) {
        setError('ID de hábito no proporcionado');
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        const token = await getToken();
        
        if (!token) {
          setError('No se pudo obtener el token de autenticación');
          setIsLoading(false);
          return;
        }

        const habitoControl = new HabitoControl();
        const detalles = await habitoControl.obtenerDetallesHabitoGrupal(id, token);
        setHabito(detalles);
      } catch (error) {
        console.error('Error al obtener detalles del hábito grupal:', error);
        setError(error instanceof Error ? error.message : 'Error al cargar los detalles del hábito');
      } finally {
        setIsLoading(false);
      }
    };

    fetchHabitoDetalle();
  }, [id, getToken]);

  // Función para eliminar un miembro del grupo
  const handleDeleteMember = async (memberId: string) => {
    if (!habito || !habito.grupo.id) return;
    
    try {
      setIsDeleting(true);
      setDeleteError(null);
      
      const token = await getToken();
      
      if (!token) {
        setDeleteError('No se pudo obtener el token de autenticación');
        setIsDeleting(false);
        return;
      }
      
      const habitoControl = new HabitoControl();
      await habitoControl.eliminarMiembroGrupo(habito.grupo.id, memberId, token);
      
      // Actualizar el estado local eliminando al miembro
      setHabito({
        ...habito,
        progreso_miembros: habito.progreso_miembros.filter(m => m.id_clerk !== memberId)
      });
      
      setShowDeleteModal(false);
    } catch (error) {
      console.error('Error al eliminar miembro del grupo:', error);
      setDeleteError(error instanceof Error ? error.message : 'Error al eliminar al miembro del grupo');
    } finally {
      setIsDeleting(false);
    }
  };

  // Función para mostrar el modal de confirmación
  const confirmDeleteMember = (memberId: string) => {
    setMemberToDelete(memberId);
    setShowDeleteModal(true);
  };

  // Función para cambiar el rol de un miembro
  const handleChangeRole = async () => {
    if (!habito || !habito.grupo.id || !memberToChangeRole) return;
    
    try {
      setIsChangingRole(true);
      setRoleChangeError(null);
      
      const token = await getToken();
      
      if (!token) {
        setRoleChangeError('No se pudo obtener el token de autenticación');
        setIsChangingRole(false);
        return;
      }
      
      const habitoControl = new HabitoControl();
      await habitoControl.cambiarRolMiembro(habito.grupo.id, memberToChangeRole, newRole, token);
      
      // Actualizar el estado local cambiando el rol del miembro
      setHabito({
        ...habito,
        progreso_miembros: habito.progreso_miembros.map(m => 
          m.id_clerk === memberToChangeRole ? { ...m, rol: newRole } : m
        )
      });
      
      setShowRoleModal(false);
      setMemberToChangeRole(null);
    } catch (error) {
      console.error('Error al cambiar rol del miembro:', error);
      setRoleChangeError(error instanceof Error ? error.message : 'Error al cambiar el rol del miembro');
    } finally {
      setIsChangingRole(false);
    }
  };

  // Función para mostrar el modal de cambio de rol
  const confirmChangeRole = (memberId: string, currentRole: string) => {
    setMemberToChangeRole(memberId);
    setNewRole(currentRole === 'miembro' ? 'administrador' : 'miembro');
    setShowRoleModal(true);
    setRoleChangeError(null);
  };

  // Función para obtener invitaciones pendientes
  const fetchInvitaciones = async () => {
    if (!habito || !habito.grupo.id) return;

    try {
      setIsLoadingInvitaciones(true);
      setInvitacionesError(null);

      const token = await getToken();

      if (!token) {
        setInvitacionesError('No se pudo obtener el token de autenticación');
        return;
      }

      const grupoControl = new GrupoControl();
      const invitacionesData = await grupoControl.obtenerInvitaciones(habito.grupo.id, token);
      
      // Filtrar solo invitaciones pendientes
      const invitacionesPendientes = invitacionesData.filter((inv: any) => inv.estado === 'pendiente');

      // Mapear a InvitacionPendiente
      const invitacionesPendientesMapped: InvitacionPendiente[] = invitacionesPendientes.map((inv: any) => ({
        id: inv.id,
        id_grupo: inv.id_grupo,
        correo: inv.correo ?? inv.correo_invitado,
        estado: inv.estado,
        fecha_invitacion: inv.fecha_invitacion ?? inv.fecha_creacion,
        fecha_creacion: inv.fecha_creacion ?? inv.fecha_invitacion,
        rol: inv.rol,
        correo_invitado: inv.correo_invitado ?? inv.correo,
        fecha_respuesta: inv.fecha_respuesta,
        expira_en: inv.expira_en,
      }));

      setInvitaciones(invitacionesPendientesMapped);
    } catch (error) {
      console.error('Error al obtener invitaciones:', error);
      setInvitacionesError(error instanceof Error ? error.message : 'Error al cargar las invitaciones');
    } finally {
      setIsLoadingInvitaciones(false);
    }
  };

  // Función para cancelar una invitación
  const handleCancelInvitation = async (invitationId: string) => {
    // Por ahora solo removemos del estado local
    // En el futuro se puede implementar la llamada al backend
    setInvitaciones(invitaciones.filter(inv => inv.id !== invitationId));
  };  // Cargar invitaciones cuando se carga el hábito
  useEffect(() => {
    if (habito && habito.grupo.id && (habito.mi_rol_en_grupo === 'propietario' || habito.mi_rol_en_grupo === 'administrador')) {
      fetchInvitaciones();
    }
  }, [habito]);
  
  // Función para mostrar el modal de invitación o vista móvil
  const handleShowInviteModal = () => {
    if (isMobile()) {
      setShowMobileInviteView(true);
    } else {
      setShowInviteModal(true);
    }
    setEmails([]);
    setEmailInput('');
    setInvitationRole('miembro');
    setInviteError(null);
    setInviteSuccess(false);
  };

  // Validar formato de email
  const isValidEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };
  
  // Agregar email a la lista
  const handleAddEmail = () => {
    const trimmedEmail = emailInput.trim();
    
    if (!trimmedEmail) return;
    
    if (!isValidEmail(trimmedEmail)) {
      setInviteError('El formato del correo electrónico no es válido');
      return;
    }
    
    if (emails.includes(trimmedEmail)) {
      setInviteError('Este correo ya ha sido agregado');
      return;
    }
    
    setEmails([...emails, trimmedEmail]);
    setEmailInput('');
    setInviteError(null);
  };
  
  // Eliminar email de la lista
  const handleRemoveEmail = (email: string) => {
    setEmails(emails.filter(e => e !== email));
  };
  
  // Manejar pulsación de Enter en el input
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddEmail();
    }
  };
  
  // Estado para resultado de invitaciones
  const [invitationResult, setInvitationResult] = useState<{
    total_exitosas: number;
    errores?: { correo: string; error: string }[];
  } | null>(null);

  // Enviar invitaciones
  const sendInvitations = async () => {
    if (!habito || !habito.grupo.id || emails.length === 0) return;

    try {
      setIsInviting(true);
      setInviteError(null);
      setInvitationResult(null);

      const token = await getToken();

      if (!token) {
        setInviteError('No se pudo obtener el token de autenticación');
        setIsInviting(false);
        return;
      }

      const habitoControl = new HabitoControl();
      // API expects: idGrupo, emails, token
      const result = await habitoControl.invitarMiembrosGrupo(habito.grupo.id, emails, token);

      setIsInviting(false);
      setInviteSuccess(true);
      setInvitationResult(result);

      // Limpiar después de 5 segundos si no hay errores, o mantener el modal para mostrar errores
      if (!result.errores || result.errores.length === 0) {
        setTimeout(() => {
          setShowInviteModal(false);
          setInvitationResult(null);
        }, 5000);
      }

    } catch (error) {
      console.error('Error al enviar invitaciones:', error);
      setInviteError(error instanceof Error ? error.message : 'Error al enviar invitaciones');
      setIsInviting(false);
    }
  };

  // Función para manejar la salida del grupo
  const handleLeaveGroup = async () => {
    try {
      setIsLeaving(true);
      setLeaveError(null);

      const token = await getToken();

      if (!token) {
        setLeaveError('No se pudo obtener el token de autenticación');
        setIsLeaving(false);
        return;
      }

      const habitoControl = new HabitoControl();
      if (habito) {
        await habitoControl.salirDeGrupo(habito.grupo.id, token);
      }

      // Redirigir al usuario a la página de hábitos después de salir del grupo
      navigate('/dashboard');

    } catch (error) {
      console.error('Error al salir del grupo:', error);
      setLeaveError(error instanceof Error ? error.message : 'Error al salir del grupo');
      setIsLeaving(false);
      setShowLeaveModal(false);
    }
  };

  // Función para mostrar el modal de confirmación para salir del grupo
  const confirmLeaveGroup = () => {
    setShowLeaveModal(true);
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="container mx-auto max-w-4xl pb-20 pt-4 space-y-6">
        {/* Back button and title skeleton */}
        <div className="mb-6 flex items-center gap-4">
          <div className="h-9 w-9 rounded-full bg-gray-700 animate-pulse"></div>
          <div className="h-8 w-96 bg-gray-700 rounded-lg animate-pulse"></div>
        </div>
        
        {/* Group actions skeleton */}
        <div className="mb-6 flex justify-end">
          <div className="h-9 w-32 bg-gray-700 rounded-lg animate-pulse"></div>
        </div>

        {/* Habit header skeleton */}
        <div className="mb-8 rounded-2xl border border-white/10 bg-gray-900/60 p-6 space-y-4">
          <div className="flex items-center gap-3">
            <div className="h-6 w-24 bg-gray-700 rounded-full animate-pulse"></div>
            <div className="h-6 w-20 bg-gray-700 rounded-full animate-pulse"></div>
          </div>
          
          <div className="h-7 w-64 bg-gray-700 rounded-lg animate-pulse"></div>
          
          <div className="flex flex-wrap gap-4">
            <div className="h-4 w-40 bg-gray-700 rounded-lg animate-pulse"></div>
            <div className="h-4 w-48 bg-gray-700 rounded-lg animate-pulse"></div>
          </div>
        </div>

        {/* Stats cards skeleton */}
        <div className="mb-8 grid gap-4 grid-cols-2 md:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="rounded-xl border border-white/10 bg-gray-900/60 p-4">
              <div className="mb-2 h-10 w-10 rounded-full bg-gray-700 animate-pulse"></div>
              <div className="h-6 w-12 bg-gray-700 rounded-lg animate-pulse mb-2"></div>
              <div className="h-4 w-20 bg-gray-700 rounded-lg animate-pulse"></div>
            </div>
          ))}
        </div>

        {/* Mi progreso section skeleton */}
        <div className="mb-8 rounded-2xl border border-white/10 bg-gray-900/60">
          <div className="border-b border-white/10 p-6 space-y-3">
            <div className="h-6 w-32 bg-gray-700 rounded-lg animate-pulse"></div>
            <div className="h-4 w-64 bg-gray-700 rounded-lg animate-pulse"></div>
          </div>
          
          <div className="p-6 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-full bg-gray-700 animate-pulse"></div>
                <div className="space-y-2">
                  <div className="h-4 w-32 bg-gray-700 rounded-lg animate-pulse"></div>
                  <div className="h-3 w-48 bg-gray-700 rounded-lg animate-pulse"></div>
                </div>
              </div>
              <div className="h-9 w-32 bg-gray-700 rounded-lg animate-pulse"></div>
            </div>
            
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="rounded-lg border border-white/10 bg-white/5 p-3">
                  <div className="h-3 w-16 bg-gray-700 rounded-lg animate-pulse mb-2"></div>
                  <div className="h-5 w-12 bg-gray-700 rounded-lg animate-pulse"></div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Members progress skeleton */}
        <div className="rounded-2xl border border-white/10 bg-gray-900/60">
          <div className="border-b border-white/10 p-6 space-y-3">
            <div className="h-6 w-48 bg-gray-700 rounded-lg animate-pulse"></div>
            <div className="h-4 w-80 bg-gray-700 rounded-lg animate-pulse"></div>
          </div>
          
          <div className="divide-y divide-white/10">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="p-6 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-gray-700 animate-pulse"></div>
                    <div className="space-y-2">
                      <div className="h-4 w-32 bg-gray-700 rounded-lg animate-pulse"></div>
                      <div className="h-3 w-40 bg-gray-700 rounded-lg animate-pulse"></div>
                    </div>
                  </div>
                  <div className="h-8 w-24 bg-gray-700 rounded-lg animate-pulse"></div>
                </div>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                  {[...Array(4)].map((_, j) => (
                    <div key={j} className="h-8 bg-gray-700 rounded-lg animate-pulse"></div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="flex h-full flex-col items-center justify-center">
        <div className="max-w-md text-center">
          <XCircle className="mx-auto h-12 w-12 text-red-500" />
          <h2 className="mt-4 text-xl font-medium text-white">Error al cargar detalles</h2>
          <p className="mt-2 text-gray-400">{error}</p>
          <button
            onClick={() => navigate(-1)}
            className="mt-6 inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 font-medium text-white hover:bg-blue-700"
          >
            <ArrowLeft className="h-4 w-4" />
            Volver
          </button>
        </div>
      </div>
    );
  }

  // No data state
  if (!habito) {
    return (
      <div className="flex h-full flex-col items-center justify-center">
        <div className="max-w-md text-center">
          <XCircle className="mx-auto h-12 w-12 text-gray-500" />
          <h2 className="mt-4 text-xl font-medium text-white">Hábito no encontrado</h2>
          <p className="mt-2 text-gray-400">No se encontró información para este hábito grupal</p>
          <button
            onClick={() => navigate(-1)}
            className="mt-6 inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 font-medium text-white hover:bg-blue-700"
          >
            <ArrowLeft className="h-4 w-4" />
            Volver
          </button>
        </div>
      </div>
    );
  }

  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', {
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    });
  };

  // Success percentage color
  const getSuccessColor = (percentage: number) => {
    if (percentage >= 80) return 'text-emerald-500';
    if (percentage >= 60) return 'text-green-500';
    if (percentage >= 40) return 'text-yellow-500';
    return 'text-red-500';
  };

  // Estadísticas para los cards
  const totalMembers = habito.progreso_miembros.length;
  const completedToday = habito.progreso_miembros.filter(m => m.progreso.registro_hoy.completado).length;
  const bestStreak = Math.max(...habito.progreso_miembros.map(m => m.progreso.rachas.mejor), 0);
  const avgSuccessRate =
    totalMembers > 0
      ? habito.progreso_miembros.reduce((acc, m) => acc + m.progreso.tasa_exito, 0) / totalMembers
      : 0;

  // Filtrar miembros basado en el término de búsqueda
  const filteredMembers = habito.progreso_miembros.filter((miembro) => {
    const searchLower = searchTerm.toLowerCase();
    const memberName = (miembro.nombre || 'Usuario').toLowerCase();
    const memberRole = miembro.rol.toLowerCase();
    
    return memberName.includes(searchLower) || memberRole.includes(searchLower);
  });

  return (
    <div className="container mx-auto max-w-4xl pb-20 pt-4">
      {/* Back button and title */}
      <div className="mb-6 flex items-center gap-4">
        <button
          onClick={() => navigate(-1)}
          className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <h1 className="text-2xl font-bold text-white">Detalles del hábito grupal</h1>
      </div>
      
      {/* Group actions */}
      <div className="mb-6 flex justify-end">
        {habito.mi_rol_en_grupo === 'miembro' ? (
          <button
            onClick={confirmLeaveGroup}
            className="inline-flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
          >
            <Users className="h-4 w-4" />
            <span>Salir del grupo</span>
          </button>
        ) : (
          <div className="flex gap-3">
            {/* */}
          </div>
        )}
      </div>

      {/* Habit header */}
      <div className="mb-8 rounded-2xl border border-white/10 bg-gray-900/60 p-6">
        <div className="mb-4 flex items-center gap-3">
          <span className="rounded-full bg-blue-500/20 px-3 py-1 text-sm font-medium text-blue-400">
            Hábito Grupal
          </span>
          <span className="rounded-full bg-emerald-500/20 px-3 py-1 text-sm font-medium text-emerald-400">
            {habito.tipo === 'hacer' ? 'Hacer' : 'Dejar'}
          </span>
          {habito.archivado && (
            <span className="rounded-full bg-gray-500/20 px-3 py-1 text-sm font-medium text-gray-400">
              Archivado
            </span>
          )}
        </div>
        
        <h2 className="mb-2 text-2xl font-bold text-white">{habito.titulo}</h2>
        
        <div className="mt-4 flex flex-wrap gap-4">
          <div className="flex items-center gap-2 text-sm text-gray-400">
            <Users className="h-4 w-4" />
            <span>{habito.grupo.nombre}</span>
          </div>
          
          <div className="flex items-center gap-2 text-sm text-gray-400">
            <Calendar className="h-4 w-4" />
            <span>Creado: {formatDate(habito.fecha_creacion)}</span>
          </div>
          
          {habito.grupo.descripcion && (
            <div className="flex items-center gap-2 text-sm text-gray-400">
              <MessageSquare className="h-4 w-4" />
              <span>{habito.grupo.descripcion}</span>
            </div>
          )}
        </div>
      </div>

      {/* Stats cards */}
      <div className="mb-8 grid gap-4 grid-cols-2 md:grid-cols-4">
        <div className="rounded-xl border border-white/10 bg-gray-900/60 p-4 text-center">
          <div className="mb-2 inline-flex h-10 w-10 items-center justify-center rounded-full bg-blue-500/10">
            <Users className="h-5 w-5 text-blue-400" />
          </div>
          <h3 className="text-xl font-bold text-white">{totalMembers}</h3>
          <p className="text-sm text-gray-400">Miembros</p>
        </div>

        <div className="rounded-xl border border-white/10 bg-gray-900/60 p-4 text-center">
          <div className="mb-2 inline-flex h-10 w-10 items-center justify-center rounded-full bg-emerald-500/10">
            <CheckCircle className="h-5 w-5 text-emerald-400" />
          </div>
          <h3 className="text-xl font-bold text-white">{completedToday}</h3>
          <p className="text-sm text-gray-400">Completados hoy</p>
        </div>

        <div className="rounded-xl border border-white/10 bg-gray-900/60 p-4 text-center">
          <div className="mb-2 inline-flex h-10 w-10 items-center justify-center rounded-full bg-orange-500/10">
            <Flame className="h-5 w-5 text-orange-400" />
          </div>
          <h3 className="text-xl font-bold text-white">{bestStreak}</h3>
          <p className="text-sm text-gray-400">Mejor racha</p>
        </div>

        <div className="rounded-xl border border-white/10 bg-gray-900/60 p-4 text-center">
          <div className="mb-2 inline-flex h-10 w-10 items-center justify-center rounded-full bg-purple-500/10">
            <BarChart className="h-5 w-5 text-purple-400" />
          </div>
          <h3 className={`text-xl font-bold ${getSuccessColor(avgSuccessRate)}`}>
            {Math.round(avgSuccessRate)}%
          </h3>
          <p className="text-sm text-gray-400">Tasa media de éxito</p>
        </div>
      </div>

      {/* Mi progreso section */}
      <div className="mb-8 rounded-2xl border border-white/10 bg-gray-900/60">
        <div className="border-b border-white/10 p-6">
          <h3 className="text-xl font-bold text-white">Mi progreso</h3>
          <p className="mt-1 text-gray-400">Tu seguimiento personal en este hábito</p>
        </div>
        
        <div className="p-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-blue-600 text-lg font-bold text-white">
                {userId?.charAt(0).toUpperCase() || 'Y'}
              </div>
              
              <div>
                <h4 className="font-medium text-white">
                  Tú
                  <span className="ml-2 rounded-full bg-amber-500/20 px-2 py-0.5 text-xs text-amber-400">
                    {habito.mi_rol_en_grupo}
                  </span>
                </h4>
                <div className="flex items-center gap-2 text-sm">
                  <div className="flex items-center gap-1 text-orange-400">
                    <Flame className="h-4 w-4" />
                    <span>{habito.mi_progreso.rachas.actual} días</span>
                  </div>
                  <span className="text-gray-500">(mejor: {habito.mi_progreso.rachas.mejor})</span>
                </div>
              </div>
            </div>
            
            <div className="flex items-center">
              {habito.mi_progreso.registro_hoy.completado ? (
                <div className="flex items-center gap-2 rounded-lg bg-emerald-500/10 px-3 py-1.5 text-sm text-emerald-400">
                  <CheckCircle className="h-4 w-4" />
                  Completado hoy
                </div>
              ) : (
                <div className="flex items-center gap-2 rounded-lg bg-gray-700/50 px-3 py-1.5 text-sm text-gray-400">
                  <Clock className="h-4 w-4" />
                  Pendiente hoy
                </div>
              )}
            </div>
          </div>
          
          <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-4">
            <div className="rounded-lg border border-white/10 bg-white/5 p-3 text-center">
              <p className="text-xs text-gray-400">Total registros</p>
              <p className="text-lg font-semibold text-white">{habito.mi_progreso.total_registros}</p>
            </div>
            <div className="rounded-lg border border-white/10 bg-white/5 p-3 text-center">
              <p className="text-xs text-gray-400">Completados</p>
              <p className="text-lg font-semibold text-emerald-400">{habito.mi_progreso.total_exitos}</p>
            </div>
            <div className="rounded-lg border border-white/10 bg-white/5 p-3 text-center">
              <p className="text-xs text-gray-400">Fallos</p>
              <p className="text-lg font-semibold text-red-400">{habito.mi_progreso.total_fallos}</p>
            </div>
            <div className="rounded-lg border border-white/10 bg-white/5 p-3 text-center">
              <p className="text-xs text-gray-400">Tasa de éxito</p>
              <p className={`text-lg font-semibold ${getSuccessColor(habito.mi_progreso.tasa_exito)}`}>
                {Math.round(habito.mi_progreso.tasa_exito)}%
              </p>
            </div>
          </div>
          
          {/* Last comment if available */}
          {habito.mi_progreso.registro_hoy.comentario && (
            <div className="mt-3 rounded-lg border border-white/10 bg-white/5 p-3">
              <div className="mb-1 flex items-center gap-2 text-xs text-gray-400">
                <MessageSquare className="h-3 w-3" />
                <span>Comentario de hoy</span>
              </div>
              <p className="text-sm text-gray-300">{habito.mi_progreso.registro_hoy.comentario}</p>
            </div>
          )}
        </div>
      </div>

      {/* Members progress */}
      <div className="rounded-2xl border border-white/10 bg-gray-900/60">
        <div className="border-b border-white/10 p-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h3 className="text-xl font-bold text-white">Progreso de los miembros</h3>
              <p className="mt-1 text-gray-400">Seguimiento del progreso de cada miembro del grupo</p>
            </div>
            
            {/* Buscador de miembros */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar miembros..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full sm:w-64 rounded-lg border border-white/10 bg-gray-800 px-10 py-2 text-sm text-white placeholder:text-gray-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
          </div>
          
          {/* Botones para propietarios y administradores */}
          {(habito.mi_rol_en_grupo === 'propietario' || habito.mi_rol_en_grupo === 'administrador') && (
            <div className="mt-4 flex gap-2">
              <button
                onClick={handleShowInviteModal}
                className="flex-1 inline-flex items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-blue-600 to-blue-700 px-4 py-2.5 text-sm font-medium text-white shadow-lg hover:from-blue-700 hover:to-blue-800 transition-all duration-200 transform hover:scale-[1.02]"
              >
                <UserPlus className="h-4 w-4" />
                <span className="hidden sm:inline">Invitar miembros</span>
                <span className="sm:hidden">Invitar</span>
              </button>

              <button
                onClick={() => {
                  if (isMobile()) {
                    setShowMobileInvitationsView(true);
                  } else {
                    setShowInvitacionesModal(true);
                  }
                }}
                className="flex-1 inline-flex items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-emerald-600 to-emerald-700 px-4 py-2.5 text-sm font-medium text-white shadow-lg hover:from-emerald-700 hover:to-emerald-800 transition-all duration-200 transform hover:scale-[1.02]"
              >
                <Users className="h-4 w-4" />
                <span className="hidden sm:inline">Ver invitaciones</span>
                <span className="sm:hidden">Invitaciones</span>
              </button>
            </div>
          )}
        </div>
        
        <div className="divide-y divide-white/10">
          {filteredMembers.length === 0 ? (
            <div className="p-8 text-center">
              <Users className="mx-auto h-12 w-12 text-gray-500" />
              <h3 className="mt-4 text-lg font-medium text-gray-300">
                {searchTerm ? 'No se encontraron miembros' : 'No hay miembros en este grupo'}
              </h3>
              <p className="mt-1 text-gray-400">
                {searchTerm 
                  ? 'Intenta con otro término de búsqueda' 
                  : 'Los miembros aparecerán aquí cuando se unan al grupo'
                }
              </p>
            </div>
          ) : (
            filteredMembers.map((miembro) => (
            <div key={miembro.id_clerk} className="p-6">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 overflow-hidden rounded-full bg-gray-700">
                    <div className="flex h-full w-full items-center justify-center bg-blue-600 text-lg font-bold text-white">
                      {miembro.nombre ? miembro.nombre.charAt(0).toUpperCase() : miembro.id_clerk.charAt(0).toUpperCase()}
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="font-medium text-white">
                      {miembro.nombre || 'Usuario'}
                      {miembro.id_clerk === userId && <span className="ml-2 text-blue-400">(Tú)</span>}
                      <span className="ml-2 rounded-full bg-amber-500/20 px-2 py-0.5 text-xs text-amber-400">
                        {miembro.rol}
                      </span>
                    </h4>
                    <div className="flex items-center gap-2 text-sm">
                      <div className="flex items-center gap-1 text-orange-400">
                        <Flame className="h-4 w-4" />
                        <span>{miembro.progreso.rachas.actual} días</span>
                      </div>
                      <span className="text-gray-500">(mejor: {miembro.progreso.rachas.mejor})</span>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  {miembro.progreso.registro_hoy.completado ? (
                    <div className="flex items-center gap-2 rounded-lg bg-emerald-500/10 px-3 py-1.5 text-sm text-emerald-400">
                      <CheckCircle className="h-4 w-4" />
                      Completado hoy
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 rounded-lg bg-gray-700/50 px-3 py-1.5 text-sm text-gray-400">
                      <Clock className="h-4 w-4" />
                      Pendiente hoy
                    </div>
                  )}
                  
                  {/* Botones de gestión (solo visible para propietarios y administradores, y no para gestionar a uno mismo) */}
                  {(() => {
                    const isOwner = habito.mi_rol_en_grupo === 'propietario';
                    const isAdmin = habito.mi_rol_en_grupo === 'administrador';
                    const isMemberOwner = miembro.rol === 'propietario';
                    const isNotCurrentUser = miembro.id_clerk !== userId;
                    
                    // Reglas de permisos:
                    // - Propietarios pueden gestionar (eliminar/cambiar rol) a administradores y miembros
                    // - Administradores pueden gestionar a otros administradores y miembros (excepto al propietario)
                    // - Miembros no pueden gestionar a nadie
                    const canManage = (isOwner && isNotCurrentUser) || 
                                     (isAdmin && !isMemberOwner && isNotCurrentUser);
                    
                    return canManage;
                  })() && (
                    <div className="flex items-center gap-1">
                      {/* Botón de cambiar rol */}
                      <button
                        onClick={() => confirmChangeRole(miembro.id_clerk, miembro.rol)}
                        className="flex items-center justify-center rounded-full bg-blue-500/10 p-1.5 text-blue-400 hover:bg-blue-500/20"
                        title={`Cambiar rol (${miembro.rol === 'miembro' ? 'Hacer administrador' : 'Hacer miembro'})`}
                      >
                        <Settings className="h-4 w-4" />
                      </button>
                      
                      {/* Botón de eliminar */}
                      <button
                        onClick={() => confirmDeleteMember(miembro.id_clerk)}
                        className="flex items-center justify-center rounded-full bg-red-500/10 p-1.5 text-red-400 hover:bg-red-500/20"
                        title="Eliminar miembro"
                      >
                        <UserMinus className="h-4 w-4" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
              
              {/* Stats for this member */}
              <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
                <div className="rounded-lg border border-white/10 bg-white/5 p-2 text-center">
                  <p className="text-xs text-gray-400">Total</p>
                  <p className="text-sm font-semibold text-white">{miembro.progreso.total_registros}</p>
                </div>
                <div className="rounded-lg border border-white/10 bg-white/5 p-2 text-center">
                  <p className="text-xs text-gray-400">Éxitos</p>
                  <p className="text-sm font-semibold text-emerald-400">{miembro.progreso.total_exitos}</p>
                </div>
                <div className="rounded-lg border border-white/10 bg-white/5 p-2 text-center">
                  <p className="text-xs text-gray-400">Fallos</p>
                  <p className="text-sm font-semibold text-red-400">{miembro.progreso.total_fallos}</p>
                </div>
                <div className="rounded-lg border border-white/10 bg-white/5 p-2 text-center">
                  <p className="text-xs text-gray-400">Éxito</p>
                  <p className={`text-sm font-semibold ${getSuccessColor(miembro.progreso.tasa_exito)}`}>
                    {Math.round(miembro.progreso.tasa_exito)}%
                  </p>
                </div>
              </div>
              
              {/* Last comment if available */}
              {miembro.progreso.registro_hoy.comentario && (
                <div className="mt-3 rounded-lg border border-white/10 bg-white/5 p-3">
                  <div className="mb-1 flex items-center gap-2 text-xs text-gray-400">
                    <MessageSquare className="h-3 w-3" />
                    <span>Comentario de hoy</span>
                  </div>
                  <p className="text-sm text-gray-300">{miembro.progreso.registro_hoy.comentario}</p>
                </div>
              )}
              
              {/* Recent records if available */}
              {miembro.progreso.registros_recientes && miembro.progreso.registros_recientes.length > 0 && (
                <div className="mt-3">
                  <div className="mb-1 flex items-center gap-2 text-xs text-gray-400">
                    <CalendarDays className="h-3 w-3" />
                    <span>Registros recientes</span>
                  </div>
                  <div className="mt-2 space-y-2">
                    {miembro.progreso.registros_recientes.map((registro, idx) => (
                      <div key={idx} className="flex items-center gap-2 text-xs">
                        <span className="text-gray-400">{new Date(registro.fecha).toLocaleDateString()}</span>
                        {registro.estado === 'exito' ? (
                          <span className="flex items-center gap-1 text-emerald-400">
                            <CheckCircle className="h-3 w-3" />
                            Completado
                          </span>
                        ) : (
                          <span className="flex items-center gap-1 text-red-400">
                            <XCircle className="h-3 w-3" />
                            Fallado
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )))}
        </div>
      </div>

      {/* Modal de confirmación para eliminar miembro */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70">
          <div className="w-full max-w-md rounded-lg border border-white/10 bg-gray-900 p-6 shadow-xl">
            <div className="mb-4 flex items-center gap-3 text-red-400">
              <AlertCircle className="h-6 w-6" />
              <h3 className="text-lg font-semibold">Eliminar miembro</h3>
            </div>
            
            <p className="mb-4 text-gray-300">
              ¿Estás seguro de que deseas eliminar a este miembro del grupo? Esta acción no se puede deshacer.
            </p>
            
            {deleteError && (
              <div className="mb-4 rounded-md bg-red-900/30 p-3 text-sm text-red-400">
                {deleteError}
              </div>
            )}
            
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="rounded-md border border-white/10 bg-gray-800 px-4 py-2 text-white hover:bg-gray-700"
                disabled={isDeleting}
              >
                Cancelar
              </button>
              <button
                onClick={() => memberToDelete && handleDeleteMember(memberToDelete)}
                className="rounded-md bg-red-600 px-4 py-2 text-white hover:bg-red-700 disabled:opacity-50"
                disabled={isDeleting}
              >
                {isDeleting ? (
                  <span className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Eliminando...
                  </span>
                ) : (
                  'Eliminar'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Vista completa móvil para invitar miembros */}
      {showMobileInviteView && (
        <div className="fixed inset-x-0 top-16 bottom-0 z-50 bg-gray-900 md:hidden">
          <div className="flex h-full flex-col">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-white/10 p-4">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setShowMobileInviteView(false)}
                  className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20"
                >
                  <ArrowLeft className="h-5 w-5" />
                </button>
                <h2 className="text-lg font-semibold text-white">Invitar miembros</h2>
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-4">
              <p className="mb-6 text-gray-300">
                Ingresa los correos electrónicos de las personas que deseas invitar a este grupo.
              </p>

              {inviteError && (
                <div className="mb-4 rounded-md bg-red-900/30 p-3 text-sm text-red-400">
                  {inviteError}
                </div>
              )}

              {inviteSuccess ? (
                <div className="space-y-4">
                  {invitationResult?.total_exitosas === 0 && invitationResult?.errores && invitationResult.errores.length > 0 ? (
                    // Si no hay invitaciones exitosas pero hay errores
                    <div className="rounded-md bg-red-900/30 p-4 text-sm text-red-400">
                      <div className="flex items-center gap-2 mb-2">
                        <AlertCircle className="h-5 w-5" />
                        <span className="font-medium">No se enviaron invitaciones</span>
                      </div>
                    </div>
                  ) : (
                    // Si hay al menos algunas invitaciones exitosas
                    <div className="rounded-md bg-green-900/30 p-4 text-sm text-green-400">
                      <div className="flex items-center gap-2 mb-2">
                        <CheckCircle className="h-5 w-5" />
                        <span className="font-medium">¡Invitaciones enviadas con éxito!</span>
                      </div>
                    </div>
                  )}

                  {invitationResult && (
                    <div className="space-y-3 rounded-md border border-white/10 p-4 text-sm">
                      {invitationResult.total_exitosas > 0 && (
                        <p className="text-gray-300">
                          Se enviaron <span className="font-medium text-green-400">{invitationResult.total_exitosas}</span> invitaciones.
                        </p>
                      )}

                      {invitationResult.errores && invitationResult.errores.length > 0 && (
                        <div className="space-y-2">
                          <p className="text-gray-300 font-medium">
                            {invitationResult.total_exitosas === 0 ? 'Motivos:' : 'Algunas invitaciones no pudieron enviarse:'}
                          </p>
                          <div className="max-h-40 overflow-auto rounded-lg border border-white/10 bg-gray-800 p-2">
                            {invitationResult.errores.map((fallo, index) => (
                              <div key={index} className="border-b border-white/5 py-2 last:border-0">
                                <span className="text-red-400">{fallo.correo}</span>
                                <p className="text-xs text-gray-400 mt-1">
                                  {fallo.error === 'El usuario no está registrado en la plataforma' 
                                    ? '⚠️ El usuario debe estar registrado en la plataforma antes de ser invitado'
                                    : fallo.error
                                  }
                                </p>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      <div className="flex justify-end pt-2">
                        <button
                          onClick={() => {
                            setShowMobileInviteView(false);
                            setInvitationResult(null);
                            setEmails([]);
                            setInvitationRole('miembro');
                          }}
                          className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
                        >
                          Cerrar
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <>
                  <div className="mb-6">
                    <label className="mb-2 block text-sm font-medium text-gray-400">
                      Correo electrónico
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="email"
                        value={emailInput}
                        onChange={(e) => setEmailInput(e.target.value)}
                        onKeyDown={handleKeyPress}
                        placeholder="ejemplo@correo.com"
                        className="flex-1 rounded-lg border border-white/10 bg-gray-800 px-3 py-2 text-sm text-white placeholder:text-gray-500"
                        disabled={isInviting}
                      />
                      <button
                        onClick={handleAddEmail}
                        className="rounded-lg bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
                        disabled={!emailInput.trim() || isInviting}
                      >
                        Agregar
                      </button>
                    </div>
                  </div>

                  {/* Selector de rol */}
                  <div className="mb-6">
                    <label className="mb-3 block text-sm font-medium text-gray-400">
                      Rol del invitado
                    </label>
                    <div className="space-y-2">
                      <label className="flex items-center gap-3 rounded-lg border border-white/10 bg-gray-800 p-3 cursor-pointer hover:bg-gray-700">
                        <input
                          type="radio"
                          name="mobileInvitationRole"
                          value="miembro"
                          checked={invitationRole === 'miembro'}
                          onChange={(e) => setInvitationRole(e.target.value as 'miembro' | 'administrador')}
                          className="text-blue-500 focus:ring-blue-500"
                          disabled={isInviting}
                        />
                        <div>
                          <div className="font-medium text-white">Miembro</div>
                          <div className="text-sm text-gray-400">Puede ver y registrar progreso, pero no gestionar el grupo</div>
                        </div>
                      </label>

                      <label className="flex items-center gap-3 rounded-lg border border-white/10 bg-gray-800 p-3 cursor-pointer hover:bg-gray-700">
                        <input
                          type="radio"
                          name="mobileInvitationRole"
                          value="administrador"
                          checked={invitationRole === 'administrador'}
                          onChange={(e) => setInvitationRole(e.target.value as 'miembro' | 'administrador')}
                          className="text-blue-500 focus:ring-blue-500"
                          disabled={isInviting}
                        />
                        <div>
                          <div className="font-medium text-white">Administrador</div>
                          <div className="text-sm text-gray-400">Puede gestionar miembros y configuraciones del grupo</div>
                        </div>
                      </label>
                    </div>
                  </div>

                  {/* Lista de emails agregados */}
                  {emails.length > 0 && (
                    <div className="mb-6">
                      <label className="mb-2 block text-sm font-medium text-gray-400">
                        Destinatarios ({emails.length})
                      </label>
                      <div className="max-h-40 overflow-auto rounded-lg border border-white/10 bg-gray-800 p-2">
                        <div className="flex flex-wrap gap-2">
                          {emails.map((email, index) => (
                            <div
                              key={index}
                              className="inline-flex items-center gap-1 rounded-full bg-blue-900/40 px-3 py-1 text-xs text-blue-300"
                            >
                              <span>{email}</span>
                              <button
                                onClick={() => handleRemoveEmail(email)}
                                className="ml-1 rounded-full bg-red-500/20 p-0.5 text-red-400 hover:bg-red-500/30"
                              >
                                <X className="h-3 w-3" />
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Footer con botones */}
            {!inviteSuccess && (
              <div className="border-t border-white/10 p-4">
                <div className="flex gap-3">
                  <button
                    onClick={() => setShowMobileInviteView(false)}
                    className="flex-1 rounded-lg border border-white/10 bg-gray-800 px-4 py-2 text-sm font-medium text-white hover:bg-gray-700 disabled:opacity-50"
                    disabled={isInviting}
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={sendInvitations}
                    className="flex-1 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
                    disabled={emails.length === 0 || isInviting}
                  >
                    {isInviting ? (
                      <span className="flex items-center justify-center gap-2">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Enviando...
                      </span>
                    ) : (
                      'Enviar invitaciones'
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
      {/* Modal de invitación para escritorio */}
      {showInviteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70">
          <div className="w-full max-w-md rounded-lg border border-white/10 bg-gray-900 p-6 shadow-xl">
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-3 text-blue-400">
                <UserPlus className="h-6 w-6" />
                <h3 className="text-lg font-semibold">Invitar miembros</h3>
              </div>
              <button
                onClick={() => setShowInviteModal(false)}
                className="rounded-full bg-gray-800 p-1 text-gray-400 hover:bg-gray-700 hover:text-white"
                disabled={isInviting}
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <p className="mb-4 text-gray-300">
              Ingresa los correos electrónicos de las personas que deseas invitar a este grupo.
            </p>
            
            {inviteError && (
              <div className="mb-4 rounded-md bg-red-900/30 p-3 text-sm text-red-400">
                {inviteError}
              </div>
            )}
            
            {inviteSuccess ? (
              <div className="mb-4 space-y-3">
                {invitationResult?.total_exitosas === 0 && invitationResult?.errores && invitationResult.errores.length > 0 ? (
                  // Si no hay invitaciones exitosas pero hay errores
                  <div className="rounded-md bg-red-900/30 p-3 text-sm text-red-400 flex items-center gap-2">
                    <AlertCircle className="h-5 w-5" />
                    <span>No se enviaron invitaciones</span>
                  </div>
                ) : (
                  // Si hay al menos algunas invitaciones exitosas
                  <div className="rounded-md bg-green-900/30 p-3 text-sm text-green-400 flex items-center gap-2">
                    <CheckCircle className="h-5 w-5" />
                    <span>¡Invitaciones enviadas con éxito!</span>
                  </div>
                )}
                
                {invitationResult && (
                  <div className="space-y-3 rounded-md border border-white/10 p-3 text-sm">
                    {invitationResult.total_exitosas > 0 && (
                      <p className="text-gray-300">
                        Se enviaron <span className="font-medium text-green-400">{invitationResult.total_exitosas}</span> invitaciones.
                      </p>
                    )}
                    
                    {invitationResult.errores && invitationResult.errores.length > 0 && (
                      <div className="space-y-2">
                        <p className="text-gray-300 font-medium">
                          {invitationResult.total_exitosas === 0 ? 'Motivos:' : 'Algunas invitaciones no pudieron enviarse:'}
                        </p>
                        <div className="max-h-40 overflow-auto rounded-lg border border-white/10 bg-gray-800 p-2">
                          {invitationResult.errores.map((fallo, index) => (
                            <div key={index} className="border-b border-white/5 py-2 last:border-0">
                              <span className="text-red-400">{fallo.correo}</span>
                              <p className="text-xs text-gray-400 mt-1">
                                {fallo.error === 'El usuario no está registrado en la plataforma' 
                                  ? '⚠️ El usuario debe estar registrado en la plataforma antes de ser invitado'
                                  : fallo.error
                                }
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    <div className="flex justify-end pt-2">
                      <button
                        onClick={() => {
                          setShowInviteModal(false);
                          setInvitationResult(null);
                          setEmails([]);
                          setInvitationRole('miembro');
                        }}
                        className="rounded-md bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700"
                      >
                        Cerrar
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <>
                <div className="mb-3 mt-4">
                  <label className="mb-2 block text-sm font-medium text-gray-400">
                    Correo electrónico
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="email"
                      value={emailInput}
                      onChange={(e) => setEmailInput(e.target.value)}
                      onKeyDown={handleKeyPress}
                      placeholder="ejemplo@correo.com"
                      className="w-full rounded-lg border border-white/10 bg-gray-800 px-3 py-2 text-sm text-white placeholder:text-gray-500"
                      disabled={isInviting}
                    />
                    <button
                      onClick={handleAddEmail}
                      className="rounded-lg bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
                      disabled={!emailInput.trim() || isInviting}
                    >
                      Agregar
                    </button>
                  </div>
                </div>

                {/* Selector de rol */}
                <div className="mb-4">
                  <label className="mb-3 block text-sm font-medium text-gray-400">
                    Rol del invitado
                  </label>
                  <div className="space-y-2">
                    <label className="flex items-center gap-3 rounded-lg border border-white/10 bg-gray-800 p-3 cursor-pointer hover:bg-gray-700">
                      <input
                        type="radio"
                        name="invitationRole"
                        value="miembro"
                        checked={invitationRole === 'miembro'}
                        onChange={(e) => setInvitationRole(e.target.value as 'miembro' | 'administrador')}
                        className="text-blue-500 focus:ring-blue-500"
                        disabled={isInviting}
                      />
                      <div>
                        <div className="font-medium text-white">Miembro</div>
                        <div className="text-sm text-gray-400">Puede ver y registrar progreso, pero no gestionar el grupo</div>
                      </div>
                    </label>

                    <label className="flex items-center gap-3 rounded-lg border border-white/10 bg-gray-800 p-3 cursor-pointer hover:bg-gray-700">
                      <input
                        type="radio"
                        name="invitationRole"
                        value="administrador"
                        checked={invitationRole === 'administrador'}
                        onChange={(e) => setInvitationRole(e.target.value as 'miembro' | 'administrador')}
                        className="text-blue-500 focus:ring-blue-500"
                        disabled={isInviting}
                      />
                      <div>
                        <div className="font-medium text-white">Administrador</div>
                        <div className="text-sm text-gray-400">Puede gestionar miembros y configuraciones del grupo</div>
                      </div>
                    </label>
                  </div>
                </div>
                
                {/* Lista de emails agregados */}
                {emails.length > 0 && (
                  <div className="mb-4 mt-3">
                    <label className="mb-2 block text-sm font-medium text-gray-400">
                      Destinatarios ({emails.length})
                    </label>
                    <div className="max-h-40 overflow-auto rounded-lg border border-white/10 bg-gray-800 p-2">
                      <div className="flex flex-wrap gap-2">
                        {emails.map((email, index) => (
                          <div 
                            key={index} 
                            className="inline-flex items-center gap-1 rounded-full bg-blue-900/40 px-3 py-1 text-xs text-blue-300"
                          >
                            <span>{email}</span>
                            <button
                              onClick={() => handleRemoveEmail(email)}
                              className="ml-1 rounded-full p-0.5 text-blue-300 hover:bg-blue-800 hover:text-white"
                              disabled={isInviting}
                            >
                              <X className="h-3 w-3" />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
                
                <div className="mt-6 flex justify-end gap-3">
                  <button
                    onClick={() => setShowInviteModal(false)}
                    className="rounded-md border border-white/10 bg-gray-800 px-4 py-2 text-white hover:bg-gray-700 disabled:opacity-50"
                    disabled={isInviting}
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={sendInvitations}
                    className="rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 disabled:opacity-50"
                    disabled={emails.length === 0 || isInviting}
                  >
                    {isInviting ? (
                      <span className="flex items-center gap-2">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Enviando...
                      </span>
                    ) : (
                      'Enviar invitaciones'
                    )}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Vista completa móvil para ver invitaciones */}
      {showMobileInvitationsView && (
        <div className="fixed inset-x-0 top-16 bottom-0 z-50 bg-gray-900 md:hidden">
          <div className="flex h-full flex-col">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-white/10 p-4">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setShowMobileInvitationsView(false)}
                  className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20"
                >
                  <ArrowLeft className="h-5 w-5" />
                </button>
                <h2 className="text-lg font-semibold text-white">Invitaciones pendientes</h2>
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-4">
              {invitaciones.length === 0 ? (
                <div className="text-center py-12">
                  <UserPlus className="mx-auto h-16 w-16 text-gray-500" />
                  <h3 className="mt-4 text-xl font-medium text-gray-300">No hay invitaciones pendientes</h3>
                  <p className="mt-2 text-gray-400">Todas las invitaciones han sido aceptadas o han expirado</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {invitaciones.map((invitacion) => (
                    <div key={invitacion.id} className="flex items-center justify-between rounded-lg border border-white/10 bg-white/5 p-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-600/20 text-blue-400">
                          <UserPlus className="h-6 w-6" />
                        </div>
                        <div>
                          <h4 className="font-medium text-white">{invitacion.correo_invitado || invitacion.correo}</h4>
                          <div className="flex items-center gap-2 text-sm text-gray-400">
                            <span>Rol: {invitacion.rol}</span>
                            <span>•</span>
                            <span>Enviada: {new Date(invitacion.fecha_invitacion).toLocaleDateString('es-ES')}</span>
                          </div>
                          {invitacion.expira_en && (
                            <div className="text-sm text-gray-400">
                              Expira: {new Date(invitacion.expira_en).toLocaleDateString('es-ES')}
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="rounded-full bg-yellow-500/20 px-3 py-1 text-xs text-yellow-400">
                          Pendiente
                        </span>
                        <button
                          onClick={() => handleCancelInvitation(invitacion.id)}
                          className="rounded-full bg-red-500/10 p-2 text-red-400 hover:bg-red-500/20"
                          title="Cancelar invitación"
                        >
                          <X className="h-5 w-5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="border-t border-white/10 p-4">
              <button
                onClick={() => setShowMobileInvitationsView(false)}
                className="w-full rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de confirmación para salir del grupo */}
      {showLeaveModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70">
          <div className="w-full max-w-md rounded-lg border border-white/10 bg-gray-900 p-6 shadow-xl">
            <div className="mb-4 flex items-center gap-3 text-red-400">
              <AlertCircle className="h-6 w-6" />
              <h3 className="text-lg font-semibold">Salir del grupo</h3>
            </div>
            
            <p className="mb-4 text-gray-300">
              ¿Estás seguro de que deseas salir de este grupo? No podrás volver a unirte sin una nueva invitación.
            </p>
            
            {leaveError && (
              <div className="mb-4 rounded-md bg-red-900/30 p-3 text-sm text-red-400">
                {leaveError}
              </div>
            )}
            
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowLeaveModal(false)}
                className="rounded-md border border-white/10 bg-gray-800 px-4 py-2 text-white hover:bg-gray-700"
                disabled={isLeaving}
              >
                Cancelar
              </button>
              <button
                onClick={handleLeaveGroup}
                className="rounded-md bg-red-600 px-4 py-2 text-white hover:bg-red-700 disabled:opacity-50"
                disabled={isLeaving}
              >
                {isLeaving ? (
                  <span className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Saliendo...
                  </span>
                ) : (
                  'Salir del grupo'
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal para ver todas las invitaciones pendientes */}
      {showInvitacionesModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70">
          <div className="w-full max-w-2xl rounded-lg border border-white/10 bg-gray-900 p-6 shadow-xl max-h-[80vh] overflow-hidden">
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-3 text-blue-400">
                <UserPlus className="h-6 w-6" />
                <h3 className="text-lg font-semibold">Invitaciones pendientes</h3>
              </div>
              <button
                onClick={() => setShowInvitacionesModal(false)}
                className="rounded-full bg-gray-800 p-1 text-gray-400 hover:bg-gray-700 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="overflow-y-auto max-h-[60vh]">
              {invitaciones.length === 0 ? (
                <div className="text-center py-8">
                  <UserPlus className="mx-auto h-12 w-12 text-gray-500" />
                  <h3 className="mt-4 text-lg font-medium text-gray-300">No hay invitaciones pendientes</h3>
                  <p className="mt-1 text-gray-400">Todas las invitaciones han sido aceptadas o han expirado</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {invitaciones.map((invitacion) => (
                    <div key={invitacion.id} className="flex items-center justify-between rounded-lg border border-white/10 bg-white/5 p-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-600/20 text-blue-400">
                          <UserPlus className="h-5 w-5" />
                        </div>
                      <div>
                        <h4 className="font-medium text-white">{invitacion.correo}</h4>
                        <div className="flex items-center gap-2 text-sm text-gray-400">
                          <span>Estado: {invitacion.estado}</span>
                          <span>•</span>
                          <span>Enviada: {new Date(invitacion.fecha_invitacion).toLocaleDateString('es-ES')}</span>
                          {invitacion.expira_en && (
                            <>
                              <span>•</span>
                              <span>Expira: {new Date(invitacion.expira_en).toLocaleDateString('es-ES')}</span>
                            </>
                          )}
                        </div>
                      </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="rounded-full bg-yellow-500/20 px-2 py-1 text-xs text-yellow-400">
                          Pendiente
                        </span>
                        <button
                          onClick={() => handleCancelInvitation(invitacion.id)}
                          className="rounded-full bg-red-500/10 p-2 text-red-400 hover:bg-red-500/20"
                          title="Cancelar invitación"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setShowInvitacionesModal(false)}
                className="rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de cambio de rol */}
      {showRoleModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70">
          <div className="w-full max-w-md rounded-lg border border-white/10 bg-gray-900 p-6 shadow-xl">
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-3 text-blue-400">
                <Settings className="h-6 w-6" />
                <h3 className="text-lg font-semibold">Cambiar rol del miembro</h3>
              </div>
              <button
                onClick={() => setShowRoleModal(false)}
                className="rounded-full bg-gray-800 p-1 text-gray-400 hover:bg-gray-700 hover:text-white"
                disabled={isChangingRole}
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <p className="mb-4 text-gray-300">
              Selecciona el nuevo rol para este miembro:
            </p>

            {roleChangeError && (
              <div className="mb-4 rounded-md bg-red-900/30 p-3 text-sm text-red-400">
                {roleChangeError}
              </div>
            )}

            <div className="mb-6">
              <label className="mb-3 block text-sm font-medium text-gray-400">
                Nuevo rol
              </label>
              <div className="space-y-2">
                <label className="flex items-center gap-3 rounded-lg border border-white/10 bg-gray-800 p-3 cursor-pointer hover:bg-gray-700">
                  <input
                    type="radio"
                    name="role"
                    value="miembro"
                    checked={newRole === 'miembro'}
                    onChange={(e) => setNewRole(e.target.value as 'miembro' | 'administrador')}
                    className="text-blue-500 focus:ring-blue-500"
                    disabled={isChangingRole}
                  />
                  <div>
                    <div className="font-medium text-white">Miembro</div>
                    <div className="text-sm text-gray-400">Puede ver y registrar progreso, pero no gestionar el grupo</div>
                  </div>
                </label>

                <label className="flex items-center gap-3 rounded-lg border border-white/10 bg-gray-800 p-3 cursor-pointer hover:bg-gray-700">
                  <input
                    type="radio"
                    name="role"
                    value="administrador"
                    checked={newRole === 'administrador'}
                    onChange={(e) => setNewRole(e.target.value as 'miembro' | 'administrador')}
                    className="text-blue-500 focus:ring-blue-500"
                    disabled={isChangingRole}
                  />
                  <div>
                    <div className="font-medium text-white">Administrador</div>
                    <div className="text-sm text-gray-400">Puede gestionar miembros y configuraciones del grupo</div>
                  </div>
                </label>
              </div>
            </div>

            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowRoleModal(false)}
                className="rounded-md border border-white/10 bg-gray-800 px-4 py-2 text-white hover:bg-gray-700 disabled:opacity-50"
                disabled={isChangingRole}
              >
                Cancelar
              </button>
              <button
                onClick={handleChangeRole}
                className="rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 disabled:opacity-50"
                disabled={isChangingRole}
              >
                {isChangingRole ? (
                  <span className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Cambiando...
                  </span>
                ) : (
                  'Cambiar rol'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default HabitoGrupalDetalle;
