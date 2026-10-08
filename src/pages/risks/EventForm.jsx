import { useState } from 'react'
import { useApp } from '../../context/AppContext'
import { useAsync } from '../../hooks/useAsync'
import { createEvent, riskCatalog } from '../../services/risks'
import { listPlantings } from '../../services/production'
import { DateField, Field, FormSheet, Loadable, SelectField, Sheet } from '../../components/ui'
import { isoDate, parseNumber } from '../../lib/format'

export function EventForm({ onClose }) {
  const app = useApp()
  const farm = app.activeFarm
  const data = useAsync(async () => {
    const risks = await riskCatalog()
    const plantings = (await listPlantings().catch(() => [])).filter((p) => p.farmId === farm?.id && p.status === 'en_curso')
    return { risks, plantings }
  }, [farm?.id])
  const [form, setForm] = useState({ riskId: null, plantingId: null, severity: 'moderada', area: '', loss: '', notes: '', date: isoDate() })
  const input = (key) => ({ value: form[key], onChange: (e) => setForm((f) => ({ ...f, [key]: e.target.value })) })
  const set = (key) => (value) => setForm((f) => ({ ...f, [key]: value }))

  if (!farm) return <Sheet title="Registrar evento adverso" onClose={() => onClose(false)}><p>Primero registre una finca.</p></Sheet>

  return (
    <Loadable state={data} skeleton={<Sheet title="Registrar evento adverso" onClose={() => onClose(false)}><p>Cargando…</p></Sheet>}>
      {({ risks, plantings }) => (
        <FormSheet
          title="Registrar evento adverso"
          subtitle={farm.name}
          submitLabel="Guardar evento"
          onClose={onClose}
          validate={() => ({ riskId: form.riskId ? null : 'Elija el tipo de evento.' })}
          onSubmit={() =>
            createEvent({
              farmId: farm.id,
              riskId: form.riskId,
              start: form.date,
              severity: form.severity,
              plantingId: form.plantingId,
              affectedArea: form.area ? parseNumber(form.area) : null,
              estimatedLoss: form.loss ? parseNumber(form.loss) : null,
              notes: form.notes.trim() || null,
            })
          }
        >
          <SelectField label="Qué ocurrió" name="riskId" value={form.riskId} placeholder="Elija el tipo de evento" onChange={set('riskId')} options={risks.map((r) => [r.id, r.name])} />
          {plantings.length > 0 && (
            <SelectField label="Siembra afectada (opcional)" name="plantingId" value={form.plantingId} placeholder="Toda la finca" onChange={set('plantingId')} options={plantings.map((p) => [p.id, app.cropName(p.cropId)])} />
          )}
          <SelectField label="Severidad" name="severity" value={form.severity} onChange={(v) => set('severity')(v ?? 'moderada')} options={[['leve', 'Leve'], ['moderada', 'Moderada'], ['severa', 'Severa']]} />
          <DateField label="Fecha de inicio" value={form.date} max={isoDate()} onChange={set('date')} />
          <Field label="Área afectada en hectáreas (opcional)" name="area" inputMode="decimal" {...input('area')} />
          <Field label="Pérdida estimada en pesos (opcional)" name="loss" prefix="COP $" inputMode="decimal" {...input('loss')} />
          <Field label="Notas (opcional)" name="notes" multiline maxLength={2000} {...input('notes')} />
        </FormSheet>
      )}
    </Loadable>
  )
}
