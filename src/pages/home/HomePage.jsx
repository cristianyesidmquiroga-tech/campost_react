import { AlertTriangle, ArrowRight, BadgeCheck, Banknote, Mountain, Shield, Sprout, TriangleAlert } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useApp } from '../../context/AppContext'
import { useAuth } from '../../context/AuthContext'
import { useAsync } from '../../hooks/useAsync'
import { homeOverview } from '../../services/home'
import { cashFlow } from '../../services/money'
import { listPlantings } from '../../services/production'
import { Card, EmptyState, KpiGrid, KpiTile, ListRow, Loadable, ProgressLine, RowGroup, SectionTitle, SkeletonList, StatusPill } from '../../components/ui'
import { InPageFarm } from '../../components/layout/FarmSelector'
import { Gap, Page } from '../../components/layout/Page'
import { firstName, formatDate, formatHa, formatNumber, greeting, humanize } from '../../lib/format'
import { severityTone } from '../../lib/labels'

async function loadHome(app, access) {
  const overview = await homeOverview()
  let flow = null
  let plantings = null
  if (app.activeFarm && access.seesMoney) flow = await cashFlow(app.activeFarm.id).catch(() => null)
  if (access.seesProduction) plantings = await listPlantings().catch(() => null)
  return { overview, flow, plantings }
}

function NoticeCard({ notice }) {
  return (
    <Card accent="var(--tertiary)">
      <StatusPill tone="warn" icon={TriangleAlert}>Atención · {notice.susceptibility}</StatusPill>
      <h3 className="label-md clamp-2" style={{ fontSize: 15, marginTop: 12 }}>{notice.risk} en {notice.crop}</h3>
      <p className="mono-sm" style={{ color: 'var(--tertiary)', marginTop: 2 }}>Fase de {humanize(notice.phase).toLowerCase()}</p>
      <p className="body-sm" style={{ marginTop: 6, lineHeight: 1.5 }}>{notice.text}</p>
      {notice.measures && <p className="body-sm" style={{ marginTop: 6, color: 'var(--on-surface)', lineHeight: 1.5 }}>{notice.measures}</p>}
      {notice.toValidate && <p className="body-sm" style={{ marginTop: 8, color: 'var(--outline)' }}>Dato por validar con asistencia técnica.</p>}
      {notice.plantingId && (
        <div className="right" style={{ marginTop: 12 }}>
          <Link to={`/produccion/siembras/${notice.plantingId}`} className="btn btn--sm">
            Ver siembra <ArrowRight size={18} aria-hidden />
          </Link>
        </div>
      )}
    </Card>
  )
}

function AreaCard({ farm, plantings }) {
  const planted = plantings.reduce((sum, p) => sum + p.areaHa, 0)
  const total = farm.areaHa ?? planted
  const free = Math.max(total - planted, 0)
  const ratio = total > 0 ? Math.min(planted / total, 1) : 0
  return (
    <Card>
      <div className="spread">
        <div className="grow">
          <h3 className="label-md">Estado de área física</h3>
          <p className="body-sm clamp-1">{farm.name}</p>
        </div>
        <span className="mono-md" style={{ color: 'var(--primary)' }}>{formatHa(total)}</span>
      </div>
      <div style={{ height: 12 }} />
      <ProgressLine value={ratio} height={12} />
      <div style={{ height: 12 }} />
      <hr className="divider" />
      <div className="stat-row" style={{ marginTop: 12 }}>
        {[['Total', total, 'var(--on-surface)'], ['Sembrada', planted, 'var(--primary-container)'], ['Libre', free, 'var(--on-surface-variant)']].map(([label, value, color]) => (
          <div className="stat" key={label}>
            <span className="body-sm" style={{ fontSize: 11 }}>{label}</span>
            <div className="mono-sm" style={{ color, fontWeight: 700 }}>{formatHa(value)}</div>
          </div>
        ))}
      </div>
    </Card>
  )
}

