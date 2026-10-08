import { afterEach, describe, expect, it, vi } from 'vitest'
import { ApiError, api, setOnUnauthorized, setToken } from '../../src/services/http'

const json = (body, status = 200) => new Response(JSON.stringify(body), { status })

afterEach(() => {
  setToken(null)
  setOnUnauthorized(null)
  vi.unstubAllGlobals()
})

describe('cliente del API', () => {
  it('envía el token y lee una página con total', async () => {
    const fetchMock = vi.fn(async () => json({ items: [{ id: 'a' }], total: 7, has_more: true }))
    vi.stubGlobal('fetch', fetchMock)
    setToken('token-x')
    const page = await api.page('siembras', { limit: 50 })
    expect(page).toEqual({ items: [{ id: 'a' }], total: 7, hasMore: true })
    const [url, init] = fetchMock.mock.calls[0]
    expect(url).toContain('/siembras?limit=50')
    expect(init.headers.Authorization).toBe('Bearer token-x')
  })

  it('list acepta lista directa o página', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => json([{ id: 1 }])))
    expect(await api.list('x')).toHaveLength(1)
    vi.stubGlobal('fetch', vi.fn(async () => json({ items: [{ id: 1 }, { id: 2 }] })))
    expect(await api.list('x')).toHaveLength(2)
  })

  it('los registros llevan clave de idempotencia distinta cada vez', async () => {
    const keys = []
    vi.stubGlobal('fetch', vi.fn(async (_url, init) => {
      keys.push(init.headers['Idempotency-Key'])
      return json({}, 201)
    }))
    await api.post('gastos', { monto: 1 }, { idempotent: true })
    await api.post('gastos', { monto: 1 }, { idempotent: true })
    expect(keys[0]).toBeTruthy()
    expect(keys[0]).not.toBe(keys[1])
  })

  it('un 401 con sesión avisa para cerrarla', async () => {
    const onUnauthorized = vi.fn()
    setOnUnauthorized(onUnauthorized)
    setToken('token-x')
    vi.stubGlobal('fetch', vi.fn(async () => json({ error: { code: 'TOKEN_INVALIDO', message: 'Sesión inválida.' } }, 401)))
    await expect(api.get('auth/me')).rejects.toMatchObject({ code: 'TOKEN_INVALIDO', status: 401, message: 'Sesión inválida.' })
    expect(onUnauthorized).toHaveBeenCalledOnce()
  })

  it('el login fallido no cierra sesión', async () => {
    const onUnauthorized = vi.fn()
    setOnUnauthorized(onUnauthorized)
    vi.stubGlobal('fetch', vi.fn(async () => json({ error: { message: 'Credenciales.' } }, 401)))
    await expect(api.login({ email: 'a', password: 'b' })).rejects.toBeInstanceOf(ApiError)
    expect(onUnauthorized).not.toHaveBeenCalled()
  })

  it('sin red da un mensaje claro', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => {
      throw new TypeError('network')
    }))
    await expect(api.get('x')).rejects.toThrow(/conexión/)
  })

  it('una respuesta ilegible da un error claro', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => new Response('no es json', { status: 200 })))
    await expect(api.get('x')).rejects.toBeInstanceOf(ApiError)
  })
})
