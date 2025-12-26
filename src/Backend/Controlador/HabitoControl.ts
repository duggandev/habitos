import { HabitoDAO } from '../Dao/HabitoDAO';
import { HabitoDTO, HabitoRespuestaDTO } from '../Dto/HabitoDTO';
import { GrupoInvitacionResponse } from '../Modelo/ApiModelos';

interface RegistroHabito {
    estado: 'exito' | 'fallo';
    comentario?: string;
}

export class HabitoControl {
    private habitoDAO: HabitoDAO;

    constructor() {
        this.habitoDAO = new HabitoDAO();
    }

    async crearHabito(habito: HabitoDTO, token: string): Promise<HabitoRespuestaDTO> {
        try {
            // Validaciones básicas
            if (!token) {
                throw new Error('Token de autenticación requerido');
            }

            if (!habito.titulo || !habito.tipo) {
                throw new Error('Título y tipo son requeridos');
            }

            if (!['hacer', 'dejar'].includes(habito.tipo)) {
                throw new Error('Tipo de hábito inválido');
            }

            const resultado = await this.habitoDAO.crearHabito(habito, token);
            return resultado;
        } catch (error) {
            throw error;
        }
    }

    async obtenerUsuario(token: string) {
        try {
            return await this.habitoDAO.obtenerUsuario(token);
        } catch (error) {
            throw error;
        }
    }

    async listarHabitos(token: string): Promise<any[]> {
        try {
            const habitos = await this.habitoDAO.listarHabitos(token);
            
            // Procesar correctamente los hábitos grupales
            return habitos.map(habito => {
                // Si el hábito tiene la propiedad 'es_grupal' y 'grupo', asegurarnos de que está correctamente formateado
                if (habito.es_grupal && 'grupo' in habito) {
                    const grupo = (habito as any).grupo;
                    if (grupo && typeof grupo === 'object') {
                        return {
                            ...habito,
                            grupo: {
                                id: grupo.id,
                                nombre: grupo.nombre
                            }
                        };
                    }
                }
                return habito;
            });
        } catch (error) {
            throw error;
        }
    }

    async eliminarHabito(id: string, token: string) {
        try {
            await this.habitoDAO.eliminarHabito(id, token);
        } catch (error) {
            throw error;
        }
    }

    async editarHabito(id: string, titulo: string, token: string): Promise<HabitoRespuestaDTO> {
        try {
            // Validaciones básicas
            if (!token) {
                throw new Error('Token de autenticación requerido');
            }

            if (!titulo || titulo.trim() === '') {
                throw new Error('El título del hábito es requerido');
            }

            const resultado = await this.habitoDAO.editarHabito(id, titulo, token);
            return resultado;
        } catch (error) {
            throw error;
        }
    }

    async registrarProgreso(habitId: string, registro: RegistroHabito, token: string) {
        try {
            // Validaciones
            if (!['exito', 'fallo'].includes(registro.estado)) {
                throw new Error('Estado inválido');
            }

            if (!token) {
                throw new Error('Token de autenticación requerido');
            }

            const resultado = await this.habitoDAO.registrarProgreso(habitId, registro, token);
            
            return resultado;
        } catch (error) {
            throw error;
        }
    }

    // Obtiene la lista de todos los hábitos grupales de un grupo específico
    async obtenerHabitosGrupales(idGrupo: string, token: string): Promise<HabitoRespuestaDTO[]> {
        try {
            if (!token) {
                throw new Error('Token de autenticación requerido');
            }

            if (!idGrupo) {
                throw new Error('ID del grupo es requerido');
            }

            return await this.habitoDAO.obtenerHabitosGrupales(idGrupo, token);
        } catch (error) {
            throw error;
        }
    }

    // Obtiene los detalles de un hábito grupal específico
    async obtenerDetallesHabitoGrupal(idHabito: string, token: string): Promise<any> {
        try {
            if (!token) {
                throw new Error('Token de autenticación requerido');
            }

            if (!idHabito) {
                throw new Error('ID del hábito es requerido');
            }

            return await this.habitoDAO.obtenerDetallesHabitoGrupal(idHabito, token);
        } catch (error) {
            throw error;
        }
    }
    
    // Elimina un miembro de un grupo
    async eliminarMiembroGrupo(idGrupo: string, idMiembro: string, token: string): Promise<{ ok: boolean }> {
        try {
            if (!token) {
                throw new Error('Token de autenticación requerido');
            }

            if (!idGrupo) {
                throw new Error('ID del grupo es requerido');
            }

            if (!idMiembro) {
                throw new Error('ID del miembro es requerido');
            }

            return await this.habitoDAO.eliminarMiembroGrupo(idGrupo, idMiembro, token);
        } catch (error) {
            throw error;
        }
    }
    
    // Invita a usuarios a un grupo por correo electrónico
    async invitarMiembrosGrupo(idGrupo: string, emails: string[], token: string): Promise<GrupoInvitacionResponse> {
        try {
            if (!token) {
                throw new Error('Token de autenticación requerido');
            }

            if (!idGrupo) {
                throw new Error('ID del grupo es requerido');
            }

            if (!emails || emails.length === 0) {
                throw new Error('Se requieren correos electrónicos para enviar invitaciones');
            }

            return await this.habitoDAO.invitarMiembrosGrupo(idGrupo, emails, token);
        } catch (error) {
            throw error;
        }
    }
    
    // Salir de un grupo (para miembros que no son propietarios ni administradores)
    async salirDeGrupo(idGrupo: string, token: string): Promise<{ ok: boolean }> {
        try {
            if (!token) {
                throw new Error('Token de autenticación requerido');
            }

            if (!idGrupo) {
                throw new Error('ID del grupo es requerido');
            }

            return await this.habitoDAO.salirDeGrupo(idGrupo, token);
        } catch (error) {
            throw error;
        }
    }

    // Cambiar rol de un miembro del grupo
    async cambiarRolMiembro(idGrupo: string, idMiembro: string, nuevoRol: 'miembro' | 'administrador', token: string): Promise<{ id_clerk: string; rol: string; mensaje: string }> {
        try {
            if (!token) {
                throw new Error('Token de autenticación requerido');
            }

            if (!idGrupo) {
                throw new Error('ID del grupo es requerido');
            }

            if (!idMiembro) {
                throw new Error('ID del miembro es requerido');
            }

            if (!['miembro', 'administrador'].includes(nuevoRol)) {
                throw new Error('Rol inválido. Debe ser "miembro" o "administrador"');
            }

            return await this.habitoDAO.cambiarRolMiembro(idGrupo, idMiembro, nuevoRol, token);
        } catch (error) {
            throw error;
        }
    }
}
