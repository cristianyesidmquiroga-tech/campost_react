import { screen, within } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { PLANTING_ID, createFakeBackend } from '../../src/dev/fakeApi'
import { zoneName } from '../../src/lib/dane'
import { formatCop, formatNumber, plural } from '../../src/lib/format'
import { gone, ready, renderApp } from '../support/harness'

const nav = () => within(screen.getByRole('navigation', { name: 'Principal' }))

describe('vistas por rol', () => {
  for (const role of ['admin', 'agricultor']) {
    it(`${role} ve cuatro pestañas y el registro rápido completo`, async () => {
      const { user } = await renderApp({ role })
      await ready('RESUMEN DE HOY')
      for (const tab of ['Inicio', 'Producción', 'Dinero', 'Más']) expect(nav().getByText(tab)).toBeInTheDocument()
      await user.click(screen.getByRole('button', { name: 'Registrar' }))
      for (const action of ['Labor con jornales', 'Gasto', 'Ingreso', 'Cosecha', 'Evento adverso']) {
        expect(await screen.findByText(action)).toBeInTheDocument()
      }
    })
  }

  it('el contador solo registra dinero', async () => {
    const { user } = await renderApp({ role: 'contador' })
    await ready('RESUMEN DE HOY')
    await user.click(screen.getByRole('button', { name: 'Registrar' }))
    expect(await screen.findByText('Gasto')).toBeInTheDocument()
    expect(screen.getByText('Ingreso')).toBeInTheDocument()
    expect(screen.queryByText('Labor con jornales')).not.toBeInTheDocument()
    expect(screen.queryByText('Cosecha')).not.toBeInTheDocument()
  })

  it('el experto solo ve Inicio y Más, sin registro', async () => {
    const { user } = await renderApp({ role: 'experto' })
    await ready('RESUMEN DE HOY')
    expect(nav().getByText('Inicio')).toBeInTheDocument()
    expect(nav().getByText('Más')).toBeInTheDocument()
    expect(nav().queryByText('Producción')).not.toBeInTheDocument()
    expect(nav().queryByText('Dinero')).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Registrar' })).not.toBeInTheDocument()
    await user.click(nav().getByText('Más'))
    await ready('OPERACIÓN DE CAMPO')
    expect(screen.queryByText('Trabajadores')).not.toBeInTheDocument()
    expect(screen.queryByText('Catálogo de cultivos')).not.toBeInTheDocument()
    expect(screen.getByText('Glosario del campo')).toBeInTheDocument()
  })

  it('el experto no entra a rutas de dinero', async () => {
    await renderApp({ role: 'experto', route: '/dinero' })
    await ready('RESUMEN DE HOY')
    expect(screen.queryByText('Dinero y finanzas')).not.toBeInTheDocument()
  })

  it('el agricultor no ve la utilidad y el contador sí', async () => {
    const farmer = await renderApp({ role: 'agricultor', route: '/dinero' })
    await ready('Ingresos del mes')
    expect(screen.queryByText('SALDO NETO DISPONIBLE')).not.toBeInTheDocument()
    farmer.unmount()

    await renderApp({ role: 'contador', route: '/dinero' })
    await ready('SALDO NETO DISPONIBLE')
  })

  it('anular un movimiento es del administrador y el contador', async () => {
    for (const [role, canCancel] of [['admin', true], ['agricultor', false], ['contador', true]]) {
      const { unmount } = await renderApp({ role, route: '/dinero/movimientos/g1000000-0000-4000-8000-000000000001' })
      await ready('TRAZABILIDAD')
      if (canCancel) expect(screen.getByRole('button', { name: 'Anular movimiento' })).toBeInTheDocument()
      else expect(screen.queryByRole('button', { name: 'Anular movimiento' })).not.toBeInTheDocument()
      unmount()
    }
  })

  it('el contador no inicia ni cancela siembras', async () => {
    await renderApp({ role: 'contador', route: '/produccion/siembras/s0000000-0000-4000-8000-000000000001' })
    await ready('ÍNDICES POR PLANTA')
    expect(screen.queryByRole('button', { name: 'Cancelar siembra' })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Registrar conteo de plantas' })).not.toBeInTheDocument()
  })

  it('sin consentimiento se pide la autorización y luego se entra', async () => {
    const { createFakeBackend } = await import('../../src/dev/fakeApi')
    const backend = createFakeBackend({ consentAccepted: false })
    const { user } = await renderApp({ role: 'agricultor', backend })
    await ready('Datos que se tratan'.toUpperCase())
    const accept = screen.getByRole('button', { name: 'Aceptar y continuar' })
    expect(accept).toBeDisabled()
    await user.click(screen.getAllByRole('checkbox')[0])
    await user.click(accept)
    await ready('RESUMEN DE HOY')
    expect(backend.options.consentAccepted).toBe(true)
    await gone('Sus datos')
  })

  it('solo administrador y contador marcan pagos', async () => {
    for (const [role, canPay] of [['admin', true], ['agricultor', false], ['contador', true]]) {
      const { unmount } = await renderApp({ role, route: '/mas/pagos' })
      await ready('Pedro Nel Builes')
      if (canPay) expect(screen.getByRole('button', { name: 'Marcar como pagado' })).toBeInTheDocument()
      else expect(screen.queryByRole('button', { name: 'Marcar como pagado' })).not.toBeInTheDocument()
      unmount()
    }
  })

  it('solo administrador y agricultor crean insumos y procesos', async () => {
    for (const [role, can] of [['admin', true], ['agricultor', true], ['contador', false]]) {
      const inv = await renderApp({ role, route: '/mas/inventario' })
      await ready('Fertilizante triple 15')
      expect(!!screen.queryByRole('button', { name: 'Nuevo insumo' })).toBe(can)
      inv.unmount()
      const proc = await renderApp({ role, route: '/mas/procesos' })
      await ready('Secado de bijao lote 1')
      expect(!!screen.queryByRole('button', { name: 'Nuevo proceso' })).toBe(can)
      proc.unmount()
    }
  })

  it('el experto no entra a pagos, inventario ni procesos', async () => {
    for (const route of ['/mas/pagos', '/mas/inventario', '/mas/procesos']) {
      const { unmount } = await renderApp({ role: 'experto', route })
      await ready('RESUMEN DE HOY')
      unmount()
    }
  })

  it('el menú Más muestra los accesos según el rol', async () => {
    const { user } = await renderApp({ role: 'contador', route: '/mas' })
    await ready('OPERACIÓN DE CAMPO')
    expect(screen.getByText('Pagos pendientes')).toBeInTheDocument()
    expect(screen.getByText('Insumos e inventario')).toBeInTheDocument()
    expect(user).toBeTruthy()
  })

  it('el experto no ve ni entra a los reportes', async () => {
    await renderApp({ role: 'experto', route: '/mas/reportes' })
    await ready('RESUMEN DE HOY')
    expect(screen.queryByText('Tiempos del ciclo')).not.toBeInTheDocument()
  })

  it('el contador ve los reportes en el menú Más', async () => {
    const { user } = await renderApp({ role: 'contador' })
    await ready('RESUMEN DE HOY')
    await user.click(nav().getByText('Más'))
    await ready('OPERACIÓN DE CAMPO')
    expect(screen.getByText('Índices, tiempos y eventos')).toBeInTheDocument()
  })

  it('el contador no entra al vivero', async () => {
    await renderApp({ role: 'contador', route: '/mas/vivero' })
    await ready('RESUMEN DE HOY')
    expect(screen.queryByText('Actualizar avance')).not.toBeInTheDocument()
  })

  it('el agricultor abre las tres hojas del vivero', async () => {
    const { user } = await renderApp({ role: 'agricultor', route: '/mas/vivero' })
    await ready('Actualizar avance')
    await user.click(screen.getByRole('button', { name: 'Actualizar avance' }))
    expect(await screen.findByRole('button', { name: 'Guardar avance' })).toBeInTheDocument()
    await user.keyboard('{Escape}')
    await user.click(screen.getByRole('button', { name: 'Trasplantar' }))
    expect(await screen.findByRole('button', { name: 'Registrar trasplante' })).toBeInTheDocument()
    await user.keyboard('{Escape}')
    await user.click(screen.getByRole('button', { name: /Nuevo lote/ }))
    expect(await screen.findByRole('button', { name: 'Guardar lote' })).toBeInTheDocument()
  })

  it('contador y experto no entran a los animales', async () => {
    for (const role of ['contador', 'experto']) {
      const { unmount } = await renderApp({ role, route: '/mas/animales' })
      await ready('RESUMEN DE HOY')
      expect(screen.queryByText('Vacas de ordeño')).not.toBeInTheDocument()
      unmount()
    }
  })

  it('el agricultor registra especie, lote y animal desde el botón Registrar', async () => {
    const { user } = await renderApp({ role: 'agricultor', route: '/mas/animales' })
    await ready('Vacas de ordeño')
    for (const [row, button] of [['Especie', 'Guardar especie'], ['Lote de animales', 'Guardar lote'], ['Animal', 'Guardar animal']]) {
      await user.click(screen.getByRole('button', { name: /Registrar/ }))
      await user.click(await screen.findByText(row))
      expect(await screen.findByRole('button', { name: button })).toBeInTheDocument()
      await user.keyboard('{Escape}')
    }
  })

  it('solo el administrador ve la calidad del asistente', async () => {
    const admin = await renderApp({ role: 'admin', route: '/mas/asistente' })
    await ready('Historial de consultas')
    expect(screen.getByText('Calidad del asistente')).toBeInTheDocument()
    admin.unmount()
    await renderApp({ role: 'agricultor', route: '/mas/asistente' })
    await ready('Historial de consultas')
    expect(screen.queryByText('Calidad del asistente')).not.toBeInTheDocument()
  })

  it('el experto y el contador no consultan al asistente', async () => {
    for (const role of ['experto', 'contador']) {
      const { unmount } = await renderApp({ role, route: '/mas/asistente' })
      await ready('RESUMEN DE HOY')
      expect(screen.queryByText('Historial de consultas')).not.toBeInTheDocument()
      unmount()
    }
  })

  it('el agricultor consulta al asistente y ve la respuesta', async () => {
    const { user } = await renderApp({ role: 'agricultor', route: '/mas/asistente' })
    await ready('Historial de consultas')
    await user.selectOptions(screen.getByLabelText('Siembra'), PLANTING_ID)
    await user.type(screen.getByLabelText('Qué está pasando'), 'Manchas amarillas en las hojas nuevas')
    await user.click(screen.getByRole('button', { name: 'Consultar' }))
    expect(await screen.findByText('Causas probables')).toBeInTheDocument()
  })

  it('todos los perfiles pueden cambiar su contraseña desde Mi cuenta', async () => {
    for (const role of ['admin', 'agricultor', 'contador', 'experto']) {
      const { user, unmount } = await renderApp({ role, route: '/mas/cuenta' })
      await user.click(await screen.findByRole('button', { name: 'Cambiar contraseña' }))
      expect(await screen.findByRole('button', { name: 'Guardar contraseña' })).toBeInTheDocument()
      unmount()
    }
  })

  it('el cambio de contraseña valida el largo y la confirmación', async () => {
    const { user } = await renderApp({ role: 'agricultor', route: '/mas/cuenta' })
    await user.click(await screen.findByRole('button', { name: 'Cambiar contraseña' }))
    await user.type(await screen.findByLabelText('Contraseña actual'), 'actual-1234')
    await user.type(screen.getByLabelText('Contraseña nueva'), 'corta')
    await user.type(screen.getByLabelText('Repita la contraseña nueva'), 'otra')
    await user.click(screen.getByRole('button', { name: 'Guardar contraseña' }))
    expect(await screen.findByText('Debe tener al menos 10 caracteres.')).toBeInTheDocument()
    expect(screen.getByText('Las contraseñas no coinciden.')).toBeInTheDocument()
  })

  it('el agricultor edita y anula una labor; el contador solo la mira', async () => {
    const farmer = await renderApp({ role: 'agricultor', route: '/produccion/labores/act-1' })
    await ready('Editar labor')
    expect(screen.getByRole('button', { name: 'Anular labor' })).toBeInTheDocument()
    await farmer.user.click(screen.getByRole('button', { name: 'Editar labor' }))
    expect(await screen.findByRole('button', { name: 'Guardar cambios' })).toBeInTheDocument()
    farmer.unmount()
    await renderApp({ role: 'contador', route: '/produccion/labores/act-1' })
    await ready('Socola y limpieza selectiva del lote')
    expect(screen.queryByRole('button', { name: 'Editar labor' })).not.toBeInTheDocument()
  })

  it('solo el administrador crea usuarios', async () => {
    const admin = await renderApp({ role: 'admin', route: '/mas/usuarios' })
    await admin.user.click(await screen.findByRole('tab', { name: 'Crear' }))
    expect(await screen.findByRole('button', { name: 'Crear usuario' })).toBeInTheDocument()
    admin.unmount()
    for (const role of ['agricultor', 'contador', 'experto']) {
      const { unmount } = await renderApp({ role, route: '/mas/usuarios' })
      await ready('RESUMEN DE HOY')
      expect(screen.queryByRole('button', { name: 'Crear usuario' })).not.toBeInTheDocument()
      unmount()
    }
  })

  it('el administrador valida y crea un usuario', async () => {
    const { user } = await renderApp({ role: 'admin', route: '/mas/usuarios' })
    await user.click(await screen.findByRole('tab', { name: 'Crear' }))
    await user.click(await screen.findByRole('button', { name: 'Crear usuario' }))
    expect(await screen.findByText('Escriba el nombre completo.')).toBeInTheDocument()
    expect(screen.getByText('Escriba un correo válido.')).toBeInTheDocument()
    await user.type(screen.getByLabelText('Nombre completo'), 'Persona Nueva')
    await user.type(screen.getByLabelText('Correo'), 'nuevo@demo.com')
    await user.type(screen.getByLabelText('Contraseña inicial'), 'clave-segura-1')
    await user.click(screen.getByRole('button', { name: 'Crear usuario' }))
    expect(await screen.findByText('nuevo@demo.com')).toBeInTheDocument()
  })

  it('el experto y el administrador revisan fichas; el agricultor no', async () => {
    for (const role of ['experto', 'admin']) {
      const { user, unmount } = await renderApp({ role, route: '/mas/conocimiento/revision' })
      await ready('Hojas con agujeros')
      await user.click(screen.getByRole('button', { name: 'Validar ficha' }))
      expect(await screen.findByRole('button', { name: 'Confirmar cambio' })).toBeInTheDocument()
      unmount()
    }
    await renderApp({ role: 'agricultor', route: '/mas/conocimiento/revision' })
    await ready('RESUMEN DE HOY')
    expect(screen.queryByText('Hojas con agujeros')).not.toBeInTheDocument()
  })

  it('solo el administrador gestiona fuentes y alertas', async () => {
    const admin = await renderApp({ role: 'admin', route: '/mas/alertas' })
    expect(await screen.findByRole('button', { name: 'Registrar fuente' })).toBeInTheDocument()
    admin.unmount()
    for (const role of ['agricultor', 'contador', 'experto']) {
      const { unmount } = await renderApp({ role, route: '/mas/alertas' })
      await ready('RESUMEN DE HOY')
      expect(screen.queryByRole('button', { name: 'Registrar fuente' })).not.toBeInTheDocument()
      unmount()
    }
  })

  it('el administrador valida, registra y sincroniza una fuente', async () => {
    const { user } = await renderApp({ role: 'admin', route: '/mas/alertas' })
    await user.click(await screen.findByRole('button', { name: 'Registrar fuente' }))
    expect(await screen.findByText('Escriba el nombre de la fuente.')).toBeInTheDocument()
    await user.type(screen.getByLabelText('Nombre de la fuente'), 'IDEAM')
    await user.type(screen.getByLabelText('Dirección de la fuente'), 'https://ideam.gov.co/alertas')
    await user.click(screen.getByRole('button', { name: 'Registrar fuente' }))
    await user.click(await screen.findByRole('button', { name: 'Sincronizar' }))
    expect(await screen.findByText('1 alertas encontradas en IDEAM.')).toBeInTheDocument()
  })

  it('el administrador ve los perfiles, abre uno y ve sus fincas', async () => {
    const { user } = await renderApp({ role: 'admin', route: '/mas/usuarios' })
    await user.click(await screen.findByText('Hernando Gómez Restrepo'))
    expect(await screen.findByText('Su movimiento')).toBeInTheDocument()
    expect(screen.getByText('Finca La Esperanza')).toBeInTheDocument()
    expect(screen.getByText(/Antioquia/)).toBeInTheDocument()
  })

  it('el administrador filtra los perfiles por rol', async () => {
    const { user, backend } = await renderApp({ role: 'admin', route: '/mas/usuarios' })
    await ready('Hernando Gómez Restrepo')
    const antes = backend.calls.filter((c) => c === 'GET usuarios').length
    await user.click(screen.getByRole('tab', { name: 'Contador' }))
    await vi.waitFor(() => expect(backend.calls.filter((c) => c === 'GET usuarios').length).toBeGreaterThan(antes))
  })

  it('los demás perfiles no ven los perfiles de usuarios', async () => {
    for (const role of ['agricultor', 'contador', 'experto']) {
      const { unmount } = await renderApp({ role, route: '/mas/usuarios/u-agricultor-1' })
      await ready('RESUMEN DE HOY')
      expect(screen.queryByText('Su movimiento')).not.toBeInTheDocument()
      unmount()
    }
  })

  it('solo el administrador entra al panel de control', async () => {
    const admin = await renderApp({ role: 'admin', route: '/mas/panel' })
    expect(await screen.findByText('Usuarios por rol')).toBeInTheDocument()
    admin.unmount()
    for (const role of ['agricultor', 'contador', 'experto']) {
      const { unmount } = await renderApp({ role, route: '/mas/panel' })
      await ready('RESUMEN DE HOY')
      expect(screen.queryByText('Usuarios por rol')).not.toBeInTheDocument()
      unmount()
    }
  })

  it('el panel muestra los totales que entrega la API', async () => {
    const backend = createFakeBackend()
    const pedir = async (ruta) => (await backend.fetch(`http://localhost:8000/${ruta}`, { headers: { Authorization: 'Bearer token-admin' } })).json()
    const resumen = await pedir('estadisticas/resumen')
    const costos = await pedir('estadisticas/costos')
    await renderApp({ role: 'admin', route: '/mas/panel', backend })
    expect(await screen.findByText(formatCop(resumen.gastos))).toBeInTheDocument()
    expect(screen.getByText(formatCop(resumen.utilidad))).toBeInTheDocument()
    expect(screen.getByText(plural(resumen.usuarios_activos, 'activo', 'activos'))).toBeInTheDocument()
    expect(resumen.gastos).toBe(costos.gastos)
  })

  it('el panel cambia de pestaña y muestra gastos por categoría y por hectárea', async () => {
    const backend = createFakeBackend()
    const costos = await (await backend.fetch('http://localhost:8000/estadisticas/costos', { headers: { Authorization: 'Bearer token-admin' } })).json()
    const { user } = await renderApp({ role: 'admin', route: '/mas/panel', backend })
    await user.click(await screen.findByRole('tab', { name: 'Costos' }))
    expect(await screen.findByText('Gasto por hectárea')).toBeInTheDocument()
    expect(screen.getByText(formatCop(costos.gasto_por_ha))).toBeInTheDocument()
    for (const categoria of costos.gastos_por_categoria) {
      expect(screen.getByText(`${categoria.categoria} (${categoria.registros})`)).toBeInTheDocument()
    }
  })

  it('el crecimiento cambia de métrica', async () => {
    const { user } = await renderApp({ role: 'admin', route: '/mas/panel' })
    await screen.findByText('Crecimiento')
    await user.click(screen.getByRole('tab', { name: 'Ingresos' }))
    expect((await screen.findAllByRole('progressbar')).length).toBeGreaterThan(0)
  })

  it('la pestaña de cultivos sigue el orden y los datos que entrega la API', async () => {
    const backend = createFakeBackend()
    const pedir = async (ruta) => (await backend.fetch(`http://localhost:8000/${ruta}`, { headers: { Authorization: 'Bearer token-admin' } })).json()
    const cultivos = await pedir('estadisticas/cultivos')
    const { user } = await renderApp({ role: 'admin', route: '/mas/panel', backend })
    await user.click(await screen.findByRole('tab', { name: 'Cultivos' }))
    expect(await screen.findByText('Cultivos más registrados')).toBeInTheDocument()
    for (const cultivo of cultivos) {
      expect((await screen.findAllByText(cultivo.cultivo)).length).toBeGreaterThanOrEqual(2)
    }
    const conCosecha = cultivos.find((c) => c.cosechas > 0)
    expect(screen.getAllByText(`${formatNumber(conCosecha.dias_entre_cosechas, 1)} días`).length).toBeGreaterThan(0)
    expect(screen.getAllByText('Sin cosechas').length).toBe(cultivos.filter((c) => c.cosechas === 0).length)
  })

  it('la pestaña de zonas nombra cada departamento y cambia a municipios', async () => {
    const backend = createFakeBackend()
    const zonas = await (await backend.fetch('http://localhost:8000/estadisticas/zonas', { headers: { Authorization: 'Bearer token-admin' } })).json()
    const { user } = await renderApp({ role: 'admin', route: '/mas/panel', backend })
    await user.click(await screen.findByRole('tab', { name: 'Zonas' }))
    for (const zona of zonas) {
      expect((await screen.findAllByText(zoneName(zona.zona))).length).toBeGreaterThanOrEqual(2)
    }
    const antes = backend.calls.filter((c) => c === 'GET estadisticas/zonas').length
    await user.click(screen.getByRole('tab', { name: 'Municipios' }))
    await vi.waitFor(() => expect(backend.calls.filter((c) => c === 'GET estadisticas/zonas').length).toBeGreaterThan(antes))
  })

  it('la pestaña de producción lista cada cosecha y manda los filtros a la API', async () => {
    const backend = createFakeBackend()
    const original = backend.fetch
    const urls = []
    backend.fetch = (input, init) => {
      urls.push(String(input))
      return original(input, init)
    }
    const cosechas = await (await original('http://localhost:8000/estadisticas/produccion', { headers: { Authorization: 'Bearer token-admin' } })).json()
    const { user } = await renderApp({ role: 'admin', route: '/mas/panel', backend })
    await user.click(await screen.findByRole('tab', { name: 'Producción' }))
    for (const c of cosechas.items) {
      expect(await screen.findByText(`${c.cultivo} · ${formatNumber(c.cantidad, 1)} ${c.unidad}`)).toBeInTheDocument()
    }
    expect(screen.getByText(`${plural(cosechas.total, 'cosecha', 'cosechas')}, de la más reciente a la más antigua`)).toBeInTheDocument()
    const cultivos = await (await original('http://localhost:8000/estadisticas/cultivos', { headers: { Authorization: 'Bearer token-admin' } })).json()
    await user.selectOptions(screen.getByLabelText('Cultivo'), cultivos[0].cultivo_id)
    await vi.waitFor(() => expect(urls.some((u) => u.includes('estadisticas/produccion') && u.includes(`cultivo_id=${cultivos[0].cultivo_id}`))).toBe(true))
    await user.type(screen.getByLabelText('Desde'), '2026-09-01')
    await vi.waitFor(() => expect(urls.some((u) => u.includes('desde=2026-09-01'))).toBe(true))
  })

  it('la pestaña de siembras filtra por estado y muestra zona y agricultor', async () => {
    const backend = createFakeBackend()
    const original = backend.fetch
    const urls = []
    backend.fetch = (input, init) => {
      urls.push(String(input))
      return original(input, init)
    }
    const siembras = await (await original('http://localhost:8000/estadisticas/siembras', { headers: { Authorization: 'Bearer token-admin' } })).json()
    const { user } = await renderApp({ role: 'admin', route: '/mas/panel', backend })
    await user.click(await screen.findByRole('tab', { name: 'Siembras' }))
    expect(await screen.findByText(plural(siembras.total, 'siembra', 'siembras'))).toBeInTheDocument()
    for (const s of siembras.items) {
      expect(screen.getByText(new RegExp(`${s.finca} · .* · ${s.agricultor}`))).toBeInTheDocument()
    }
    await user.click(screen.getByRole('tab', { name: 'En curso' }))
    await vi.waitFor(() => expect(urls.some((u) => u.includes('estadisticas/siembras') && u.includes('estado=en_curso'))).toBe(true))
  })

  it('la pestaña de productores ordena a quien más cosechas registró', async () => {
    const backend = createFakeBackend()
    const productores = await (await backend.fetch('http://localhost:8000/estadisticas/productores', { headers: { Authorization: 'Bearer token-admin' } })).json()
    const { user } = await renderApp({ role: 'admin', route: '/mas/panel', backend })
    await user.click(await screen.findByRole('tab', { name: 'Productores' }))
    expect(await screen.findByText('Quién produce más')).toBeInTheDocument()
    for (const p of productores) {
      expect((await screen.findAllByText(p.nombre)).length).toBeGreaterThanOrEqual(1)
    }
    const cosechas = productores.map((p) => p.cosechas)
    expect(cosechas).toEqual([...cosechas].sort((a, b) => b - a))
  })

  it('la barra del vivero refleja las plantas listas sobre las puestas', async () => {
    const backend = createFakeBackend()
    const lotes = await (await backend.fetch('http://localhost:8000/propagacion', { headers: { Authorization: 'Bearer token-agricultor' } })).json()
    await renderApp({ role: 'agricultor', route: '/mas/vivero', backend })
    const barra = await screen.findByRole('progressbar')
    const lote = lotes.items[0]
    expect(Number(barra.getAttribute('aria-valuenow'))).toBe(Math.round((lote.listas / lote.puestas) * 100))
    expect(Number(barra.getAttribute('aria-valuenow'))).toBeLessThan(100)
  })
})
