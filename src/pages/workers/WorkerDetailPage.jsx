import { useParams } from 'react-router-dom'
import { BadgeCheck, Banknote, Contact, Phone, ScrollText } from 'lucide-react'
import { useApp } from '../../context/AppContext'
import { useAsync } from '../../hooks/useAsync'
import { listWorkers } from '../../services/workers'
import { Card, EmptyState, InfoList, InfoRow, Loadable, Note, StatusPill } from '../../components/ui'
import { DetailPage, Gap } from '../../components/layout/Page'
import { formatCop, humanize } from '../../lib/format'
import { workerTypeLabel } from '../../lib/labels'

export function WorkerDetailPage() {
  const { id } = useParams()
  const app = useApp()
  const farm = app.activeFarm
  const state = useAsync(async () => (farm ? (await listWorkers(farm.id)).find((w) => w.id === id) ?? null : null), [farm?.id, id])

  return (
    <Loadable state={state}>
      {(w) =>
        !w ? (
          <DetailPage title="Trabajador"><Card><EmptyState icon={Contact} title="No encontramos este trabajador" /></Card></DetailPage>
        ) : (
          <DetailPage title={w.name} subtitle="Ficha laboral">
            <Card>
              <div className="row gap-16">
                <span className="avatar">{w.initials}</span>
                <div className="grow stack gap-8">
                  <h2 className="headline-md clamp-2">{w.name}</h2>
                  <span><StatusPill tone={w.status === 'activo' ? 'ok' : 'neutral'}>{workerTypeLabel(w.type)}</StatusPill></span>
                </div>
              </div>
            </Card>
            <Gap />
            <InfoList>
              <InfoRow icon={Contact} label="Documento" value={w.maskedDocument} mono />
              <InfoRow icon={Phone} label="Teléfono" value={w.phone ?? 'Sin registrar'} />
              <InfoRow icon={Banknote} label="Jornal habitual" value={formatCop(w.dailyRate)} mono />
              <InfoRow icon={BadgeCheck} label="Estado" value={humanize(w.status)} />
            </InfoList>
            <Gap />
            <Note icon={ScrollText}>Información laboral protegida por la Ley 1581 de 2012. Su uso es exclusivo para liquidar jornales en la finca.</Note>
          </DetailPage>
        )
      }
    </Loadable>
  )
}
