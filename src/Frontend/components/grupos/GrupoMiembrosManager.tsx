import React, { useState, useEffect } from 'react';
import { useAuth } from '@clerk/clerk-react';
import { GrupoControl } from '../../../Backend/Controlador/GrupoControl';
import { Trash2, Send, X, Loader2, CheckCircle, Users } from 'lucide-react';
import { MiembroGrupoDTO } from '../../../Backend/Dto/GrupoDTO';

interface GrupoMiembrosManagerProps {
  grupoId: string;
  onMembersChanged?: () => void;
}

const GrupoMiembrosManager: React.FC<GrupoMiembrosManagerProps> = ({ grupoId, onMembersChanged }) => {
  const { getToken, userId } = useAuth();
  const grupoControl = new GrupoControl();
  
  const [miembros, setMiembros] = useState<MiembroGrupoDTO[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<'miembro' | 'administrador'>('miembro');
  const [isSending, setIsSending] = useState(false);
  const [inviteSuccess, setInviteSuccess] = useState<string | null>(null);
  const [isRemoving, setIsRemoving] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);

  // Get all members
  useEffect(() => {
    const cargarMiembros = async () => {
      if (!grupoId) {
        return;
      }
      
      try {
        setIsLoading(true);
        const authToken = await getToken();
        if (!authToken) {
          setError('No hay token de autenticación. Por favor, inicia sesión.');
          setIsLoading(false);
          return;
        }

        const data = await grupoControl.obtenerMiembrosGrupo(grupoId, authToken);
        setMiembros(data);
        
        // Find current user's role
        const currentUserMember = data.find(miembro => miembro.id_usuario === userId);
        if (currentUserMember) {
          setUserRole(currentUserMember.rol);
        }
      } catch (error) {
        console.error('Error al cargar miembros del grupo:', error);
        setError(error instanceof Error ? error.message : 'Error al cargar miembros del grupo');
      } finally {
        setIsLoading(false);
      }
    };

    cargarMiembros();
  }, [grupoId, getToken, userId, grupoControl]);

  // Send invitation
  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!inviteEmail.trim()) return;
    
    try {
      setIsSending(true);
      setInviteSuccess(null);
      setError(null);
      
      const authToken = await getToken();
      if (!authToken) {
        setError('No hay token de autenticación. Por favor, inicia sesión.');
        setIsSending(false);
        return;
      }

      setInviteSuccess(`Invitación enviada a ${inviteEmail} con éxito`);
      setInviteEmail('');
      setInviteRole('miembro');
      
      // Call callback if provided
      if (onMembersChanged) {
        onMembersChanged();
      }
    } catch (error) {
      console.error('❌ Error al enviar invitación desde GrupoMiembrosManager:', error);
      setError(error instanceof Error ? error.message : 'Error al enviar la invitación');
    } finally {
      setIsSending(false);
    }
  };

  // Remove member
  const handleRemoveMember = async (miembroId: string) => {
    if (!grupoId || !miembroId) return;
    
    try {
      setIsRemoving(miembroId);
      setError(null);
      
      const authToken = await getToken();
      if (!authToken) {
        setError('No hay token de autenticación. Por favor, inicia sesión.');
        setIsRemoving(null);
        return;
      }

      await grupoControl.eliminarMiembroGrupo(grupoId, miembroId, authToken);
      
      // Update members list
      setMiembros(prevMiembros => prevMiembros.filter(m => m.id !== miembroId));
      
      // Call callback if provided
      if (onMembersChanged) {
        onMembersChanged();
      }
    } catch (error) {
      console.error('Error al eliminar miembro:', error);
      setError(error instanceof Error ? error.message : 'Error al eliminar al miembro del grupo');
    } finally {
      setIsRemoving(null);
    }
  };

  // Check if the current user can manage members (admin or owner)
  const canManageMembers = userRole === 'administrador' || userRole === 'owner';

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="mt-2 text-sm text-gray-500">Cargando miembros del grupo...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-md">
        <p className="text-red-600">{error}</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
      <div className="p-4 border-b border-gray-200">
        <h3 className="text-lg font-medium flex items-center gap-2">
          <Users className="h-5 w-5 text-primary" />
          Miembros del Grupo
        </h3>
      </div>

      {/* Invitation form */}
      {canManageMembers && (
        <div className="p-4 border-b border-gray-100">
          <form onSubmit={handleInvite} className="flex flex-col">
            <label htmlFor="inviteEmail" className="text-sm font-medium text-gray-700 mb-1">
              Invitar a nuevo miembro
            </label>
            <div className="flex items-center gap-2">
              <div className="relative flex-grow">
                <input
                  id="inviteEmail"
                  type="email"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  placeholder="Correo electrónico"
                  className="w-full px-3 py-2 border border-gray-300 rounded-l-md focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
                  required
                />
                {inviteEmail && (
                  <button
                    type="button"
                    onClick={() => setInviteEmail('')}
                    className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>
              <select
                value={inviteRole}
                onChange={(e) => setInviteRole(e.target.value as 'miembro' | 'administrador')}
                className="px-3 py-2 border border-gray-300 bg-white focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
              >
                <option value="miembro">Miembro</option>
                <option value="administrador">Administrador</option>
              </select>
              <button
                type="submit"
                disabled={isSending || !inviteEmail.trim()}
                className="flex items-center justify-center gap-1 px-4 py-2 bg-primary text-white rounded-r-md hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
                <span>Invitar</span>
              </button>
            </div>
            {inviteSuccess && (
              <div className="mt-2 text-sm text-green-600 flex items-center gap-1">
                <CheckCircle className="h-4 w-4" />
                {inviteSuccess}
              </div>
            )}
          </form>
        </div>
      )}

      {/* Members list */}
      <div className="p-4">
        <div className="divide-y divide-gray-100">
          {miembros.length === 0 ? (
            <p className="text-sm text-gray-500 py-2">No hay miembros en este grupo.</p>
          ) : (
            miembros.map((miembro) => (
              <div key={miembro.id} className="py-2 flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="flex-shrink-0">
                    {miembro.url_imagen ? (
                      <img
                        src={miembro.url_imagen}
                        alt={miembro.nombre_usuario}
                        className="h-8 w-8 rounded-full"
                      />
                    ) : (
                      <div className="h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center">
                        <span className="text-gray-500 text-sm">{miembro.nombre_usuario.charAt(0)}</span>
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900">{miembro.nombre_usuario}</p>
                    <p className="text-xs text-gray-500 truncate">{miembro.correo_usuario}</p>
                  </div>
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                    {miembro.rol === 'owner' ? 'Propietario' : miembro.rol === 'administrador' ? 'Administrador' : 'Miembro'}
                  </span>
                </div>
                
                {/* Remove button - owners can remove admins/members, admins can only remove members */}
                {(() => {
                  const isOwner = userRole === 'owner';
                  const isAdmin = userRole === 'administrador';
                  const isMember = miembro.rol === 'miembro';
                  const isOwnerMember = miembro.rol === 'owner';
                  const isNotCurrentUser = miembro.id_usuario !== userId;
                  
                  const canRemove = (isOwner && !isOwnerMember && isNotCurrentUser) || 
                                   (isAdmin && isMember && isNotCurrentUser);
                  
                  return canRemove;
                })() && (
                  <button
                    onClick={() => handleRemoveMember(miembro.id)}
                    disabled={isRemoving === miembro.id}
                    className="ml-2 p-1 text-gray-400 hover:text-red-500 focus:outline-none"
                    title="Eliminar miembro"
                  >
                    {isRemoving === miembro.id ? (
                      <Loader2 className="h-5 w-5 animate-spin" />
                    ) : (
                      <Trash2 className="h-5 w-5" />
                    )}
                  </button>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default GrupoMiembrosManager;
