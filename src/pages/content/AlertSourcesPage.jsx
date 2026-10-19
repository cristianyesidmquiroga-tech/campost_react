import { useState } from 'react'
import { Bell, RefreshCw, Rss } from 'lucide-react'
import { useApp } from '../../context/AppContext'
import { useToast } from '../../context/ToastContext'
import { useAsync } from '../../hooks/useAsync'
import { listAlerts, registerAlertSource, syncAlertSource } from '../../services/alerts'
import { Button, Card, EmptyState, Field, ListRow, Loadable, Note, RowGroup, SectionTitle, SkeletonList } from '../../components/ui'
import { DetailPage } from '../../components/layout/Page'
import { formatDate, humanize } from '../../lib/format'

const URL_OK = /^https:\/\/\S+$/

export function AlertSourcesPage() {
  const app = useApp()
  const show = useToast()
  const farm = app.activeFarm
  const [form, setForm] = useState({ name: '', url: '' })
  const [errors, setErrors] = useState({})
  const [error, setError] = useState(null)
  const [busy, setBusy] = useState(false)
  const [syncing, setSyncing] = useState(null)
  const [sources, setSources] = useState([])
  const alerts = useAsync(() => (farm ? listAlerts(farm.id) : Promise.resolve([])), [farm?.id, app.revision])
  const input = (key) => ({ value: form[key], error: errors[key], onChange: (e) => setForm((f) => ({ ...f, [key]: e.target.value })) })

  const register = async (event) => {
    event.preventDefault()
    const found = {
      name: form.name.trim() ? null : 'Escriba el nombre de la fuente.',
      url: URL_OK.test(form.url.trim()) ? null : 'Escriba una dirección que empiece por https://',
    }
    setErrors(Object.fromEntries(Object.entries(found).filter(([, m]) => m)))
    if (Object.values(found).some(Boolean)) return
    setBusy(true)
    setError(null)
    try {
      const source = await registerAlertSource({ name: form.name.trim(), url: form.url.trim() })
      setSources((list) => [source, ...list])
      setForm({ name: '', url: '' })
    } catch (e) {
      setError(e.message)
    } finally {
      setBusy(false)
    }
  }

  const sync = async (source) => {
    setSyncing(source.id)
    try {
      const found = await syncAlertSource(source.id)
      show(`${found.length} alertas encontradas en ${source.name}.`)
      app.markChanged()
    } catch (e) {
      show(e.message, true)
    } finally {
      setSyncing(null)
    }
  }

  return (
    <DetailPage title="Fuentes y alertas" subtitle="Alertas regionales de fuentes oficiales">
      <Card>
        <form onSubmit={register} noValidate>
          <Field label="Nombre de la fuente" name="name" maxLength={120} {...input('name')} />
          <Field label="Dirección de la fuente" name="url" type="url" maxLength={300} {...input('url')} />
          {error && <div className="form-error" role="alert"><span>{error}</span></div>}
          <Button type="submit" wide icon={Rss} busy={busy}>Registrar fuente</Button>
        </form>
      </Card>
      <Note icon={Bell}>Solo se aceptan direcciones públicas con https. Después de registrar una fuente, sincronícela para traer sus alertas.</Note>
      <SectionTitle>Fuentes registradas en esta sesión</SectionTitle>
      {sources.length === 0 ? (
        <Card><EmptyState icon={Rss} title="Sin fuentes nuevas" message="Las fuentes que registre aparecen aquí para sincronizarlas." /></Card>
      ) : (
        <div className="stack gap-12">
          {sources.map((s) => (
            <Card key={s.id}>
              <ListRow icon={Rss} title={s.name} subtitle={s.url} titleLines={2} />
              <div style={{ marginTop: 8 }}>
                <Button variant="outline" icon={RefreshCw} busy={syncing === s.id} onClick={() => sync(s)}>Sincronizar</Button>
              </div>
            </Card>
          ))}
        </div>
      )}
      <SectionTitle>Alertas vigentes</SectionTitle>
      <Loadable state={alerts} skeleton={<SkeletonList height={72} />}>
        {(items) =>
          items.length === 0 ? (
            <Card><EmptyState icon={Bell} title="Sin alertas vigentes" message="Las alertas sincronizadas para su finca aparecen aquí." /></Card>
          ) : (
            <RowGroup>
              {items.map((a) => (
                <ListRow key={a.id} icon={Bell} title={a.title} titleLines={2} subtitle={`${humanize(a.type)} · hasta el ${formatDate(a.until)}`} />
              ))}
            </RowGroup>
          )
        }
      </Loadable>
    </DetailPage>
  )
}
