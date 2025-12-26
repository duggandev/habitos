import { HabitoDTO, HabitoRespuestaDTO } from '../Dto/HabitoDTO';
import { GrupoInvitacionResponse } from '../Modelo/ApiModelos';

interface Grupo {
    id: string;
    nombre: string;
}

interface HabitoConRachas extends HabitoRespuestaDTO {
    rachas: {
        actual: number;
        mejor: number;
    };
    es_grupal: boolean;
    grupo?: Grupo;
    registro_hoy?: {
        completado: boolean;
        estado: string | null;
        comentario: string | null;
        fecha_local_usuario: string;
        puede_registrar: boolean;
    };
}

interface RegistroHabito {
    estado: 'exito' | 'fallo';
    comentario?: string;
}

interface RegistroRespuesta {
    id: string;
    fecha: string;
    estado: 'success' | 'fail';
    comentario?: string;
    rachas_usuario: {
        actual: number;
        mejor: number;
    };
}

export class HabitoDAO {
    private apiUrl: string;

    constructor() {
        this.apiUrl = import.meta.env.VITE_API;
    }

    async crearHabito(habito: HabitoDTO, token: string): Promise<HabitoRespuestaDTO> {
        try {
            if (!token) {
                throw new Error('No se proporcionó token de autenticación');
            }

            const response = await fetch(`${this.apiUrl}/habits`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(habito)
            });

            const responseData = await response.json();

            if (!response.ok) {
                let errorMessage = 'Error al crear el hábito';
                if (response.status === 403) {
                    errorMessage = 'No tienes permisos para crear hábitos. Verifica tu autenticación.';
                }
                if (responseData.message) {
                    errorMessage += `: ${responseData.message}`;
                }
                throw new Error(errorMessage);
            }

            return responseData;
        } catch (error) {
            throw error;
        }
    }

    async listarHabitos(token: string): Promise<HabitoConRachas[]> {
        try {
            const response = await fetch(`${this.apiUrl}/habits`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) {
                throw new Error('Error al obtener los hábitos');
            }

            return await response.json();
        } catch (error) {
            throw error;
        }
    }

    async registrarProgreso(habitId: string, registro: RegistroHabito, token: string): Promise<RegistroRespuesta> {
        try {

            const response = await fetch(`${this.apiUrl}/habits/${habitId}/entries`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(registro)
            });

            const responseData = await response.json();

            if (!response.ok) {
                throw new Error(`Error al registrar el progreso: ${responseData.message || 'Error desconocido'}`);
            }

            return responseData;
        } catch (error) {
            throw error;
        }
    }

    async eliminarHabito(habitId: string, token: string): Promise<void> {
        try {
            const response = await fetch(`${this.apiUrl}/habits/${habitId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) {
                throw new Error('Error al eliminar el hábito');
            }
        } catch (error) {
            throw error;
        }
    }

    async editarHabito(habitId: string, titulo: string, token: string): Promise<HabitoRespuestaDTO> {
        try {
            const response = await fetch(`${this.apiUrl}/habits/${habitId}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ titulo })
            });

            const responseData = await response.json();

            if (!response.ok) {
                let errorMessage = 'Error al editar el hábito';
                if (response.status === 403) {
                    errorMessage = 'No tienes permisos para editar hábitos. Verifica tu autenticación.';
                }
                if (responseData.error?.message) {
                    errorMessage += `: ${responseData.error.message}`;
                }
                throw new Error(errorMessage);
            }

            return responseData;
        } catch (error) {
            throw error;
        }
    }

    async obtenerUsuario(token: string) {
        try {
            const response = await fetch(`${this.apiUrl}/me`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) {
                throw new Error('Error al obtener información del usuario');
            }

            return await response.json();
        } catch (error) {
            throw error;
        }
    }

    // Obtiene todos los hábitos de un grupo específico
    async obtenerHabitosGrupales(idGrupo: string, token: string): Promise<HabitoRespuestaDTO[]> {
        try {
            const response = await fetch(`${this.apiUrl}/groups/${idGrupo}/habits`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                }
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.message || 'Error al obtener los hábitos grupales');
            }

            return await response.json();
        } catch (error) {
            throw error;
        }
    }

    // Obtiene los detalles de un hábito grupal específico
    async obtenerDetallesHabitoGrupal(idHabito: string, token: string): Promise<any> {
        try {
            const response = await fetch(`${this.apiUrl}/groups/habits/${idHabito}/details`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                }
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.message || 'Error al obtener los detalles del hábito grupal');
            }

            return await response.json();
        } catch (error) {
            throw error;
        }
    }
    
    // Elimina un miembro de un grupo
    async eliminarMiembroGrupo(idGrupo: string, idMiembro: string, token: string): Promise<{ ok: boolean }> {
        try {
            const response = await fetch(`${this.apiUrl}/groups/${idGrupo}/members/${idMiembro}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`,
                }
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.message || 'Error al eliminar al miembro del grupo');
            }

            return await response.json();
        } catch (error) {
            throw error;
        }
    }
    
    // Invitar múltiples usuarios a un grupo por correo electrónico (endpoint batch)
    async invitarMiembrosGrupo(idGrupo: string, emails: string[], token: string): Promise<GrupoInvitacionResponse> {
        try {
            const response = await fetch(`${this.apiUrl}/groups/${idGrupo}/invites/batch`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ correos: emails })
            });

            const responseData = await response.json();

            if (!response.ok) {
                throw new Error(responseData.message || 'Error al enviar invitaciones');
            }

            return responseData;
        } catch (error) {
            throw error;
        }
    }
    
    // Salir de un grupo (para miembros que no son propietarios ni administradores)
    async salirDeGrupo(idGrupo: string, token: string): Promise<{ ok: boolean }> {
        try {
            const response = await fetch(`${this.apiUrl}/groups/${idGrupo}/leave`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                }
            });

            const responseData = await response.json();

            if (!response.ok) {
                throw new Error(responseData.message || 'Error al salir del grupo');
            }

            return responseData;
        } catch (error) {
            throw error;
        }
    }

    // Cambiar rol de un miembro del grupo
    async cambiarRolMiembro(idGrupo: string, idMiembro: string, nuevoRol: 'miembro' | 'administrador', token: string): Promise<{ id_clerk: string; rol: string; mensaje: string }> {
        try {
            const response = await fetch(`${this.apiUrl}/groups/${idGrupo}/members/${idMiembro}/role`, {
                method: 'PATCH',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    rol: nuevoRol
                })
            });

            const responseData = await response.json();

            if (!response.ok) {
                throw new Error(responseData.message || 'Error al cambiar el rol del miembro');
            }

            return responseData;
        } catch (error) {
            throw error;
        }
    }
}
