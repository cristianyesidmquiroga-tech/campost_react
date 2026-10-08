import { api } from './http'

const toSupply = (j) => ({
  id: j.id,
  name: j.nombre ?? '',
  unit: j.unidad ?? '',
  stock: Number(j.existencia) || 0,
  value: Number(j.valor) || 0,
  averageCost: j.costo_promedio == null ? null : Number(j.costo_promedio),
  lastMovement: j.ultimo_movimiento ?? null,
})

export const listSupplies = async (farmId) => (await api.list(`fincas/${farmId}/insumos`)).map(toSupply)

export const supplyMovements = async (farmId, supplyId) =>
  (await api.list(`fincas/${farmId}/movimientos-insumo`))
    .filter((m) => m.insumo_id === supplyId)
    .map((m) => ({
      id: m.id,
      type: m.tipo,
      isEntry: m.tipo === 'entrada',
      quantity: Number(m.cantidad) || 0,
      cost: Number(m.costo) || 0,
      date: m.fecha ?? '',
    }))

export const createSupply = (farmId, { name, unit }) => api.post(`fincas/${farmId}/insumos`, { nombre: name, unidad: unit })

export const addEntry = (farmId, { supplyId, quantity, cost, date }) =>
  api.post(`fincas/${farmId}/insumos/entrada`, { insumo_id: supplyId, cantidad: quantity, costo: cost, fecha: date }, { idempotent: true })

export const addConsumption = (farmId, { supplyId, quantity, activityId, date }) =>
  api.post(`fincas/${farmId}/insumos/consumo`, { insumo_id: supplyId, cantidad: quantity, actividad_id: activityId, fecha: date }, { idempotent: true })

export const listActivities = async (farmId) =>
  (await api.list(`fincas/${farmId}/actividades`)).map((a) => ({ id: a.id, name: a.nombre }))
