import { useState } from 'react'
import { Search, SearchX } from 'lucide-react'
import { useAsync } from '../../hooks/useAsync'
import { listGlossary } from '../../services/content'
import { Card, EmptyState, Loadable, StatusPill } from '../../components/ui'
import { DetailPage } from '../../components/layout/Page'
import { humanize } from '../../lib/format'

export function GlossaryPage() {
  const state = useAsync(listGlossary, [])
  const [query, setQuery] = useState('')
  const q = query.toLowerCase()
  return (
    <DetailPage title="Glosario del campo" subtitle="Palabras del agro explicadas">
      <div className="field" style={{ marginBottom: 16 }}>
        <div className="field__wrap field__wrap--icon">
          <Search size={20} aria-hidden />
          <input className="field__control" placeholder="Buscar un término" aria-label="Buscar un término" value={query} onChange={(e) => setQuery(e.target.value)} />
        </div>
      </div>
      <Loadable state={state}>
        {(terms) => {
          const shown = terms.filter((t) => t.term.toLowerCase().includes(q) || t.explanation.toLowerCase().includes(q))
          return shown.length === 0 ? (
            <Card><EmptyState icon={SearchX} title="No encontramos ese término" message="Pruebe con otra palabra." /></Card>
          ) : (
            <div className="stack gap-12">
              {shown.map((t) => (
                <Card key={t.id}>
                  <div className="row gap-8">
                    <h3 className="headline-md grow clamp-1">{t.term}</h3>
                    <StatusPill>{humanize(t.category)}</StatusPill>
                  </div>
                  <p style={{ marginTop: 8, lineHeight: 1.5 }}>{t.explanation}</p>
                </Card>
              ))}
            </div>
          )
        }}
      </Loadable>
    </DetailPage>
  )
}
