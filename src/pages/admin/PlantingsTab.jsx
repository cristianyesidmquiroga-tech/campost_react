import { useState } from 'react'
import { Sprout } from 'lucide-react'
import { useAsync } from '../../hooks/useAsync'
import { adminPlantings } from '../../services/admin'
import { Card, EmptyState, FilterBar, ListRow, Loadable, RowGroup, SkeletonList, StatusPill } from '../../components/ui'
import { zoneName } from '../../lib/dane'
import { formatDate, formatHa, formatNumber } from '../../lib/format'
import { plantingStatusLabel, plantingStatusTone } from '../../lib/labels'
import { CropFilter, ZoneFilter } from './Filters'
import { Pager } from './Pager'

const SIZE = 20
const STATES = [null, 'planeada', 'en_curso', 'cerrada', 'cancelada']

export function PlantingsTab() {
  const [filters, setFilters] = useState({ cropId: null, zone: null, state: 0 })
  const [skip, setSkip] = useState(0)
  const set = (key) => (value) => {
    setFilters((f) => ({ ...f, [key]: value }))
    setSkip(0)
  }
  const state = useAsync(
    () => adminPlantings({ cropId: filters.cropId ?? undefined, zone: filters.zone ?? undefined, state: STATES[filters.state] ?? undefined, skip, limit: SIZE }),
    [filters, skip],
  )
  return (
    <>
      <FilterBar labels={['Todas', ...STATES.slice(1).map(plantingStatusLabel)]} selected={filters.state} onSelect={set('state')} />
      <div style={{ height: 12 }} />
      <CropFilter value={filters.cropId} onChange={set('cropId')} />
      <ZoneFilter value={filters.zone} onChange={set('zone')} />
      <div style={{ height: 12 }} />
      <Loadable state={state} skeleton={<SkeletonList height={72} />}>
        {(page) =>
          page.items.length === 0 ? (
            <Card><EmptyState icon={Sprout} title="Sin siembras" message="No hay siembras que coincidan con los filtros." /></Card>
          ) : (
            <>
              <p className="body-sm">{formatNumber(page.total)} siembras</p>
              <RowGroup>
                {page.items.map((s) => (
                  <ListRow
                    key={s.id}
                    icon={Sprout}
                    title={`${s.crop} · ${formatHa(s.areaHa)}`}
                    titleLines={2}
                    subtitle={`${s.farm} · ${zoneName(s.zone)} · ${s.farmer ?? 'Sin dato'} · plan ${formatDate(s.plannedDate)}${s.cycleStart ? ` · inició ${formatDate(s.cycleStart)}` : ''}`}
                    trailing={<StatusPill tone={plantingStatusTone(s.state)}>{plantingStatusLabel(s.state)}</StatusPill>}
                  />
                ))}
              </RowGroup>
              <Pager skip={skip} size={SIZE} hasMore={page.hasMore} onChange={setSkip} />
            </>
          )
        }
      </Loadable>
    </>
  )
}
