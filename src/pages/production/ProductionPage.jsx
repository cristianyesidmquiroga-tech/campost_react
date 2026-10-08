import { useState } from 'react'
import { BookOpen, LineChart, Sprout } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useApp } from '../../context/AppContext'
import { useAuth } from '../../context/AuthContext'
import { useAsync } from '../../hooks/useAsync'
import { listLots } from '../../services/farms'
import { listPlantings, plantingProgress } from '../../services/production'
import { Card, EmptyState, FilterBar, IconBadge, Loadable, ProgressLine, Skeleton, SkeletonList, StatusPill } from '../../components/ui'
import { InPageFarm } from '../../components/layout/FarmSelector'
import { Gap, Page } from '../../components/layout/Page'
import { formatHa, formatNumber } from '../../lib/format'
import { methodLabel, phaseLabel, plantingStatusLabel, plantingStatusTone } from '../../lib/labels'
import { PlantingForm } from './PlantingForm'

const FILTERS = ['en_curso', 'planeada', 'cerrada']

function PlantingCard({ planting, lotName }) {
  const app = useApp()
  const progress = useAsync(() => plantingProgress(planting.id).catch(() => []), [planting.id])
  const phases = progress.data ?? []
  const done = phases.filter((p) => p.done).length
  const current = phases.find((p) => !p.done) ?? phases[phases.length - 1]
  const ratio = phases.length > 0 ? done / phases.length : 0

  return (
    <Card to={`/produccion/siembras/${planting.id}`}>
      <div className="row gap-8">
        <span className="label-sm grow clamp-1">{lotName}</span>
        <StatusPill tone={plantingStatusTone(planting.status)}>{plantingStatusLabel(planting.status)}</StatusPill>
      </div>
      <h3 className="headline-md clamp-1" style={{ fontWeight: 700, margin: '6px 0 12px' }}>{app.cropName(planting.cropId)}</h3>
      <div className="progress-slot">
        {progress.loading ? (
          <Skeleton height={12} width={180} />
        ) : phases.length === 0 ? (
          <span className="body-sm">{planting.status === 'planeada' ? 'Aún no inicia: sin calendario de fases.' : 'Sin calendario de fases.'}</span>
        ) : (
          <>
            <div className="spread">
              <span className="body-sm clamp-1" style={{ color: 'var(--on-surface)' }}>
                {phaseLabel(current.phase)} (fase {current.order} de {phases.length})
              </span>
              <span className="mono-sm" style={{ color: 'var(--primary-container)' }}>{Math.round(ratio * 100)}%</span>
            </div>
            <div style={{ height: 8 }} />
            <ProgressLine value={ratio} />
          </>
        )}
      </div>
      <div style={{ height: 12 }} />
      <div className="fact-box">
        <div><div className="mono-sm" style={{ color: 'var(--on-surface)', fontWeight: 700 }}>{formatHa(planting.areaHa)}</div><span className="body-sm" style={{ fontSize: 11 }}>área</span></div>
        <div><div className="mono-sm" style={{ color: 'var(--on-surface)', fontWeight: 700 }}>{planting.plants == null ? '—' : formatNumber(planting.plants)}</div><span className="body-sm" style={{ fontSize: 11 }}>plantas</span></div>
        <div><div className="mono-sm clamp-1" style={{ color: 'var(--on-surface)', fontWeight: 700 }}>{methodLabel(planting.method)}</div><span className="body-sm" style={{ fontSize: 11 }}>propagación</span></div>
      </div>
    </Card>
  )
}

export function ProductionPage() {
  const app = useApp()
  const { access } = useAuth()
  const farm = app.activeFarm
  const [filter, setFilter] = useState(0)
  const [creating, setCreating] = useState(false)
  const state = useAsync(async () => {
    const plantings = await listPlantings()
    const lots = farm ? await listLots(farm.id) : []
    return { plantings, lots: Object.fromEntries(lots.map((l) => [l.id, l])) }
  }, [farm?.id, app.revision])

  return (
    <Page>
      <InPageFarm />
      <div className="spread">
        <h1 className="headline-md">Producción</h1>
        {access.managesCatalog && (
          <Link to="/produccion/cultivos" className="btn btn--text"><BookOpen size={18} aria-hidden /> Catálogo</Link>
        )}
      </div>
      <Gap size="sm" />
      <Loadable state={state} skeleton={<SkeletonList height={168} />}>
        {({ plantings, lots }) => {
          const mine = plantings.filter((p) => !farm || p.farmId === farm.id)
          const by = (status) => mine.filter((p) => (status === 'cerrada' ? ['cerrada', 'cancelada'].includes(p.status) : p.status === status))
          const shown = by(FILTERS[filter])
          const active = by('en_curso')
          const planted = active.reduce((s, p) => s + p.areaHa, 0)
          const plants = active.reduce((s, p) => s + (p.plants ?? 0), 0)
          return (
            <>
              <FilterBar
                labels={['En curso', 'Planeadas', 'Cerradas']}
                counts={FILTERS.map((f) => by(f).length)}
                selected={filter}
                onSelect={setFilter}
              />
              <Gap size="sm" />
              <Card tone="tint">
                <div className="row gap-12">
                  <IconBadge icon={LineChart} tone="ok" size={32} circle />
                  <span className="label-sm grow">Balance operativo actual</span>
                </div>
                <div className="stat-row" style={{ marginTop: 12 }}>
                  <div className="stat"><div className="mono-md" style={{ color: 'var(--primary-container)' }}>{formatHa(planted)}</div><span className="body-sm">sembradas</span></div>
                  <div className="stat"><div className="mono-md" style={{ color: 'var(--primary-container)' }}>{formatNumber(active.length)}</div><span className="body-sm">siembras activas</span></div>
                  <div className="stat"><div className="mono-md" style={{ color: 'var(--primary-container)' }}>{formatNumber(plants)}</div><span className="body-sm">plantas</span></div>
                </div>
              </Card>
              <Gap />
              {shown.length === 0 ? (
                <Card>
                  <EmptyState
                    icon={Sprout}
                    title={filter === 0 ? 'Aún no tiene siembras en curso' : filter === 1 ? 'No hay siembras planeadas' : 'No hay siembras cerradas'}
                    message={farm ? 'Planee una siembra para seguir sus fases, plantas y tiempos.' : 'Registre una finca para empezar.'}
                    actionLabel={access.managesProduction && farm && filter !== 2 ? 'Planear siembra' : undefined}
                    onAction={() => setCreating(true)}
                  />
                </Card>
              ) : (
                <div className="stack gap-12">
                  {shown.map((p) => <PlantingCard key={p.id} planting={p} lotName={lots[p.lotId]?.name ?? 'Lote'} />)}
                </div>
              )}
            </>
          )
        }}
      </Loadable>
      {creating && <PlantingForm onClose={(saved) => { setCreating(false); if (saved) app.markChanged() }} />}
    </Page>
  )
}
