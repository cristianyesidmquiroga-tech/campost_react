import { useState } from 'react'
import { Wheat } from 'lucide-react'
import { useAsync } from '../../hooks/useAsync'
import { adminHarvests } from '../../services/admin'
import { Card, DateField, EmptyState, ListRow, Loadable, RowGroup, SkeletonList } from '../../components/ui'
import { zoneName } from '../../lib/dane'
import { formatDate, formatNumber, plural } from '../../lib/format'
import { CropFilter, ZoneFilter } from './Filters'
import { Pager } from './Pager'

const SIZE = 20

export function HarvestsTab() {
  const [filters, setFilters] = useState({ cropId: null, zone: null, from: '', to: '' })
  const [skip, setSkip] = useState(0)
  const set = (key) => (value) => {
    setFilters((f) => ({ ...f, [key]: value }))
    setSkip(0)
  }
  const state = useAsync(
    () => adminHarvests({ cropId: filters.cropId ?? undefined, zone: filters.zone ?? undefined, from: filters.from || undefined, to: filters.to || undefined, skip, limit: SIZE }),
    [filters, skip],
  )
  return (
    <>
      <CropFilter value={filters.cropId} onChange={set('cropId')} />
      <ZoneFilter value={filters.zone} onChange={set('zone')} />
      <DateField label="Desde" value={filters.from} onChange={set('from')} />
      <DateField label="Hasta" value={filters.to} onChange={set('to')} />
      <div style={{ height: 12 }} />
      <Loadable state={state} skeleton={<SkeletonList height={72} />}>
        {(page) =>
          page.items.length === 0 ? (
            <Card><EmptyState icon={Wheat} title="Sin cosechas" message="No hay cosechas que coincidan con los filtros." /></Card>
          ) : (
            <>
              <p className="body-sm">{plural(page.total, 'cosecha', 'cosechas')}, de la más reciente a la más antigua</p>
              <RowGroup>
                {page.items.map((h) => (
                  <ListRow
                    key={h.id}
                    icon={Wheat}
                    title={`${h.crop} · ${formatNumber(h.amount, 1)} ${h.unit}`}
                    titleLines={2}
                    subtitle={`${formatDate(h.date)} · ${h.farm} · ${zoneName(h.zone)} · ${h.farmer ?? 'Sin dato'}${h.quality ? ` · calidad ${h.quality}` : ''}`}
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
