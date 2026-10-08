import { humanize } from './format'

const PLANTING_STATUS = { en_curso: 'En curso', planeada: 'Planeada', cerrada: 'Cerrada', cancelada: 'Cancelada' }
export const plantingStatusLabel = (s) => PLANTING_STATUS[s] ?? humanize(s)
export const plantingStatusTone = (s) => (s === 'en_curso' ? 'ok' : s === 'planeada' ? 'info' : 'neutral')

const PHASES = {
  preparacion: 'Preparación del terreno',
  siembra: 'Siembra',
  mantenimiento: 'Mantenimiento',
  cosecha: 'Cosecha',
  poscosecha: 'Poscosecha',
  renovacion: 'Renovación',
}
export const phaseLabel = (p) => PHASES[p] ?? humanize(p)
export const PHASE_KEYS = Object.keys(PHASES)

const CYCLES = { levante: 'Levante', produccion: 'Producción', renovacion: 'Renovación' }
export const cycleTypeLabel = (t) => CYCLES[t] ?? humanize(t)
export const CYCLE_KEYS = Object.keys(CYCLES)

const METHODS = {
  semilla: 'Semilla',
  esqueje: 'Esqueje',
  estaca: 'Estaca',
  injerto: 'Injerto',
  hijuelo: 'Hijuelo',
  acodo: 'Acodo',
  in_vitro: 'In vitro',
}
export const methodLabel = (m) => METHODS[m] ?? humanize(m)
export const METHOD_KEYS = Object.keys(METHODS)

export const susceptibilityTone = (level) => (level === 'alta' ? 'danger' : level === 'media' ? 'warn' : 'neutral')
export const severityTone = (s) => (s === 'severa' ? 'danger' : s === 'moderada' ? 'warn' : 'neutral')

export const WORKER_TYPES = { jornalero: 'Jornalero', contratista: 'Contratista', fijo: 'Fijo' }
export const workerTypeLabel = (t) => WORKER_TYPES[t] ?? humanize(t)

export const EXPENSE_CATEGORIES = [
  'Mano de obra',
  'Insumos y fertilizantes',
  'Combustible y fletes',
  'Mantenimiento de herramientas',
  'Servicios y arriendos',
  'Otros gastos',
]
export const INCOME_CATEGORIES = ['Venta de cosecha', 'Venta de subproductos', 'Venta de animales', 'Otros ingresos']
