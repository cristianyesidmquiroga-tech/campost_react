import { useMemo, useState } from 'react'
import { CheckCircle2, Lock, User, Wrench, CircleCheck } from 'lucide-react'
import { useApp } from '../../context/AppContext'
import { useAuth } from '../../context/AuthContext'
import { useAsync } from '../../hooks/useAsync'
import { useConfirm } from '../../hooks/useConfirm'
import { useToast } from '../../context/ToastContext'
import { listJornales, payJornal } from '../../services/payments'
import { Amount, Button, Card, EmptyState, IconBadge, Loadable, Note, SectionTitle, SegmentedTabs, SkeletonList } from '../../components/ui'
import { DetailPage, Gap } from '../../components/layout/Page'
import { formatCop, formatDateShort, formatNumber } from '../../lib/format'

function groupBy(items, byWorker) {
  const groups = new Map()
  items.forEach((j) => {
    const key = byWorker ? j.payee : j.activityName
    groups.set(key, [...(groups.get(key) ?? []), j])
  })
  return groups
}

function GroupCard({ title, items, selectable, selected, onToggle }) {
  const total = items.reduce((s, j) => s + j.total, 0)
  const days = items.reduce((s, j) => s + j.workDays, 0)
  const subtitle = items.length === 1 ? `${items[0].activityName} · ${formatDateShort(items[0].date)}` : `${items.length} registros`
  const body = (
    <div className="row gap-12">
      {selectable ? (
        <input type="checkbox" className="check-box" checked={selected} onChange={onToggle} aria-label={`Seleccionar ${title}`} onClick={(e) => e.stopPropagation()} />
      ) : (
        <IconBadge icon={User} />
      )}
      <div className="grow">
        <div className="label-md clamp-2" style={{ fontSize: 15 }}>{title}</div>
        <div className="body-sm clamp-2">{subtitle} · {formatNumber(days, days % 1 === 0 ? 0 : 1)} jornales</div>
      </div>
      <Amount>{formatCop(total)}</Amount>
    </div>
  )
  return selectable ? <Card onClick={onToggle}>{body}</Card> : <Card>{body}</Card>
}

export function PaymentsPage() {
  const app = useApp()
  const { access } = useAuth()
  const show = useToast()
  const [confirm, dialog] = useConfirm()
  const farm = app.activeFarm
  const [byWorker, setByWorker] = useState(true)
  const [selected, setSelected] = useState(() => new Set())
  const [paying, setPaying] = useState(false)
  const state = useAsync(() => (farm ? listJornales(farm.id, 'pendiente') : Promise.resolve([])), [farm?.id, app.revision])
  const items = useMemo(() => state.data ?? [], [state.data])
  const groups = useMemo(() => groupBy(items, byWorker), [items, byWorker])
  const chosen = [...groups.entries()].filter(([key]) => selected.has(key)).flatMap(([, list]) => list)
  const chosenTotal = chosen.reduce((s, j) => s + j.total, 0)
  const canPay = access.paysWorkers

  const toggle = (key) =>
    setSelected((current) => {
      const next = new Set(current)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })

  const pay = async () => {
    const yes = await confirm({
      title: 'Marcar como pagado',
      message: `${chosen.length} jornales por ${formatCop(chosenTotal)}. Se registra un gasto de mano de obra por cada pago.`,
      confirmLabel: 'Marcar como pagado',
    })
    if (!yes) return
    setPaying(true)
    let paid = 0
    try {
      for (const jornal of chosen) {
        await payJornal(farm.id, jornal.id)
        paid += 1
      }
      show(`${paid} jornales marcados como pagados.`)
    } catch (error) {
      show(error.message, true)
    } finally {
      setPaying(false)
      setSelected(new Set())
      app.markChanged()
    }
  }

  return (
    <DetailPage title="Pagos pendientes" subtitle={farm?.name ?? 'Sin finca activa'}>
      {!farm ? (
        <Card><EmptyState icon={CircleCheck} title="Sin finca activa" message="Registre una finca para llevar sus pagos." /></Card>
      ) : (
        <Loadable state={state} skeleton={<SkeletonList height={120} />}>
          {() => {
            const total = items.reduce((s, j) => s + j.total, 0)
            const days = items.reduce((s, j) => s + j.workDays, 0)
            return (
              <>
                <SegmentedTabs labels={['Por trabajador', 'Por labor']} icons={[User, Wrench]} selected={byWorker ? 0 : 1} onSelect={(i) => { setByWorker(i === 0); setSelected(new Set()) }} />
                <Gap size="sm" />
                <Card>
                  <span className="label-sm">Total acumulado por liquidar</span>
                  <div className="mono-xl" style={{ fontSize: 30, lineHeight: '38px', color: 'var(--primary)', marginTop: 8 }}>{formatCop(total)}</div>
                  <hr className="divider" style={{ margin: '12px 0' }} />
                  <div className="spread body-sm">
                    <span>{formatNumber(groups.size)} {byWorker ? 'beneficiarios' : 'labores'}</span>
                    <span>{formatNumber(days, days % 1 === 0 ? 0 : 1)} jornales</span>
                  </div>
                </Card>
                <SectionTitle trailing={canPay && groups.size > 0 ? (
                  <Button variant="text" onClick={() => setSelected(selected.size === groups.size ? new Set() : new Set(groups.keys()))}>
                    {selected.size === groups.size ? 'Quitar selección' : 'Seleccionar todos'}
                  </Button>
                ) : null}>
                  {byWorker ? 'Partidas por trabajador' : 'Partidas por labor'}
                </SectionTitle>
                {groups.size === 0 ? (
                  <Card><EmptyState icon={CheckCircle2} title="No hay pagos pendientes" message="Los jornales que registre aparecen aquí hasta que los marque como pagados." /></Card>
                ) : (
                  <div className="stack gap-12">
                    {[...groups.entries()].map(([key, list]) => (
                      <GroupCard key={key} title={key} items={list} selectable={canPay} selected={selected.has(key)} onToggle={() => toggle(key)} />
                    ))}
                  </div>
                )}
                <Gap />
                <Note icon={Lock}>Cada pago genera un solo gasto de mano de obra y queda auditado (Ley 1581 de 2012).</Note>
                {canPay && items.length > 0 && (
                  <div className="paybar">
                    <div className="spread">
                      <span className="label-sm grow">Total a liquidar ({selected.size} seleccionados)</span>
                      <span className="mono-xl">{formatCop(chosenTotal)}</span>
                    </div>
                    <Button wide icon={CheckCircle2} busy={paying} disabled={chosen.length === 0} onClick={pay}>Marcar como pagado</Button>
                  </div>
                )}
              </>
            )
          }}
        </Loadable>
      )}
      {dialog}
    </DetailPage>
  )
}
