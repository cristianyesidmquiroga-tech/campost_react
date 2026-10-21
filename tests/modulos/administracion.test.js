import { beforeEach, describe, expect, it, vi } from 'vitest'
import { USER_ID, createFakeBackend } from '../../src/dev/fakeApi'
import { zoneName } from '../../src/lib/dane'
import { adminCosts, adminCrops, adminGrowth, adminHarvests, adminPlantings, adminProducers, adminSummary, adminZones, getUser, listUsers } from '../../src/services/admin'
import { setToken } from '../../src/services/http'

const sum = (list, pick) => list.reduce((total, item) => total + pick(item), 0)

beforeEach(() => {
  vi.stubGlobal('fetch', createFakeBackend().fetch)
  setToken('token-admin')
})

describe('administración', () => {
  it('la lista de usuarios trae perfil, rol, estado y conteos', async () => {
    const page = await listUsers({ text: 'a' })
    expect(page.items.length).toBeLessThanOrEqual(page.total)
    page.items.forEach((u) => expect(u).toMatchObject({ id: expect.any(String), email: expect.any(String), role: expect.any(String), active: expect.any(Boolean) }))
    expect(page.items.some((u) => u.farms > 0)).toBe(true)
  })

  it('el perfil de un usuario suma lo de sus fincas', async () => {
    const user = await getUser(USER_ID)
    expect(user.farmDetails).toHaveLength(user.farms)
    expect(user.expenses).toBe(sum(user.farmDetails, (f) => f.expenses))
    expect(user.income).toBe(sum(user.farmDetails, (f) => f.income))
    expect(user.harvests).toBe(sum(user.farmDetails, (f) => f.harvests))
    expect(user.plantings).toBe(sum(user.farmDetails, (f) => f.plantings))
  })

  it('el resumen cuadra consigo mismo', async () => {
    const s = await adminSummary()
    expect(s.profit).toBe(s.income - s.expenses)
    expect(sum(s.usersByRole, ([, n]) => n)).toBe(s.users)
    expect(sum(s.plantingsByState, ([, n]) => n)).toBe(s.plantings)
    expect(s.activeUsers).toBeLessThanOrEqual(s.users)
  })

  it('el crecimiento viene ordenado por mes', async () => {
    const months = (await adminGrowth(3)).map((p) => p.month)
    expect(months.every((m) => /^\d{4}-\d{2}$/.test(m))).toBe(true)
    expect(months).toEqual([...months].sort())
  })

  it('los costos reparten el total entre las categorías y por hectárea', async () => {
    const c = await adminCosts()
    expect(sum(c.expensesByCategory, (x) => x.total)).toBe(c.expenses)
    expect(sum(c.incomeByCategory, (x) => x.total)).toBe(c.income)
    expect(c.expensePerHa).toBeCloseTo(c.expenses / c.plantedHa, 1)
  })

  it('los cultivos se ordenan por registros y la utilidad es ingresos menos gastos', async () => {
    const crops = await adminCrops()
    expect(crops.map((c) => c.plantings)).toEqual([...crops.map((c) => c.plantings)].sort((a, b) => b - a))
    crops.forEach((c) => {
      expect(c.profit).toBe(c.income - c.expenses)
      expect(c.openCycles + c.closedCycles).toBeGreaterThan(0)
    })
    expect(crops.find((c) => c.harvests === 0).daysBetweenHarvests).toBeNull()
  })

  it('las zonas traen utilidad y costo por hectárea coherentes', async () => {
    const zones = await adminZones('departamento')
    zones.forEach((z) => {
      expect(z.profit).toBe(z.income - z.expenses)
      expect(z.expensePerHa).toBeCloseTo(z.expenses / z.plantedHa, 1)
      expect(z.topCrops.length).toBeGreaterThan(0)
    })
  })

  it('los listados paginados informan el total', async () => {
    const harvests = await adminHarvests({})
    const plantings = await adminPlantings({})
    for (const page of [harvests, plantings]) {
      expect(page.total).toBe(page.items.length)
      expect(page.hasMore).toBe(false)
    }
    expect(harvests.items.every((h) => h.amount > 0 && h.unit)).toBe(true)
  })

  it('los productores traen su producción por unidad', async () => {
    const producers = await adminProducers()
    producers.forEach((p) => {
      expect(p.harvests).toBeGreaterThan(0)
      expect(p.production.every((u) => u.unit && u.amount > 0)).toBe(true)
    })
  })

  it('los nombres de zona salen del código del DANE', () => {
    expect(zoneName('05')).toBe('Antioquia')
    expect(zoneName('76001')).toContain('Valle del Cauca')
    expect(zoneName('76001')).toContain('76001')
    expect(zoneName('sin_zona')).toBe('Sin zona')
    expect(zoneName(null)).toBe('Sin zona')
    expect(zoneName('99999')).toContain('Vichada')
    expect(zoneName('00')).toBe('00')
  })
})
