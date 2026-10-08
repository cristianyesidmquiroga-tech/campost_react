import { useState } from 'react'
import { useParams } from 'react-router-dom'
import { Archive, CalendarDays, Hammer, Lock, LockOpen, LockKeyhole, Plus, FlaskConical, TrendingUp } from 'lucide-react'
import { useApp } from '../../context/AppContext'
import { useAuth } from '../../context/AuthContext'
import { useAsync } from '../../hooks/useAsync'
import { useConfirm } from '../../hooks/useConfirm'
import { useToast } from '../../context/ToastContext'
import { closeCycle, cycleOverview } from '../../services/production'
import { Button, Card, EmptyState, KpiGrid, KpiTile, ListRow, Loadable, RowGroup, SectionTitle, SkeletonList, StatusPill } from '../../components/ui'
import { DetailPage, Gap } from '../../components/layout/Page'
import { formatDate, formatHa, formatNumber, humanize } from '../../lib/format'
import { cycleTypeLabel, phaseLabel } from '../../lib/labels'
import { WorkForm } from '../home/WorkForms'

export function CyclePage() {
  const { id, cycleId } = useParams()
  const app = useApp()
  const { access } = useAuth()
  const show = useToast()
  const [confirm, dialog] = useConfirm()
  const [adding, setAdding] = useState(false)
  const state = useAsync(() => cycleOverview(id, cycleId), [id, cycleId])

  const close = async () => {
    const yes = await confirm({
      title: 'Cerrar ciclo',
      message: 'Antes de cerrar, registre la cosecha final o el motivo de la pérdida si hubo un siniestro. El cierre no se puede deshacer.',
      confirmLabel: 'Cerrar ciclo',
    })
    if (!yes) return
    try {
      await closeCycle(cycleId)
      show('Ciclo cerrado.')
      app.markChanged()
      await state.reload()
    } catch (error) {
      show(error.message, true)
    }
  }

  return (
    <Loadable state={state} skeleton={<DetailPage title="Ciclo"><SkeletonList height={120} /></DetailPage>}>
      {({ cycle, activities, schedule, needs }) => {
        const open = cycle.status === 'abierto'
        const days = cycle.start ? Math.floor((Date.now() - new Date(cycle.start).getTime()) / 86400000) : null
        const done = schedule.filter((p) => p.done).length
        return (
          <DetailPage title={`Ciclo ${cycle.number} · ${cycleTypeLabel(cycle.type)}`} subtitle={open ? 'En curso' : 'Cerrado'}>
            <KpiGrid>
              <KpiTile label="Días transcurridos" value={days == null ? '—' : formatNumber(days)} icon={CalendarDays} caption={cycle.start ? `desde ${formatDate(cycle.start)}` : 'sin fecha de inicio'} />
              <KpiTile label="Fases completadas" value={schedule.length === 0 ? '—' : `${done} de ${schedule.length}`} icon={TrendingUp} tone="high" caption="según el cronograma" />
              <KpiTile label="Labores registradas" value={formatNumber(activities.length)} icon={Hammer} tone="warn" caption="en este ciclo" />
              <KpiTile label="Estado" value={open ? 'Abierto' : 'Cerrado'} icon={open ? LockOpen : Lock} tone="high" caption={cycle.end ? formatDate(cycle.end) : 'sin cierre'} />
            </KpiGrid>
            <SectionTitle caption={`${activities.length} registradas`}>Labores del ciclo</SectionTitle>
            {activities.length === 0 ? (
              <Card>
                <EmptyState
                  icon={Hammer}
                  title="Aún no hay labores"
                  message="Registre la primera labor con sus jornales para ver costos y avance."
                  actionLabel={open && access.registersFieldWork ? 'Agregar labor' : undefined}
                  onAction={() => setAdding(true)}
                />
              </Card>
            ) : (
              <RowGroup>
                {activities.map((a) => (
                  <ListRow key={a.id} icon={Hammer} title={a.name} subtitle={`${phaseLabel(a.phase)} · ${formatHa(a.areaHa)}`} trailing={<StatusPill tone="info">{humanize(a.status)}</StatusPill>} />
                ))}
              </RowGroup>
            )}
            <SectionTitle>Insumos que necesita</SectionTitle>
            {needs.length === 0 ? (
              <Card><EmptyState icon={Archive} title="Sin dosis cargadas" message="Falta cargar las dosis de este cultivo desde una fuente técnica." /></Card>
            ) : (
              <RowGroup>
                {needs.map((n) => (
                  <ListRow key={n.type} icon={FlaskConical} title={humanize(n.type)} subtitle={`${formatNumber(n.dose, 1)} ${n.unit} por ${n.base}`} trailing={<span className="mono-md">{n.quantity == null ? '—' : formatNumber(n.quantity, 1)}</span>} />
                ))}
              </RowGroup>
            )}
            {open && access.registersFieldWork && (
              <>
                <SectionTitle>Acciones</SectionTitle>
                <div className="btn-stack">
                  <Button wide icon={Plus} onClick={() => setAdding(true)}>Agregar labor</Button>
                  {access.managesProduction && <Button wide variant="outline" icon={LockKeyhole} onClick={close}>Cerrar ciclo</Button>}
                </div>
              </>
            )}
            <Gap />
            {adding && <WorkForm cycleId={cycleId} onClose={(saved) => { setAdding(false); if (saved) { app.markChanged(); state.reload() } }} />}
            {dialog}
          </DetailPage>
        )
      }}
    </Loadable>
  )
}
