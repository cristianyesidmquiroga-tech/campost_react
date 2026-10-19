import { api } from './http'

const toSpecies = (j) => ({ id: j.id, name: j.nombre, description: j.descripcion ?? null })

const toLot = (j) => ({
  id: j.id,
  speciesId: j.especie_id,
  name: j.nombre,
  quantity: Number(j.cantidad) || 0,
  location: j.ubicacion ?? null,
})

const toAnimal = (j) => ({
  id: j.id,
  speciesId: j.especie_id,
  lotId: j.lote_animal_id ?? null,
  tag: j.arete,
  name: j.nombre ?? null,
  sex: j.sexo,
  breed: j.raza ?? null,
  birth: j.nacimiento ?? null,
  status: j.estado ?? '',
})

const toEvent = (j) => ({
  id: j.id,
  animalId: j.animal_id ?? null,
  lotId: j.lote_animal_id ?? null,
  type: j.tipo,
  date: j.fecha ?? '',
  product: j.producto ?? null,
  dose: j.dosis ?? null,
  withdrawalUntil: j.retiro_hasta ?? null,
  notes: j.notas ?? null,
})

const toProduction = (j) => ({ id: j.id, lotId: j.lote_animal_id, date: j.fecha ?? '', type: j.tipo, quantity: Number(j.cantidad) || 0, unit: j.unidad })

const toFeeding = (j) => ({ id: j.id, lotId: j.lote_animal_id, food: j.alimento, quantity: Number(j.cantidad) || 0, cost: Number(j.costo) || 0, date: j.fecha ?? '' })

const path = (farmId, name) => `fincas/${farmId}/${name}`

export const listSpecies = async (farmId) => (await api.list(path(farmId, 'especies'))).map(toSpecies)
export const listLots = async (farmId) => (await api.list(path(farmId, 'lotes-animales'))).map(toLot)
export const listAnimals = async (farmId) => (await api.list(path(farmId, 'animales'))).map(toAnimal)
export const listAnimalEvents = async (farmId) => (await api.list(path(farmId, 'eventos-animales'))).map(toEvent)
export const listProduction = async (farmId) => (await api.list(path(farmId, 'produccion-animal'))).map(toProduction)
export const listFeeding = async (farmId) => (await api.list(path(farmId, 'alimentacion-animal'))).map(toFeeding)

export const createSpecies = (farmId, { name, description }) =>
  api.post(path(farmId, 'especies'), { nombre: name, ...(description ? { descripcion: description } : {}) }, { idempotent: true })

export const createLot = (farmId, { speciesId, name, quantity, location }) =>
  api.post(path(farmId, 'lotes-animales'), { especie_id: speciesId, nombre: name, cantidad: quantity, ...(location ? { ubicacion: location } : {}) }, { idempotent: true })

export const createAnimal = (farmId, { speciesId, lotId, tag, name, sex, breed }) =>
  api.post(
    path(farmId, 'animales'),
    { especie_id: speciesId, arete: tag, sexo: sex, ...(lotId ? { lote_animal_id: lotId } : {}), ...(name ? { nombre: name } : {}), ...(breed ? { raza: breed } : {}) },
    { idempotent: true },
  )

export const createAnimalEvent = (farmId, { animalId, lotId, type, date, product, notes }) =>
  api.post(
    path(farmId, 'eventos-animales'),
    { tipo: type, fecha: `${date}T00:00:00`, ...(animalId ? { animal_id: animalId } : { lote_animal_id: lotId }), ...(product ? { producto: product } : {}), ...(notes ? { notas: notes } : {}) },
    { idempotent: true },
  )

export const createProduction = (farmId, { lotId, date, type, quantity, unit }) =>
  api.post(path(farmId, 'produccion-animal'), { lote_animal_id: lotId, fecha: `${date}T00:00:00`, tipo: type, cantidad: quantity, unidad: unit }, { idempotent: true })

export const createFeeding = (farmId, { lotId, food, quantity, cost, date }) =>
  api.post(path(farmId, 'alimentacion-animal'), { lote_animal_id: lotId, alimento: food, cantidad: quantity, costo: cost, fecha: `${date}T00:00:00` }, { idempotent: true })

export const EVENT_TYPES = {
  vacunacion: 'Vacunación',
  tratamiento: 'Tratamiento',
  pesaje: 'Pesaje',
  monta: 'Monta',
  prenez: 'Preñez',
  parto: 'Parto',
  traslado: 'Traslado',
  venta: 'Venta',
  muerte: 'Muerte',
}
export const SEXES = { hembra: 'Hembra', macho: 'Macho', indeterminado: 'Indeterminado' }
