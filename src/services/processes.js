import { api } from './http'

const toProcess = (j) => ({
  id: j.id,
  name: j.nombre ?? '',
  product: j.producto ?? '',
  rawMaterial: j.materia_prima ?? '',
  origin: j.origen_materia ?? '',
  start: j.fecha_inicio ?? '',
  end: j.fecha_fin ?? null,
  finished: j.fecha_fin != null,
  stages: j.etapas ?? 0,
  stagesDone: j.etapas_finalizadas ?? 0,
  progress: j.etapas ? (j.etapas_finalizadas ?? 0) / j.etapas : 0,
})

const toStage = (j) => ({
  id: j.id,
  name: j.nombre ?? '',
  estimatedDays: Number(j.dias_estimados) || 0,
  startedAt: j.iniciado_en ?? null,
  finishedAt: j.finalizado_en ?? null,
  done: j.finalizado_en != null,
  running: j.iniciado_en != null && j.finalizado_en == null,
})

export const listProcesses = async (farmId) => (await api.list(`fincas/${farmId}/procesos`)).map(toProcess)

export const listStages = async (farmId, processId) =>
  (await api.list(`fincas/${farmId}/procesos/${processId}/etapas`)).map(toStage)

export const createProcess = (farmId, p) =>
  api.post(`fincas/${farmId}/procesos`, {
    nombre: p.name,
    producto: p.product,
    materia_prima: p.rawMaterial,
    origen_materia: p.origin,
    fecha_inicio: p.start,
  })

export const addStage = (farmId, processId, { name, days }) =>
  api.post(`fincas/${farmId}/procesos/${processId}/etapas`, { nombre: name, dias_estimados: days })

export const moveStage = (farmId, stageId, action) => api.post(`fincas/${farmId}/etapas/${stageId}/${action}`, {})
