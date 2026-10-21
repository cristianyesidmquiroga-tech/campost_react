import { useState } from 'react'
import { FilterBar } from '../../components/ui'
import { DetailPage } from '../../components/layout/Page'
import { CostsTab } from './CostsTab'
import { CropsTab } from './CropsTab'
import { HarvestsTab } from './HarvestsTab'
import { PlantingsTab } from './PlantingsTab'
import { ProducersTab } from './ProducersTab'
import { SummaryTab } from './SummaryTab'
import { ZonesTab } from './ZonesTab'

const TABS = [
  { label: 'Resumen', Tab: SummaryTab },
  { label: 'Cultivos', Tab: CropsTab },
  { label: 'Costos', Tab: CostsTab },
  { label: 'Zonas', Tab: ZonesTab },
  { label: 'Producción', Tab: HarvestsTab },
  { label: 'Siembras', Tab: PlantingsTab },
  { label: 'Productores', Tab: ProducersTab },
]

export function PanelPage() {
  const [selected, setSelected] = useState(0)
  const { Tab } = TABS[selected]
  return (
    <DetailPage title="Panel de control" subtitle="Toda la aplicación en un solo lugar">
      <FilterBar labels={TABS.map((t) => t.label)} selected={selected} onSelect={setSelected} />
      <div style={{ height: 12 }} />
      <Tab />
    </DetailPage>
  )
}
