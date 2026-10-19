import { api } from './http'

const toBatch = (j) => ({
  id: j.id,
  farmId: j.finca_id,
  cropId: j.cultivo_id,
  method: j.metodo,
  start: j.fecha_inicio ?? '',
  total: j.puestas ?? 0,
  germinated: j.germinadas ?? 0,
  ready: j.listas ?? 0,
  lost: j.perdidas ?? 0,
  transplanted: j.trasplantadas ?? 0,
})

export const listBatches = async (farmId) =>
  (await api.list('propagacion', { limit: 50 })).map(toBatch).filter((b) => !farmId || b.farmId === farmId)

export const createBatch = ({ farmId, cropId, method, start, total }) =>
  api.post('propagacion', { finca_id: farmId, cultivo_id: cropId, metodo: method, fecha_inicio: start, puestas: total })

export const updateBatch = (id, { germinated, ready, lost }) =>
  api.patch(`propagacion/${id}`, { germinadas: germinated, listas: ready, perdidas: lost })

export const transplantBatch = (id, { plantingId, quantity }) =>
  api.post(`propagacion/${id}/trasplante`, { siembra_id: plantingId, cantidad: quantity })
