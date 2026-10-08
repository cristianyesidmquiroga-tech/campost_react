import { useState } from 'react'
import { useParams } from 'react-router-dom'
import { BookOpen, Bug, Info, Search } from 'lucide-react'
import { useAsync } from '../../hooks/useAsync'
import { knowledgeDetail, listKnowledge } from '../../services/content'
import { Card, EmptyState, ListRow, Loadable, RowGroup, SectionTitle, SkeletonList, StatusPill } from '../../components/ui'
import { DetailPage, Gap } from '../../components/layout/Page'
import { humanize } from '../../lib/format'

const stateTone = (state) => (state === 'validado' ? 'ok' : state === 'borrador' ? 'warn' : 'neutral')

export function KnowledgePage() {
  const state = useAsync(listKnowledge, [])
  const [query, setQuery] = useState('')
  return (
    <DetailPage title="Biblioteca de conocimiento" subtitle="Plagas, enfermedades y manejo">
      <div className="field" style={{ marginBottom: 16 }}>
        <div className="field__wrap field__wrap--icon">
          <Search size={20} aria-hidden />
          <input className="field__control" placeholder="Buscar un problema" aria-label="Buscar un problema" value={query} onChange={(e) => setQuery(e.target.value)} />
        </div>
      </div>
      <Loadable state={state}>
        {(items) => {
          const shown = items.filter((i) => i.name.toLowerCase().includes(query.toLowerCase()))
          return shown.length === 0 ? (
            <Card><EmptyState icon={BookOpen} title="Sin fichas por ahora" message="Las fichas validadas por expertos aparecerán aquí." /></Card>
          ) : (
            <RowGroup>
              {shown.map((i) => (
                <ListRow key={i.id} to={`/mas/conocimiento/${i.id}`} icon={Bug} title={i.name} subtitle={humanize(i.type)} trailing={<StatusPill tone={stateTone(i.state)}>{humanize(i.state)}</StatusPill>} />
              ))}
            </RowGroup>
          )
        }}
      </Loadable>
    </DetailPage>
  )
}

function Bullets({ items, empty }) {
  return (
    <Card>
      {items.length === 0 ? (
        <p className="body-sm">{empty}</p>
      ) : (
        <ul style={{ margin: 0, paddingLeft: 20, lineHeight: 1.6 }}>
          {items.map((text) => <li key={text}>{text}</li>)}
        </ul>
      )}
    </Card>
  )
}

export function KnowledgeDetailPage() {
  const { id } = useParams()
  const state = useAsync(() => knowledgeDetail(id), [id])
  return (
    <Loadable state={state} skeleton={<DetailPage title="Ficha de problema"><SkeletonList height={120} /></DetailPage>}>
      {(d) => (
        <DetailPage title={d.name} subtitle={humanize(d.type)}>
          <Card>
            <StatusPill tone={stateTone(d.state)}>{humanize(d.state)}</StatusPill>
            <h3 className="label-md" style={{ marginTop: 12 }}>Causa</h3>
            <p style={{ marginTop: 4, lineHeight: 1.5 }}>{d.cause || 'Sin causa registrada.'}</p>
          </Card>
          <SectionTitle>Síntomas</SectionTitle>
          <Bullets items={d.symptoms} empty="Sin síntomas registrados." />
          <SectionTitle>Qué hacer</SectionTitle>
          <Bullets items={d.handling} empty="Aún no hay manejos validados." />
          {d.notice && (
            <>
              <Gap />
              <Card tone="warn" flat>
                <div className="note">
                  <Info size={20} aria-hidden style={{ color: 'var(--tertiary)' }} />
                  <p className="body-sm" style={{ color: 'var(--on-surface)' }}>{d.notice}</p>
                </div>
              </Card>
            </>
          )}
        </DetailPage>
      )}
    </Loadable>
  )
}
