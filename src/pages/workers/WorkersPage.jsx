import { useState } from 'react'
import { Search, ShieldCheck, UserPlus, Users } from 'lucide-react'
import { useApp } from '../../context/AppContext'
import { useAuth } from '../../context/AuthContext'
import { useAsync } from '../../hooks/useAsync'
import { createWorker, listWorkers } from '../../services/workers'
import { Amount, Card, EmptyState, Field, FilterBar, FormSheet, Loadable, Note, SelectField, StatusPill, positive, required } from '../../components/ui'
import { DetailPage, Gap } from '../../components/layout/Page'
import { formatCop, parseNumber } from '../../lib/format'
import { WORKER_TYPES, workerTypeLabel } from '../../lib/labels'

const TYPES = [null, 'jornalero', 'contratista', 'fijo']

function WorkerForm({ farm, onClose }) {
  const [form, setForm] = useState({ name: '', type: 'jornalero', rate: '', document: '', phone: '' })
  const input = (key) => ({ value: form[key], onChange: (e) => setForm((f) => ({ ...f, [key]: e.target.value })) })
  return (
    <FormSheet
      title="Registrar trabajador"
      subtitle={farm.name}
      submitLabel="Guardar trabajador"
      onClose={onClose}
      validate={() => ({ name: required(form.name), rate: positive(form.rate) })}
      onSubmit={() =>
        createWorker(farm.id, {
          name: form.name.trim(),
          type: form.type,
          dailyRate: parseNumber(form.rate),
          document: form.document.trim() || null,
          phone: form.phone.trim() || null,
        })
      }
    >
      <Field label="Nombre completo" name="name" maxLength={150} {...input('name')} />
      <SelectField label="Tipo" name="type" value={form.type} onChange={(type) => setForm((f) => ({ ...f, type: type ?? 'jornalero' }))} options={Object.entries(WORKER_TYPES)} />
      <Field label="Jornal habitual" name="rate" prefix="COP $" inputMode="decimal" {...input('rate')} />
      <Field label="Documento de identidad (opcional)" name="document" inputMode="numeric" maxLength={20} {...input('document')} />
      <Field label="Teléfono (opcional)" name="phone" type="tel" maxLength={30} {...input('phone')} />
    </FormSheet>
  )
}

export function WorkersPage() {
  const app = useApp()
  const { access } = useAuth()
  const farm = app.activeFarm
  const [query, setQuery] = useState('')
  const [filter, setFilter] = useState(0)
  const [creating, setCreating] = useState(false)
  const state = useAsync(() => (farm ? listWorkers(farm.id) : Promise.resolve([])), [farm?.id, app.revision])

  return (
    <DetailPage
      title="Trabajadores"
      subtitle={farm?.name ?? 'Sin finca activa'}
      fab={access.managesWorkers && farm ? { icon: UserPlus, label: 'Registrar', onClick: () => setCreating(true) } : undefined}
    >
      {!farm ? (
        <Card><EmptyState icon={Users} title="Sin finca activa" message="Registre una finca para llevar sus trabajadores." /></Card>
      ) : (
        <Loadable state={state}>
          {(all) => {
            const type = TYPES[filter]
            const shown = all.filter((w) => (!type || w.type === type) && w.name.toLowerCase().includes(query.toLowerCase()))
            return (
              <>
                <div className="field" style={{ marginBottom: 12 }}>
                  <div className="field__wrap field__wrap--icon">
                    <Search size={20} aria-hidden />
                    <input className="field__control" placeholder="Buscar trabajador" aria-label="Buscar trabajador" value={query} onChange={(e) => setQuery(e.target.value)} />
                  </div>
                </div>
                <FilterBar labels={['Todos', 'Jornaleros', 'Contratistas', 'Fijos']} counts={TYPES.map((t) => all.filter((w) => !t || w.type === t).length)} selected={filter} onSelect={setFilter} />
                <Gap />
                {shown.length === 0 ? (
                  <Card>
                    <EmptyState icon={Users} title={all.length === 0 ? 'Aún no hay trabajadores' : 'Nadie coincide con la búsqueda'} message={all.length === 0 ? 'Registre a quienes trabajan en la finca para llevar sus jornales.' : undefined} />
                  </Card>
                ) : (
                  <div className="stack gap-12">
                    {shown.map((w) => (
                      <Card key={w.id} to={`/mas/trabajadores/${w.id}`}>
                        <div className="row gap-12" style={{ alignItems: 'flex-start' }}>
                          <span className="avatar avatar--sm">{w.initials}</span>
                          <div className="grow stack gap-4">
                            <h3 className="headline-md clamp-2" style={{ fontSize: 18 }}>{w.name}</h3>
                            <span className="mono-sm">{w.maskedDocument}</span>
                            <span><StatusPill tone={w.status === 'activo' ? 'ok' : 'neutral'}>{workerTypeLabel(w.type)}</StatusPill></span>
                          </div>
                        </div>
                        <div className="flow-row" style={{ margin: '12px 0 0' }}>
                          <span className="body-sm grow">Jornal habitual</span>
                          <Amount>{formatCop(w.dailyRate)}</Amount>
                        </div>
                      </Card>
                    ))}
                  </div>
                )}
                <Gap />
                <Note icon={ShieldCheck}>Los documentos se guardan cifrados y solo se muestran los últimos dígitos (Ley 1581 de 2012).</Note>
              </>
            )
          }}
        </Loadable>
      )}
      {creating && <WorkerForm farm={farm} onClose={(saved) => { setCreating(false); if (saved) app.markChanged() }} />}
    </DetailPage>
  )
}
