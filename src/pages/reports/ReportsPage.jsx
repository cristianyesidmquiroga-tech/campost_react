import { BarChart3, ChevronRight, Clock, Lock, ShieldAlert } from 'lucide-react'
import { useAsync } from '../../hooks/useAsync'
import { listReports } from '../../services/reports'
import { Card, EmptyState, IconBadge, Loadable, SkeletonList } from '../../components/ui'
import { DetailPage } from '../../components/layout/Page'

const ICONS = { indices: BarChart3, cronograma: Clock, eventos: ShieldAlert }

export function ReportsPage() {
  const state = useAsync(listReports, [])
  return (
    <DetailPage title="Reportes" subtitle="Lo que puede ver según su perfil">
      <Loadable state={state} skeleton={<SkeletonList height={96} />}>
        {(reports) =>
          reports.length === 0 ? (
            <Card><EmptyState icon={BarChart3} title="Sin reportes" message="Su perfil no tiene reportes disponibles." /></Card>
          ) : (
            <div className="stack gap-12">
              {reports.map((report) => (
                <Card key={report.id} to={report.available ? `/mas/reportes/${report.id}` : undefined}>
                  <div className="row gap-12">
                    <IconBadge icon={report.available ? (ICONS[report.id] ?? BarChart3) : Lock} tone={report.available ? undefined : 'warn'} />
                    <div className="grow">
                      <h3 className="headline-md clamp-1" style={{ fontSize: 18 }}>{report.title}</h3>
                      <p className="body-sm">{report.description}</p>
                      {!report.available && <p className="body-sm" style={{ color: 'var(--warn, #8a5a00)' }}>{report.reason ?? 'No disponible todavía'}</p>}
                    </div>
                    {report.available && <ChevronRight size={20} className="chevron" aria-hidden />}
                  </div>
                </Card>
              ))}
            </div>
          )
        }
      </Loadable>
    </DetailPage>
  )
}
