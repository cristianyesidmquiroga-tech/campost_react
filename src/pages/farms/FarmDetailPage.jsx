import { useState } from 'react'
import { useParams } from 'react-router-dom'
import { ChevronRight, Grid2x2, Plus, Ruler, Sprout, Square } from 'lucide-react'
import { useApp } from '../../context/AppContext'
import { useAuth } from '../../context/AuthContext'
import { useAsync } from '../../hooks/useAsync'
import { createLot, listLots } from '../../services/farms'
import { listPlantings } from '../../services/production'
import { Card, EmptyState, Field, FormSheet, IconBadge, Loadable, ProgressLine, SectionTitle, SkeletonList, StatusPill, positive, required } from '../../components/ui'
import { DetailPage, Gap } from '../../components/layout/Page'
import { formatHa, formatNumber, parseNumber } from '../../lib/format'

function LotForm({ farm, onClose }) {
  const [form, setForm] = useState({ name: '', area: '', notes: '' })
  const input = (key) => ({ value: form[key], onChange: (e) => setForm((f) => ({ ...f, [key]: e.target.value })) })
  return (
    <FormSheet
      title="Agregar lote"
      subtitle={farm.name}
      submitLabel="Guardar lote"
      onClose={onClose}
      validate={() => ({ name: required(form.name), area: positive(form.area) })}
      onSubmit={() => createLot(farm.id, { name: form.name.trim(), areaHa: parseNumber(form.area), notes: form.notes.trim() || null })}
    >
      <Field label="Nombre del lote" name="name" maxLength={150} {...input('name')} />
      <Field label="Área en hectáreas" name="area" inputMode="decimal" {...input('area')} />
      <Field label="Notas (opcional)" name="notes" multiline maxLength={500} {...input('notes')} />
    </FormSheet>
  )
}

export function FarmDetailPage() {
  const { id } = useParams()
  const app = useApp()
  const { access } = useAuth()
  const [adding, setAdding] = useState(false)
  const farm = app.farms.find((f) => f.id === id)
  const state = useAsync(async () => {
    const lots = await listLots(id)
    const plantings = access.seesProduction ? await listPlantings().catch(() => []) : []
    return { lots, plantings: plantings.filter((p) => p.farmId === id) }
  }, [id, app.revision])

  if (!farm) return <DetailPage title="Finca"><Card><EmptyState icon={Square} title="No encontramos esta finca" /></Card></DetailPage>

  return (
    <DetailPage
      title={farm.name}
      subtitle={farm.municipalityCode ? `Municipio DANE ${farm.municipalityCode}` : 'Ubicación sin registrar'}
      fab={access.createsFarms ? { icon: Plus, label: 'Agregar lote', onClick: () => setAdding(true) } : undefined}
    >
      <Loadable state={state} skeleton={<SkeletonList height={120} />}>
        {({ lots, plantings }) => {
          const active = plantings.filter((p) => p.status === 'en_curso')
          const planted = active.reduce((s, p) => s + p.areaHa, 0)
          const total = farm.areaHa ?? lots.reduce((s, l) => s + l.areaHa, 0)
          const free = Math.max(total - planted, 0)
          const ratio = total > 0 ? Math.min(planted / total, 1) : 0
          return (
            <>
              <Card>
                <div className="row gap-12">
                  <IconBadge icon={Ruler} size={32} circle />
                  <span className="label-sm grow">Distribución territorial</span>
                </div>
                <div className="stat-row" style={{ margin: '12px 0' }}>
                  {[['Área total', total, 'var(--on-surface)'], ['Sembrada', planted, 'var(--primary-container)'], ['Libre', free, 'var(--on-surface-variant)']].map(([label, value, color]) => (
                    <div className="stat" key={label}>
                      <span className="body-sm">{label}</span>
                      <div className="mono-md" style={{ color }}>{formatHa(value)}</div>
                    </div>
                  ))}
                </div>
                <ProgressLine value={ratio} height={12} />
                <div className="spread body-sm" style={{ marginTop: 8 }}>
                  <span>{formatNumber(ratio * 100)}% sembrada</span>
                  <span>{formatNumber((1 - ratio) * 100)}% disponible</span>
                </div>
              </Card>
              <SectionTitle caption="Gestión individual por cuartel" trailing={<StatusPill>{lots.length}</StatusPill>}>Lotes registrados</SectionTitle>
              {lots.length === 0 ? (
                <Card><EmptyState icon={Grid2x2} title="Esta finca aún no tiene lotes" message="Los lotes dividen la finca para sembrar y llevar costos por cuartel." /></Card>
              ) : (
                <div className="stack gap-12">
                  {lots.map((lot) => {
                    const planting = active.find((p) => p.lotId === lot.id)
                    return (
                      <Card key={lot.id} to={`/mas/fincas/${farm.id}/lotes/${lot.id}`}>
                        <div className="row gap-12">
                          <IconBadge icon={planting ? Sprout : Square} />
                          <div className="grow">
                            <h3 className="headline-md clamp-1" style={{ fontSize: 18 }}>{lot.name}</h3>
                            <p className="body-sm clamp-1">{planting ? app.cropName(planting.cropId) : 'Sin siembra activa'}</p>
                          </div>
                          <ChevronRight size={20} className="chevron" aria-hidden />
                        </div>
                        <div className="spread" style={{ marginTop: 12 }}>
                          <span className="mono-sm">{formatHa(lot.areaHa)} · {formatNumber(total > 0 ? (lot.areaHa / total) * 100 : 0)}% del predio</span>
                          <StatusPill tone={planting ? 'ok' : 'neutral'}>{planting ? 'En producción' : 'Libre'}</StatusPill>
                        </div>
                      </Card>
                    )
                  })}
                </div>
              )}
              <Gap />
            </>
          )
        }}
      </Loadable>
      {adding && <LotForm farm={farm} onClose={(saved) => { setAdding(false); if (saved) app.markChanged() }} />}
    </DetailPage>
  )
}
