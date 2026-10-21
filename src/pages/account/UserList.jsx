import { useEffect, useState } from 'react'
import { ChevronRight, Search, Users } from 'lucide-react'
import { useAsync } from '../../hooks/useAsync'
import { listUsers } from '../../services/admin'
import { Button, Card, EmptyState, Field, FilterBar, ListRow, Loadable, RowGroup, SkeletonList, StatusPill } from '../../components/ui'
import { ROLE_LABELS } from '../../lib/access'
import { formatDate, plural } from '../../lib/format'

const ROLES = [null, 'admin', 'agricultor', 'contador', 'experto']
const LABELS = ['Todos', ...ROLES.slice(1).map((r) => ROLE_LABELS[r])]
const SIZE = 20

export function UserList() {
  const [filter, setFilter] = useState(0)
  const [query, setQuery] = useState('')
  const [text, setText] = useState('')
  const [skip, setSkip] = useState(0)
  useEffect(() => {
    const timer = setTimeout(() => {
      setText(query.trim())
      setSkip(0)
    }, 300)
    return () => clearTimeout(timer)
  }, [query])
  const state = useAsync(() => listUsers({ text: text || undefined, role: ROLES[filter] ?? undefined, skip, limit: SIZE }), [text, filter, skip])

  return (
    <>
      <Field label="Buscar por nombre o correo" name="q" maxLength={80} icon={Search} value={query} onChange={(e) => setQuery(e.target.value)} />
      <div style={{ height: 12 }} />
      <FilterBar labels={LABELS} selected={filter} onSelect={(i) => { setFilter(i); setSkip(0) }} />
      <div style={{ height: 12 }} />
      <Loadable state={state} skeleton={<SkeletonList height={72} />}>
        {(page) =>
          page.items.length === 0 ? (
            <Card><EmptyState icon={Users} title="Sin usuarios" message="No hay perfiles que coincidan con la búsqueda." /></Card>
          ) : (
            <>
              <p className="body-sm">{plural(page.total, 'perfil', 'perfiles')}</p>
              <RowGroup>
                {page.items.map((u) => (
                  <ListRow
                    key={u.id}
                    to={`/mas/usuarios/${u.id}`}
                    icon={Users}
                    title={u.name}
                    titleLines={2}
                    subtitle={`${u.email} · ${plural(u.farms, 'finca', 'fincas')} · ${plural(u.plantings, 'siembra', 'siembras')}${u.lastAccess ? ` · último acceso ${formatDate(u.lastAccess)}` : ''}`}
                    trailing={
                      <>
                        <StatusPill tone={u.active ? 'ok' : 'neutral'}>{u.active ? ROLE_LABELS[u.role] ?? u.role : 'Inactivo'}</StatusPill>
                        <ChevronRight size={20} className="chevron" aria-hidden />
                      </>
                    }
                  />
                ))}
              </RowGroup>
              {(skip > 0 || page.hasMore) && (
                <div className="row gap-8" style={{ marginTop: 12 }}>
                  <Button variant="outline" disabled={skip === 0} onClick={() => setSkip(Math.max(0, skip - SIZE))}>Anterior</Button>
                  <Button variant="outline" disabled={!page.hasMore} onClick={() => setSkip(skip + SIZE)}>Siguiente</Button>
                </div>
              )}
            </>
          )
        }
      </Loadable>
    </>
  )
}
