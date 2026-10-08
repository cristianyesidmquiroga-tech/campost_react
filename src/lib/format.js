const MONTHS = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic']

const asNumber = (value) => {
  if (value === null || value === undefined || value === '') return null
  const number = typeof value === 'number' ? value : Number(value)
  return Number.isFinite(number) ? number : null
}

const group = (digits) => digits.replace(/\B(?=(\d{3})+(?!\d))/g, '.')

export function formatNumber(value, decimals = 0) {
  const number = asNumber(value)
  if (number === null) return '—'
  const [whole, fraction] = Math.abs(number).toFixed(decimals).split('.')
  const text = decimals > 0 ? `${group(whole)},${fraction}` : group(whole)
  return number < 0 ? `-${text}` : text
}

export function formatCop(value) {
  const number = asNumber(value)
  if (number === null) return '—'
  return `$ ${formatNumber(Math.round(number))}`
}

export function formatHa(value) {
  const number = asNumber(value)
  if (number === null) return '—'
  return `${formatNumber(number, Number.isInteger(number) ? 0 : 1)} ha`
}

const asDate = (value) => {
  if (!value) return null
  const date = value instanceof Date ? value : new Date(`${String(value).slice(0, 10)}T12:00:00`)
  return Number.isNaN(date.getTime()) ? null : date
}

export function formatDate(value) {
  const date = asDate(value)
  if (!date) return '—'
  return `${date.getDate()} ${MONTHS[date.getMonth()]} ${date.getFullYear()}`
}

export function formatDateShort(value) {
  const date = asDate(value)
  if (!date) return '—'
  return `${date.getDate()} ${MONTHS[date.getMonth()]}`
}

export function greeting(now = new Date()) {
  const hour = now.getHours()
  if (hour < 12) return 'Buenos días'
  if (hour < 19) return 'Buenas tardes'
  return 'Buenas noches'
}

export const capitalize = (text) => (text ? text[0].toUpperCase() + text.slice(1) : text)
export const humanize = (code) => capitalize(String(code ?? '').replaceAll('_', ' '))
export const firstName = (fullName) => String(fullName ?? '').trim().split(/\s+/)[0] ?? ''
export const isoDate = (date = new Date()) => {
  const pad = (n) => String(n).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
}
export const parseNumber = (text) => Number(String(text).trim().replace(',', '.'))
