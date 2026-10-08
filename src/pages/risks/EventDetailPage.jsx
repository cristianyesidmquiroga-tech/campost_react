import { useState } from 'react'
import { useParams } from 'react-router-dom'
import { CheckCircle2, Gauge, TrendingDown } from 'lucide-react'
import { useApp } from '../../context/AppContext'
import { useAuth } from '../../context/AuthContext'
import { useAsync } from '../../hooks/useAsync'
import { useConfirm } from '../../hooks/useConfirm'
import { useToast } from '../../context/ToastContext'
import { closeEvent, getEvent, riskCatalog } from '../../services/risks'
import { Button, Card, InfoList, InfoRow, KpiGrid, KpiTile, Loadable, SectionTitle, SkeletonList } from '../../components/ui'
import { DetailPage, Gap } from '../../components/layout/Page'
import { formatDate, formatHa, formatNumber, humanize, isoDate } from '../../lib/format'

const tones = { severa: 'danger', moderada: 'warn', leve: 'high' }

export function EventDetailPage() {
  const { id } = useParams()
  const app = useApp()
  const { access } = useAuth()
  const show = useToast()
  const [confirm, dialog] = useConfirm()
  const [busy, setBusy] = useState(false)
  const state = useAsync(async () => {
    const [event, risks] = await Promise.all([getEvent(id), riskCatalog()])
    return { event, risk: risks.find((r) => r.id === event.riskId) ?? null }
  }, [id])

  const finish = async () => {
    const yes = await confirm({ title: 'Marcar como terminado', message: 'El evento queda cerrado con fecha de hoy.', confirmLabel: 'Terminar evento' })
    if (!yes) return
    setBusy(true)
    try {
      await closeEvent(id, isoDate())
      show('Evento terminado.')
      app.markChanged()
      await state.reload()
    } catch (error) {
      show(error.message, true)
    } finally {
      setBusy(false)
    }
  }

  return (
    <Loadable state={state} skeleton={<DetailPage title="Evento adverso"><SkeletonList height={120} /></DetailPage>}>
      {({ event, risk }) => (
        <DetailPage title={risk?.name ?? 'Evento adverso'} subtitle={`Desde el ${formatDate(event.start)}`}>
          <KpiGrid cols={2} colsWide={2}>
            <KpiTile label="Severidad" value={humanize(event.severity)} icon={Gauge} tone={tones[event.severity] ?? 'high'} caption={event.active ? 'evento en curso' : 'evento terminado'} />
            <KpiTile
              label="Pérdida estimada"
              value={event.estimatedLoss == null ? '—' : formatNumber(Math.round(event.estimatedLoss))}
              prefix={event.estimatedLoss == null ? undefined : '$'}
              icon={TrendingDown}
              tone="danger"
              caption={event.lossPercent == null ? 'sin porcentaje' : `${formatNumber(event.lossPercent)}% de la producción`}
            />
          </KpiGrid>
          <SectionTitle>Detalle</SectionTitle>
          <InfoList>
            <InfoRow label="Tipo de riesgo" value={humanize(risk?.type ?? '—')} />
            <InfoRow label="Inicio" value={formatDate(event.start)} />
            <InfoRow label="Fin" value={event.end ? formatDate(event.end) : 'En curso'} />
            <InfoRow label="Área afectada" value={event.affectedArea == null ? 'Sin dato' : formatHa(event.affectedArea)} />
          </InfoList>
          {event.notes && (
            <>
              <SectionTitle>Notas</SectionTitle>
              <Card><p>{event.notes}</p></Card>
            </>
          )}
          {event.active && access.registersFieldWork && (
            <>
              <Gap size="lg" />
              <Button wide icon={CheckCircle2} busy={busy} onClick={finish}>Marcar como terminado</Button>
            </>
          )}
          {dialog}
        </DetailPage>
      )}
    </Loadable>
  )
}
