import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowDown, ArrowRight, ArrowUp, BarChart3, Ban, Receipt, Truck, Users, Wallet, PieChart } from 'lucide-react'
import { useApp } from '../../context/AppContext'
import { useAuth } from '../../context/AuthContext'
import { useAsync } from '../../hooks/useAsync'
import { cashFlow, expensesByCategory, listMovements } from '../../services/money'
import { Amount, Card, EmptyState, FilterBar, IconBadge, ListRow, Loadable, RowGroup, SectionTitle, SkeletonList, StatusPill } from '../../components/ui'
import { InPageFarm } from '../../components/layout/FarmSelector'
import { Gap, Page } from '../../components/layout/Page'
import { formatCop, formatNumber } from '../../lib/format'

const PALETTE = ['#005138', '#2f6952', '#904d00', '#6f7a73', '#1d4ed8', '#ba1a1a']

export function MovementRow({ movement, to }) {
  const m = movement
  const tone = m.cancelled ? 'muted' : m.isIncome ? 'pos' : 'neg'
  const icon = m.cancelled ? Ban : m.isIncome ? Truck : Users
  const iconTone = m.cancelled ? undefined : m.isIncome ? 'ok' : 'danger'
  return (
    <ListRow
      to={to}
      icon={icon}
      iconTone={iconTone}
      title={<span className={m.cancelled ? 'line-through' : ''}>{m.category}</span>}
      titleLines={2}
      subtitle={m.cancelled ? <StatusPill>Anulado</StatusPill> : m.isIncome ? 'Ingreso' : 'Gasto'}
      trailing={<Amount tone={tone}>{m.isIncome ? '+' : '-'} {formatCop(m.amount)}</Amount>}
    />
  )
}

function FlowRow({ label, amount, income }) {
  return (
    <div className="flow-row">
      <IconBadge icon={income ? ArrowUp : ArrowDown} tone={income ? 'ok' : 'danger'} size={36} circle />
      <span className="label-md grow clamp-2">{label}</span>
      <Amount tone={income ? 'pos' : 'neg'}>{formatCop(amount)}</Amount>
    </div>
  )
}

export function MoneyPage() {
  const app = useApp()
  const { access } = useAuth()
  const farm = app.activeFarm
  const [period, setPeriod] = useState(0)
  const state = useAsync(async () => {
    if (!farm) return null
    const month = new Date()
    if (period === 1) month.setMonth(month.getMonth() - 1)
    const [flow, movements] = await Promise.all([cashFlow(farm.id, month), listMovements(farm.id)])
    return { flow, movements }
  }, [farm?.id, period, app.revision])

  if (!farm && !app.farmsLoading) {
    return (
      <Page>
        <InPageFarm />
        <Card><EmptyState icon={Wallet} title="Registre una finca para ver su dinero" message="Los gastos e ingresos se llevan por finca." /></Card>
      </Page>
    )
  }

  return (
    <Page>
      <InPageFarm />
      <h1 className="headline-md">Dinero y finanzas</h1>
      <Gap size="sm" />
      <FilterBar labels={['Este mes', 'Mes pasado']} selected={period} onSelect={setPeriod} />
      <Gap size="sm" />
      <Loadable state={state} skeleton={<SkeletonList height={160} />}>
        {(data) => {
          if (!data) return null
          const { flow, movements } = data
          const categories = expensesByCategory(movements)
          const total = categories.reduce((s, [, v]) => s + v, 0)
          const recent = [...movements].reverse().slice(0, 5)
          return (
            <>
              <Card>
                {access.seesProfit && (
                  <>
                    <div className="spread">
                      <span className="label-md grow" style={{ letterSpacing: '0.06em' }}>SALDO NETO DISPONIBLE</span>
                      <StatusPill tone={flow.balance >= 0 ? 'ok' : 'danger'}>{flow.balance >= 0 ? 'Flujo positivo' : 'Flujo negativo'}</StatusPill>
                    </div>
                    <div className="hero-amount" style={{ marginTop: 8 }}>
                      <span className="mono-xl">{formatCop(flow.balance)}</span>
                      <span className="mono-sm">COP</span>
                    </div>
                    <div style={{ height: 12 }} />
                    <hr className="divider" />
                    <div style={{ height: 12 }} />
                  </>
                )}
                <FlowRow label="Ingresos del mes" amount={flow.income} income />
                <FlowRow label="Gastos del mes" amount={flow.expenses} income={false} />
                {access.seesProfit && flow.margin !== null && (
                  <div className="row gap-8" style={{ marginTop: 12 }}>
                    <BarChart3 size={20} color="var(--primary-container)" aria-hidden />
                    <span className="body-sm grow" style={{ color: 'var(--on-surface)' }}>Margen operativo estimado</span>
                    <span className="mono-md" style={{ color: 'var(--primary-container)' }}>{formatNumber(flow.margin, 1)}%</span>
                  </div>
                )}
              </Card>
              <SectionTitle>Distribución del gasto</SectionTitle>
              <Card>
                {categories.length === 0 ? (
                  <EmptyState icon={PieChart} title="Aún no hay gastos" message="Cuando registre gastos verá aquí en qué se va el dinero." />
                ) : (
                  <>
                    <p className="body-sm">Total registrado: {formatCop(total)}</p>
                    <div className="bar-stack" style={{ margin: '12px 0' }} role="img" aria-label="Distribución del gasto por categoría">
                      {categories.map(([name, value], i) => (
                        <span key={name} style={{ flex: Math.max(Math.round((value / total) * 1000), 1), background: PALETTE[i % PALETTE.length] }} />
                      ))}
                    </div>
                    {categories.map(([name, value], i) => (
                      <div className="cat-row" key={name}>
                        <span className="cat-dot" style={{ background: PALETTE[i % PALETTE.length] }} />
                        <div className="grow">
                          <div className="label-md clamp-2">{name}</div>
                          <div className="body-sm">{formatNumber((value / total) * 100)}% del gasto</div>
                        </div>
                        <span className="mono-sm" style={{ whiteSpace: 'nowrap' }}>{formatCop(value)}</span>
                      </div>
                    ))}
                  </>
                )}
              </Card>
              <SectionTitle trailing={<Link to="/dinero/movimientos" className="btn btn--text">Ver todos <ArrowRight size={16} aria-hidden /></Link>}>
                Últimos movimientos
              </SectionTitle>
              {recent.length === 0 ? (
                <Card><EmptyState icon={Receipt} title="Sin movimientos" message="Registre un gasto o un ingreso con el botón Registrar." /></Card>
              ) : (
                <RowGroup>
                  {recent.map((m) => <MovementRow key={m.id} movement={m} to={`/dinero/movimientos/${m.id}`} />)}
                </RowGroup>
              )}
            </>
          )
        }}
      </Loadable>
    </Page>
  )
}
