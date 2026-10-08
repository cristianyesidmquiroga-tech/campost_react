import { api } from './http'

const toCrop = (j) => ({
  id: j.id,
  name: j.nombre,
  group: j.grupo ?? '',
  cycleType: j.tipo_ciclo ?? '',
  countUnit: j.unidad_conteo ?? '',
  toValidate: j.por_validar === true,
})

const toCycle = (j) => ({
  id: j.id,
  type: j.tipo ?? '',
  number: j.numero ?? 1,
  status: j.estado ?? '',
  start: j.fecha_inicio ?? null,
  end: j.fecha_fin ?? null,
})

const toPlanting = (j) => ({
  id: j.id,
  farmId: j.finca_id,
  lotId: j.lote_id,
  cropId: j.cultivo_id,
  method: j.metodo ?? '',
  areaHa: Number(j.area_ha) || 0,
  plants: j.plantas_sembradas ?? null,
  planDate: j.fecha_plan ?? '',
  status: j.estado ?? '',
  budget: j.presupuesto == null ? null : Number(j.presupuesto),
  cycles: (j.ciclos ?? []).map(toCycle),
})

const toPhase = (j) => ({ phase: j.fase, order: j.orden ?? 0, days: j.dias_estimados ?? null })

const toScheduled = (j) => ({
  phase: j.fase,
  order: j.orden ?? 0,
  plannedDays: j.dias_estimados ?? null,
  planStart: j.inicio_plan ?? null,
  planEnd: j.fin_plan ?? null,
  realEnd: j.fin_real ?? null,
  delayDays: j.dias_retraso ?? null,
  done: j.fin_real != null,
})

const toIndicator = (j) => ({
  title: j.titulo ?? '',
  value: j.valor ?? null,
  unit: j.unidad ?? '',
  explanation: j.explicacion ?? '',
  state: j.estado ?? 'informativo',
  action: j.que_hacer ?? null,
  date: j.fecha_datos ?? null,
})

export const openCycleOf = (planting) => planting.cycles.find((c) => c.status === 'abierto') ?? null

export const listCrops = async () => (await api.list('cultivos', { limit: 50 })).map(toCrop)

export async function cropDetail(id) {
  const [detail, methods, risks, doses, riskNames] = await Promise.all([
    api.get(`cultivos/${id}`),
    api.list(`cultivos/${id}/metodos`),
    api.list(`cultivos/${id}/riesgos`),
    api.list(`cultivos/${id}/dosis`),
    api.list('riesgos'),
  ])
  return {
    crop: toCrop(detail),
    scientificName: detail.nombre_cientifico ?? null,
    renewalType: detail.tipo_renovacion ?? null,
    harvestUnit: detail.unidad_cosecha ?? null,
    source: detail.fuente ?? null,
    phases: (detail.fases ?? []).map(toPhase).sort((a, b) => a.order - b.order),
    methods: methods.map((m) => ({ method: m.metodo, germinationDays: m.dias_germinacion, nurseryDays: m.dias_vivero })),
    risks: risks.map((r) => ({
      riskId: r.riesgo_id,
      phase: r.fase_critica ?? '',
      susceptibility: r.susceptibilidad ?? '',
      measures: r.medidas ?? null,
    })),
    doses,
    riskNames: Object.fromEntries(riskNames.map((r) => [r.id, r.nombre])),
  }
}

export async function listPlantings() {
  const page = await api.page('siembras', { limit: 50 })
  return page.items.map(toPlanting)
}

async function tolerant(call, fallback) {
  try {
    return await call()
  } catch {
    return fallback
  }
}

export async function plantingOverview(id) {
  const planting = toPlanting(await api.get(`siembras/${id}`))
  const open = openCycleOf(planting)
  const [counts, indices, schedule] = await Promise.all([
    tolerant(() => api.list(`siembras/${id}/conteos`), []),
    tolerant(() => api.get(`siembras/${id}/indices`), null),
    open ? tolerant(() => api.get(`ciclos/${open.id}/cronograma`), null) : null,
  ])
  return {
    planting,
    counts: counts.map((c) => ({ date: c.fecha, alive: c.vivas, dead: c.muertas, replanted: c.resiembras })),
    indicators: (indices?.indicadores ?? []).map(toIndicator),
    schedule: (schedule?.fases ?? []).map(toScheduled).sort((a, b) => a.order - b.order),
  }
}

export async function cycleOverview(plantingId, cycleId) {
  const planting = toPlanting(await api.get(`siembras/${plantingId}`))
  const [cycle, activities, schedule, needs] = await Promise.all([
    api.get(`ciclos/${cycleId}`),
    api.list(`fincas/${planting.farmId}/actividades`),
    tolerant(() => api.get(`ciclos/${cycleId}/cronograma`), null),
    tolerant(() => api.get(`ciclos/${cycleId}/necesidad-insumos`), null),
  ])
  return {
    cycle: toCycle(cycle),
    activities: activities
      .filter((a) => a.ciclo_id === cycleId)
      .map((a) => ({
        id: a.id,
        name: a.nombre,
        phase: a.fase,
        areaHa: Number(a.area_trabajada) || 0,
        status: a.estado ?? '',
      })),
    schedule: (schedule?.fases ?? []).map(toScheduled).sort((a, b) => a.order - b.order),
    needs: (needs?.items ?? []).map((n) => ({
      type: n.insumo_tipo,
      dose: n.dosis,
      unit: n.unidad,
      base: n.base,
      quantity: n.cantidad_necesaria ?? null,
    })),
  }
}

export async function openCycles(farmId) {
  const plantings = (await listPlantings()).filter((p) => p.farmId === farmId && p.status === 'en_curso')
  const details = await Promise.all(plantings.map((p) => api.get(`siembras/${p.id}`).then(toPlanting)))
  return details.flatMap((planting) => {
    const cycle = openCycleOf(planting)
    return cycle ? [{ planting, cycle }] : []
  })
}

export const createPlanting = (body) =>
  api.post('siembras', {
    finca_id: body.farmId,
    lote_id: body.lotId,
    cultivo_id: body.cropId,
    metodo: body.method,
    area_ha: body.areaHa,
    fecha_plan: body.planDate,
    ...(body.plants ? { plantas_sembradas: body.plants } : {}),
    ...(body.budget ? { presupuesto: body.budget } : {}),
  })

export async function plantingProgress(id) {
  const planting = toPlanting(await api.get(`siembras/${id}`))
  const open = openCycleOf(planting)
  if (!open) return []
  const schedule = await api.get(`ciclos/${open.id}/cronograma`)
  return (schedule.fases ?? []).map(toScheduled).sort((a, b) => a.order - b.order)
}

export const startPlanting = (id) => api.post(`siembras/${id}/iniciar`)
export const cancelPlanting = (id) => api.post(`siembras/${id}/cancelar`)
export const closeCycle = (id) => api.post(`ciclos/${id}/cerrar`)
export const openNextCycle = (plantingId, type) => api.post(`siembras/${plantingId}/ciclos`, { tipo: type })

export const addCount = (plantingId, { date, alive, dead, replanted }) =>
  api.post(`siembras/${plantingId}/conteos`, { fecha: date, vivas: alive, muertas: dead, resiembras: replanted })

export const createHarvest = (farmId, { cycleId, quantity, unit, date, quality }) =>
  api.post(`fincas/${farmId}/cosechas`, {
    ciclo_id: cycleId,
    cantidad: quantity,
    unidad: unit,
    fecha: date,
    ...(quality ? { calidad: quality } : {}),
  })
