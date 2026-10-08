import { CloudOff } from 'lucide-react'
import { IconBadge } from './Cards'
import { Card } from './Cards'

export function EmptyState({ icon, title, message, actionLabel, onAction }) {
  return (
    <div className="empty">
      <IconBadge icon={icon} size={64} circle />
      <h3 className="headline-md">{title}</h3>
      {message && <p className="empty__message">{message}</p>}
      {actionLabel && onAction && (
        <button type="button" className="btn" onClick={onAction}>{actionLabel}</button>
      )}
    </div>
  )
}

export function ErrorState({ error, onRetry }) {
  return (
    <div role="alert">
      <EmptyState
        icon={CloudOff}
        title="No pudimos cargar esto"
        message={error?.message ?? 'Intente de nuevo en un momento.'}
        actionLabel={onRetry ? 'Reintentar' : undefined}
        onAction={onRetry}
      />
    </div>
  )
}

export function Skeleton({ height = 16, width, radius = 8 }) {
  return <span className="skeleton" style={{ display: 'block', height, width, borderRadius: radius }} aria-hidden />
}

export function SkeletonList({ count = 3, height = 88 }) {
  return (
    <div role="status" aria-label="Cargando">
      {Array.from({ length: count }, (_, i) => (
        <Card key={i} className="skeleton-card" style={{ minHeight: height }}>
          <Skeleton height={40} width={40} radius={12} />
          <span className="grow stack gap-8">
            <Skeleton height={14} />
            <Skeleton height={12} width={140} />
          </span>
        </Card>
      ))}
    </div>
  )
}

export function Loadable({ state, skeleton, children }) {
  if (state.loading && !state.data) return skeleton ?? <SkeletonList />
  if (state.error) return <ErrorState error={state.error} onRetry={state.retry} />
  return children(state.data)
}
