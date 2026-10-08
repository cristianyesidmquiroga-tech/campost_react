import { useState } from 'react'
import { useApp } from '../../context/AppContext'
import { cancelMovement, createExpense, createIncome } from '../../services/money'
import { DateField, Field, FormSheet, InfoTotal, SelectField, positive, required } from '../../components/ui'
import { formatCop, isoDate, parseNumber } from '../../lib/format'
import { EXPENSE_CATEGORIES, INCOME_CATEGORIES } from '../../lib/labels'

const num = (text) => {
  const n = Number(String(text).trim().replace(',', '.'))
  return Number.isFinite(n) ? n : 0
}

export function ExpenseForm({ onClose }) {
  const app = useApp()
  const [form, setForm] = useState({ category: null, amount: '', date: isoDate() })
  return (
    <FormSheet
      title="Registrar gasto"
      subtitle={app.activeFarm?.name}
      submitLabel="Guardar gasto"
      onClose={onClose}
      validate={() => ({ category: form.category ? null : 'Elija una categoría.', amount: positive(form.amount) })}
      onSubmit={() => createExpense(app.activeFarm.id, { category: form.category, amount: parseNumber(form.amount), date: form.date })}
    >
      <SelectField label="Categoría" name="category" value={form.category} placeholder="Elija una categoría" onChange={(category) => setForm((f) => ({ ...f, category }))} options={EXPENSE_CATEGORIES.map((c) => [c, c])} />
      <Field label="Valor del gasto" name="amount" prefix="COP $" inputMode="decimal" value={form.amount} onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))} />
      <DateField label="Fecha" value={form.date} max={isoDate()} onChange={(date) => setForm((f) => ({ ...f, date }))} />
    </FormSheet>
  )
}

export function IncomeForm({ onClose }) {
  const app = useApp()
  const [form, setForm] = useState({ category: null, quantity: '', price: '', buyer: '', date: isoDate() })
  const input = (key) => ({ value: form[key], onChange: (e) => setForm((f) => ({ ...f, [key]: e.target.value })) })
  return (
    <FormSheet
      title="Registrar ingreso"
      subtitle={app.activeFarm?.name}
      submitLabel="Guardar ingreso"
      onClose={onClose}
      validate={() => ({ category: form.category ? null : 'Elija una categoría.', quantity: positive(form.quantity), price: positive(form.price) })}
      onSubmit={() =>
        createIncome(app.activeFarm.id, {
          category: form.category,
          quantity: parseNumber(form.quantity),
          unitPrice: parseNumber(form.price),
          date: form.date,
          buyer: form.buyer.trim() || null,
        })
      }
    >
      <SelectField label="Categoría" name="category" value={form.category} placeholder="Elija una categoría" onChange={(category) => setForm((f) => ({ ...f, category }))} options={INCOME_CATEGORIES.map((c) => [c, c])} />
      <Field label="Cantidad vendida" name="quantity" inputMode="decimal" {...input('quantity')} />
      <Field label="Precio por unidad" name="price" prefix="COP $" inputMode="decimal" {...input('price')} />
      <InfoTotal label="Total del ingreso" value={formatCop(num(form.quantity) * num(form.price))} />
      <Field label="Comprador (opcional)" name="buyer" maxLength={120} {...input('buyer')} />
      <DateField label="Fecha" value={form.date} max={isoDate()} onChange={(date) => setForm((f) => ({ ...f, date }))} />
    </FormSheet>
  )
}

export function CancelForm({ movement, onClose }) {
  const app = useApp()
  const [reason, setReason] = useState('')
  return (
    <FormSheet
      title="Anular movimiento"
      subtitle="Escriba el motivo; queda guardado en la bitácora."
      submitLabel="Anular"
      onClose={onClose}
      validate={() => ({ reason: required(reason, 'Escriba el motivo de la anulación.') })}
      onSubmit={() => cancelMovement(app.activeFarm.id, movement, reason.trim())}
    >
      <Field label="Motivo" name="reason" multiline maxLength={500} value={reason} onChange={(e) => setReason(e.target.value)} />
    </FormSheet>
  )
}
