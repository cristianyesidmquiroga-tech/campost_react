import { useState } from 'react'
import { useParams } from 'react-router-dom'
import { Boxes, Crop, Ruler, Sprout } from 'lucide-react'
import { useApp } from '../../context/AppContext'
import { useAuth } from '../../context/AuthContext'
import { useAsync } from '../../hooks/useAsync'
import { listLots } from '../../services/farms'
import { listPlantings } from '../../services/production'
import { Button, Card, EmptyState, KpiGrid, KpiTile, ListRow, Loadable, RowGroup, SectionTitle, SkeletonList, StatusPill } from '../../components/ui'
import { DetailPage, Gap } from '../../components/layout/Page'
import { formatHa, formatNumber } from '../../lib/format'
import { methodLabel, plantingStatusLabel, plantingStatusTone } from '../../lib/labels'
import { PlantingForm } from '../production/PlantingForm'
import { WorkForm } from '../home/WorkForms'

export function LotDetailPage() {
  const { farmId, lotId } = useParams()
  const app = useApp()
  const { access } = useAuth()
  const [planning, setPlanning] = useState(false)
  const [working, setWorking] = useState(false)
  const state = useAsync(async () => {
    const lot = (await listLots(farmId)).find((l) => l.id === lotId)
    const plantings = (await listPlantings()).filter((p) => p.lotId === lotId)
    return { lot, plantings }
  }, [farmId, lotId, app.revision])
  const farm = app.farms.find((f) => f.id === farmId)

  return (
    <Loadable state={state} skeleton={<DetailPage title="Lote"><SkeletonList height={120} /></DetailPage>}>
      {({ lot, plantings }) => {
        if (!lot) return <DetailPage title="Lote"><Card><EmptyState icon={Crop} title="No encontramos este lote" /></Card></DetailPage>
        const active = plantings.find((p) => p.status === 'en_curso')
        const past = plantings.filter((p) => p.status !== 'en_curso')
        const planted = active?.areaHa ?? 0
        return (
          <DetailPage title={lot.name} subtitle={farm?.name}>
            <KpiGrid cols={2} colsWide={3}>
              <KpiTile label="Área total" value={formatNumber(lot.areaHa, 1)} icon={Ruler} caption="hectáreas" />
              <KpiTile label="Sembrada" value={formatNumber(planted, 1)} icon={Sprout} tone="high" caption="hectáreas" />
              <KpiTile label="Libre" value={formatNumber(Math.max(lot.areaHa - planted, 0), 1)} icon={Crop} tone="high" caption="hectáreas" />
            </KpiGrid>
            <SectionTitle>Siembra activa</SectionTitle>
            {!active ? (
              <Card>
                <EmptyState
                  icon={Sprout}
                  title="Este lote no tiene siembra activa"
                  message="Planee una siembra para seguir sus fases, plantas y costos."
                  actionLabel={access.managesProduction ? 'Nueva siembra' : undefined}
                  onAction={() => setPlanning(true)}
                />
              </Card>
            ) : (
              <Card to={`/produccion/siembras/${active.id}`}>
                <div className="row gap-8">
                  <h3 className="headline-md grow clamp-1">{app.cropName(active.cropId)}</h3>
                  <StatusPill tone={plantingStatusTone(active.status)}>{plantingStatusLabel(active.status)}</StatusPill>
                </div>
                <p className="body-sm" style={{ marginTop: 4 }}>{methodLabel(active.method)} · {active.plants == null ? 'sin conteo' : `${formatNumber(active.plants)} plantas`}</p>
                <p className="label-md right" style={{ color: 'var(--primary-container)', marginTop: 12 }}>Ver detalle de siembra →</p>
              </Card>
            )}
            {past.length > 0 && (
              <>
                <SectionTitle>Historial de siembras</SectionTitle>
                <RowGroup>
                  {past.map((p) => (
                    <ListRow key={p.id} to={`/produccion/siembras/${p.id}`} icon={Boxes} title={app.cropName(p.cropId)} subtitle={`${plantingStatusLabel(p.status)} · ${formatHa(p.areaHa)}`} />
                  ))}
                </RowGroup>
              </>
            )}
            {access.registersFieldWork && active && (
              <>
                <Gap size="lg" />
                <Button wide variant="outline" onClick={() => setWorking(true)}>Registrar labor</Button>
              </>
            )}
            {planning && <PlantingForm onClose={(saved) => { setPlanning(false); if (saved) app.markChanged() }} />}
            {working && <WorkForm onClose={(saved) => { setWorking(false); if (saved) app.markChanged() }} />}
          </DetailPage>
        )
      }}
    </Loadable>
  )
}
