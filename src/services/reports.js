import { api } from './http'

const toReport = (j) => ({
  id: j.id,
  title: j.titulo,
  description: j.descripcion ?? '',
  available: j.disponible === true,
  reason: j.motivo ?? null,
})

const toIndicator = (i) => ({
  title: i.titulo,
  value: Number(i.valor) || 0,
  unit: i.unidad ?? '',
})

export const listReports = async () => (await api.list('reportes')).map(toReport)

export async function indicesReport(farmId) {
  const j = await api.get('reportes/indices', { finca_id: farmId })
  return (j.siembras ?? []).map((s) => ({
    plantingId: s.siembra_id,
    crop: s.cultivo,
    countDate: s.fecha_conteo ?? null,
    indicators: (s.indicadores ?? []).map(toIndicator),
    notice: s.aviso ?? null,
  }))
}

export async function scheduleReport(farmId) {
  const j = await api.get('reportes/cronograma', { finca_id: farmId })
  return (j.ciclos ?? []).map((c) => ({
    cycleId: c.ciclo_id,
    crop: c.cultivo,
    type: c.tipo,
    start: c.fecha_inicio ?? null,
    phase: c.fase_actual ?? null,
    plannedPhases: c.fases_planeadas ?? 0,
    plannedEnd: c.fecha_fin_planeada ?? null,
    notice: c.aviso ?? null,
  }))
}

export async function eventsReport(farmId) {
  const j = await api.get('reportes/eventos', { finca_id: farmId })
  return {
    total: j.total ?? 0,
    loss: Number(j.perdida_estimada_total) || 0,
    byType: (j.por_tipo ?? []).map((t) => ({ type: t.tipo, count: t.cantidad, loss: Number(t.perdida_estimada) || 0 })),
    bySeverity: Object.entries(j.por_severidad ?? {}),
    notice: j.aviso ?? null,
  }
}
