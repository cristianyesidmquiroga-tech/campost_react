import { api } from './http'

const toEvent = (j) => ({
  id: j.id,
  riskId: j.riesgo_id,
  plantingId: j.siembra_id ?? null,
  start: j.inicio ?? '',
  end: j.fin ?? null,
  active: j.fin == null,
  severity: j.severidad ?? '',
  affectedArea: j.area_afectada ?? null,
  lossPercent: j.perdida_pct ?? null,
  estimatedLoss: j.perdida_estimada ?? null,
  notes: j.notas ?? null,
})

export const riskCatalog = async () =>
  (await api.list('riesgos')).map((r) => ({ id: r.id, name: r.nombre, type: r.tipo ?? '' }))

export const listEvents = async () => (await api.list('eventos-adversos', { limit: 50 })).map(toEvent)

export const getEvent = async (id) => toEvent(await api.get(`eventos-adversos/${id}`))

export const createEvent = (body) =>
  api.post('eventos-adversos', {
    finca_id: body.farmId,
    riesgo_id: body.riskId,
    inicio: body.start,
    severidad: body.severity,
    ...(body.plantingId ? { siembra_id: body.plantingId } : {}),
    ...(body.affectedArea ? { area_afectada: body.affectedArea } : {}),
    ...(body.estimatedLoss ? { perdida_estimada: body.estimatedLoss } : {}),
    ...(body.notes ? { notas: body.notes } : {}),
  })

export const closeEvent = (id, end) => api.patch(`eventos-adversos/${id}`, { fin: end })
