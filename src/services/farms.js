import { api } from './http'

const toFarm = (j) => ({
  id: j.id,
  name: j.nombre,
  departmentCode: j.departamento_dane ?? null,
  municipalityCode: j.municipio_dane ?? null,
  areaHa: j.area_ha == null ? null : Number(j.area_ha),
})

const toLot = (j) => ({
  id: j.id,
  farmId: j.finca_id,
  name: j.nombre,
  areaHa: Number(j.area) || 0,
  notes: j.notas ?? null,
})

export const listFarms = async () => (await api.list('fincas')).map(toFarm)

export const createFarm = async ({ name, areaHa }) =>
  toFarm(await api.post('fincas', { nombre: name, ...(areaHa ? { area_ha: areaHa } : {}) }))

export const listLots = async (farmId) => (await api.list(`fincas/${farmId}/lotes`)).map(toLot)

export const createLot = (farmId, { name, areaHa, notes }) =>
  api.post(`fincas/${farmId}/lotes`, { nombre: name, area: areaHa, ...(notes ? { notas: notes } : {}) })
