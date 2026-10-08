import { Bell, Link as LinkIcon } from 'lucide-react'
import { useAsync } from '../../hooks/useAsync'
import { useToast } from '../../context/ToastContext'
import { listNews } from '../../services/content'
import { Button, Card, EmptyState, Loadable, StatusPill } from '../../components/ui'
import { DetailPage } from '../../components/layout/Page'
import { formatDate } from '../../lib/format'

const daysLeft = (item) => Math.floor((new Date(item.validUntil).getTime() - Date.now()) / 86400000)

function NewsCard({ item }) {
  const show = useToast()
  const days = daysLeft(item)
  const urgent = days <= 1
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(item.link)
      show('Enlace copiado.')
    } catch {
      show('No se pudo copiar el enlace.', true)
    }
  }
  return (
    <Card accent={urgent ? 'var(--tertiary)' : 'var(--primary-container)'}>
      <div className="row gap-8">
        <span className="label-sm grow clamp-1">{item.source}</span>
        <StatusPill tone={urgent ? 'warn' : 'neutral'}>{days <= 0 ? 'Vence hoy' : `Vence en ${days} días`}</StatusPill>
      </div>
      <h3 className="headline-md" style={{ fontSize: 18, margin: '8px 0 6px' }}>{item.title}</h3>
      <p style={{ lineHeight: 1.5 }}>{item.summary}</p>
      <div className="spread" style={{ marginTop: 12 }}>
        <span className="mono-sm">Publicada el {formatDate(item.published)}</span>
        <Button variant="text" icon={LinkIcon} onClick={copy}>Copiar enlace</Button>
      </div>
    </Card>
  )
}

export function NewsPage() {
  const state = useAsync(listNews, [])
  return (
    <DetailPage title="Novedades de mi región" subtitle="Noticias y alertas vigentes">
      <Loadable state={state}>
        {(items) =>
          items.length === 0 ? (
            <Card><EmptyState icon={Bell} title="No hay novedades vigentes" message="Las noticias del sector aparecen aquí mientras estén vigentes." /></Card>
          ) : (
            <div className="stack gap-12">{items.map((item) => <NewsCard key={item.id} item={item} />)}</div>
          )
        }
      </Loadable>
    </DetailPage>
  )
}
