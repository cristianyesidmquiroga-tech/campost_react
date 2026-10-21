import { ProgressLine } from '../../components/ui'

export function BarList({ rows }) {
  const max = Math.max(...rows.map((r) => r.value), 0)
  return (
    <div className="stack gap-12">
      {rows.map((r) => (
        <div key={r.label}>
          <div className="spread body-sm">
            <span className="clamp-1">{r.label}</span>
            <span className="mono-sm">{r.text}</span>
          </div>
          <ProgressLine value={max > 0 ? r.value / max : 0} />
        </div>
      ))}
    </div>
  )
}
