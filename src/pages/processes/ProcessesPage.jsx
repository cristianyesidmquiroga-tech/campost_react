import { useState } from 'react'
import { Cog, Plus } from 'lucide-react'
import { useApp } from '../../context/AppContext'
import { useAuth } from '../../context/AuthContext'
import { useAsync } from '../../hooks/useAsync'
import { createProcess, listProcesses } from '../../services/processes'
import { Card, DateField, EmptyState, Field, FilterBar, FormSheet, Loadable, ProgressLine, SelectField, SkeletonList, StatusPill, required } from '../../components/ui'
import { DetailPage, Gap } from '../../components/layout/Page'
import { formatDate, isoDate } from '../../lib/format'

function ProcessForm({ farm, onClose }) {
  const [form, setForm] = useState({ name: '', product: '', rawMaterial: '', origin: 'propia', start: isoDate() })
  const input = (key) => ({ value: form[key], onChange: (e) => setForm((f) => ({ ...f, [key]: e.target.value })) })
  return (
    <FormSheet
      title="Nuevo proceso"
      subtitle={farm.name}
      submitLabel="Guardar proceso"
      onClose={onClose}
      validate={() => ({ name: required(form.name), product: required(form.product), rawMaterial: required(form.rawMaterial) })}
      onSubmit={() => createProcess(farm.id, { ...form, name: form.name.trim(), product: form.product.trim(), rawMaterial: form.rawMaterial.trim() })}
    >
      <Field label="Nombre del proceso" name="name" maxLength={150} hint="Ejemplo: Secado lote 1" {...input('name')} />
      <Field label="Producto final" name="product" maxLength={150} {...input('product')} />
      <Field label="Materia prima" name="rawMaterial" maxLength={150} {...input('rawMaterial')} />
      <SelectField label="Origen de la materia prima" name="origin" value={form.origin} onChange={(origin) => setForm((f) => ({ ...f, origin: origin ?? 'propia' }))} options={[['propia', 'Propia'], ['comprada', 'Comprada']]} />
      <DateField label="Fecha de inicio" value={form.start} max={isoDate()} onChange={(start) => setForm((f) => ({ ...f, start }))} />
    </FormSheet>
  )
}

export function ProcessesPage() {
  const app = useApp()
  const { access } = useAuth()
  const farm = app.activeFarm
  const [filter, setFilter] = useState(0)
  const [creating, setCreating] = useState(false)
  const state = useAsync(() => (farm ? listProcesses(farm.id) : Promise.resolve([])), [farm?.id, app.revision])

  return (
    <DetailPage
      title="Procesos de transformación"
      subtitle={farm?.name ?? 'Sin finca activa'}
      fab={access.managesInventory && farm ? { icon: Plus, label: 'Nuevo proceso', onClick: () => setCreating(true) } : undefined}
    >
      {!farm ? (
        <Card><EmptyState icon={Cog} title="Sin finca activa" message="Registre una finca para llevar sus procesos." /></Card>
      ) : (
        <Loadable state={state} skeleton={<SkeletonList height={140} />}>
          {(all) => {
            const active = all.filter((p) => !p.finished)
            const done = all.filter((p) => p.finished)
            const shown = filter === 0 ? active : done
            return (
              <>
                <FilterBar labels={['En proceso', 'Terminados']} counts={[active.length, done.length]} selected={filter} onSelect={setFilter} />
                <Gap />
                {shown.length === 0 ? (
                  <Card>
                    <EmptyState
                      icon={Cog}
                      title={filter === 0 ? 'No hay procesos en curso' : 'Aún no hay procesos terminados'}
                      message="Un proceso transforma la cosecha, por ejemplo el secado del bijao por etapas."
                    />
                  </Card>
                ) : (
                  <div className="stack gap-12">
                    {shown.map((p) => (
                      <Card key={p.id} to={`/mas/procesos/${p.id}`}>
                        <div className="row gap-12" style={{ alignItems: 'flex-start' }}>
                          <h3 className="headline-md grow clamp-2" style={{ fontSize: 18 }}>{p.name}</h3>
                          <StatusPill tone={p.finished ? 'neutral' : 'ok'}>{p.finished ? 'Terminado' : 'En proceso'}</StatusPill>
                        </div>
                        <p className="body-sm clamp-2" style={{ marginTop: 4 }}>{p.product} · materia prima {p.origin === 'propia' ? 'propia' : 'comprada'}</p>
                        <div className="spread body-sm" style={{ marginTop: 12 }}>
                          <span>{p.stages === 0 ? 'Sin etapas definidas' : `${p.stagesDone} de ${p.stages} etapas`}</span>
                          <span className="mono-sm" style={{ color: 'var(--primary-container)' }}>{Math.round(p.progress * 100)}%</span>
                        </div>
                        <div style={{ marginTop: 8 }}><ProgressLine value={p.progress} /></div>
                        <div className="mono-sm" style={{ marginTop: 8 }}>Desde el {formatDate(p.start)}</div>
                      </Card>
                    ))}
                  </div>
                )}
              </>
            )
          }}
        </Loadable>
      )}
      {creating && <ProcessForm farm={farm} onClose={(saved) => { setCreating(false); if (saved) app.markChanged() }} />}
    </DetailPage>
  )
}
