import { useState } from 'react'
import { useParams } from 'react-router-dom'
import { CalendarClock, Check, CheckCircle2, Clock, ListOrdered, Play, Plus, Timer } from 'lucide-react'
import { useApp } from '../../context/AppContext'
import { useAuth } from '../../context/AuthContext'
import { useToast } from '../../context/ToastContext'
import { useAsync } from '../../hooks/useAsync'
import { addStage, listProcesses, listStages, moveStage } from '../../services/processes'
import { Button, Card, EmptyState, Field, FormSheet, InfoRow, KpiGrid, KpiTile, Loadable, SectionTitle, SkeletonList, StatusPill, positive, required } from '../../components/ui'
import { DetailPage, Gap } from '../../components/layout/Page'
import { formatDate, formatDateShort, formatNumber, parseNumber } from '../../lib/format'

function StageForm({ farm, process, onClose }) {
  const [name, setName] = useState('')
  const [days, setDays] = useState('')
  return (
    <FormSheet
      title="Agregar etapa"
      subtitle={process.name}
      submitLabel="Guardar etapa"
      onClose={onClose}
      validate={() => ({ name: required(name), days: positive(days) })}
      onSubmit={() => addStage(farm.id, process.id, { name: name.trim(), days: parseNumber(days) })}
    >
      <Field label="Nombre de la etapa" name="name" maxLength={120} hint="Ejemplo: Secar al sol" value={name} onChange={(e) => setName(e.target.value)} />
      <Field label="Días estimados" name="days" inputMode="decimal" value={days} onChange={(e) => setDays(e.target.value)} />
    </FormSheet>
  )
}

const dayText = (n) => formatNumber(n, n % 1 === 0 ? 0 : 1)

export function ProcessDetailPage() {
  const { id } = useParams()
  const app = useApp()
  const { access } = useAuth()
  const show = useToast()
  const farm = app.activeFarm
  const [adding, setAdding] = useState(false)
  const [moving, setMoving] = useState(false)
  const state = useAsync(async () => {
    const process = (await listProcesses(farm.id)).find((p) => p.id === id)
    return { process, stages: process ? await listStages(farm.id, id) : [] }
  }, [farm?.id, id, app.revision])

  const move = async (stage, action) => {
    setMoving(true)
    try {
      await moveStage(farm.id, stage.id, action)
      show(action === 'iniciar' ? 'Etapa iniciada.' : 'Etapa finalizada.')
      app.markChanged()
    } catch (error) {
      show(error.message, true)
    } finally {
      setMoving(false)
    }
  }

  return (
    <Loadable state={state} skeleton={<DetailPage title="Proceso"><SkeletonList height={120} /></DetailPage>}>
      {({ process, stages }) => {
        if (!process) return <DetailPage title="Proceso"><Card><EmptyState icon={ListOrdered} title="No encontramos este proceso" /></Card></DetailPage>
        const manage = access.managesInventory
        const current = stages.findIndex((s) => !s.done)
        const done = stages.filter((s) => s.done).length
        const estimated = stages.reduce((s, e) => s + e.estimatedDays, 0)
        return (
          <DetailPage title={process.name} subtitle={process.product} fab={manage ? { icon: Plus, label: 'Agregar etapa', onClick: () => setAdding(true) } : undefined}>
            <KpiGrid cols={2} colsWide={2}>
              <KpiTile label="Etapas completadas" value={stages.length === 0 ? '—' : `${done} de ${stages.length}`} icon={ListOrdered} caption={process.finished ? 'proceso terminado' : 'en proceso'} />
              <KpiTile label="Días estimados" value={dayText(estimated)} icon={Timer} tone="warn" caption="sumando todas las etapas" />
            </KpiGrid>
            <Gap />
            <Card>
              <InfoRow label="Producto final" value={process.product} />
              <InfoRow label="Materia prima" value={process.rawMaterial} />
              <InfoRow label="Origen" value={process.origin === 'propia' ? 'Propia' : 'Comprada'} />
              <InfoRow label="Inicio" value={formatDate(process.start)} icon={CalendarClock} />
            </Card>
            <SectionTitle>Etapas</SectionTitle>
            {stages.length === 0 ? (
              <Card><EmptyState icon={ListOrdered} title="Aún no hay etapas" message="Agregue las etapas del proceso, por ejemplo cocinar, limpiar y secar al sol." /></Card>
            ) : (
              <Card>
                <div className="timeline">
                  {stages.map((stage, i) => {
                    const color = stage.done ? 'var(--primary-container)' : stage.running ? 'var(--tertiary)' : 'var(--outline)'
                    const Icon = stage.done ? Check : stage.running ? Play : Clock
                    const planned = !stage.done && !stage.running
                    return (
                      <div className="timeline__item" key={stage.id}>
                        <div className="timeline__rail">
                          <span className={`timeline__dot ${planned ? 'timeline__dot--planned' : ''}`} style={{ '--c': color }}><Icon size={16} aria-hidden /></span>
                          {i < stages.length - 1 && <span className="timeline__line" />}
                        </div>
                        <div className="timeline__body grow">
                          <div className="label-md">{i + 1}. {stage.name}</div>
                          <div className="mono-sm">Estimado: {dayText(stage.estimatedDays)} días</div>
                          {stage.done && <div style={{ marginTop: 6 }}><StatusPill tone="ok">Finalizada el {formatDateShort(stage.finishedAt)}</StatusPill></div>}
                          {manage && !process.finished && !stage.done && (stage.running || i === current) && (
                            <div style={{ marginTop: 8 }}>
                              <Button variant="outline" icon={stage.running ? CheckCircle2 : Play} busy={moving} onClick={() => move(stage, stage.running ? 'finalizar' : 'iniciar')}>
                                {stage.running ? 'Finalizar etapa' : 'Iniciar etapa'}
                              </Button>
                            </div>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </Card>
            )}
            {adding && <StageForm farm={farm} process={process} onClose={(saved) => { setAdding(false); if (saved) app.markChanged() }} />}
          </DetailPage>
        )
      }}
    </Loadable>
  )
}
