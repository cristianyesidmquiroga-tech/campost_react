import { useState } from 'react'
import { Archive, Package, Plus, Search, TriangleAlert, Warehouse } from 'lucide-react'
import { useApp } from '../../context/AppContext'
import { useAuth } from '../../context/AuthContext'
import { useAsync } from '../../hooks/useAsync'
import { createSupply, listSupplies } from '../../services/inventory'
import { Card, EmptyState, Field, FormSheet, IconBadge, KpiGrid, KpiTile, Loadable, SelectField, SkeletonList, StatusPill, required } from '../../components/ui'
import { DetailPage, Gap } from '../../components/layout/Page'
import { formatCop, formatNumber } from '../../lib/format'

export const UNITS = [['bulto', 'Bulto'], ['kilo', 'Kilo'], ['litro', 'Litro'], ['unidad', 'Unidad'], ['galón', 'Galón']]

function SupplyForm({ farm, onClose }) {
  const [name, setName] = useState('')
  const [unit, setUnit] = useState('bulto')
  return (
    <FormSheet
      title="Nuevo insumo"
      subtitle={farm.name}
      submitLabel="Guardar insumo"
      onClose={onClose}
      validate={() => ({ name: required(name) })}
      onSubmit={() => createSupply(farm.id, { name: name.trim(), unit })}
    >
      <Field label="Nombre del insumo" name="name" maxLength={150} value={name} onChange={(e) => setName(e.target.value)} />
      <SelectField label="Unidad" name="unit" value={unit} onChange={(v) => setUnit(v ?? 'bulto')} options={UNITS} />
    </FormSheet>
  )
}

export const stockText = (supply) => `${formatNumber(supply.stock, supply.stock % 1 === 0 ? 0 : 1)} ${supply.unit}`

export function InventoryPage() {
  const app = useApp()
  const { access } = useAuth()
  const farm = app.activeFarm
  const [query, setQuery] = useState('')
  const [creating, setCreating] = useState(false)
  const state = useAsync(() => (farm ? listSupplies(farm.id) : Promise.resolve([])), [farm?.id, app.revision])

  return (
    <DetailPage
      title="Insumos e inventario"
      subtitle={farm?.name ?? 'Sin finca activa'}
      fab={access.managesInventory && farm ? { icon: Plus, label: 'Nuevo insumo', onClick: () => setCreating(true) } : undefined}
    >
      {!farm ? (
        <Card><EmptyState icon={Package} title="Sin finca activa" message="Registre una finca para llevar su inventario." /></Card>
      ) : (
        <Loadable state={state} skeleton={<SkeletonList />}>
          {(all) => {
            const shown = all.filter((s) => s.name.toLowerCase().includes(query.toLowerCase()))
            const value = all.reduce((s, i) => s + i.value, 0)
            const empty = all.filter((s) => s.stock <= 0).length
            return (
              <>
                <KpiGrid cols={2} colsWide={2}>
                  <KpiTile label="Valor estimado de la bodega" value={formatNumber(Math.round(value))} prefix="$" icon={Warehouse} tone="warn" caption="pesos (COP)" />
                  <KpiTile label="Insumos sin existencias" value={formatNumber(empty)} icon={TriangleAlert} tone={empty > 0 ? 'danger' : 'ok'} caption={`de ${formatNumber(all.length)} registrados`} />
                </KpiGrid>
                <Gap />
                <div className="field" style={{ marginBottom: 16 }}>
                  <div className="field__wrap field__wrap--icon">
                    <Search size={20} aria-hidden />
                    <input className="field__control" placeholder="Buscar insumo" aria-label="Buscar insumo" value={query} onChange={(e) => setQuery(e.target.value)} />
                  </div>
                </div>
                {shown.length === 0 ? (
                  <Card>
                    <EmptyState
                      icon={Archive}
                      title={all.length === 0 ? 'Aún no hay insumos' : 'No hay insumos con ese nombre'}
                      message={all.length === 0 ? 'Registre fertilizantes, semillas o herramientas para llevar sus existencias.' : undefined}
                    />
                  </Card>
                ) : (
                  <div className="stack gap-12">
                    {shown.map((supply) => {
                      const none = supply.stock <= 0
                      return (
                        <Card key={supply.id} to={`/mas/insumos/${supply.id}`}>
                          <div className="row gap-12">
                            <IconBadge icon={Archive} tone={none ? 'danger' : undefined} />
                            <h3 className="headline-md grow clamp-2" style={{ fontSize: 18 }}>{supply.name}</h3>
                            <StatusPill tone={none ? 'danger' : 'ok'}>{none ? 'Sin existencias' : 'Disponible'}</StatusPill>
                          </div>
                          <div className="fact-box" style={{ marginTop: 12 }}>
                            <div><div className="mono-sm fit-ellipsis" style={{ color: 'var(--on-surface)', fontWeight: 700 }}>{stockText(supply)}</div><span className="body-sm" style={{ fontSize: 11 }}>existencia</span></div>
                            <div><div className="mono-sm" style={{ color: 'var(--on-surface)', fontWeight: 700 }}>{supply.averageCost == null ? '—' : formatCop(supply.averageCost)}</div><span className="body-sm" style={{ fontSize: 11 }}>costo promedio</span></div>
                            <div><div className="mono-sm" style={{ color: 'var(--on-surface)', fontWeight: 700 }}>{formatCop(supply.value)}</div><span className="body-sm" style={{ fontSize: 11 }}>valor</span></div>
                          </div>
                        </Card>
                      )
                    })}
                  </div>
                )}
              </>
            )
          }}
        </Loadable>
      )}
      {creating && <SupplyForm farm={farm} onClose={(saved) => { setCreating(false); if (saved) app.markChanged() }} />}
    </DetailPage>
  )
}