export function HomePage() {
  const app = useApp()
  const { session, access } = useAuth()
  const state = useAsync(() => loadHome(app, access), [app.activeFarm?.id, app.revision])

  return (
    <Page>
      <InPageFarm />
      <Loadable state={state} skeleton={<SkeletonList />}>
        {({ overview, flow, plantings }) => {
          const notice = overview.notices[0]
          const farm = app.activeFarm
          const active = plantings?.filter((p) => farm && p.farmId === farm.id && p.status === 'en_curso') ?? []
          return (
            <>
              <div className="spread" style={{ alignItems: 'flex-end' }}>
                <div className="grow">
                  <h1 className="headline-md" style={{ fontWeight: 700 }}>{greeting()}, {firstName(session.name)}</h1>
                  <p className="body-sm">{access.roleLabel}</p>
                </div>
                <span className="mono-sm">{formatDate(new Date())}</span>
              </div>
              {overview.firstSteps.length > 0 && (
                <>
                  <Gap />
                  <Card>
                    <h3 className="label-md">Primeros pasos</h3>
                    <ol style={{ margin: '8px 0 0', paddingLeft: 20, lineHeight: 1.6 }}>
                      {overview.firstSteps.map((step) => <li key={step}>{step}</li>)}
                    </ol>
                  </Card>
                </>
              )}
              {notice && <><Gap /><NoticeCard notice={notice} /></>}
              <SectionTitle>Resumen de hoy</SectionTitle>
              <KpiGrid>
                <KpiTile label="Fincas activas" value={formatNumber(overview.farms)} icon={Mountain} caption="a su cargo" />
                <KpiTile label="Siembras en curso" value={formatNumber(overview.activePlantings)} icon={Sprout} tone="high" caption={`${formatNumber(overview.plannedPlantings)} planeadas`} />
                {flow ? (
                  <KpiTile
                    label={access.seesProfit ? 'Saldo del mes' : 'Gastos del mes'}
                    value={formatNumber(Math.round(access.seesProfit ? flow.balance : flow.expenses))}
                    prefix="$"
                    icon={Banknote}
                    tone="warn"
                    caption="pesos colombianos (COP)"
                  />
                ) : (
                  <KpiTile label="Eventos recientes" value={formatNumber(overview.recentEvents.length)} icon={AlertTriangle} tone="warn" caption="en sus siembras" />
                )}
                <KpiTile label="Avisos de riesgo" value={formatNumber(overview.notices.length)} icon={Shield} tone="high" caption={overview.notices.length === 0 ? 'sin avisos hoy' : 'según la fase'} />
              </KpiGrid>
              {farm && plantings && <><Gap /><AreaCard farm={farm} plantings={active} /></>}
              <SectionTitle
                trailing={access.seesRisks ? <Link to="/mas/eventos" className="btn btn--text">Ver eventos</Link> : null}
              >
                Eventos recientes
              </SectionTitle>
              {overview.recentEvents.length === 0 ? (
                <Card>
                  <EmptyState icon={BadgeCheck} title="Sin eventos recientes" message="Cuando registre una helada, plaga o lluvia fuerte, aparecerá aquí." />
                </Card>
              ) : (
                <RowGroup>
                  {overview.recentEvents.slice(0, 4).map((event) => (
                    <ListRow
                      key={event.id}
                      icon={TriangleAlert}
                      iconTone="warn"
                      title={event.risk}
                      subtitle={`Desde el ${formatDate(event.start)}`}
                      trailing={<StatusPill tone={severityTone(event.severity)}>{humanize(event.severity)}</StatusPill>}
                    />
                  ))}
                </RowGroup>
              )}
              {access.seesProduction && overview.activePlantings > 0 && (
                <>
                  <Gap />
                  <Link to="/produccion" className="btn btn--text">Ir a producción <ArrowRight size={16} aria-hidden /></Link>
                </>
              )}
            </>
          )
        }}
      </Loadable>
    </Page>
  )
}
