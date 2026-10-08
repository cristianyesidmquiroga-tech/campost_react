import { useState } from 'react'
import { useParams } from 'react-router-dom'
import { Ban, Calendar, Check, Clock, Hash, PiggyBank, Play, RefreshCw, Square, TreePine, TriangleAlert } from 'lucide-react'
import { useApp } from '../../context/AppContext'
import { useAuth } from '../../context/AuthContext'
import { useAsync } from '../../hooks/useAsync'
import { useConfirm } from '../../hooks/useConfirm'
import { useToast } from '../../context/ToastContext'
import { cancelPlanting, openCycleOf, openNextCycle, plantingOverview, startPlanting } from '../../services/production'
import { Button, Card, EmptyState, KpiGrid, KpiTile, ListRow, Loadable, RowGroup, SectionTitle, SegmentedTabs, SkeletonList, StatusPill, Sheet } from '../../components/ui'
import { DetailPage, Gap } from '../../components/layout/Page'
import { formatDate, formatDateShort, formatNumber } from '../../lib/format'
import { CYCLE_KEYS, cycleTypeLabel, methodLabel, phaseLabel, plantingStatusLabel } from '../../lib/labels'
import { PlantCountSheet } from './PlantCountSheet'

function IndicatorCard({ indicator }) {
  return (
    <Card>
      <div className="row gap-8">
        <h3 className="label-md grow clamp-2">{indicator.title}</h3>
        <StatusPill tone={indicator.state === 'alerta' ? 'danger' : 'neutral'}>{indicator.state}</StatusPill>
      </div>
      <div className="row gap-8" style={{ marginTop: 8, alignItems: 'flex-end' }}>
        <span className="mono-xl">{indicator.value == null ? '—' : formatNumber(indicator.value, indicator.value % 1 === 0 ? 0 : 1)}</span>
        <span className="body-sm grow clamp-2">{indicator.unit}</span>
      </div>
      <p className="body-sm" style={{ marginTop: 8, lineHeight: 1.5 }}>{indicator.explanation}</p>
      {indicator.action && <p className="body-sm" style={{ marginTop: 8, color: 'var(--on-surface)', lineHeight: 1.5 }}>{indicator.action}</p>}
      {indicator.date && <p className="mono-sm" style={{ marginTop: 8 }}>Datos del {formatDate(indicator.date)}</p>}
    </Card>
  )
}

function Timeline({ phases }) {
  if (phases.length === 0) {
    return (
      <Card>
        <EmptyState icon={Clock} title="Sin cronograma" message="El calendario aparece cuando la siembra tiene un ciclo abierto y fases cargadas." />
      </Card>
    )
  }
  const currentIndex = phases.findIndex((p) => !p.done)
  return (
    <Card>
      <div className="timeline">
        {phases.map((phase, i) => {
          const state = phase.done ? 'done' : i === currentIndex ? 'current' : 'planned'
          const color = state === 'done' ? 'var(--primary-container)' : state === 'current' ? 'var(--tertiary)' : 'var(--outline)'
          const Icon = state === 'done' ? Check : state === 'current' ? Play : Clock
          return (
            <div className="timeline__item" key={phase.order}>
              <div className="timeline__rail">
                <span className={`timeline__dot ${state === 'planned' ? 'timeline__dot--planned' : ''}`} style={{ '--c': color }}><Icon size={16} aria-hidden /></span>
                {i < phases.length - 1 && <span className="timeline__line" />}
              </div>
              <div className="timeline__body">
                <div className="label-md">{phase.order}. {phaseLabel(phase.phase)}</div>
                <div className="mono-sm">
                  {formatDateShort(phase.planStart)} → {formatDateShort(phase.planEnd)}{phase.plannedDays ? ` · ${phase.plannedDays} días` : ''}
                </div>
                {phase.delayDays > 0 && <div style={{ marginTop: 6 }}><StatusPill tone="warn" icon={TriangleAlert}>{phase.delayDays} días de retraso</StatusPill></div>}
              </div>
            </div>
          )
        })}
      </div>
    </Card>
  )
}

