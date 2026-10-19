import { api } from './http'

export const USER_ROLES = [
  ['agricultor', 'Agricultor'],
  ['contador', 'Contador'],
  ['experto', 'Experto'],
  ['admin', 'Administrador'],
]

export async function createUser({ email, name, password, role }) {
  const j = await api.post('usuarios', { email, nombre: name, password, rol: role }, { idempotent: true })
  return { id: j.id, email: j.email, name: j.nombre, role: j.rol, active: j.activo === true }
}
