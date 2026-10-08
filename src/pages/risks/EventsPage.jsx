import { useState } from 'react'
import { Bug, ChevronRight, Cloud, History, Plus, ShieldCheck, TrendingDown, TriangleAlert, Square, Virus, AlertCircle } from 'lucide-react'
import { useApp } from '../../context/AppContext'
import { useAuth } from '../../context/AuthContext'
import { useAsync } from '../../hooks/useAsync'
import { listEvents, riskCatalog } from '../../services/risks'
import { Amount, Card, EmptyState, FilterBar, IconBadge, KpiGrid, KpiTile, Loadable, SkeletonList, StatusPill } from '../../components/ui'
import { DetailPage, Gap } from '../../components/layout/Page'
import { formatCop, formatDate, formatNumber } from '../../lib/format'
import { severityTone } from '../../lib/labels'
import { EventForm } from './EventForm'

const GROUPS = [null, 'clima', 'plaga', 'enfermedad', 'otro']
const KNOWN = ['clima', 'plaga', 'enfermedad']
export const riskIcon = (type) => ({ clima: Cloud, plaga: Bug, enfermedad: Virus }[type] ?? TriangleAlert)

export function EventsPage() {
  const app = useApp()
  const { access } = useAuth()
  const [filter, setFilter] = useState(0)
  const [creating, setCreating] = useState(false)
  const state = useAsync(async () => {
    const [events, risks] = await Promise.all([listEvents(), riskCatalog()])
    return { events, risks: Object.fromEntries(risks.map((r) => [r.id, r])) }
  }, [app.revision])

  return (
    <DetailPage
      title="Eventos adversos"
      subtitle="Heladas, plagas, lluvias y otros riesgos"
      fab={access.registersFieldWork ? { icon: Plus, label: 'Registrar', onClick: () => setCreating(true) } : undefined}
    >
      <Loadable state={state} skeleton={<SkeletonList height={140} />}>
        {({ events, risks }) => {
          const typeOf = (e) => risks[e.riskId]?.type ?? 'otro'
          const inGroup = (e, g) => !g || (g === 'otro' ? !KNOWN.includes(typeOf(e)) : typeOf(e) === g)
          const shown = events.filter((e) => inGroup(e, GROUPS[filter])).sort((a, b) => b.start.localeCompare(a.start))
          const loss = events.reduce((s, e) => s + (e.estimatedLoss ?? 0), 0)
          const area = events.reduce((s, e) => s + (e.affectedArea ?? 0), 0)
          return (
            <>
              <KpiGrid cols={2} colsWide={4}>
                <KpiTile label="Eventos activos" value={formatNumber(events.filter((e) => e.active).length)} icon={AlertCircle} tone="warn" caption="en curso" />
                <KpiTile label="Eventos registrados" value={formatNumber(events.length)} icon={History} tone="high" caption="en total" />
                <KpiTile label="Pérdida estimada" value={formatNumber(Math.round(loss))} prefix="$" icon={TrendingDown} tone="danger" caption="pesos (COP)" />
                <KpiTile label="Área afectada" value={formatNumber(area, 1)} icon={Square} caption="hectáreas" />
              </KpiGrid>
              <Gap />
              <FilterBar labels={['Todos', 'Clima', 'Plagas', 'Enfermedades', 'Otros']} counts={GROUPS.map((g) => events.filter((e) => inGroup(e, g)).length)} selected={filter} onSelect={setFilter} />
              <Gap />
              {shown.length === 0 ? (
                <Card><EmptyState icon={ShieldCheck} title="Sin eventos en esta categoría" message="Cuando ocurra una helada, plaga o lluvia fuerte, regístrela para medir su costo." /></Card>
              ) : (
                <div className="stack gap-12">
                  {shown.map((event) => (
                    <Card key={event.id} to={`/mas/eventos/${event.id}`}>
                      <div className="row gap-12">
                        <IconBadge icon={riskIcon(typeOf(event))} tone="warn" />
                        <div className="grow">
                          <h3 className="headline-md clamp-1" style={{ fontSize: 18 }}>{risks[event.riskId]?.name ?? 'Evento'}</h3>
                          <p className="body-sm">Desde el {formatDate(event.start)}</p>
                        </div>
                        <ChevronRight size={20} className="chevron" aria-hidden />
                      </div>
                      <div className="row gap-8" style={{ margin: '12px 0' }}>
                        <StatusPill tone={severityTone(event.severity)}>Severidad {event.severity}</StatusPill>
                        <StatusPill tone={event.active ? 'warn' : 'ok'}>{event.active ? 'En curso' : 'Terminado'}</StatusPill>
                      </div>
                      <div className="flow-row" style={{ marginBottom: 0 }}>
                        <span className="body-sm grow" style={{ color: 'var(--on-surface)' }}>Pérdida estimada</span>
                        <Amount tone={event.estimatedLoss == null ? 'muted' : 'neg'}>{event.estimatedLoss == null ? 'Sin estimar' : formatCop(event.estimatedLoss)}</Amount>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </>
          )
        }}
      </Loadable>
      {creating && <EventForm onClose={(saved) => { setCreating(false); if (saved) app.markChanged() }} />}
    </DetailPage>
  )
}
