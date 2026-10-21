import { api } from './http'

const money = (value) => Number(value) || 0

const toUnits = (list) => (list ?? []).map((u) => ({ unit: u.unidad, amount: money(u.cantidad) }))

const toUser = (u) => ({
  id: u.id,
  email: u.email,
  name: u.nombre,
  role: u.rol,
  active: u.activo === true,
  createdAt: u.creado_en ?? '',
  lastAccess: u.ultimo_acceso ?? null,
  farms: u.fincas ?? 0,
  plantings: u.siembras ?? 0,
})

export async function listUsers({ text, role, active, skip = 0, limit = 20 } = {}) {
  const page = await api.page('usuarios', { q: text, rol: role, activo: active, skip, limit })
  return { items: page.items.map(toUser), total: page.total, hasMore: page.hasMore }
}

export async function getUser(id) {
  const u = await api.get(`usuarios/${id}`)
  return {
    ...toUser(u),
    blocked: u.bloqueado === true,
    harvests: u.cosechas ?? 0,
    expenses: money(u.gastos),
    income: money(u.ingresos),
    farmDetails: (u.detalle_fincas ?? []).map((f) => ({
      id: f.id,
      name: f.nombre,
      zone: f.municipio_dane ?? f.departamento_dane ?? null,
      areaHa: money(f.area_ha),
      plantings: f.siembras ?? 0,
      harvests: f.cosechas ?? 0,
      expenses: money(f.gastos),
      income: money(f.ingresos),
    })),
  }
}

export async function adminSummary() {
  const j = await api.get('estadisticas/resumen')
  return {
    users: j.usuarios ?? 0,
    activeUsers: j.usuarios_activos ?? 0,
    usersByRole: Object.entries(j.usuarios_por_rol ?? {}),
    farms: j.fincas ?? 0,
    farmAreaHa: money(j.area_ha_fincas),
    plantings: j.siembras ?? 0,
    plantingsByState: Object.entries(j.siembras_por_estado ?? {}),
    openCycles: j.ciclos_abiertos ?? 0,
    closedCycles: j.ciclos_cerrados ?? 0,
    harvests: j.cosechas ?? 0,
    workers: j.trabajadores ?? 0,
    expenses: money(j.gastos),
    income: money(j.ingresos),
    profit: money(j.utilidad),
    events: j.eventos_adversos ?? 0,
    estimatedLoss: money(j.perdida_estimada),
  }
}

export async function adminGrowth(months = 12) {
  const list = await api.list('estadisticas/crecimiento', { meses: months })
  return list.map((p) => ({
    month: p.mes,
    users: p.usuarios ?? 0,
    farms: p.fincas ?? 0,
    plantings: p.siembras ?? 0,
    harvests: p.cosechas ?? 0,
    expenses: money(p.gastos),
    income: money(p.ingresos),
  }))
}

const toCategory = (c) => ({ name: c.categoria, records: c.registros ?? 0, total: money(c.total) })

export async function adminCosts() {
  const j = await api.get('estadisticas/costos')
  return {
    expensesByCategory: (j.gastos_por_categoria ?? []).map(toCategory),
    incomeByCategory: (j.ingresos_por_categoria ?? []).map(toCategory),
    expenses: money(j.gastos),
    income: money(j.ingresos),
    plantedHa: money(j.area_sembrada_ha),
    expensePerHa: j.gasto_por_ha ?? null,
    incomePerHa: j.ingreso_por_ha ?? null,
  }
}

export async function adminCrops() {
  const list = await api.list('estadisticas/cultivos')
  return list.map((c) => ({
    id: c.cultivo_id,
    name: c.cultivo,
    group: c.grupo,
    plantings: c.siembras ?? 0,
    farms: c.fincas ?? 0,
    farmers: c.agricultores ?? 0,
    areaHa: money(c.area_ha),
    plants: c.plantas ?? 0,
    openCycles: c.ciclos_abiertos ?? 0,
    closedCycles: c.ciclos_cerrados ?? 0,
    averageDays: c.duracion_media_dias ?? null,
    longestDays: c.ciclo_mas_largo_dias ?? null,
    harvests: c.cosechas ?? 0,
    production: toUnits(c.produccion),
    firstHarvest: c.primera_cosecha ?? null,
    lastHarvest: c.ultima_cosecha ?? null,
    daysBetweenHarvests: c.dias_entre_cosechas ?? null,
    expenses: money(c.gastos),
    income: money(c.ingresos),
    profit: money(c.utilidad),
  }))
}

export async function adminZones(level = 'departamento') {
  const list = await api.list('estadisticas/zonas', { nivel: level })
  return list.map((z) => ({
    zone: z.zona,
    farms: z.fincas ?? 0,
    farmers: z.agricultores ?? 0,
    farmAreaHa: money(z.area_ha_fincas),
    plantings: z.siembras ?? 0,
    plantedHa: money(z.area_sembrada_ha),
    harvests: z.cosechas ?? 0,
    production: toUnits(z.produccion),
    expenses: money(z.gastos),
    income: money(z.ingresos),
    profit: money(z.utilidad),
    expensePerHa: z.gasto_por_ha ?? null,
    topCrops: z.cultivos_principales ?? [],
  }))
}

export async function adminHarvests({ cropId, zone, from, to, skip = 0, limit = 20 } = {}) {
  const page = await api.page('estadisticas/produccion', { cultivo_id: cropId, zona: zone, desde: from, hasta: to, skip, limit })
  return {
    items: page.items.map((h) => ({
      id: h.id,
      date: h.fecha,
      crop: h.cultivo,
      amount: money(h.cantidad),
      unit: h.unidad,
      quality: h.calidad ?? null,
      farm: h.finca,
      zone: h.zona,
      farmer: h.agricultor ?? null,
    })),
    total: page.total,
    hasMore: page.hasMore,
  }
}

export async function adminPlantings({ cropId, state, zone, skip = 0, limit = 20 } = {}) {
  const page = await api.page('estadisticas/siembras', { cultivo_id: cropId, estado: state, zona: zone, skip, limit })
  return {
    items: page.items.map((s) => ({
      id: s.id,
      crop: s.cultivo,
      state: s.estado,
      areaHa: money(s.area_ha),
      plants: s.plantas ?? null,
      plannedDate: s.fecha_plan,
      cycleStart: s.inicio_ciclo ?? null,
      farm: s.finca,
      zone: s.zona,
      farmer: s.agricultor ?? null,
    })),
    total: page.total,
    hasMore: page.hasMore,
  }
}

export async function adminProducers() {
  const list = await api.list('estadisticas/productores')
  return list.map((p) => ({
    id: p.usuario_id,
    name: p.nombre,
    farms: p.fincas ?? 0,
    harvests: p.cosechas ?? 0,
    production: toUnits(p.produccion),
    lastHarvest: p.ultima_cosecha ?? null,
  }))
}
