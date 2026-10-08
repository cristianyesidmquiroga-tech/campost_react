import { useState } from 'react'
import { useParams } from 'react-router-dom'
import { ArrowDownLeft, ArrowUpRight, Banknote, Boxes, PackagePlus, PackageMinus, Receipt, Wallet } from 'lucide-react'
import { useApp } from '../../context/AppContext'
import { useAuth } from '../../context/AuthContext'
import { useAsync } from '../../hooks/useAsync'
import { addConsumption, addEntry, listActivities, listSupplies, supplyMovements } from '../../services/inventory'
import { Button, Card, DateField, EmptyState, Field, FormSheet, KpiGrid, KpiTile, ListRow, Loadable, RowGroup, SectionTitle, SelectField, Sheet, SkeletonList, positive } from '../../components/ui'
import { DetailPage, Gap } from '../../components/layout/Page'
import { formatCop, formatDate, formatNumber, isoDate, parseNumber } from '../../lib/format'
import { stockText } from './InventoryPage'

function EntryForm({ farm, supply, onClose }) {
  const [form, setForm] = useState({ quantity: '', cost: '', date: isoDate() })
  const input = (key) => ({ value: form[key], onChange: (e) => setForm((f) => ({ ...f, [key]: e.target.value })) })
  return (
    <FormSheet
      title="Registrar entrada"
      subtitle={`${supply.name} · ${supply.unit}`}
      submitLabel="Guardar entrada"
      onClose={onClose}
      validate={() => ({ quantity: positive(form.quantity) })}
      onSubmit={() => addEntry(farm.id, { supplyId: supply.id, quantity: parseNumber(form.quantity), cost: form.cost.trim() ? parseNumber(form.cost) : 0, date: form.date })}
    >
      <Field label="Cantidad comprada" name="quantity" inputMode="decimal" {...input('quantity')} />
      <Field label="Valor total de la compra (opcional)" name="cost" prefix="COP $" inputMode="decimal" {...input('cost')} />
      <DateField label="Fecha" value={form.date} max={isoDate()} onChange={(date) => setForm((f) => ({ ...f, date }))} />
    </FormSheet>
  )
}

function ConsumptionForm({ farm, supply, onClose }) {
  const activities = useAsync(() => listActivities(farm.id), [farm.id])
  const [form, setForm] = useState({ quantity: '', activityId: null, date: isoDate() })
  return (
    <Loadable state={activities} skeleton={<Sheet title="Registrar consumo" onClose={() => onClose(false)}><p>Cargando…</p></Sheet>}>
      {(list) =>
        list.length === 0 ? (
          <Sheet title="Registrar consumo" onClose={() => onClose(false)}>
            <EmptyState icon={PackageMinus} title="Aún no hay labores" message="El consumo de un insumo se registra contra una labor. Registre primero la labor." />
          </Sheet>
        ) : (
          <FormSheet
            title="Registrar consumo"
            subtitle={`${supply.name} · existencia ${stockText(supply)}`}
            submitLabel="Guardar consumo"
            onClose={onClose}
            validate={() => ({ activityId: form.activityId ? null : 'Elija una labor.', quantity: positive(form.quantity) })}
            onSubmit={() => addConsumption(farm.id, { supplyId: supply.id, quantity: parseNumber(form.quantity), activityId: form.activityId, date: form.date })}
          >
            <SelectField label="Labor donde se usó" name="activityId" value={form.activityId} placeholder="Elija una labor" onChange={(activityId) => setForm((f) => ({ ...f, activityId }))} options={list.map((a) => [a.id, a.name])} />
            <Field label="Cantidad consumida" name="quantity" inputMode="decimal" value={form.quantity} onChange={(e) => setForm((f) => ({ ...f, quantity: e.target.value }))} />
            <DateField label="Fecha" value={form.date} max={isoDate()} onChange={(date) => setForm((f) => ({ ...f, date }))} />
          </FormSheet>
        )
      }
    </Loadable>
  )
}

export function SupplyDetailPage() {
  const { id } = useParams()
  const app = useApp()
  const { access } = useAuth()
  const farm = app.activeFarm
  const [form, setForm] = useState(null)
  const state = useAsync(async () => {
    const supply = (await listSupplies(farm.id)).find((s) => s.id === id)
    return { supply, movements: supply ? await supplyMovements(farm.id, id) : [] }
  }, [farm?.id, id, app.revision])

  return (
    <Loadable state={state} skeleton={<DetailPage title="Insumo"><SkeletonList height={120} /></DetailPage>}>
      {({ supply, movements }) =>
        !supply ? (
          <DetailPage title="Insumo"><Card><EmptyState icon={Boxes} title="No encontramos este insumo" /></Card></DetailPage>
        ) : (
          <DetailPage title={supply.name} subtitle={`Bodega · ${farm.name}`}>
            <KpiGrid cols={2} colsWide={3}>
              <KpiTile label="Existencia" value={formatNumber(supply.stock, supply.stock % 1 === 0 ? 0 : 1)} icon={Boxes} caption={supply.unit} />
              <KpiTile label="Costo promedio" value={supply.averageCost == null ? '—' : formatNumber(Math.round(supply.averageCost))} prefix={supply.averageCost == null ? undefined : '$'} icon={Banknote} tone="warn" caption={`por ${supply.unit}`} />
              <KpiTile label="Valor en bodega" value={formatNumber(Math.round(supply.value))} prefix="$" icon={Wallet} tone="high" caption="pesos (COP)" />
            </KpiGrid>
            {access.managesInventory && (
              <>
                <Gap />
                <div className="btn-stack">
                  <Button wide icon={PackagePlus} onClick={() => setForm('entry')}>Registrar entrada</Button>
                  <Button wide variant="outline" icon={PackageMinus} onClick={() => setForm('consumption')}>Registrar consumo</Button>
                </div>
              </>
            )}
            <SectionTitle>Movimientos de kardex</SectionTitle>
            {movements.length === 0 ? (
              <Card><EmptyState icon={Receipt} title="Sin movimientos" message="Las entradas y los consumos quedan aquí con su fecha." /></Card>
            ) : (
              <RowGroup>
                {movements.map((m) => (
                  <ListRow
                    key={m.id}
                    icon={m.isEntry ? ArrowDownLeft : ArrowUpRight}
                    iconTone={m.isEntry ? 'ok' : 'warn'}
                    title={m.isEntry ? 'Entrada de compra' : 'Consumo en campo'}
                    subtitle={m.isEntry && m.cost > 0 ? `${formatDate(m.date)} · inversión ${formatCop(m.cost)}` : formatDate(m.date)}
                    trailing={<span className="mono-md" style={{ color: m.isEntry ? 'var(--success)' : 'var(--error)', whiteSpace: 'nowrap' }}>{m.isEntry ? '+' : '-'}{formatNumber(m.quantity, m.quantity % 1 === 0 ? 0 : 1)} {supply.unit}</span>}
                  />
                ))}
              </RowGroup>
            )}
            {form === 'entry' && <EntryForm farm={farm} supply={supply} onClose={(saved) => { setForm(null); if (saved) app.markChanged() }} />}
            {form === 'consumption' && <ConsumptionForm farm={farm} supply={supply} onClose={(saved) => { setForm(null); if (saved) app.markChanged() }} />}
          </DetailPage>
        )
      }
    </Loadable>
  )
}
