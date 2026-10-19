import { api } from './http'

const toActivity = (a) => ({
  id: a.id,
  farmId: a.finca_id,
  cycleId: a.ciclo_id,
  name: a.nombre,
  phase: a.fase,
  start: a.fecha_inicio ?? '',
  end: a.fecha_fin ?? null,
  areaHa: Number(a.area_trabajada) || 0,
  status: a.estado ?? '',
})

export const listActivities = async (farmId) => (await api.list(`fincas/${farmId}/actividades`)).map(toActivity)

export const updateActivity = (farmId, id, { name, areaHa, end }) =>
  api.patch(`fincas/${farmId}/actividades/${id}`, { nombre: name, area_trabajada: areaHa, ...(end ? { fecha_fin: end } : {}) })

export const cancelActivity = (farmId, id) => api.delete(`fincas/${farmId}/actividades/${id}`)
