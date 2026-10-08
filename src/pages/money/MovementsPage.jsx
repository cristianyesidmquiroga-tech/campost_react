import { useState } from 'react'
import { ArrowDownLeft, ArrowUpRight, Receipt } from 'lucide-react'
import { useApp } from '../../context/AppContext'
import { useAsync } from '../../hooks/useAsync'
import { listMovements } from '../../services/money'
import { Card, EmptyState, Loadable, RowGroup, SegmentedTabs } from '../../components/ui'
import { DetailPage, Gap } from '../../components/layout/Page'
import { formatCop } from '../../lib/format'
import { MovementRow } from './MoneyPage'

export function MovementsPage() {
  const app = useApp()
  const farm = app.activeFarm
  const [kind, setKind] = useState(0)
  const state = useAsync(() => (farm ? listMovements(farm.id) : Promise.resolve([])), [farm?.id, app.revision])

  return (
    <DetailPage title="Movimientos" subtitle={farm?.name}>
      <Loadable state={state}>
        {(all) => {
          const expenses = all.filter((m) => !m.isIncome)
          const incomes = all.filter((m) => m.isIncome)
          const shown = kind === 0 ? expenses : incomes
          const total = shown.filter((m) => !m.cancelled).reduce((s, m) => s + m.amount, 0)
          return (
            <>
              <SegmentedTabs
                labels={[`Gastos (${expenses.length})`, `Ingresos (${incomes.length})`]}
                icons={[ArrowUpRight, ArrowDownLeft]}
                selected={kind}
                onSelect={setKind}
              />
              <Gap size="sm" />
              <Card tone="tint">
                <div className="spread">
                  <span className="label-md">{kind === 0 ? 'Total de gastos' : 'Total de ingresos'}</span>
                  <span className="mono-xl" style={{ color: kind === 0 ? 'var(--error)' : 'var(--success)' }}>{formatCop(total)}</span>
                </div>
              </Card>
              <Gap />
              {shown.length === 0 ? (
                <Card>
                  <EmptyState icon={Receipt} title={kind === 0 ? 'Aún no hay gastos' : 'Aún no hay ingresos'} message="Use el botón Registrar de la pantalla principal." />
                </Card>
              ) : (
                <RowGroup>
                  {shown.map((m) => <MovementRow key={m.id} movement={m} to={`/dinero/movimientos/${m.id}`} />)}
                </RowGroup>
              )}
            </>
          )
        }}
      </Loadable>
    </DetailPage>
  )
}
