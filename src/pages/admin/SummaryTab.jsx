import { useState } from 'react'
import { Activity, AlertTriangle, Landmark, MapPin, Sprout, TrendingDown, TrendingUp, Users, Wheat } from 'lucide-react'
import { useAsync } from '../../hooks/useAsync'
import { adminGrowth, adminSummary } from '../../services/admin'
import { Card, FilterBar, KpiGrid, KpiTile, Loadable, RowGroup, ListRow, SectionTitle, SkeletonList } from '../../components/ui'
import { ROLE_LABELS } from '../../lib/access'
import { formatCop, formatHa, formatNumber, humanize } from '../../lib/format'
import { BarList } from './BarList'

const METRICS = [
  { label: 'Usuarios', key: 'users' },
  { label: 'Siembras', key: 'plantings' },
  { label: 'Cosechas', key: 'harvests' },
  { label: 'Gastos', key: 'expenses', money: true },
  { label: 'Ingresos', key: 'income', money: true },
]

function Growth() {
  const [metric, setMetric] = useState(0)
  const state = useAsync(() => adminGrowth(12), [])
  const { key, money } = METRICS[metric]
  return (
    <>
      <FilterBar labels={METRICS.map((m) => m.label)} selected={metric} onSelect={setMetric} />
      <div style={{ height: 12 }} />
      <Loadable state={state} skeleton={<SkeletonList count={1} height={160} />}>
        {(points) => (
          <Card>
            <BarList rows={points.map((p) => ({ label: p.month, value: p[key], text: money ? formatCop(p[key]) : formatNumber(p[key]) }))} />
          </Card>
        )}
      </Loadable>
    </>
  )
}

export function SummaryTab() {
  const state = useAsync(adminSummary, [])
  return (
    <Loadable state={state} skeleton={<SkeletonList height={110} />}>
      {(s) => (
        <>
          <KpiGrid cols={2} colsWide={4}>
            <KpiTile label="Usuarios" value={formatNumber(s.users)} icon={Users} caption={`${formatNumber(s.activeUsers)} activos`} />
            <KpiTile label="Fincas" value={formatNumber(s.farms)} icon={MapPin} caption={formatHa(s.farmAreaHa)} />
            <KpiTile label="Siembras" value={formatNumber(s.plantings)} icon={Sprout} caption={`${formatNumber(s.openCycles)} ciclos abiertos`} />
            <KpiTile label="Cosechas" value={formatNumber(s.harvests)} icon={Wheat} caption={`${formatNumber(s.closedCycles)} ciclos cerrados`} />
          </KpiGrid>
          <SectionTitle>Dinero de toda la aplicación</SectionTitle>
          <KpiGrid cols={2} colsWide={4}>
            <KpiTile label="Gastos" value={formatCop(s.expenses)} icon={TrendingDown} tone="danger" caption="sin contar anulados" />
            <KpiTile label="Ingresos" value={formatCop(s.income)} icon={TrendingUp} caption="sin contar anulados" />
            <KpiTile label="Utilidad" value={formatCop(s.profit)} icon={Landmark} tone={s.profit >= 0 ? 'ok' : 'danger'} caption="ingresos menos gastos" />
            <KpiTile label="Pérdida por eventos" value={formatCop(s.estimatedLoss)} icon={AlertTriangle} tone="warn" caption={`${formatNumber(s.events)} eventos adversos`} />
          </KpiGrid>
          <SectionTitle>Usuarios por rol</SectionTitle>
          <RowGroup>
            {s.usersByRole.map(([role, count]) => (
              <ListRow key={role} icon={Users} title={ROLE_LABELS[role] ?? humanize(role)} trailing={<span className="mono-md">{formatNumber(count)}</span>} />
            ))}
          </RowGroup>
          <SectionTitle>Siembras por estado</SectionTitle>
          <RowGroup>
            {s.plantingsByState.map(([estado, count]) => (
              <ListRow key={estado} icon={Activity} title={humanize(estado)} trailing={<span className="mono-md">{formatNumber(count)}</span>} />
            ))}
          </RowGroup>
          <SectionTitle caption="Últimos 12 meses">Crecimiento</SectionTitle>
          <Growth />
        </>
      )}
    </Loadable>
  )
}
