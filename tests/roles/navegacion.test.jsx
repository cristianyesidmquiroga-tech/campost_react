import { screen, within } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
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
})
