import { api } from './http'

const toJornal = (j) => {
  const workers = Number(j.obreros) || 0
  const days = Number(j.dias) || 0
  return {
    id: j.id,
    workerName: j.trabajador_nombre ?? null,
    payee: j.trabajador_nombre ?? 'Cuadrilla sin nombre',
    activityName: j.actividad_nombre ?? '',
    date: j.fecha ?? '',
    workDays: workers * days,
    total: Number(j.total) || 0,
    status: j.estado ?? 'pendiente',
    paid: j.estado === 'pagado',
  }
}

export const listJornales = async (farmId, status) =>
  (await api.list(`fincas/${farmId}/jornales`, { estado: status })).map(toJornal)

export const payJornal = (farmId, id) => api.post(`fincas/${farmId}/jornales/${id}/pagar`, {}, { idempotent: true })
