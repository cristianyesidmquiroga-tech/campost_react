import { beforeEach, describe, expect, it, vi } from 'vitest'
import { CROP_ID, CYCLE_ID, FARM_ID, PLANTING_ID, PROCESS_ID, SUPPLY_ID, createFakeBackend } from '../../src/dev/fakeApi'
import { setToken } from '../../src/services/http'
import { listLots } from '../../src/services/farms'
import { homeOverview } from '../../src/services/home'
import { cashFlow, expensesByCategory, listMovements } from '../../src/services/money'
import { cropDetail, plantingOverview } from '../../src/services/production'
import { listSupplies, supplyMovements } from '../../src/services/inventory'
import { listJornales, payJornal } from '../../src/services/payments'
import { addStage, listProcesses, listStages, moveStage } from '../../src/services/processes'
import { listAnimalEvents, listAnimals, listFeeding, listLots as listAnimalLots, listProduction, listSpecies } from '../../src/services/livestock'
import { listBatches } from '../../src/services/nursery'
import { eventsReport, indicesReport, listReports, scheduleReport } from '../../src/services/reports'
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

  it('los jornales pendientes traen beneficiario, labor y total', async () => {
    const list = await listJornales(FARM_ID, 'pendiente')
    expect(list).toHaveLength(3)
    expect(list[0]).toMatchObject({ payee: 'Pedro Nel Builes', total: 270000, workDays: 3, paid: false })
    expect(list[2].payee).toBe('Cuadrilla sin nombre')
    expect(list[2].workDays).toBe(4)
  })

  it('pagar un jornal llama al endpoint de pago', async () => {
    await payJornal(FARM_ID, 'j1')
    expect(backend.calls).toContain(`POST fincas/${FARM_ID}/jornales/j1/pagar`)
  })

  it('los insumos traen existencia, costo promedio y kardex', async () => {
    const supplies = await listSupplies(FARM_ID)
    expect(supplies[0]).toMatchObject({ stock: 12, averageCost: 150000, value: 1800000 })
    expect(supplies[1].averageCost).toBeNull()
    const moves = await supplyMovements(FARM_ID, SUPPLY_ID)
    expect(moves.map((m) => m.isEntry)).toEqual([true, false])
  })

  it('los procesos calculan el avance y las etapas su estado', async () => {
    const processes = await listProcesses(FARM_ID)
    expect(processes[0].progress).toBeCloseTo(1 / 3)
    expect(processes[0].finished).toBe(false)
    expect(processes[1].finished).toBe(true)
    const stages = await listStages(FARM_ID, PROCESS_ID)
    expect(stages.map((s) => [s.done, s.running])).toEqual([[true, false], [false, true], [false, false]])
  })

  it('agregar y mover etapas llama a los endpoints', async () => {
    await addStage(FARM_ID, PROCESS_ID, { name: 'Empacar', days: 1 })
    await moveStage(FARM_ID, 'e2', 'finalizar')
    expect(backend.calls).toContain(`POST fincas/${FARM_ID}/procesos/${PROCESS_ID}/etapas`)
    expect(backend.calls).toContain(`POST fincas/${FARM_ID}/etapas/e2/finalizar`)
  })

  it('los reportes marcan cuáles no están disponibles', async () => {
    const reports = await listReports()
    expect(reports.map((r) => r.id)).toEqual(['indices', 'cronograma', 'costos'])
    expect(reports[2].available).toBe(false)
    expect(reports[2].reason).toMatch(/costos/)
  })

  it('los reportes de índices, tiempos y eventos se leen', async () => {
    expect((await indicesReport(FARM_ID))[0].indicators[0].value).toBe(3800)
    expect((await scheduleReport(FARM_ID))[0].plannedPhases).toBe(3)
    const events = await eventsReport(FARM_ID)
    expect(events.loss).toBe(1850000)
    expect(events.bySeverity).toEqual([['moderada', 1]])
  })

  it('los lotes de vivero traen su avance', async () => {
    const batches = await listBatches(FARM_ID)
    expect(batches).toHaveLength(1)
    expect(batches[0].ready - batches[0].transplanted).toBe(200)
    expect(await listBatches('otra-finca')).toHaveLength(0)
  })

  it('el pecuario relaciona especies, lotes, animales y eventos', async () => {
    expect((await listSpecies(FARM_ID))[0].name).toBe('Bovinos')
    expect((await listAnimalLots(FARM_ID))[0].quantity).toBe(12)
    const animals = await listAnimals(FARM_ID)
    expect(animals[0].tag).toBe('A-102')
    expect((await listAnimalEvents(FARM_ID))[0].animalId).toBe(animals[0].id)
    expect((await listProduction(FARM_ID))[0].unit).toBe('litros')
    expect((await listFeeding(FARM_ID))[0].cost).toBe(180000)
  })
})
