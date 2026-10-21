import { Landmark, Ruler, TrendingDown, TrendingUp } from 'lucide-react'
import { useAsync } from '../../hooks/useAsync'
import { adminCosts } from '../../services/admin'
import { Card, EmptyState, KpiGrid, KpiTile, Loadable, SectionTitle, SkeletonList } from '../../components/ui'
import { formatCop, formatHa } from '../../lib/format'
import { BarList } from './BarList'

const rows = (list) => list.map((c) => ({ label: `${c.name} (${c.records})`, value: c.total, text: formatCop(c.total) }))

function Categories({ title, list }) {
  return (
    <>
      <SectionTitle>{title}</SectionTitle>
      {list.length === 0 ? (
        <Card><EmptyState icon={Landmark} title="Sin registros" message="Todavía no hay movimientos en esta lista." /></Card>
      ) : (
        <Card><BarList rows={rows(list)} /></Card>
      )}
    </>
  )
}

export function CostsTab() {
  const state = useAsync(adminCosts, [])
  return (
    <Loadable state={state} skeleton={<SkeletonList height={110} />}>
      {(c) => (
        <>
          <KpiGrid cols={2} colsWide={4}>
            <KpiTile label="Gastos" value={formatCop(c.expenses)} icon={TrendingDown} tone="danger" caption="total activo" />
            <KpiTile label="Ingresos" value={formatCop(c.income)} icon={TrendingUp} caption="total activo" />
            <KpiTile label="Gasto por hectárea" value={c.expensePerHa === null ? '—' : formatCop(c.expensePerHa)} icon={Ruler} tone="warn" caption={`sobre ${formatHa(c.plantedHa)} sembradas`} />
            <KpiTile label="Ingreso por hectárea" value={c.incomePerHa === null ? '—' : formatCop(c.incomePerHa)} icon={Ruler} caption={`sobre ${formatHa(c.plantedHa)} sembradas`} />
          </KpiGrid>
          <Categories title="Gastos por categoría" list={c.expensesByCategory} />
          <Categories title="Ingresos por categoría" list={c.incomeByCategory} />
        </>
      )}
    </Loadable>
  )
}
