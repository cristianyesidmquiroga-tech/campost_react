import { useState } from 'react'
import { History, MessageCircleQuestion, Send } from 'lucide-react'
import { useApp } from '../../context/AppContext'
import { useAuth } from '../../context/AuthContext'
import { useAsync } from '../../hooks/useAsync'
import { askAssistant } from '../../services/assistant'
import { listPlantings } from '../../services/production'
import { Button, Card, EmptyState, Field, ListRow, Loadable, RowGroup, SelectField, SkeletonList } from '../../components/ui'
import { DetailPage } from '../../components/layout/Page'
import { AnswerView } from './AnswerView'

export function AssistantPage() {
  const app = useApp()
  const { access } = useAuth()
  const farm = app.activeFarm
  const plantings = useAsync(async () => (await listPlantings()).filter((p) => !farm || p.farmId === farm.id), [farm?.id])
  const [plantingId, setPlantingId] = useState(null)
  const [text, setText] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(null)
  const [consultation, setConsultation] = useState(null)

  const ask = async (event) => {
    event.preventDefault()
    if (!plantingId) return setError('Elija la siembra sobre la que pregunta.')
    if (text.trim().length < 5) return setError('Cuéntenos qué ve en el cultivo, con al menos 5 letras.')
    setBusy(true)
    setError(null)
    try {
      setConsultation(await askAssistant(plantingId, text.trim()))
    } catch (e) {
      setError(e.message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <DetailPage title="Consultar" subtitle="Describa lo que ve en su cultivo">
      <Loadable state={plantings} skeleton={<SkeletonList height={120} />}>
        {(list) =>
          list.length === 0 ? (
            <Card><EmptyState icon={MessageCircleQuestion} title="Sin siembras" message="Registre una siembra para consultar sobre ella." /></Card>
          ) : (
            <>
              <Card>
                <form onSubmit={ask} noValidate>
                  <SelectField label="Siembra" name="plantingId" value={plantingId} placeholder="Elija la siembra" onChange={setPlantingId} options={list.map((p) => [p.id, `${app.cropName(p.cropId)} - ${p.areaHa} ha`])} />
                  <Field label="Qué está pasando" name="text" multiline maxLength={1000} value={text} onChange={(e) => setText(e.target.value)} hint="Por ejemplo: manchas amarillas en las hojas nuevas" />
                  {error && <div className="form-error" role="alert"><span>{error}</span></div>}
                  <Button type="submit" wide icon={Send} busy={busy}>Consultar</Button>
                </form>
              </Card>
              {consultation?.answer && (
                <>
                  <div style={{ height: 12 }} />
                  <AnswerView answer={consultation.answer} />
                </>
              )}
              <div style={{ height: 12 }} />
              <RowGroup>
                <ListRow to="/mas/asistente/historial" icon={History} title="Historial de consultas" subtitle="Sus preguntas anteriores" />
                {access.seesAssistantQuality && <ListRow to="/mas/asistente/calidad" icon={MessageCircleQuestion} title="Calidad del asistente" subtitle="Qué tanto le sirvió a la gente" />}
              </RowGroup>
            </>
          )
        }
      </Loadable>
    </DetailPage>
  )
}
