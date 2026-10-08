import { useState } from 'react'
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { Bell, CircleUserRound, Home, Leaf, Menu, Plus, Sprout, Wallet } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { useApp } from '../../context/AppContext'
import { useWide } from '../../hooks/useMedia'
import { QuickRegister } from '../../pages/home/QuickRegister'
import { FarmSelector } from './FarmSelector'
import { Fab } from './Fab'

function destinations(access) {
  return [
    { to: '/inicio', label: 'Inicio', icon: Home },
    access.seesProduction && { to: '/produccion', label: 'Producción', icon: Sprout },
    access.seesMoney && { to: '/dinero', label: 'Dinero', icon: Wallet },
    { to: '/mas', label: 'Más', icon: Menu },
  ].filter(Boolean)
}

function Brand() {
  return (
    <div className="topbar__brand">
      <span className="icon-badge" style={{ '--size': '36px', background: 'var(--secondary-container)', color: 'var(--primary)' }}>
        <Leaf size={22} aria-hidden />
      </span>
      <strong>AgroGestión</strong>
    </div>
  )
}

function TopBar({ wide }) {
  const navigate = useNavigate()
  return (
    <header className="topbar">
      {wide ? (
        <div className="topbar__farm">
          <FarmSelector compact />
        </div>
      ) : (
        <Brand />
      )}
      {wide && <div className="topbar__spacer" />}
      <button type="button" className="btn btn--icon" aria-label="Novedades de mi región" onClick={() => navigate('/mas/novedades')}>
        <Bell size={24} />
      </button>
      <button type="button" className="btn btn--icon" aria-label="Mi cuenta" onClick={() => navigate('/mas/cuenta')}>
        <CircleUserRound size={24} />
      </button>
    </header>
  )
}

function BottomBar({ items }) {
  return (
    <nav className="bottombar" aria-label="Principal">
      {items.map(({ to, label, icon: Icon }) => (
        <NavLink key={to} to={to} className="bottombar__item">
          <span className="bottombar__pill">
            <Icon size={24} aria-hidden />
            <span>{label}</span>
          </span>
        </NavLink>
      ))}
    </nav>
  )
}

function Sidebar({ items }) {
  const { session, access } = useAuth()
  return (
    <aside className="sidebar">
      <div className="sidebar__brand">
        <span className="icon-badge" style={{ '--size': '36px', background: 'var(--secondary-container)', color: 'var(--primary)' }}>
          <Leaf size={22} aria-hidden />
        </span>
        <strong>AgroGestión</strong>
      </div>
      <nav aria-label="Principal">
        {items.map(({ to, label, icon: Icon }) => (
          <NavLink key={to} to={to} className="sidebar__item">
            <Icon size={22} aria-hidden />
            {label}
          </NavLink>
        ))}
      </nav>
      <div className="sidebar__user">
        <span className="avatar">{(session.name[0] ?? '?').toUpperCase()}</span>
        <span className="grow">
          <strong className="clamp-1">{session.name}</strong>
          <small>{access.roleLabel}</small>
        </span>
      </div>
    </aside>
  )
}

export function AppShell() {
  const { access } = useAuth()
  const app = useApp()
  const location = useLocation()
  const [quick, setQuick] = useState(false)
  const items = destinations(access)
  const segments = location.pathname.split('/').filter(Boolean)
  const isDetail = segments.length > 1
  const isTab = segments.length === 1
  const showFab = access.canQuickRegister && isTab && segments[0] !== 'mas'
  const wide = useWide()

  return (
    <div className="app">
      {wide && <Sidebar items={items} />}
      <div className="main">
        {isTab && <TopBar wide={wide} />}
        {isDetail && wide && (
          <header className="topbar">
            <div className="topbar__farm"><FarmSelector compact /></div>
          </header>
        )}
        <Outlet key={`${location.pathname}-${app.revision}`} />
      </div>
      {!wide && isTab && <BottomBar items={items} />}
      {showFab && (
        <Fab icon={Plus} onClick={() => setQuick(true)}>Registrar</Fab>
      )}
      {quick && <QuickRegister onClose={() => setQuick(false)} />}
    </div>
  )
}
