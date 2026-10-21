import { useState } from 'react'
import { FilterBar } from '../../components/ui'
import { DetailPage } from '../../components/layout/Page'
import { CostsTab } from './CostsTab'
import { SummaryTab } from './SummaryTab'

const TABS = [
  { label: 'Resumen', Tab: SummaryTab },
  { label: 'Costos', Tab: CostsTab },
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
