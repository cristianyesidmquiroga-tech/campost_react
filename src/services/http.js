const BASE = (import.meta.env.VITE_API_URL || 'http://localhost:8000').replace(/\/+$/, '')

export class ApiError extends Error {
  constructor(message, status = 0, code = null) {
    super(message)
    this.status = status
    this.code = code
  }
}

const DEFAULT_MESSAGES = {
  401: 'El correo o la contraseña no son válidos.',
  403: 'No tiene permiso para realizar esta acción.',
  404: 'No encontramos ese recurso.',
  409: 'La operación entra en conflicto con los datos actuales.',
}

let token = null
let onUnauthorized = () => {}

export const setToken = (value) => {
  token = value
}
export const setOnUnauthorized = (handler) => {
  onUnauthorized = handler ?? (() => {})
}

export function newIdempotencyKey() {
  const bytes = new Uint8Array(16)
  crypto.getRandomValues(bytes)
  return Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('')
}

function buildUrl(path, query) {
  const url = new URL(`${BASE}/${path.replace(/^\/+/, '')}`, window.location.origin)
  Object.entries(query ?? {}).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') url.searchParams.set(key, String(value))
  })
  return url.toString()
}

async function request(method, path, { query, body, idempotent = false, auth = true } = {}) {
  const headers = { Accept: 'application/json' }
  if (body !== undefined) headers['Content-Type'] = 'application/json'
  if (auth && token) headers.Authorization = `Bearer ${token}`
  if (idempotent) headers['Idempotency-Key'] = newIdempotencyKey()

  let response
  try {
    response = await fetch(buildUrl(path, query), {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
    })
  } catch {
    throw new ApiError('No hay conexión con el servidor. Revise su señal e intente de nuevo.')
  }

  let data = null
  const text = await response.text()
  if (text) {
    try {
      data = JSON.parse(text)
    } catch {
      throw new ApiError('El servidor devolvió una respuesta que no se pudo leer.', response.status)
    }
  }

  if (response.ok) return data ?? {}

  if (response.status === 401 && auth && token) onUnauthorized()
  const error = data?.error
  const message =
    typeof error?.message === 'string'
      ? error.message
      : (DEFAULT_MESSAGES[response.status] ?? 'No se pudo completar la solicitud. Intente de nuevo.')
  throw new ApiError(message, response.status, error?.code ?? null)
}

export const api = {
  get: (path, query) => request('GET', path, { query }),
  post: (path, body, options = {}) => request('POST', path, { body: body ?? {}, ...options }),
  patch: (path, body) => request('PATCH', path, { body }),
  put: (path, body) => request('PUT', path, { body }),
  delete: (path) => request('DELETE', path),
  public: (path) => request('GET', path, { auth: false }),
  login: (body) => request('POST', 'auth/login', { body, auth: false }),

  async list(path, query) {
    const data = await request('GET', path, { query })
    if (Array.isArray(data)) return data
    if (Array.isArray(data?.items)) return data.items
    throw new ApiError('La respuesta del servidor no se pudo leer.')
  },

  async page(path, query) {
    const data = await request('GET', path, { query })
    const items = Array.isArray(data) ? data : Array.isArray(data?.items) ? data.items : null
    if (!items) throw new ApiError('La respuesta del servidor no se pudo leer.')
    return { items, total: data?.total ?? items.length, hasMore: data?.has_more === true }
  },
}
