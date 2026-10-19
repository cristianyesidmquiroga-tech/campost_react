import { Navigate, useParams } from 'react-router-dom'
import { BarChart3, Info } from 'lucide-react'
import { useApp } from '../../context/AppContext'
import { useAsync } from '../../hooks/useAsync'
import { eventsReport, indicesReport, scheduleReport } from '../../services/reports'
import { Card, EmptyState, InfoList, InfoRow, KpiGrid, KpiTile, Loadable, Note, SectionTitle, SkeletonList } from '../../components/ui'
import { DetailPage } from '../../components/layout/Page'
import { cycleTypeLabel, phaseLabel } from '../../lib/labels'
import { formatDate, formatNumber, humanize } from '../../lib/format'

const TITLES = { indices: 'Índices por planta', cronograma: 'Tiempos del ciclo', eventos: 'Eventos adversos' }

function Indices({ farmId }) {
  const state = useAsync(() => indicesReport(farmId), [farmId])
  return (
    <Loadable state={state} skeleton={<SkeletonList height={140} />}>
      {(plantings) =>
        plantings.length === 0 ? (
          <Card><EmptyState icon={BarChart3} title="Sin siembras activas" message="Cuando haya una siembra con conteos, sus índices aparecen aquí." /></Card>
        ) : (
          <div className="stack gap-12">
            {plantings.map((p) => (
              <Card key={p.plantingId}>
                <h3 className="headline-md">{p.crop}</h3>
                <p className="body-sm">{p.countDate ? `Conteo del ${formatDate(p.countDate)}` : 'Sin conteos todavía'}</p>
                <InfoList>
                  {p.indicators.map((i) => (
                    <InfoRow key={i.title} label={i.title} value={`${formatNumber(i.value, i.value % 1 === 0 ? 0 : 1)} ${i.unit}`} />
                  ))}
                </InfoList>
                {p.notice && <Note icon={Info}>{p.notice}</Note>}
              </Card>
            ))}
          </div>
        )
      }
    </Loadable>
  )
}

function Schedule({ farmId }) {
  const state = useAsync(() => scheduleReport(farmId), [farmId])
  return (
    <Loadable state={state} skeleton={<SkeletonList height={120} />}>
      {(cycles) =>
        cycles.length === 0 ? (
          <Card><EmptyState icon={BarChart3} title="Sin ciclos abiertos" message="Inicie un ciclo para ver sus tiempos." /></Card>
        ) : (
          <div className="stack gap-12">
            {cycles.map((c) => (
              <Card key={c.cycleId}>
                <h3 className="headline-md">{c.crop}</h3>
                <p className="body-sm">{cycleTypeLabel(c.type)}</p>
                <InfoList>
                  <InfoRow label="Inicio" value={c.start ? formatDate(c.start) : 'Sin fecha'} />
                  <InfoRow label="Fase actual" value={c.phase ? phaseLabel(c.phase) : 'Sin fase'} />
                  <InfoRow label="Fases planeadas" value={formatNumber(c.plannedPhases)} />
                  <InfoRow label="Fin planeado" value={c.plannedEnd ? formatDate(c.plannedEnd) : 'Sin fecha'} />
                </InfoList>
                {c.notice && <Note icon={Info}>{c.notice}</Note>}
              </Card>
            ))}
          </div>
        )
      }
    </Loadable>
  )
}

function Events({ farmId }) {
  const state = useAsync(() => eventsReport(farmId), [farmId])
  return (
    <Loadable state={state} skeleton={<SkeletonList height={120} />}>
      {(report) => (
        <>
          <KpiGrid cols={2} colsWide={2}>
            <KpiTile label="Eventos" value={formatNumber(report.total)} icon={BarChart3} caption="en total" />
            <KpiTile label="Pérdida estimada" value={formatNumber(Math.round(report.loss))} prefix="$" icon={BarChart3} tone="danger" caption="pesos (COP)" />
          </KpiGrid>
          <SectionTitle>Por tipo</SectionTitle>
          <Card>
            <InfoList>
              {report.byType.map((t) => (
                <InfoRow key={t.type} label={`${humanize(t.type)} (${t.count})`} value={`$ ${formatNumber(Math.round(t.loss))}`} />
              ))}
              {report.byType.length === 0 && <InfoRow label="Sin eventos" value="-" />}
            </InfoList>
          </Card>
          <SectionTitle>Por severidad</SectionTitle>
          <Card>
            <InfoList>
              {report.bySeverity.map(([name, count]) => (
                <InfoRow key={name} label={humanize(name)} value={formatNumber(count)} />
              ))}
            </InfoList>
          </Card>
          {report.notice && <Note icon={Info}>{report.notice}</Note>}
        </>
      )}
    </Loadable>
  )
}

const VIEWERS = { indices: Indices, cronograma: Schedule, eventos: Events }

export function ReportViewerPage() {
  const { id } = useParams()
  const { activeFarm } = useApp()
  const Viewer = VIEWERS[id]
  if (!Viewer) return <Navigate to="/mas/reportes" replace />
  return (
    <DetailPage title={TITLES[id]} subtitle={activeFarm?.name ?? 'Sin finca activa'}>
      {activeFarm ? <Viewer farmId={activeFarm.id} /> : <Card><EmptyState icon={BarChart3} title="Sin finca activa" message="Registre una finca para ver sus reportes." /></Card>}
    </DetailPage>
  )
}
