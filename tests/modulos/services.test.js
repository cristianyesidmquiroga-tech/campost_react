import { beforeEach, describe, expect, it, vi } from 'vitest'
import { CROP_ID, CYCLE_ID, FARM_ID, PLANTING_ID, createFakeBackend } from '../../src/dev/fakeApi'
import { setToken } from '../../src/services/http'
import { listLots } from '../../src/services/farms'
import { homeOverview } from '../../src/services/home'
import { cashFlow, expensesByCategory, listMovements } from '../../src/services/money'
import { cropDetail, plantingOverview } from '../../src/services/production'
import { listWorkers, registerWork } from '../../src/services/workers'

let backend

beforeEach(() => {
  backend = createFakeBackend()
  vi.stubGlobal('fetch', backend.fetch)
  setToken('token-admin')
})

describe('servicios', () => {
  it('los lotes se leen con sus áreas', async () => {
    const lots = await listLots(FARM_ID)
    expect(lots.map((l) => l.areaHa)).toEqual([4.5, 3.2])
  })

  it('una siembra trae su ciclo abierto, conteos e índices', async () => {
    const overview = await plantingOverview(PLANTING_ID)
    expect(overview.planting.cycles[0].type).toBe('levante')
    expect(overview.counts[0].alive).toBe(17100)
    expect(overview.indicators).toHaveLength(2)
    expect(overview.schedule[0].done).toBe(true)
    expect(overview.schedule[1].delayDays).toBe(4)
  })

  it('el flujo de caja calcula el margen', async () => {
    const flow = await cashFlow(FARM_ID)
    expect(flow.balance).toBe(8400000)
    expect(flow.margin).toBeCloseTo(56.57, 1)
  })

  it('los movimientos se combinan y el gasto anulado no suma', async () => {
    const movements = await listMovements(FARM_ID)
    expect(movements).toHaveLength(4)
    expect(movements.filter((m) => m.cancelled)).toHaveLength(1)
    const categories = expensesByCategory(movements)
    expect(categories.map(([name]) => name)).toEqual(['Mano de obra', 'Insumos y fertilizantes'])
  })

  it('los trabajadores enmascaran el documento', async () => {
    const workers = await listWorkers(FARM_ID)
    expect(workers[0].maskedDocument).toBe('CC ****5831')
    expect(workers[1].maskedDocument).toBe('Sin documento')
    expect(workers[0].initials).toBe('PN')
  })

  it('el inicio resume avisos y eventos', async () => {
    const overview = await homeOverview()
    expect(overview.activePlantings).toBe(1)
    expect(overview.notices[0].risk).toBe('Helada')
    expect(overview.recentEvents[0].severity).toBe('moderada')
  })

  it('la ficha del cultivo reúne fases, métodos y riesgos', async () => {
    const detail = await cropDetail(CROP_ID)
    expect(detail.phases).toHaveLength(4)
    expect(detail.methods[0].method).toBe('semilla')
    expect(Object.values(detail.riskNames)).toContain('Helada')
  })

  it('registrar una labor crea la actividad y luego el jornal', async () => {
    await registerWork(FARM_ID, { cycleId: CYCLE_ID, name: 'Socola', phase: 'preparacion', date: '2026-10-07', workedArea: 1, workers: 12, days: 3, dailyValue: 60000 })
    expect(backend.calls.filter((c) => c.startsWith('POST'))).toEqual([`POST fincas/${FARM_ID}/actividades`, `POST fincas/${FARM_ID}/jornales`])
  })
})
