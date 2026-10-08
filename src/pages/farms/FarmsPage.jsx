import { useState } from 'react'
import { ChevronRight, Landmark, Mountain, Plus, Search } from 'lucide-react'
import { useApp } from '../../context/AppContext'
import { useAuth } from '../../context/AuthContext'
import { createFarm } from '../../services/farms'
import { Amount, Card, EmptyState, Field, FormSheet, IconBadge, KpiGrid, KpiTile, SkeletonList, ErrorState, StatusPill, positive, required } from '../../components/ui'
import { DetailPage, Gap } from '../../components/layout/Page'
import { formatHa, formatNumber, parseNumber } from '../../lib/format'

function FarmForm({ onClose }) {
  const [name, setName] = useState('')
  const [area, setArea] = useState('')
  return (
    <FormSheet
      title="Nueva finca"
      submitLabel="Guardar finca"
      onClose={onClose}
      validate={() => ({ name: required(name), area: area.trim() ? positive(area) : null })}
      onSubmit={() => createFarm({ name: name.trim(), areaHa: area.trim() ? parseNumber(area) : null })}
    >
      <Field label="Nombre de la finca" name="name" maxLength={150} value={name} onChange={(e) => setName(e.target.value)} />
      <Field label="Área total en hectáreas (opcional)" name="area" inputMode="decimal" value={area} onChange={(e) => setArea(e.target.value)} />
    </FormSheet>
  )
}

export function FarmsPage() {
  const app = useApp()
  const { access } = useAuth()
  const [query, setQuery] = useState('')
  const [creating, setCreating] = useState(false)
  const farms = app.farms.filter((f) => f.name.toLowerCase().includes(query.toLowerCase()))
  const total = app.farms.reduce((s, f) => s + (f.areaHa ?? 0), 0)

  return (
    <DetailPage title="Mis fincas" subtitle="Fincas y lotes" fab={access.createsFarms ? { icon: Plus, label: 'Nueva finca', onClick: () => setCreating(true) } : undefined}>
      <KpiGrid cols={2} colsWide={2}>
        <KpiTile label="Área registrada" value={formatNumber(total, 1)} icon={Mountain} caption="hectáreas en total" />
        <KpiTile label="Fincas" value={formatNumber(app.farms.length)} icon={Landmark} tone="high" caption="a su cargo" />
      </KpiGrid>
      <Gap />
      <div className="field" style={{ marginBottom: 16 }}>
        <div className="field__wrap field__wrap--icon">
          <Search size={20} aria-hidden />
          <input className="field__control" placeholder="Buscar finca" aria-label="Buscar finca" value={query} onChange={(e) => setQuery(e.target.value)} />
        </div>
      </div>
      {app.farmsLoading && app.farms.length === 0 ? (
        <SkeletonList />
      ) : app.farmsError && app.farms.length === 0 ? (
        <ErrorState error={new Error(app.farmsError)} onRetry={app.loadFarms} />
      ) : farms.length === 0 ? (
        <Card>
          <EmptyState
            icon={Mountain}
            title={query ? 'No hay fincas con ese nombre' : 'Registre su primera finca para empezar'}
            message={query ? undefined : 'Con una finca puede crear lotes, siembras y llevar sus cuentas.'}
            actionLabel={access.createsFarms && !query ? 'Nueva finca' : undefined}
            onAction={() => setCreating(true)}
          />
        </Card>
      ) : (
        <div className="stack gap-12">
          {farms.map((farm) => (
            <Card key={farm.id} to={`/mas/fincas/${farm.id}`}>
              <div className="row gap-12">
                <IconBadge icon={Mountain} />
                <div className="grow">
                  <h3 className="headline-md clamp-1">{farm.name}</h3>
                  <p className="body-sm clamp-1">{farm.municipalityCode ? `Municipio DANE ${farm.municipalityCode}` : 'Ubicación sin registrar'}</p>
                </div>
                <ChevronRight size={20} className="chevron" aria-hidden />
              </div>
              <div style={{ margin: '12px 0' }}>
                <StatusPill tone={farm.id === app.activeFarm?.id ? 'ok' : 'neutral'}>{farm.id === app.activeFarm?.id ? 'Finca activa' : 'Registrada'}</StatusPill>
              </div>
              <div className="flow-row" style={{ marginBottom: 0 }}>
                <span className="body-sm grow">Área total</span>
                <Amount>{farm.areaHa == null ? 'Sin registrar' : formatHa(farm.areaHa)}</Amount>
              </div>
            </Card>
          ))}
        </div>
      )}
      {creating && <FarmForm onClose={(saved) => { setCreating(false); if (saved) app.loadFarms() }} />}
    </DetailPage>
  )
}
