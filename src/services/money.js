import { api } from './http'

const toMovement = (j, kind) => ({
  id: j.id,
  kind,
  category: j.categoria ?? '',
  amount: Number(j.monto ?? j.total) || 0,
  status: j.estado ?? 'activo',
  cancelled: j.estado === 'anulado',
  isIncome: kind === 'income',
})

export async function cashFlow(farmId, month = new Date()) {
  const j = await api.get(`fincas/${farmId}/flujo-caja`, { anio: month.getFullYear(), mes: month.getMonth() + 1 })
  const income = Number(j.ingresos) || 0
  const expenses = Number(j.gastos) || 0
  const balance = Number(j.saldo) || 0
  return { income, expenses, balance, margin: income > 0 ? (balance / income) * 100 : null }
}

export async function listMovements(farmId) {
  const [expenses, incomes] = await Promise.all([
    api.list(`fincas/${farmId}/gastos`),
    api.list(`fincas/${farmId}/ingresos`),
  ])
  return [...expenses.map((j) => toMovement(j, 'expense')), ...incomes.map((j) => toMovement(j, 'income'))]
}

export function expensesByCategory(movements) {
  const totals = new Map()
  movements
    .filter((m) => !m.isIncome && !m.cancelled)
    .forEach((m) => totals.set(m.category, (totals.get(m.category) ?? 0) + m.amount))
  return [...totals.entries()].sort((a, b) => b[1] - a[1])
}

export const createExpense = (farmId, { category, amount, date }) =>
  api.post(`fincas/${farmId}/gastos`, { categoria: category, monto: amount, fecha: date }, { idempotent: true })

export const createIncome = (farmId, { category, quantity, unitPrice, date, buyer }) =>
  api.post(
    `fincas/${farmId}/ingresos`,
    {
      categoria: category,
      cantidad: quantity,
      precio_unitario: unitPrice,
      fecha: date,
      ...(buyer ? { comprador: buyer } : {}),
    },
    { idempotent: true },
  )

export const cancelMovement = (farmId, movement, reason) =>
  api.post(`fincas/${farmId}/${movement.isIncome ? 'ingresos' : 'gastos'}/${movement.id}/anular`, { motivo: reason })
