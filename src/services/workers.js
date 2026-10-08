import { api } from './http'

const toWorker = (j) => {
  const name = j.nombre ?? ''
  const letters = name
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0].toUpperCase())
    .join('')
  return {
    id: j.id,
    name,
    type: j.tipo ?? '',
    dailyRate: Number(j.jornal_habitual) || 0,
    status: j.estado ?? 'activo',
    phone: j.telefono ?? null,
    maskedDocument: j.documento_ultimos4 ? `CC ****${j.documento_ultimos4}` : 'Sin documento',
    initials: letters || '?',
  }
}

export const listWorkers = async (farmId) => (await api.list(`fincas/${farmId}/trabajadores`)).map(toWorker)

export const createWorker = (farmId, { name, type, dailyRate, document, phone }) =>
  api.post(`fincas/${farmId}/trabajadores`, {
    nombre: name,
    tipo: type,
    jornal_habitual: dailyRate,
    ...(document ? { documento: document } : {}),
    ...(phone ? { telefono: phone } : {}),
  })

export async function registerWork(farmId, work) {
  const activity = await api.post(`fincas/${farmId}/actividades`, {
    ciclo_id: work.cycleId,
    nombre: work.name,
    fase: work.phase,
    fecha_inicio: work.date,
    area_trabajada: work.workedArea,
  })
  await api.post(
    `fincas/${farmId}/jornales`,
    {
      ...(work.workerId ? { trabajador_id: work.workerId } : {}),
      actividad_id: activity.id,
      ciclo_id: work.cycleId,
      fecha: work.date,
      obreros: work.workers,
      dias: work.days,
      valor_jornal: work.dailyValue,
    },
    { idempotent: true },
  )
  return activity.id
}
