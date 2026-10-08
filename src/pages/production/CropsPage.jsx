import { useState } from 'react'
import { ChevronRight, Leaf, Search, SearchX, TreePine, Trees, Wheat } from 'lucide-react'
import { useAsync } from '../../hooks/useAsync'
import { listCrops } from '../../services/production'
import { Card, EmptyState, FilterBar, IconBadge, Loadable, StatusPill } from '../../components/ui'
import { DetailPage, Gap } from '../../components/layout/Page'
import { capitalize, humanize } from '../../lib/format'

const TYPES = [null, 'permanente', 'transitorio', 'semipermanente', 'forestal']
const LABELS = ['Todos', 'Permanentes', 'Transitorios', 'Semipermanentes', 'Forestales']

export const cropIcon = (crop) => ({ transitorio: Wheat, forestal: Trees, permanente: TreePine }[crop.cycleType] ?? Leaf)

export function CropsPage() {
  const state = useAsync(listCrops, [])
  const [filter, setFilter] = useState(0)
  const [query, setQuery] = useState('')

  return (
    <DetailPage title="Catálogo de cultivos" subtitle="El perfil define fases, conteo y alertas">
      <Loadable state={state}>
        {(crops) => {
          const type = TYPES[filter]
          const shown = crops.filter((c) => (!type || c.cycleType === type) && c.name.toLowerCase().includes(query.toLowerCase()))
          return (
            <>
              <div className="field" style={{ marginBottom: 12 }}>
                <div className="field__wrap field__wrap--icon">
                  <Search size={20} aria-hidden />
                  <input className="field__control" placeholder="Buscar cultivo" aria-label="Buscar cultivo" value={query} onChange={(e) => setQuery(e.target.value)} />
                </div>
              </div>
              <FilterBar labels={LABELS} counts={TYPES.map((t) => crops.filter((c) => !t || c.cycleType === t).length)} selected={filter} onSelect={setFilter} />
              <Gap />
              {shown.length === 0 ? (
                <Card><EmptyState icon={SearchX} title="No hay cultivos con ese filtro" message="Pruebe con otro nombre o quite el filtro." /></Card>
              ) : (
                <div className="stack gap-12">
                  {shown.map((crop) => (
                    <Card key={crop.id} to={`/produccion/cultivos/${crop.id}`}>
                      <div className="row gap-12">
                        <IconBadge icon={cropIcon(crop)} />
                        <div className="grow">
                          <h3 className="headline-md clamp-2">{crop.name}</h3>
                          <p className="body-sm clamp-1">{capitalize(crop.group)} · conteo {crop.countUnit === 'planta' ? 'por planta' : 'por área'}</p>
                        </div>
                        <ChevronRight size={20} className="chevron" aria-hidden />
                      </div>
                      <div className="row gap-8" style={{ marginTop: 12 }}>
                        <StatusPill tone="ok">{humanize(crop.cycleType)}</StatusPill>
                        {crop.toValidate && <StatusPill tone="warn">Por validar</StatusPill>}
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </>
          )
        }}
      </Loadable>
    </DetailPage>
  )
}
