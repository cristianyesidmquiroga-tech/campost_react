import { describe, expect, it } from 'vitest'
import { firstName, formatCop, formatDate, formatDateShort, formatHa, formatNumber, greeting, humanize } from '../../src/lib/format'

describe('formato', () => {
  it('el dinero usa punto de miles y el signo de pesos', () => {
    expect(formatCop(1850000)).toBe('$ 1.850.000')
    expect(formatCop('4248000.00')).toBe('$ 4.248.000')
    expect(formatCop(-215000)).toBe('$ -215.000')
    expect(formatCop(null)).toBe('—')
  })

  it('los números llevan coma decimal', () => {
    expect(formatNumber(18.5, 1)).toBe('18,5')
    expect(formatNumber(1234567)).toBe('1.234.567')
    expect(formatNumber(0)).toBe('0')
  })

  it('las hectáreas omiten el decimal cuando es entero', () => {
    expect(formatHa(14)).toBe('14 ha')
    expect(formatHa(4.5)).toBe('4,5 ha')
  })

  it('las fechas salen en español', () => {
    expect(formatDate('2026-10-07')).toBe('7 oct 2026')
    expect(formatDateShort('2026-09-27')).toBe('27 sep')
    expect(formatDate('no es fecha')).toBe('—')
  })

  it('el saludo cambia según la hora', () => {
    expect(greeting(new Date(2026, 0, 1, 8))).toBe('Buenos días')
    expect(greeting(new Date(2026, 0, 1, 15))).toBe('Buenas tardes')
    expect(greeting(new Date(2026, 0, 1, 21))).toBe('Buenas noches')
  })

  it('humanize y firstName', () => {
    expect(humanize('en_curso')).toBe('En curso')
    expect(firstName('Hernando Gómez Restrepo')).toBe('Hernando')
  })
})
