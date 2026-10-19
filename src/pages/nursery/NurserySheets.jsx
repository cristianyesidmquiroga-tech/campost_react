import { useState } from 'react'
import { useApp } from '../../context/AppContext'
import { useAsync } from '../../hooks/useAsync'
import { createBatch, transplantBatch, updateBatch } from '../../services/nursery'
import { listPlantings } from '../../services/production'
import { DateField, Field, FormSheet, Loadable, SelectField, Sheet } from '../../components/ui'
import { isoDate } from '../../lib/format'
import { METHOD_KEYS, methodLabel } from '../../lib/labels'

const whole = (value) => (/^\d+$/.test(String(value).trim()) ? null : 'Escriba un número entero.')
const positiveWhole = (value) => (/^[1-9]\d*$/.test(String(value).trim()) ? null : 'Escriba un número mayor que cero.')

export function BatchForm({ farm, onClose }) {
  const app = useApp()
  const [form, setForm] = useState({ cropId: null, method: 'semilla', start: isoDate(), total: '' })
  const set = (key) => (value) => setForm((f) => ({ ...f, [key]: value }))
  return (
    <FormSheet
      title="Nuevo lote de vivero"
      subtitle={farm.name}
      submitLabel="Guardar lote"
      onClose={onClose}
      validate={() => ({ cropId: form.cropId ? null : 'Elija el cultivo.', total: positiveWhole(form.total) })}
      onSubmit={() => createBatch({ farmId: farm.id, cropId: form.cropId, method: form.method, start: form.start, total: Number(form.total) })}
    >
      <SelectField label="Cultivo" name="cropId" value={form.cropId} placeholder="Elija el cultivo" onChange={set('cropId')} options={Object.values(app.crops).map((c) => [c.id, c.name])} />
      <SelectField label="Método" name="method" value={form.method} onChange={(v) => set('method')(v ?? 'semilla')} options={METHOD_KEYS.map((k) => [k, methodLabel(k)])} />
      <DateField label="Fecha de inicio" value={form.start} max={isoDate()} onChange={set('start')} />
      <Field label="Semillas o esquejes puestos" name="total" inputMode="numeric" value={form.total} onChange={(e) => set('total')(e.target.value)} />
    </FormSheet>
  )
}

export function BatchProgressSheet({ batch, onClose }) {
  const [form, setForm] = useState({ germinated: String(batch.germinated), ready: String(batch.ready), lost: String(batch.lost) })
  const input = (key) => ({ value: form[key], inputMode: 'numeric', onChange: (e) => setForm((f) => ({ ...f, [key]: e.target.value })) })
  return (
    <FormSheet
      title="Actualizar lote"
      subtitle={`${batch.total} puestas`}
      submitLabel="Guardar avance"
      onClose={onClose}
      validate={() => ({ germinated: whole(form.germinated), ready: whole(form.ready), lost: whole(form.lost) })}
      onSubmit={() => updateBatch(batch.id, { germinated: Number(form.germinated), ready: Number(form.ready), lost: Number(form.lost) })}
    >
      <Field label="Germinadas" name="germinated" {...input('germinated')} />
      <Field label="Listas para sembrar" name="ready" {...input('ready')} />
      <Field label="Perdidas" name="lost" {...input('lost')} />
    </FormSheet>
  )
}

export function TransplantSheet({ batch, onClose }) {
  const app = useApp()
  const available = batch.ready - batch.transplanted
  const plantings = useAsync(async () => (await listPlantings()).filter((p) => p.farmId === batch.farmId && p.cropId === batch.cropId && p.status !== 'cancelada'), [batch.id])
  const [form, setForm] = useState({ plantingId: null, quantity: '' })
  return (
    <Loadable state={plantings} skeleton={<Sheet title="Trasplantar" onClose={() => onClose(false)}><p>Cargando…</p></Sheet>}>
      {(list) => (
        <FormSheet
          title="Trasplantar al lote"
          subtitle={`${available} plantas disponibles`}
          submitLabel="Registrar trasplante"
          onClose={onClose}
          validate={() => ({
            plantingId: form.plantingId ? null : 'Elija la siembra de destino.',
            quantity: positiveWhole(form.quantity) ?? (Number(form.quantity) > available ? `Solo hay ${available} plantas disponibles.` : null),
          })}
          onSubmit={() => transplantBatch(batch.id, { plantingId: form.plantingId, quantity: Number(form.quantity) })}
        >
          <SelectField label="Siembra de destino" name="plantingId" value={form.plantingId} placeholder={list.length ? 'Elija la siembra' : 'No hay siembras de este cultivo'} onChange={(v) => setForm((f) => ({ ...f, plantingId: v }))} options={list.map((p) => [p.id, `${app.cropName(p.cropId)} - ${p.areaHa} ha`])} />
          <Field label="Cantidad a trasplantar" name="quantity" inputMode="numeric" value={form.quantity} onChange={(e) => setForm((f) => ({ ...f, quantity: e.target.value }))} />
        </FormSheet>
      )}
    </Loadable>
  )
}
