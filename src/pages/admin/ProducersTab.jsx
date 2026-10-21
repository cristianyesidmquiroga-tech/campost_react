import { Users } from 'lucide-react'
import { useAsync } from '../../hooks/useAsync'
import { adminProducers } from '../../services/admin'
import { Card, EmptyState, ListRow, Loadable, RowGroup, SectionTitle, SkeletonList } from '../../components/ui'
import { formatDate, formatNumber, formatUnits, plural } from '../../lib/format'
import { BarList } from './BarList'

export function ProducersTab() {
  const state = useAsync(adminProducers, [])
  return (
    <Loadable state={state} skeleton={<SkeletonList height={72} />}>
      {(producers) =>
        producers.length === 0 ? (
          <Card><EmptyState icon={Users} title="Sin productores" message="Cuando alguien registre una cosecha aparece aquí." /></Card>
        ) : (
          <>
            <SectionTitle caption="Por número de cosechas registradas">Quién produce más</SectionTitle>
            <Card><BarList rows={producers.map((p) => ({ label: p.name, value: p.harvests, text: formatNumber(p.harvests) }))} /></Card>
            <SectionTitle>Detalle</SectionTitle>
            <RowGroup>
              {producers.map((p) => (
                <ListRow
                  key={p.id}
                  icon={Users}
                  title={p.name}
                  titleLines={2}
                  subtitle={`${plural(p.harvests, 'cosecha', 'cosechas')} · ${formatUnits(p.production)} · ${plural(p.farms, 'finca', 'fincas')}${p.lastHarvest ? ` · última ${formatDate(p.lastHarvest)}` : ''}`}
                />
              ))}
            </RowGroup>
          </>
        )
      }
    </Loadable>
  )
}
