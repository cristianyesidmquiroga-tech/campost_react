import { useState } from 'react'
import { createAnimal, createAnimalEvent, createFeeding, createLot, createProduction, createSpecies, EVENT_TYPES, SEXES } from '../../services/livestock'
import { DateField, Field, FormSheet, SelectField } from '../../components/ui'
import { isoDate, parseNumber } from '../../lib/format'

const text = (value, message = 'Este campo es obligatorio.') => (String(value).trim() ? null : message)
const amount = (value) => (parseNumber(value) > 0 ? null : 'Escriba una cantidad mayor que cero.')
const useForm = (initial) => {
  const [form, setForm] = useState(initial)
  const set = (key) => (value) => setForm((f) => ({ ...f, [key]: value }))
  const input = (key, extra) => ({ value: form[key], onChange: (e) => set(key)(e.target.value), ...extra })
  return { form, set, input }
}

export function SpeciesForm({ farm, onClose }) {
  const { form, input } = useForm({ name: '', description: '' })
  return (
    <FormSheet title="Nueva especie" subtitle={farm.name} submitLabel="Guardar especie" onClose={onClose} validate={() => ({ name: text(form.name) })} onSubmit={() => createSpecies(farm.id, { name: form.name.trim(), description: form.description.trim() })}>
      <Field label="Nombre de la especie" name="name" maxLength={80} {...input('name')} />
      <Field label="Descripción (opcional)" name="description" multiline maxLength={500} {...input('description')} />
    </FormSheet>
  )
}

export function LotForm({ farm, species, onClose }) {
  const { form, set, input } = useForm({ speciesId: null, name: '', quantity: '', location: '' })
  return (
    <FormSheet
      title="Nuevo lote de animales"
      subtitle={farm.name}
      submitLabel="Guardar lote"
      onClose={onClose}
      validate={() => ({ speciesId: form.speciesId ? null : 'Elija la especie.', name: text(form.name), quantity: amount(form.quantity) })}
      onSubmit={() => createLot(farm.id, { speciesId: form.speciesId, name: form.name.trim(), quantity: parseNumber(form.quantity), location: form.location.trim() })}
    >
      <SelectField label="Especie" name="speciesId" value={form.speciesId} placeholder="Elija la especie" onChange={set('speciesId')} options={species.map((s) => [s.id, s.name])} />
      <Field label="Nombre del lote" name="name" maxLength={80} {...input('name')} />
      <Field label="Cantidad de animales" name="quantity" inputMode="numeric" {...input('quantity')} />
      <Field label="Ubicación (opcional)" name="location" maxLength={120} {...input('location')} />
    </FormSheet>
  )
}

export function AnimalForm({ farm, species, lots, onClose }) {
  const { form, set, input } = useForm({ speciesId: null, lotId: null, tag: '', name: '', sex: 'hembra', breed: '' })
  return (
    <FormSheet
      title="Nuevo animal"
      subtitle={farm.name}
      submitLabel="Guardar animal"
      onClose={onClose}
      validate={() => ({ speciesId: form.speciesId ? null : 'Elija la especie.', tag: text(form.tag, 'Escriba el número de arete.') })}
      onSubmit={() => createAnimal(farm.id, { speciesId: form.speciesId, lotId: form.lotId, tag: form.tag.trim(), name: form.name.trim(), sex: form.sex, breed: form.breed.trim() })}
    >
      <SelectField label="Especie" name="speciesId" value={form.speciesId} placeholder="Elija la especie" onChange={set('speciesId')} options={species.map((s) => [s.id, s.name])} />
      <Field label="Número de arete" name="tag" maxLength={80} {...input('tag')} />
      <Field label="Nombre (opcional)" name="name" maxLength={80} {...input('name')} />
      <SelectField label="Sexo" name="sex" value={form.sex} onChange={(v) => set('sex')(v ?? 'hembra')} options={Object.entries(SEXES)} />
      <Field label="Raza (opcional)" name="breed" maxLength={80} {...input('breed')} />
      {lots.length > 0 && <SelectField label="Lote (opcional)" name="lotId" value={form.lotId} placeholder="Sin lote" onChange={set('lotId')} options={lots.map((l) => [l.id, l.name])} />}
    </FormSheet>
  )
}

export function AnimalEventForm({ farm, animalId, lotId, onClose }) {
  const { form, set, input } = useForm({ type: 'vacunacion', date: isoDate(), product: '', notes: '' })
  return (
    <FormSheet
      title="Registrar evento"
      subtitle={farm.name}
      submitLabel="Guardar evento"
      onClose={onClose}
      validate={() => ({})}
      onSubmit={() => createAnimalEvent(farm.id, { animalId, lotId, type: form.type, date: form.date, product: form.product.trim(), notes: form.notes.trim() })}
    >
      <SelectField label="Tipo de evento" name="type" value={form.type} onChange={(v) => set('type')(v ?? 'vacunacion')} options={Object.entries(EVENT_TYPES)} />
      <DateField label="Fecha" value={form.date} max={isoDate()} onChange={set('date')} />
      <Field label="Producto (opcional)" name="product" maxLength={120} {...input('product')} />
      <Field label="Notas (opcional)" name="notes" multiline maxLength={1000} {...input('notes')} />
    </FormSheet>
  )
}

export function ProductionForm({ farm, lotId, onClose }) {
  const { form, set, input } = useForm({ type: '', quantity: '', unit: '', date: isoDate() })
  return (
    <FormSheet
      title="Registrar producción"
      subtitle={farm.name}
      submitLabel="Guardar producción"
      onClose={onClose}
      validate={() => ({ type: text(form.type, 'Escriba qué se produjo.'), quantity: amount(form.quantity), unit: text(form.unit, 'Escriba la unidad.') })}
      onSubmit={() => createProduction(farm.id, { lotId, date: form.date, type: form.type.trim(), quantity: parseNumber(form.quantity), unit: form.unit.trim() })}
    >
      <Field label="Qué se produjo (leche, huevos, carne)" name="type" maxLength={60} {...input('type')} />
      <Field label="Cantidad" name="quantity" inputMode="decimal" {...input('quantity')} />
      <Field label="Unidad (litros, unidades, kilos)" name="unit" maxLength={30} {...input('unit')} />
      <DateField label="Fecha" value={form.date} max={isoDate()} onChange={set('date')} />
    </FormSheet>
  )
}

export function FeedingForm({ farm, lotId, onClose }) {
  const { form, set, input } = useForm({ food: '', quantity: '', cost: '', date: isoDate() })
  return (
    <FormSheet
      title="Registrar alimentación"
      subtitle={farm.name}
      submitLabel="Guardar alimentación"
      onClose={onClose}
      validate={() => ({ food: text(form.food, 'Escriba el alimento.'), quantity: amount(form.quantity), cost: parseNumber(form.cost) >= 0 && String(form.cost).trim() ? null : 'Escriba el costo.' })}
      onSubmit={() => createFeeding(farm.id, { lotId, food: form.food.trim(), quantity: parseNumber(form.quantity), cost: parseNumber(form.cost), date: form.date })}
    >
      <Field label="Alimento" name="food" maxLength={80} {...input('food')} />
      <Field label="Cantidad (kilos)" name="quantity" inputMode="decimal" {...input('quantity')} />
      <Field label="Costo en pesos" name="cost" prefix="COP $" inputMode="decimal" {...input('cost')} />
      <DateField label="Fecha" value={form.date} max={isoDate()} onChange={set('date')} />
    </FormSheet>
  )
}
