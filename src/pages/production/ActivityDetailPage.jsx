import { useState } from 'react'
import { Navigate, useNavigate, useParams } from 'react-router-dom'
import { CalendarDays, Hammer, Layers, Pencil, Ruler, Trash2 } from 'lucide-react'
import { useApp } from '../../context/AppContext'
import { useAuth } from '../../context/AuthContext'
import { useToast } from '../../context/ToastContext'
import { useAsync } from '../../hooks/useAsync'
import { useConfirm } from '../../hooks/useConfirm'
import { cancelActivity, listActivities, updateActivity } from '../../services/activities'
import { Button, DateField, Field, FormSheet, InfoList, InfoRow, Loadable, SectionTitle, SkeletonList, StatusPill } from '../../components/ui'
import { DetailPage } from '../../components/layout/Page'
import { formatDate, formatHa, humanize, parseNumber } from '../../lib/format'
import { phaseLabel } from '../../lib/labels'

function EditSheet({ farmId, activity, onClose }) {
  const [form, setForm] = useState({ name: activity.name, area: String(activity.areaHa), end: activity.end ?? '' })
  const input = (key) => ({ value: form[key], onChange: (e) => setForm((f) => ({ ...f, [key]: e.target.value })) })
  return (
    <FormSheet
      title="Editar labor"
      subtitle={phaseLabel(activity.phase)}
      submitLabel="Guardar cambios"
      onClose={onClose}
      validate={() => ({
        name: form.name.trim() ? null : 'Escriba el nombre de la labor.',
        area: parseNumber(form.area) > 0 ? null : 'Escriba un área mayor que cero.',
      })}
      onSubmit={() => updateActivity(farmId, activity.id, { name: form.name.trim(), areaHa: parseNumber(form.area), end: form.end })}
    >
      <Field label="Nombre de la labor" name="name" maxLength={120} {...input('name')} />
      <Field label="Área trabajada en hectáreas" name="area" inputMode="decimal" {...input('area')} />
      <DateField label="Fecha de fin (opcional)" value={form.end} onChange={(end) => setForm((f) => ({ ...f, end }))} />
    </FormSheet>
  )
}

export function ActivityDetailPage() {
  const { id } = useParams()
  const app = useApp()
  const { access } = useAuth()
  const show = useToast()
  const navigate = useNavigate()
  const [confirm, dialog] = useConfirm()
  const [editing, setEditing] = useState(false)
  const farm = app.activeFarm
  const state = useAsync(async () => (farm ? { farmId: farm.id, items: await listActivities(farm.id) } : null), [farm?.id, app.revision])
  const stale = app.farmsLoading || (farm && !state.error && state.data?.farmId !== farm.id)
  const view = stale ? { ...state, loading: true, data: null } : state

  const cancel = async () => {
    const yes = await confirm({ title: 'Anular labor', message: 'La labor queda anulada y deja de sumar a los costos.', confirmLabel: 'Anular labor' })
    if (!yes) return
    try {
      await cancelActivity(farm.id, id)
      show('Labor anulada.')
      app.markChanged()
      navigate(-1)
    } catch (error) {
      show(error.message, true)
    }
  }

  return (
    <DetailPage title="Detalle de labor" subtitle={farm?.name}>
      <Loadable state={view} skeleton={<SkeletonList height={140} />}>
        {(data) => {
          const activity = data?.items.find((a) => a.id === id)
          if (!activity) return <Navigate to="/produccion" replace />
          const cancelled = activity.status === 'anulada'
          return (
            <>
              <div className="stack gap-12">
                <div className="row gap-12">
                  <span className="grow"><h2 className="headline-md">{activity.name}</h2></span>
                  <StatusPill tone={cancelled ? 'danger' : 'info'}>{humanize(activity.status)}</StatusPill>
                </div>
                <InfoList>
                  <InfoRow icon={Layers} label="Fase" value={phaseLabel(activity.phase)} />
                  <InfoRow icon={CalendarDays} label="Inicio" value={formatDate(activity.start)} />
                  <InfoRow icon={CalendarDays} label="Fin" value={activity.end ? formatDate(activity.end) : 'Sin fecha de fin'} />
                  <InfoRow icon={Ruler} label="Área trabajada" value={formatHa(activity.areaHa)} />
                  <InfoRow icon={Hammer} label="Ciclo" value={activity.cycleId.slice(0, 8)} mono />
                </InfoList>
              </div>
              {access.registersFieldWork && !cancelled && (
                <>
                  <SectionTitle>Acciones</SectionTitle>
                  <div className="btn-stack">
                    <Button wide icon={Pencil} onClick={() => setEditing(true)}>Editar labor</Button>
                    <Button wide variant="outline danger" icon={Trash2} onClick={cancel}>Anular labor</Button>
                  </div>
                </>
              )}
              {editing && <EditSheet farmId={farm.id} activity={activity} onClose={(saved) => { setEditing(false); if (saved) app.markChanged() }} />}
            </>
          )
        }}
      </Loadable>
      {dialog}
    </DetailPage>
  )
}
