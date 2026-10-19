import { Card, ListRow, Note, RowGroup, SectionTitle, StatusPill } from '../../components/ui'
import { Lightbulb, Info } from 'lucide-react'

const MATCH_TONE = { alta: 'danger', media: 'warn', baja: 'neutral' }

export function AnswerView({ answer }) {
  return (
    <>
      <Card>
        <span className="label-sm">Lo que entendí</span>
        <p style={{ marginTop: 6 }}>{answer.understood}</p>
      </Card>
      {!answer.hasInfo && <Note icon={Lightbulb}>Todavía no hay información validada para este caso. Consulte con asistencia técnica.</Note>}
      {answer.causes.length > 0 && (
        <>
          <SectionTitle>Causas probables</SectionTitle>
          <RowGroup>
            {answer.causes.map((c) => (
              <ListRow key={c.id} icon={Lightbulb} title={c.name} subtitle={c.why} titleLines={2} trailing={<StatusPill tone={MATCH_TONE[c.match] ?? 'neutral'}>{`Coincidencia ${c.match}`}</StatusPill>} />
            ))}
          </RowGroup>
        </>
      )}
      {answer.actions.length > 0 && (
        <>
          <SectionTitle>Qué hacer</SectionTitle>
          <Card>
            <ul className="stack gap-8" style={{ paddingLeft: 18 }}>
              {answer.actions.map((a) => (
                <li key={a}>{a}</li>
              ))}
            </ul>
          </Card>
        </>
      )}
      <SectionTitle>Tratamientos validados</SectionTitle>
      {answer.treatments.length === 0 ? (
        <Card><p className="body-sm">{answer.treatmentMessage || 'No hay tratamientos validados para este caso.'}</p></Card>
      ) : (
        <RowGroup>
          {answer.treatments.map((t) => (
            <ListRow key={`${t.problem}-${t.product}`} icon={Lightbulb} title={t.product} subtitle={`${t.problem}. ${t.description}`} titleLines={2} />
          ))}
        </RowGroup>
      )}
      {answer.callTechnician && (
        <Card tone="warn">
          <span className="label-sm">Cuándo llamar al técnico</span>
          <p style={{ marginTop: 6 }}>{answer.callTechnician}</p>
        </Card>
      )}
      {answer.notice && <Note icon={Info}>{answer.notice}</Note>}
    </>
  )
}
