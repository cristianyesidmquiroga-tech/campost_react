import { screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { createFakeBackend } from '../../src/dev/fakeApi'
import { WIDTHS, ready, renderApp } from '../support/harness'
import { SCREENS } from '../support/screens'

describe('pantallas', () => {
  for (const width of WIDTHS) {
    for (const [name, route, text, role = 'agricultor'] of SCREENS) {
      it(`${name} se dibuja en ${width} px`, async () => {
        await renderApp({ role, route, width })
        expect(await ready(text)).toBeInTheDocument()
      })
    }
  }

  it('el inicio de sesión se dibuja y valida los campos', async () => {
    const { user } = await renderApp({ signedIn: false })
    expect(await screen.findByRole('heading', { name: 'Iniciar sesión' })).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Entrar' }))
    expect(await screen.findByText('Escriba un correo válido.')).toBeInTheDocument()
    expect(screen.getByText('Escriba su contraseña.')).toBeInTheDocument()
  })

  it('el inicio de sesión con clave incorrecta muestra el error del servidor', async () => {
    const { user } = await renderApp({ signedIn: false })
    await user.type(await screen.findByLabelText('Correo electrónico'), 'admin@demo.com')
    await user.type(screen.getByLabelText('Contraseña'), 'mala')
    await user.click(screen.getByRole('button', { name: 'Entrar' }))
    expect(await screen.findByText('El correo o la contraseña no son válidos.')).toBeInTheDocument()
  })

  it('se puede mostrar y ocultar la contraseña', async () => {
    const { user } = await renderApp({ signedIn: false })
    await user.click(await screen.findByRole('button', { name: 'Mostrar contraseña' }))
    expect(screen.getByRole('button', { name: 'Ocultar contraseña' })).toBeInTheDocument()
  })

  it('si el servidor falla se muestra un error con reintento', async () => {
    await renderApp({ role: 'agricultor', backend: createFakeBackend({ failPaths: ['inicio'] }) })
    expect(await screen.findByText('No pudimos cargar esto')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Reintentar' })).toBeInTheDocument()
  })

  it('sin fincas se invita a registrar la primera', async () => {
    await renderApp({ role: 'agricultor', route: '/dinero', backend: createFakeBackend({ farms: [] }) })
    expect(await screen.findByText('Registre una finca para ver su dinero')).toBeInTheDocument()
  })

  it('los formularios del registro rápido se abren', async () => {
    const { user } = await renderApp({ role: 'agricultor' })
    await ready('RESUMEN DE HOY')
    const open = async (action, button) => {
      await user.click(screen.getByRole('button', { name: 'Registrar' }))
      await user.click(await screen.findByText(action))
      expect(await screen.findByRole('button', { name: button })).toBeInTheDocument()
      await user.keyboard('{Escape}')
    }
    await open('Gasto', 'Guardar gasto')
    await open('Ingreso', 'Guardar ingreso')
    await open('Labor con jornales', 'Guardar labor')
    await open('Cosecha', 'Guardar cosecha')
    await open('Evento adverso', 'Guardar evento')
  })

  it('un gasto válido se envía una sola vez con su clave', async () => {
    const backend = createFakeBackend()
    const { user } = await renderApp({ role: 'agricultor', backend })
    await ready('RESUMEN DE HOY')
    await user.click(screen.getByRole('button', { name: 'Registrar' }))
    await user.click(await screen.findByText('Gasto'))
    await user.selectOptions(await screen.findByLabelText('Categoría'), 'Mano de obra')
    await user.type(screen.getByLabelText('Valor del gasto'), '180000')
    await user.click(screen.getByRole('button', { name: 'Guardar gasto' }))
    await ready('RESUMEN DE HOY')
    expect(backend.calls.filter((c) => c === 'POST fincas/f0000000-0000-4000-8000-000000000001/gastos')).toHaveLength(1)
  })

  it('los formularios de insumos y procesos se abren', async () => {
    const supply = await renderApp({ role: 'agricultor', route: '/mas/inventario' })
    await ready('Fertilizante triple 15')
    await supply.user.click(screen.getByRole('button', { name: 'Nuevo insumo' }))
    expect(await screen.findByRole('button', { name: 'Guardar insumo' })).toBeInTheDocument()
    supply.unmount()
    const proc = await renderApp({ role: 'agricultor', route: '/mas/procesos' })
    await ready('Secado de bijao lote 1')
    await proc.user.click(screen.getByRole('button', { name: 'Nuevo proceso' }))
    expect(await screen.findByRole('button', { name: 'Guardar proceso' })).toBeInTheDocument()
  })

  it('seleccionar un pago habilita el botón y pide confirmación', async () => {
    const { user } = await renderApp({ role: 'contador', route: '/mas/pagos' })
    await ready('Pedro Nel Builes')
    const pay = screen.getByRole('button', { name: 'Marcar como pagado' })
    expect(pay).toBeDisabled()
    await user.click(screen.getByRole('checkbox', { name: 'Seleccionar Pedro Nel Builes' }))
    expect(pay).toBeEnabled()
    await user.click(pay)
    expect(await screen.findByText('Se registra un gasto de mano de obra por cada pago.', { exact: false })).toBeInTheDocument()
  })
})
