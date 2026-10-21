import { Button } from '../../components/ui'

export function Pager({ skip, size, hasMore, onChange }) {
  if (skip === 0 && !hasMore) return null
  return (
    <div className="row gap-8" style={{ marginTop: 12 }}>
      <Button variant="outline" disabled={skip === 0} onClick={() => onChange(Math.max(0, skip - size))}>Anterior</Button>
      <Button variant="outline" disabled={!hasMore} onClick={() => onChange(skip + size)}>Siguiente</Button>
    </div>
  )
}
