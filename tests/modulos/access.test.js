import { describe, expect, it } from 'vitest'
import { createAccess } from '../../src/lib/access'

const session = (role, permissions = []) => ({ role, permissions: permissions.map(([method, route]) => ({ method, route })) })
const production = [['GET', '/siembras'], ['POST', '/siembras']]

describe('acceso por rol', () => {
  it('el administrador gestiona todo', () => {
    const access = createAccess(session('admin', [...production, ['GET', '/cultivos'], ['POST', '/usuarios']]))
    expect(access.seesProduction).toBe(true)
    expect(access.managesProduction).toBe(true)
    expect(access.seesProfit).toBe(true)
    expect(access.cancelsMoney).toBe(true)
  })

  it('el agricultor registra pero no ve utilidad ni anula', () => {
    const access = createAccess(session('agricultor', [...production, ['GET', '/cultivos']]))
    expect(access.registersFieldWork).toBe(true)
    expect(access.registersMoney).toBe(true)
    expect(access.seesProfit).toBe(false)
    expect(access.cancelsMoney).toBe(false)
  })

  it('el contador lee producción y lleva el dinero', () => {
    const access = createAccess(session('contador', [['GET', '/siembras']]))
    expect(access.seesProduction).toBe(true)
    expect(access.managesProduction).toBe(false)
    expect(access.registersFieldWork).toBe(false)
    expect(access.seesProfit).toBe(true)
    expect(access.canQuickRegister).toBe(true)
  })

  it('el experto no ve dinero ni producción', () => {
    const access = createAccess(session('experto'))
    expect(access.seesMoney).toBe(false)
    expect(access.seesWorkers).toBe(false)
    expect(access.canQuickRegister).toBe(false)
    expect(access.roleLabel).toBe('Experto')
  })

  it('los permisos del servidor mandan sobre el rol', () => {
    const access = createAccess(session('agricultor'))
    expect(access.seesProduction).toBe(false)
    expect(access.seesRisks).toBe(false)
  })
})
