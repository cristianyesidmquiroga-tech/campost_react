import { useState } from 'react'
import { Sprout } from 'lucide-react'
import { useApp } from '../../context/AppContext'
import { useAsync } from '../../hooks/useAsync'
import { createHarvest, openCycles } from '../../services/production'
import { listWorkers, registerWork } from '../../services/workers'
import { DateField, EmptyState, Field, FormSheet, InfoTotal, Loadable, SelectField, Sheet, positive, required } from '../../components/ui'
import { formatCop, isoDate, parseNumber } from '../../lib/format'
import { PHASE_KEYS, cycleTypeLabel, phaseLabel } from '../../lib/labels'

const NoCycles = () => (
  <EmptyState icon={Sprout} title="No hay siembras en curso" message="Inicie una siembra para poder registrar labores y cosechas en su ciclo." />
)

const optionLabel = (app, o) => `${app.cropName(o.planting.cropId)} · ${cycleTypeLabel(o.cycle.type)} ${o.cycle.number}`

const num = (text) => {
  const n = Number(String(text).trim().replace(',', '.'))
  return Number.isFinite(n) ? n : 0
}

export function WorkForm({ cycleId, onClose }) {
  const app = useApp()
  const farm = app.activeFarm
  const data = useAsync(async () => ({
    options: await openCycles(farm.id),
    workers: await listWorkers(farm.id).catch(() => []),
  }), [farm?.id])
  const [form, setForm] = useState({ cycleId: cycleId ?? null, name: '', phase: 'mantenimiento', date: isoDate(), area: '', workerId: null, workers: '1', days: '1', value: '' })
  const input = (key) => ({ value: form[key], onChange: (e) => setForm((f) => ({ ...f, [key]: e.target.value })) })
  const set = (key) => (value) => setForm((f) => ({ ...f, [key]: value }))
  const skeleton = <Sheet title="Registrar labor con jornales" onClose={() => onClose(false)}><p>Cargando…</p></Sheet>

  return (
    <Loadable state={data} skeleton={skeleton}>
      {({ options, workers }) => {
        const chosenCycle = form.cycleId ?? (options.length === 1 ? options[0].cycle.id : null)
        return options.length === 0 ? (
          <Sheet title="Registrar labor con jornales" onClose={() => onClose(false)}><NoCycles /></Sheet>
        ) : (
          <FormSheet
            title="Registrar labor con jornales"
            subtitle={farm.name}
            submitLabel="Guardar labor"
            onClose={onClose}
            validate={() => ({
              cycleId: chosenCycle ? null : 'Elija una siembra.',
              name: required(form.name),
              area: positive(form.area),
              workers: positive(form.workers),
              days: positive(form.days),
              value: positive(form.value),
            })}
            onSubmit={() =>
              registerWork(farm.id, {
                cycleId: chosenCycle,
                name: form.name.trim(),
                phase: form.phase,
                date: form.date,
                workedArea: parseNumber(form.area),
                workers: parseNumber(form.workers),
                days: parseNumber(form.days),
                dailyValue: parseNumber(form.value),
                workerId: form.workerId,
              })
            }
          >
            <SelectField label="Siembra y ciclo" name="cycleId" value={chosenCycle} placeholder="Elija una siembra" onChange={set('cycleId')} options={options.map((o) => [o.cycle.id, optionLabel(app, o)])} />
            <Field label="Nombre de la labor" name="name" hint="Ejemplo: Socola y limpia" maxLength={150} {...input('name')} />
            <SelectField label="Fase" name="phase" value={form.phase} onChange={(v) => set('phase')(v ?? 'mantenimiento')} options={PHASE_KEYS.map((p) => [p, phaseLabel(p)])} />
            <DateField label="Fecha" value={form.date} max={isoDate()} onChange={set('date')} />
            <Field label="Área trabajada (hectáreas)" name="area" inputMode="decimal" {...input('area')} />
            {workers.length > 0 && (
              <SelectField label="Trabajador (opcional)" name="workerId" value={form.workerId} placeholder="Cuadrilla sin nombre" onChange={set('workerId')} options={workers.map((w) => [w.id, w.name])} />
            )}
            <Field label="Obreros" name="workers" inputMode="decimal" {...input('workers')} />
            <Field label="Días trabajados" name="days" inputMode="decimal" {...input('days')} />
            <Field label="Valor del jornal" name="value" prefix="COP $" inputMode="decimal" {...input('value')} />
            <InfoTotal label="Costo de mano de obra" value={formatCop(num(form.workers) * num(form.days) * num(form.value))} />
          </FormSheet>
        )
      }}
    </Loadable>
  )
}

const UNITS = [['kilo', 'Kilos'], ['arroba', 'Arrobas (12,5 kg)'], ['carga', 'Cargas'], ['lona', 'Lonas'], ['bulto', 'Bultos'], ['racimo', 'Racimos']]

export function HarvestForm({ onClose }) {
  const app = useApp()
  const farm = app.activeFarm
  const data = useAsync(() => openCycles(farm.id), [farm?.id])
  const [form, setForm] = useState({ cycleId: null, quantity: '', unit: 'kilo', quality: null, date: isoDate() })
  const set = (key) => (value) => setForm((f) => ({ ...f, [key]: value }))

  return (
    <Loadable state={data} skeleton={<Sheet title="Registrar cosecha" onClose={() => onClose(false)}><p>Cargando…</p></Sheet>}>
      {(options) =>
        options.length === 0 ? (
          <Sheet title="Registrar cosecha" onClose={() => onClose(false)}><NoCycles /></Sheet>
        ) : (
          <FormSheet
            title="Registrar cosecha"
            subtitle={farm.name}
            submitLabel="Guardar cosecha"
            onClose={onClose}
            validate={() => ({ cycleId: form.cycleId ?? options[0]?.cycle.id ? null : 'Elija una siembra.', quantity: positive(form.quantity) })}
            onSubmit={() => createHarvest(farm.id, { cycleId: form.cycleId ?? options[0].cycle.id, quantity: parseNumber(form.quantity), unit: form.unit, date: form.date, quality: form.quality })}
          >
            <SelectField label="Siembra y ciclo" name="cycleId" value={form.cycleId ?? options[0].cycle.id} onChange={set('cycleId')} options={options.map((o) => [o.cycle.id, optionLabel(app, o)])} />
            <Field label="Cantidad cosechada" name="quantity" inputMode="decimal" value={form.quantity} onChange={(e) => set('quantity')(e.target.value)} />
            <SelectField label="Unidad" name="unit" value={form.unit} onChange={(v) => set('unit')(v ?? 'kilo')} options={UNITS} />
            <SelectField label="Calidad (opcional)" name="quality" value={form.quality} placeholder="Sin clasificar" onChange={set('quality')} options={[['primera', 'Primera'], ['segunda', 'Segunda'], ['tercera', 'Tercera']]} />
            <DateField label="Fecha" value={form.date} max={isoDate()} onChange={set('date')} />
          </FormSheet>
        )
      }
    </Loadable>
  )
}
