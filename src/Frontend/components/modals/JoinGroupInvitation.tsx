import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@clerk/clerk-react';
import { Check, X, Loader2, Users, ArrowRight } from 'lucide-react';
import { GrupoControl } from '../../../Backend/Controlador/GrupoControl';

interface Invitation {
  id: string;
  token: string;
  email: string;
  status: string;
  expires_at: string;
}

interface Group {
  id: string;
  name: string;
  description?: string;
}

interface Inviter {
  id: string;
  name: string;
}

interface InvitationResponse {
  invitation: Invitation;
  group: Group;
  inviter: Inviter;
}

const JoinGroupInvitation: React.FC = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const navigate = useNavigate();
  const { getToken } = useAuth();
  // Crear la instancia de GrupoControl fuera del componente
  // para evitar recreaciones que generen múltiples solicitudes
  const [invitationData, setInvitationData] = useState<InvitationResponse | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isAccepting, setIsAccepting] = useState<boolean>(false);
  const [isRejecting, setIsRejecting] = useState<boolean>(false);
  const [success, setSuccess] = useState<{ message: string; groupId: string } | null>(null);
  const [hasAttemptedFetch, setHasAttemptedFetch] = useState<boolean>(false);

  // Fetch invitation data
  useEffect(() => {
    // Evitar múltiples solicitudes usando una bandera de control
    if (hasAttemptedFetch) return;
    
    const fetchInvitationData = async () => {
      if (!token) {
        setError('No se ha proporcionado un token de invitación válido');
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        setHasAttemptedFetch(true); // Marcar que ya se intentó hacer la solicitud
        
        const authToken = await getToken();
        if (!authToken) {
          setError('No hay token de autenticación. Por favor, inicia sesión.');
          setIsLoading(false);
          return;
        }

        const grupoControl = new GrupoControl();
        const data = await grupoControl.verificarInvitacionPorToken(token, authToken);
        setInvitationData(data);
      } catch (error) {
        console.error('Error al obtener datos de la invitación:', error);
        setError(error instanceof Error ? error.message : 'Error al verificar la invitación');
      } finally {
        setIsLoading(false);
      }
    };

    fetchInvitationData();
  }, [token, getToken, hasAttemptedFetch]);

  // Handle accept invitation
  const handleAccept = async () => {
    if (!token) return;

    try {
      setIsAccepting(true);
      const authToken = await getToken();
      if (!authToken) {
        setError('No hay token de autenticación. Por favor, inicia sesión.');
        setIsAccepting(false);
        return;
      }

      const grupoControl = new GrupoControl();
      const data = await grupoControl.aceptarInvitacionPorToken(token, authToken);
      setSuccess({
        message: `¡Te has unido a ${data.nombre_grupo} con éxito!`,
        groupId: data.id_grupo
      });
    } catch (error) {
      console.error('Error al aceptar la invitación:', error);
      setError(error instanceof Error ? error.message : 'Error al aceptar la invitación');
    } finally {
      setIsAccepting(false);
    }
  };

  // Handle reject invitation
  const handleReject = async () => {
    if (!token) return;

    try {
      setIsRejecting(true);
      const authToken = await getToken();
      if (!authToken) {
        setError('No hay token de autenticación. Por favor, inicia sesión.');
        setIsRejecting(false);
        return;
      }

      const grupoControl = new GrupoControl();
      await grupoControl.rechazarInvitacionPorToken(token, authToken);
      setSuccess({
        message: 'Has rechazado la invitación al grupo',
        groupId: '' // No group ID for redirect since we're rejecting
      });
    } catch (error) {
      console.error('Error al rechazar la invitación:', error);
      setError(error instanceof Error ? error.message : 'Error al rechazar la invitación');
    } finally {
      setIsRejecting(false);
    }
  };

  // If success, redirect after a delay
  useEffect(() => {
    if (success) {
      // Set a flag in sessionStorage to indicate that the dashboard should refresh data
      // when the user is redirected there
      sessionStorage.setItem('refreshHabits', 'true');
      
      const timer = setTimeout(() => {
        // Always navigate to the home page (dashboard) where habits are displayed
        navigate('/dashboard');
      }, 2000);

      return () => clearTimeout(timer);
    }
  }, [success, navigate]);

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center px-4">
        <div className="rounded-2xl border border-white/10 bg-gray-900/60 p-8 w-full max-w-md text-center">
          <div className="flex justify-center mb-6">
            <Loader2 className="h-12 w-12 text-blue-500 animate-spin" />
          </div>
          <h2 className="text-xl font-semibold text-white mb-2">
            Verificando invitación...
          </h2>
          <p className="text-gray-400">
            Estamos obteniendo los detalles de tu invitación al grupo
          </p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center px-4">
        <div className="rounded-2xl border border-red-500/20 bg-gray-900/60 p-8 w-full max-w-md text-center">
          <div className="flex justify-center mb-6">
            <div className="rounded-full bg-red-500/10 p-3">
              <X className="h-8 w-8 text-red-500" />
            </div>
          </div>
          <h2 className="text-xl font-semibold text-white mb-2">
            Error al verificar la invitación
          </h2>
          <p className="text-gray-400 mb-6">
            {error}
          </p>
          <button
            onClick={() => navigate('/dashboard')}
            className="w-full rounded-lg bg-blue-600 px-4 py-2 font-medium text-white hover:bg-blue-700"
          >
            Volver al inicio
          </button>
        </div>
      </div>
    );
  }

  // Success state
  if (success) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center px-4">
        <div className="rounded-2xl border border-green-500/20 bg-gray-900/60 p-8 w-full max-w-md text-center">
          <div className="flex justify-center mb-6">
            <div className="rounded-full bg-green-500/10 p-3">
              <Check className="h-8 w-8 text-green-500" />
            </div>
          </div>
          <h2 className="text-xl font-semibold text-white mb-2">
            {success.message}
          </h2>
          <p className="text-gray-400 mb-6">
            Serás redirigido en unos momentos...
          </p>
          <button
            onClick={() => navigate('/dashboard')}
            className="w-full rounded-lg bg-blue-600 px-4 py-2 font-medium text-white hover:bg-blue-700"
          >
            Ir al inicio
          </button>
        </div>
      </div>
    );
  }

  // Normal state - showing invitation details
  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center px-4">
      <div className="rounded-2xl border border-white/10 bg-gray-900/60 p-8 w-full max-w-md">
        <div className="flex justify-center mb-6">
          <div className="rounded-full bg-blue-500/10 p-3">
            <Users className="h-8 w-8 text-blue-500" />
          </div>
        </div>
        
        <h2 className="text-2xl font-bold text-white text-center mb-6">
          Invitación a grupo
        </h2>
        
        <div className="space-y-6">
          <div className="rounded-xl border border-white/10 bg-white/5 p-4">
            <h3 className="text-lg font-semibold text-white mb-1">
              {invitationData?.group.name}
            </h3>
            {invitationData?.group.description && (
              <p className="text-gray-400 text-sm">
                {invitationData.group.description}
              </p>
            )}
          </div>
          
          <div className="text-center">
            <p className="text-gray-300">
              <span className="font-semibold text-white">{invitationData?.inviter.name}</span> te ha invitado a unirte a este grupo
            </p>
          </div>
          
          <div className="grid grid-cols-2 gap-4 pt-4">
            <button
              onClick={handleReject}
              disabled={isRejecting || isAccepting}
              className="flex items-center justify-center gap-2 rounded-lg border border-white/10 bg-white/5 px-4 py-3 font-medium text-white hover:bg-white/10 disabled:opacity-50"
            >
              {isRejecting ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <X className="h-5 w-5 text-red-400" />
              )}
              Rechazar
            </button>
            
            <button
              onClick={handleAccept}
              disabled={isAccepting || isRejecting}
              className="flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-3 font-medium text-white hover:bg-blue-700 disabled:opacity-50"
            >
              {isAccepting ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <Check className="h-5 w-5" />
              )}
              Aceptar
            </button>
          </div>
          
          <div className="pt-4 text-center">
            <button
              onClick={() => navigate('/dashboard')}
              className="text-sm text-gray-400 hover:text-white flex items-center justify-center gap-1 mx-auto"
            >
              Volver al inicio
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default JoinGroupInvitation;