export function PlantingDetailPage() {
  const { id } = useParams()
  const app = useApp()
  const { access } = useAuth()
  const show = useToast()
  const [confirm, dialog] = useConfirm()
  const [tab, setTab] = useState(0)
  const [counting, setCounting] = useState(false)
  const [choosing, setChoosing] = useState(false)
  const state = useAsync(() => plantingOverview(id), [id])

  const run = async (action, success) => {
    try {
      await action()
      show(success)
      app.markChanged()
      await state.reload()
    } catch (error) {
      show(error.message, true)
    }
  }

  return (
    <Loadable
      state={state}
      skeleton={<DetailPage title="Siembra"><SkeletonList height={120} /></DetailPage>}
    >
      {({ planting, counts, indicators, schedule }) => {
        const counted = [...counts].sort((a, b) => b.date.localeCompare(a.date))
        const open = openCycleOf(planting)
        return (
          <DetailPage title={app.cropName(planting.cropId)} subtitle={`Siembra ${plantingStatusLabel(planting.status).toLowerCase()}`}>
            <SegmentedTabs labels={['Resumen', 'Ciclos', 'Plantas', 'Tiempos']} selected={tab} onSelect={setTab} />
            <Gap />
            {tab === 0 && (
              <>
                <KpiGrid>
                  <KpiTile label="Área sembrada" value={formatNumber(planting.areaHa, 1)} icon={Square} caption="hectáreas" />
                  <KpiTile label="Plantas sembradas" value={planting.plants == null ? '—' : formatNumber(planting.plants)} icon={TreePine} tone="high" caption={methodLabel(planting.method)} />
                  <KpiTile label="Presupuesto" value={planting.budget == null ? '—' : formatNumber(Math.round(planting.budget))} prefix={planting.budget == null ? undefined : '$'} icon={PiggyBank} tone="warn" caption={planting.budget == null ? 'sin definir' : 'pesos (COP)'} />
                  <KpiTile label="Fecha planeada" value={formatDateShort(planting.planDate)} icon={Calendar} tone="high" caption={formatDate(planting.planDate)} />
                </KpiGrid>
                <SectionTitle>Índices por planta</SectionTitle>
                {indicators.length === 0 ? (
                  <Card><EmptyState icon={Hash} title="Aún no hay conteos" message="Registre un conteo de plantas para calcular densidad y pérdidas." /></Card>
                ) : (
                  <div className="stack gap-12">{indicators.map((i) => <IndicatorCard key={i.title} indicator={i} />)}</div>
                )}
                {access.managesProduction && (
                  <>
                    <SectionTitle>Acciones</SectionTitle>
                    <div className="btn-stack">
                      {planting.status === 'planeada' && <Button wide icon={Play} onClick={() => run(() => startPlanting(planting.id), 'Siembra iniciada.')}>Iniciar siembra</Button>}
                      {planting.status === 'en_curso' && <Button wide icon={Hash} onClick={() => setCounting(true)}>Registrar conteo de plantas</Button>}
                      {['planeada', 'en_curso'].includes(planting.status) && (
                        <Button
                          wide
                          variant="outline danger"
                          icon={Ban}
                          onClick={async () => {
                            const yes = await confirm({ title: 'Cancelar siembra', message: 'La siembra deja de contar como activa. Esta acción no se puede deshacer.', confirmLabel: 'Cancelar siembra', destructive: true })
                            if (yes) await run(() => cancelPlanting(planting.id), 'Siembra cancelada.')
                          }}
                        >
                          Cancelar siembra
                        </Button>
                      )}
                    </div>
                  </>
                )}
              </>
            )}
            {tab === 1 && (
              <>
                {planting.cycles.length === 0 ? (
                  <Card><EmptyState icon={RefreshCw} title="Todavía no hay ciclos" message="El primer ciclo se abre al iniciar la siembra." /></Card>
                ) : (
                  <RowGroup>
                    {planting.cycles.map((cycle) => (
                      <ListRow
                        key={cycle.id}
                        to={`/produccion/siembras/${planting.id}/ciclos/${cycle.id}`}
                        icon={RefreshCw}
                        title={`Ciclo ${cycle.number} · ${cycleTypeLabel(cycle.type)}`}
                        subtitle={cycle.start ? `Desde el ${formatDate(cycle.start)}${cycle.end ? ` hasta el ${formatDate(cycle.end)}` : ''}` : 'Sin fecha de inicio'}
                        trailing={<StatusPill tone={cycle.status === 'abierto' ? 'ok' : 'neutral'}>{cycle.status}</StatusPill>}
                      />
                    ))}
                  </RowGroup>
                )}
                {access.managesProduction && planting.status === 'en_curso' && !open && (
                  <><Gap /><Button wide onClick={() => setChoosing(true)}>Abrir siguiente ciclo</Button></>
                )}
              </>
            )}
            {tab === 2 && (
              <>
                {counted.length === 0 ? (
                  <Card><EmptyState icon={Hash} title="Sin conteos de plantas" message="El conteo permite saber cuántas plantas siguen vivas." /></Card>
                ) : (
                  <RowGroup>
                    {counted.map((count) => (
                      <ListRow
                        key={count.date}
                        icon={TreePine}
                        title={formatDate(count.date)}
                        subtitle={`${formatNumber(count.dead)} muertas · ${formatNumber(count.replanted)} resiembras`}
                        trailing={<span style={{ textAlign: 'right' }}><span className="mono-md">{formatNumber(count.alive)}</span><br /><span className="body-sm" style={{ fontSize: 11 }}>vivas</span></span>}
                      />
                    ))}
                  </RowGroup>
                )}
                {access.managesProduction && planting.status === 'en_curso' && (
                  <><Gap /><Button wide onClick={() => setCounting(true)}>Registrar conteo</Button></>
                )}
              </>
            )}
            {tab === 3 && <Timeline phases={schedule} />}
            {counting && <PlantCountSheet plantingId={planting.id} onClose={(saved) => { setCounting(false); if (saved) { app.markChanged(); state.reload() } }} />}
            {choosing && (
              <Sheet title="Tipo de ciclo" onClose={() => setChoosing(false)}>
                <RowGroup>
                  {CYCLE_KEYS.map((type) => (
                    <ListRow key={type} title={cycleTypeLabel(type)} onClick={() => { setChoosing(false); run(() => openNextCycle(planting.id, type), 'Ciclo abierto.') }} />
                  ))}
                </RowGroup>
              </Sheet>
            )}
            {dialog}
          </DetailPage>
        )
      }}
    </Loadable>
  )
}
