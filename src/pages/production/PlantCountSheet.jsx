import { useState } from 'react'
import { addCount } from '../../services/production'
import { DateField, Field, FormSheet } from '../../components/ui'
import { isoDate } from '../../lib/format'

const whole = (value) => (/^\d+$/.test(String(value).trim()) ? null : 'Escriba un número entero.')

export function PlantCountSheet({ plantingId, onClose }) {
  const [form, setForm] = useState({ alive: '', dead: '0', replanted: '0', date: isoDate() })
  const input = (key) => ({ value: form[key], inputMode: 'numeric', onChange: (e) => setForm((f) => ({ ...f, [key]: e.target.value })) })
  return (
    <FormSheet
      title="Registrar conteo de plantas"
      subtitle="Cuente las plantas del lote para actualizar los índices."
      submitLabel="Guardar conteo"
      onClose={onClose}
      validate={() => ({ alive: whole(form.alive), dead: whole(form.dead), replanted: whole(form.replanted) })}
      onSubmit={() =>
        addCount(plantingId, {
          date: form.date,
          alive: Number(form.alive),
          dead: Number(form.dead),
          replanted: Number(form.replanted),
        })
      }
    >
      <DateField label="Fecha del conteo" value={form.date} max={isoDate()} onChange={(date) => setForm((f) => ({ ...f, date }))} />
      <Field label="Plantas vivas" name="alive" {...input('alive')} />
      <Field label="Plantas muertas" name="dead" {...input('dead')} />
      <Field label="Resiembras" name="replanted" {...input('replanted')} />
    </FormSheet>
  )
}
