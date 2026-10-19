import { useState } from 'react'
import { BookCheck } from 'lucide-react'
import { useAsync } from '../../hooks/useAsync'
import { useApp } from '../../context/AppContext'
import { changeKnowledgeState, listKnowledge } from '../../services/content'
import { Button, Card, EmptyState, Field, FilterBar, FormSheet, ListRow, Loadable, SkeletonList, StatusPill } from '../../components/ui'
import { DetailPage } from '../../components/layout/Page'
import { humanize } from '../../lib/format'

const STATES = ['borrador', 'validado', 'retirado']
const LABELS = ['Borradores', 'Validadas', 'Retiradas']
const NEXT = {
  borrador: [['validado', 'Validar ficha'], ['retirado', 'Retirar ficha']],
  validado: [['retirado', 'Retirar ficha']],
  retirado: [['borrador', 'Volver a borrador']],
}
const tone = (state) => (state === 'validado' ? 'ok' : state === 'borrador' ? 'warn' : 'neutral')

function ChangeSheet({ item, target, onClose }) {
  const [note, setNote] = useState('')
  return (
    <FormSheet
      title={target[1]}
      subtitle={item.name}
      submitLabel="Confirmar cambio"
      onClose={onClose}
      validate={() => ({})}
      onSubmit={() => changeKnowledgeState(item.id, target[0], note.trim())}
    >
      <Field label="Observación (opcional)" name="note" multiline maxLength={500} value={note} onChange={(e) => setNote(e.target.value)} />
    </FormSheet>
  )
}

export function KnowledgeReviewPage() {
  const app = useApp()
  const [filter, setFilter] = useState(0)
  const [change, setChange] = useState(null)
  const state = useAsync(listKnowledge, [app.revision])
  return (
    <DetailPage title="Revisión de conocimiento" subtitle="Validar, retirar o reabrir fichas">
      <Loadable state={state} skeleton={<SkeletonList height={72} />}>
        {(items) => {
          const shown = items.filter((i) => i.state === STATES[filter])
          return (
            <>
              <FilterBar labels={LABELS} counts={STATES.map((s) => items.filter((i) => i.state === s).length)} selected={filter} onSelect={setFilter} />
              <div style={{ height: 12 }} />
              {shown.length === 0 ? (
                <Card><EmptyState icon={BookCheck} title="Sin fichas en este estado" message="Cuando haya fichas aquí podrá cambiarles el estado." /></Card>
              ) : (
                <div className="stack gap-12">
                  {shown.map((i) => (
                    <Card key={i.id}>
                      <ListRow to={`/mas/conocimiento/${i.id}`} icon={BookCheck} title={i.name} subtitle={humanize(i.type)} trailing={<StatusPill tone={tone(i.state)}>{humanize(i.state)}</StatusPill>} />
                      <div className="row gap-8" style={{ flexWrap: 'wrap', marginTop: 8 }}>
                        {NEXT[i.state].map((target) => (
                          <Button key={target[0]} variant="outline" onClick={() => setChange({ item: i, target })}>{target[1]}</Button>
                        ))}
                      </div>
                    </Card>
                  ))}
                </div>
              )}
              {change && <ChangeSheet item={change.item} target={change.target} onClose={(saved) => { setChange(null); if (saved) app.markChanged() }} />}
            </>
          )
        }}
      </Loadable>
    </DetailPage>
  )
}
