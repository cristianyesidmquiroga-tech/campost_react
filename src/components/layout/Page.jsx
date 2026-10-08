import { useNavigate } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { Fab } from './Fab'

export function Page({ children, compact }) {
  return <main className={`page ${compact ? 'page--compact' : ''}`}>{children}</main>
}

export const Gap = ({ size }) => <div className={`gap ${size ? `gap--${size}` : ''}`} />

export function DetailPage({ title, subtitle, children, fab, compact = true }) {
  const navigate = useNavigate()
  return (
    <>
      <header className="detail-header">
        <button type="button" className="btn btn--icon" aria-label="Volver" onClick={() => navigate(-1)}>
          <ArrowLeft size={24} />
        </button>
        <div className="detail-header__text">
          <h1 className="clamp-1">{title}</h1>
          {subtitle && <p className="body-sm clamp-1">{subtitle}</p>}
        </div>
      </header>
      <Page compact={compact && !fab}>{children}</Page>
      {fab && <Fab detail icon={fab.icon} onClick={fab.onClick}>{fab.label}</Fab>}
    </>
  )
}
