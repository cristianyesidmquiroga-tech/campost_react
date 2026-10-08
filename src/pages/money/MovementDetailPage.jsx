import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Ban, Gavel, Hash, Layers, Mountain, ArrowUpDown, BadgeCheck } from 'lucide-react'
import { useApp } from '../../context/AppContext'
import { useAuth } from '../../context/AuthContext'
import { useAsync } from '../../hooks/useAsync'
import { useToast } from '../../context/ToastContext'
import { listMovements } from '../../services/money'
import { Button, Card, EmptyState, InfoList, InfoRow, Loadable, Note, SectionTitle, StatusPill } from '../../components/ui'
import { DetailPage, Gap } from '../../components/layout/Page'
import { formatCop } from '../../lib/format'
import { CancelForm } from './MoneyForms'

export function MovementDetailPage() {
  const { id } = useParams()
  const app = useApp()
  const { access } = useAuth()
  const show = useToast()
  const navigate = useNavigate()
  const [cancelling, setCancelling] = useState(false)
  const farm = app.activeFarm
  const state = useAsync(async () => (farm ? (await listMovements(farm.id)).find((m) => m.id === id) ?? null : null), [farm?.id, id])

  return (
    <Loadable state={state}>
      {(m) => {
        if (!m) {
          return (
            <DetailPage title="Movimiento">
              <Card><EmptyState icon={Ban} title="Ya no encontramos este movimiento" message="Vuelva a la lista de movimientos." /></Card>
            </DetailPage>
          )
        }
        const color = m.cancelled ? 'var(--outline)' : m.isIncome ? 'var(--success)' : 'var(--error)'
        return (
          <DetailPage title={m.isIncome ? 'Detalle de ingreso' : 'Detalle de gasto'} subtitle={m.category}>
            <Card>
              <StatusPill tone={m.cancelled ? 'neutral' : 'ok'} icon={m.cancelled ? Ban : BadgeCheck}>
                {m.cancelled ? 'Anulado' : m.isIncome ? 'Ingreso confirmado' : 'Gasto confirmado'}
              </StatusPill>
              <div className={`mono-xl ${m.cancelled ? 'line-through' : ''}`} style={{ fontSize: 32, lineHeight: '40px', color, marginTop: 12 }}>{formatCop(m.amount)}</div>
              <p className="body-sm">pesos colombianos (COP)</p>
            </Card>
            <SectionTitle>Trazabilidad</SectionTitle>
            <InfoList>
              <InfoRow icon={ArrowUpDown} label="Tipo" value={m.isIncome ? 'Ingreso' : 'Gasto'} />
              <InfoRow icon={Layers} label="Categoría" value={m.category} />
              <InfoRow icon={Mountain} label="Finca" value={farm?.name ?? '—'} />
              <InfoRow icon={Hash} label="Código" value={m.id.slice(0, 8).toUpperCase()} mono />
            </InfoList>
            <Gap />
            <Note icon={Gavel}>Los movimientos no se eliminan: se anulan dejando constancia con el motivo y quién lo hizo.</Note>
            {access.cancelsMoney && !m.cancelled && (
              <>
                <Gap />
                <Button wide variant="outline danger" icon={Ban} onClick={() => setCancelling(true)}>Anular movimiento</Button>
              </>
            )}
            {cancelling && (
              <CancelForm
                movement={m}
                onClose={(saved) => {
                  setCancelling(false)
                  if (saved) {
                    app.markChanged()
                    show('Movimiento anulado.')
                    navigate(-1)
                  }
                }}
              />
            )}
          </DetailPage>
        )
      }}
    </Loadable>
  )
}
