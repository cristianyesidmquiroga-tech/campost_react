import { useLayoutEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { ChevronRight } from 'lucide-react'

export function Card({ children, to, onClick, accent, tone, flat, flush, className = '', style, ...rest }) {
  const classes = [
    'card',
    flat && 'card--flat',
    tone && `card--${tone}`,
    flush && 'card--flush',
    accent && 'card--accent',
    (to || onClick) && 'card--interactive',
    className,
  ]
    .filter(Boolean)
    .join(' ')
  const css = accent ? { '--accent': accent, ...style } : style
  if (to) return <Link to={to} className={classes} style={css} {...rest}>{children}</Link>
  if (onClick) return <button type="button" onClick={onClick} className={classes} style={css} {...rest}>{children}</button>
  return <div className={classes} style={css} {...rest}>{children}</div>
}

export function IconBadge({ icon: Icon, tone, size = 40, circle }) {
  const classes = ['icon-badge', circle && 'icon-badge--circle', tone && `icon-badge--${tone}`].filter(Boolean).join(' ')
  return (
    <span className={classes} style={{ '--size': `${size}px` }} aria-hidden>
      <Icon size={Math.round(size * 0.5)} />
    </span>
  )
}

export function FitText({ children, className = '' }) {
  const box = useRef(null)
  const text = useRef(null)
  useLayoutEffect(() => {
    const outer = box.current
    const inner = text.current
    if (!outer || !inner) return undefined
    const fit = () => {
      inner.style.transform = ''
      const available = outer.clientWidth
      const needed = inner.scrollWidth
      if (available > 0 && needed > available) inner.style.transform = `scale(${available / needed})`
    }
    fit()
    document.fonts?.ready.then(fit)
    if (typeof ResizeObserver === 'undefined') return undefined
    const observer = new ResizeObserver(fit)
    observer.observe(outer)
    return () => observer.disconnect()
  }, [children])
  return (
    <span ref={box} className="fit-box">
      <span ref={text} className={`fit ${className}`}>{children}</span>
    </span>
  )
}

export function KpiTile({ label, value, icon, caption, prefix, tone = 'ok' }) {
  return (
    <Card className="kpi">
      <div className="kpi__head">
        <span className="body-sm kpi__label clamp-2">{label}</span>
        <IconBadge icon={icon} tone={tone} size={28} circle />
      </div>
      <div className="kpi__value">
        <FitText className="mono-xl">
          {prefix && <span className="mono-sm kpi__prefix">{prefix}</span>}
          {value}
        </FitText>
      </div>
      <span className="body-sm kpi__caption clamp-2">{caption ?? ' '}</span>
    </Card>
  )
}

export function KpiGrid({ children, cols = 2, colsWide = 4 }) {
  return (
    <div className="kpi-grid" style={{ '--cols': cols, '--cols-wide': colsWide }}>
      {children}
    </div>
  )
}

export function InfoRow({ label, value, mono, icon: Icon }) {
  return (
    <div className="info-row">
      {Icon && <Icon size={18} aria-hidden />}
      <span className="body-sm info-row__label">{label}</span>
      <span className={`info-row__value ${mono ? 'mono-md' : 'label-md'}`}>{value}</span>
    </div>
  )
}

export function InfoList({ children }) {
  const items = Array.isArray(children) ? children.filter(Boolean) : [children]
  return (
    <Card>
      {items.map((child, i) => (
        <div key={i}>
          {i > 0 && <hr className="divider" />}
          {child}
        </div>
      ))}
    </Card>
  )
}

export function ListRow({ icon, iconTone, title, subtitle, trailing, to, onClick, titleLines = 1 }) {
  const body = (
    <>
      {icon && <IconBadge icon={icon} tone={iconTone} />}
      <div className="list-row__body">
        <div className={`label-md ${titleLines > 1 ? 'clamp-2' : 'clamp-1'}`}>{title}</div>
        {subtitle && <div className={`body-sm ${typeof subtitle === 'string' ? 'clamp-2' : ''}`}>{subtitle}</div>}
      </div>
      {(trailing || to || onClick) && (
        <div className="list-row__trail">
          {trailing}
          {(to || onClick) && <ChevronRight size={20} className="chevron" aria-hidden />}
        </div>
      )}
    </>
  )
  if (to) return <Link to={to} className="list-row list-row--link">{body}</Link>
  if (onClick) return <button type="button" onClick={onClick} className="list-row list-row--link">{body}</button>
  return <div className="list-row">{body}</div>
}

export function RowGroup({ children }) {
  return <Card flush className="row-group">{children}</Card>
}

export function Amount({ children, tone }) {
  return <span className={`amount ${tone ? `amount--${tone}` : ''}`}>{children}</span>
}

export function ProgressLine({ value, height = 8, color }) {
  const percent = Math.round(Math.min(Math.max(value, 0), 1) * 100)
  return (
    <div className="progress" style={{ '--h': `${height}px`, '--bar': color }} role="progressbar" aria-valuenow={percent} aria-valuemin={0} aria-valuemax={100}>
      <div className="progress__bar" style={{ width: `${percent}%` }} />
    </div>
  )
}

export function SectionTitle({ children, caption, trailing }) {
  return (
    <div className="section-title">
      <div className="section-title__text">
        <h2 className="clamp-2">{children}</h2>
        {caption && <p className="body-sm clamp-2">{caption}</p>}
      </div>
      {trailing}
    </div>
  )
}

export function Note({ icon: Icon, children, tone = 'tint' }) {
  return (
    <Card tone={tone} flat>
      <div className="note">
        <Icon size={20} aria-hidden />
        <p className="body-sm">{children}</p>
      </div>
    </Card>
  )
}
