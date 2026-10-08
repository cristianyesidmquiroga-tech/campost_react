import { useState } from 'react'
import { useParams } from 'react-router-dom'
import { Info, Inbox, Shield, Sprout, FlaskConical } from 'lucide-react'
import { useAsync } from '../../hooks/useAsync'
import { cropDetail } from '../../services/production'
import { Card, EmptyState, InfoList, InfoRow, ListRow, Loadable, RowGroup, SegmentedTabs, SkeletonList, StatusPill } from '../../components/ui'
import { DetailPage, Gap } from '../../components/layout/Page'
import { humanize } from '../../lib/format'
import { methodLabel, phaseLabel, susceptibilityTone } from '../../lib/labels'

function Group({ empty, message, children }) {
  const items = children.filter(Boolean)
  if (items.length === 0) return <Card><EmptyState icon={Inbox} title={empty} message={message} /></Card>
  return <RowGroup>{items}</RowGroup>
}

export function CropDetailPage() {
  const { id } = useParams()
  const state = useAsync(() => cropDetail(id), [id])
  const [tab, setTab] = useState(0)

  return (
    <Loadable state={state} skeleton={<DetailPage title="Ficha del cultivo"><SkeletonList height={120} /></DetailPage>}>
      {(data) => {
        const { crop } = data
        return (
          <DetailPage title={crop.name} subtitle={data.scientificName ?? 'Perfil agronómico'}>
            <InfoList>
              <InfoRow label="Tipo de ciclo" value={humanize(crop.cycleType)} />
              <InfoRow label="Unidad de conteo" value={crop.countUnit === 'planta' ? 'Por planta' : 'Por área'} />
              <InfoRow label="Unidad de cosecha" value={humanize(data.harvestUnit ?? '—')} />
              {data.renewalType && <InfoRow label="Renovación" value={humanize(data.renewalType)} />}
            </InfoList>
            {crop.toValidate && (
              <>
                <Gap size="sm" />
                <Card tone="warn" flat>
                  <div className="note">
                    <Info size={20} aria-hidden style={{ color: 'var(--tertiary)' }} />
                    <p className="body-sm" style={{ color: 'var(--on-surface)' }}>
                      Estos valores están por validar con asistencia técnica. {data.source ?? ''}
                    </p>
                  </div>
                </Card>
              </>
            )}
            <Gap />
            <SegmentedTabs labels={['Fases', 'Propag.', 'Dosis', 'Riesgos']} selected={tab} onSelect={setTab} />
            <Gap />
            {tab === 0 && (
              <Group empty="Sin fases cargadas">
                {data.phases.map((p) => (
                  <ListRow key={p.order} icon={Sprout} title={phaseLabel(p.phase)} subtitle={p.days == null ? 'Duración sin definir' : `Duración estimada: ${p.days} días`} />
                ))}
              </Group>
            )}
            {tab === 1 && (
              <Group empty="Sin métodos de propagación">
                {data.methods.map((m) => (
                  <ListRow
                    key={m.method}
                    icon={Sprout}
                    title={methodLabel(m.method)}
                    subtitle={[m.germinationDays != null && `Germinación: ${m.germinationDays} días`, m.nurseryDays != null && `Vivero: ${m.nurseryDays} días`].filter(Boolean).join(' · ') || 'Tiempos sin definir'}
                  />
                ))}
              </Group>
            )}
            {tab === 2 && (
              <Group empty="Sin dosis de referencia" message="Falta cargar las dosis de este cultivo desde una fuente técnica.">
                {data.doses.map((d, i) => (
                  <ListRow key={i} icon={FlaskConical} title={humanize(d.insumo_tipo ?? 'Insumo')} subtitle={`${d.dosis ?? '—'} ${d.unidad ?? ''}`} />
                ))}
              </Group>
            )}
            {tab === 3 && (
              <Group empty="Sin riesgos asociados">
                {data.risks.map((r) => (
                  <ListRow
                    key={r.riskId}
                    icon={Shield}
                    iconTone="warn"
                    title={data.riskNames[r.riskId] ?? 'Riesgo'}
                    subtitle={[`Fase crítica: ${phaseLabel(r.phase)}`, r.measures].filter(Boolean).join(' · ')}
                    trailing={<StatusPill tone={susceptibilityTone(r.susceptibility)}>{r.susceptibility}</StatusPill>}
                  />
                ))}
              </Group>
            )}
          </DetailPage>
        )
      }}
    </Loadable>
  )
}
