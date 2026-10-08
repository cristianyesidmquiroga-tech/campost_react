import { Check } from 'lucide-react'

export function StatusPill({ children, tone = 'neutral', icon: Icon }) {
  return (
    <span className={`pill pill--${tone}`}>
      {Icon && <Icon size={13} aria-hidden />}
      <span>{children}</span>
    </span>
  )
}

export function FilterBar({ labels, counts, selected, onSelect }) {
  return (
    <div className="filter-bar" role="tablist">
      {labels.map((label, i) => (
        <button
          key={label}
          type="button"
          role="tab"
          aria-selected={i === selected}
          className={`chip ${i === selected ? 'chip--active' : ''}`}
          onClick={() => onSelect(i)}
        >
          {i === selected && <Check size={16} aria-hidden />}
          {label}
          {counts?.[i] !== undefined && counts[i] !== null && <span className="chip__count">{counts[i]}</span>}
        </button>
      ))}
    </div>
  )
}

export function SegmentedTabs({ labels, icons, selected, onSelect }) {
  return (
    <div className="segmented" role="tablist">
      {labels.map((label, i) => {
        const Icon = icons?.[i]
        return (
          <button
            key={label}
            type="button"
            role="tab"
            aria-selected={i === selected}
            className={`segmented__item ${i === selected ? 'segmented__item--active' : ''}`}
            onClick={() => onSelect(i)}
          >
            {Icon && <Icon size={18} aria-hidden />}
            <span>{label}</span>
          </button>
        )
      })}
    </div>
  )
}
