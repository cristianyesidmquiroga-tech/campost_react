import { useState } from 'react'
import { Sprout } from 'lucide-react'
import { useApp } from '../../context/AppContext'
import { useAsync } from '../../hooks/useAsync'
import { createPlanting, listCrops } from '../../services/production'
import { listLots } from '../../services/farms'
import { DateField, EmptyState, ErrorState, Field, FormSheet, Loadable, SelectField, Sheet, positive } from '../../components/ui'
import { formatHa, isoDate, parseNumber } from '../../lib/format'
import { METHOD_KEYS, methodLabel } from '../../lib/labels'

export function PlantingForm({ onClose }) {
  const app = useApp()
  const farm = app.activeFarm
  const data = useAsync(async () => ({ lots: await listLots(farm.id), crops: await listCrops() }), [farm?.id])
  const [form, setForm] = useState({ lotId: null, cropId: null, method: 'semilla', area: '', plants: '', budget: '', date: isoDate() })
  const set = (key) => (value) => setForm((f) => ({ ...f, [key]: value }))
  const input = (key) => ({ value: form[key], onChange: (e) => set(key)(e.target.value) })

  if (!farm) return <Sheet title="Planear siembra" onClose={() => onClose(false)}><ErrorState error={new Error('Primero registre una finca.')} /></Sheet>

  return (
    <Loadable
      state={data}
      skeleton={<Sheet title="Planear siembra" onClose={() => onClose(false)}><p>Cargando…</p></Sheet>}
    >
      {({ lots, crops }) =>
        lots.length === 0 ? (
          <Sheet title="Planear siembra" onClose={() => onClose(false)}>
            <EmptyState icon={Sprout} title="Esta finca aún no tiene lotes" message="Agregue un lote en el detalle de la finca antes de planear una siembra." />
          </Sheet>
        ) : (
          <FormSheet
            title="Planear siembra"
            subtitle={farm.name}
            submitLabel="Planear siembra"
            onClose={onClose}
            validate={() => ({
              lotId: form.lotId ? null : 'Elija un lote.',
              cropId: form.cropId ? null : 'Elija un cultivo.',
              area: positive(form.area),
            })}
            onSubmit={() =>
              createPlanting({
                farmId: farm.id,
                lotId: form.lotId,
                cropId: form.cropId,
                method: form.method,
                areaHa: parseNumber(form.area),
                planDate: form.date,
                plants: form.plants ? Number(form.plants) : null,
                budget: form.budget ? parseNumber(form.budget) : null,
              })
            }
          >
            <SelectField label="Lote" name="lotId" value={form.lotId} onChange={set('lotId')} placeholder="Elija un lote" options={lots.map((l) => [l.id, `${l.name} · ${formatHa(l.areaHa)}`])} />
            <SelectField label="Cultivo" name="cropId" value={form.cropId} onChange={set('cropId')} placeholder="Elija un cultivo" options={crops.map((c) => [c.id, c.name])} />
            <SelectField label="Forma de propagación" name="method" value={form.method} onChange={(v) => set('method')(v ?? 'semilla')} options={METHOD_KEYS.map((m) => [m, methodLabel(m)])} />
            <Field label="Área sembrada (hectáreas)" name="area" inputMode="decimal" {...input('area')} />
            <Field label="Plantas sembradas (opcional)" name="plants" inputMode="numeric" {...input('plants')} />
            <DateField label="Fecha planeada" value={form.date} onChange={set('date')} />
            <Field label="Presupuesto en pesos (opcional)" name="budget" prefix="$" inputMode="decimal" {...input('budget')} />
          </FormSheet>
        )
      }
    </Loadable>
  )
}
