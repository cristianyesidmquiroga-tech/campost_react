import { api, setToken } from './http'

const TOKEN_KEY = 'agrogestion_access_token'

const readStored = () => {
  try {
    return localStorage.getItem(TOKEN_KEY)
  } catch {
    return null
  }
}

const writeStored = (value) => {
  try {
    if (value) localStorage.setItem(TOKEN_KEY, value)
    else localStorage.removeItem(TOKEN_KEY)
  } catch {
    // almacenamiento no disponible
  }
}

const toSession = (token, profile) => ({
  token,
  userId: profile.id ?? '',
  email: profile.email ?? '',
  name: profile.nombre ?? 'Usuario',
  role: profile.rol ?? 'agricultor',
  farmIds: profile.fincas ?? [],
  permissions: (profile.permisos ?? []).map((p) => ({
    method: String(p.metodo ?? '').toUpperCase(),
    route: p.ruta ?? '',
  })),
})

export async function signIn(email, password) {
  const response = await api.login({ email: email.trim(), password })
  const token = response.access_token
  if (typeof token !== 'string' || !token) throw new Error('El servidor no entregó una sesión válida.')
  setToken(token)
  const profile = await api.get('auth/me')
  writeStored(token)
  return toSession(token, profile)
}

export async function restoreSession() {
  const token = readStored()
  if (!token) return null
  setToken(token)
  try {
    return toSession(token, await api.get('auth/me'))
  } catch {
    signOut()
    return null
  }
}

export const changePassword = (current, next) => api.post('cuenta/cambiar-clave', { clave_actual: current, clave_nueva: next })

export function signOut() {
  setToken(null)
  writeStored(null)
}
