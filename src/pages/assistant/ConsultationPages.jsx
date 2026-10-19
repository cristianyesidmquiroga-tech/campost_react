import { useEffect, useState } from 'react'
import { Navigate, useParams } from 'react-router-dom'
import { Gauge, History, Search, Info } from 'lucide-react'
import { useAsync } from '../../hooks/useAsync'
import { assistantQuality, getConsultation, listConsultations, rateConsultation, RATINGS } from '../../services/assistant'
import { Button, Card, EmptyState, Field, KpiGrid, KpiTile, ListRow, Loadable, Note, RowGroup, SectionTitle, SkeletonList, StatusPill } from '../../components/ui'
import { DetailPage } from '../../components/layout/Page'
import { formatDate, formatNumber } from '../../lib/format'
import { AnswerView } from './AnswerView'

export function ConsultationHistoryPage() {
  const [query, setQuery] = useState('')
  const [debounced, setDebounced] = useState('')
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(query), 300)
    return () => clearTimeout(timer)
  }, [query])
  const state = useAsync(() => listConsultations(debounced.trim() || undefined), [debounced])
  return (
    <DetailPage title="Historial de consultas" subtitle="Sus preguntas al asistente">
      <Field label="Buscar en mis preguntas" name="q" maxLength={80} icon={Search} value={query} onChange={(e) => setQuery(e.target.value)} />
      <div style={{ height: 12 }} />
      <Loadable state={state} skeleton={<SkeletonList height={72} />}>
        {(items) =>
          items.length === 0 ? (
            <Card><EmptyState icon={History} title="Sin consultas" message="Sus preguntas al asistente aparecen aquí." /></Card>
          ) : (
            <RowGroup>
              {items.map((c) => (
                <ListRow key={c.id} to={`/mas/asistente/consultas/${c.id}`} icon={History} title={c.question} titleLines={2} subtitle={formatDate(c.createdAt)} trailing={c.rating ? <StatusPill tone={c.rating === 'sirvio' ? 'ok' : 'warn'}>{RATINGS[c.rating]}</StatusPill> : null} />
              ))}
            </RowGroup>
          )
        }
      </Loadable>
    </DetailPage>
  )
}

export function ConsultationDetailPage() {
  const { id } = useParams()
  const state = useAsync(() => getConsultation(id), [id])
  const [rating, setRating] = useState(null)
  const [error, setError] = useState(null)

  const rate = async (value) => {
    setError(null)
    try {
      await rateConsultation(id, value)
      setRating(value)
    } catch (e) {
      setError(e.message)
    }
  }

  return (
    <DetailPage title="Consulta" subtitle="Pregunta y respuesta">
      <Loadable state={state} skeleton={<SkeletonList height={140} />}>
        {(consultation) => {
          if (!consultation) return <Navigate to="/mas/asistente/historial" replace />
          const current = rating ?? consultation.rating
          return (
            <>
              <Card>
                <span className="label-sm">{formatDate(consultation.createdAt)}</span>
                <p style={{ marginTop: 6 }}>{consultation.question}</p>
              </Card>
              <div style={{ height: 12 }} />
              {consultation.answer && <AnswerView answer={consultation.answer} />}
              <SectionTitle>Qué tal le pareció</SectionTitle>
              <div className="row gap-8" style={{ flexWrap: 'wrap' }}>
                {Object.entries(RATINGS).map(([value, label]) => (
                  <Button key={value} variant={current === value ? undefined : 'outline'} onClick={() => rate(value)}>{label}</Button>
                ))}
              </div>
              {error && <div className="form-error" role="alert"><span>{error}</span></div>}
            </>
          )
        }}
      </Loadable>
    </DetailPage>
  )
}

export function AssistantQualityPage() {
  const state = useAsync(assistantQuality, [])
  return (
    <DetailPage title="Calidad del asistente" subtitle="Valoración de las respuestas">
      <Loadable state={state} skeleton={<SkeletonList height={120} />}>
        {(q) => (
          <>
            <KpiGrid cols={2} colsWide={4}>
              <KpiTile label="Consultas" value={formatNumber(q.consultations)} icon={History} caption="en total" />
              <KpiTile label="Con valoración" value={formatNumber(q.rated)} icon={Gauge} caption="respondidas por la gente" />
              <KpiTile label="Les sirvió" value={formatNumber(q.helpful)} icon={Gauge} caption={q.percent == null ? 'sin datos' : `${formatNumber(q.percent, 0)} por ciento`} />
              <KpiTile label="No sirvió o equivocada" value={formatNumber(q.notHelpful + q.wrong)} icon={Gauge} tone="danger" caption={`${formatNumber(q.wrong)} equivocadas`} />
            </KpiGrid>
            {q.notice && <Note icon={Info}>{q.notice}</Note>}
          </>
        )}
      </Loadable>
    </DetailPage>
  )
}
