import { Sprout } from 'lucide-react'
import { useAsync } from '../../hooks/useAsync'
import { adminCrops } from '../../services/admin'
import { Card, EmptyState, InfoList, InfoRow, Loadable, SectionTitle, SkeletonList, StatusPill } from '../../components/ui'
import { formatCop, formatDate, formatHa, formatNumber, formatUnits, plural } from '../../lib/format'
import { BarList } from './BarList'

const days = (value) => (value === null ? 'Sin datos' : `${formatNumber(value, 1)} días`)

const longest = (crops) => crops.filter((c) => c.averageDays !== null).sort((a, b) => b.averageDays - a.averageDays)

export function CropsTab() {
  const state = useAsync(adminCrops, [])
  return (
    <Loadable state={state} skeleton={<SkeletonList height={140} />}>
      {(crops) => {
        const closed = longest(crops)
        return crops.length === 0 ? (
          <Card><EmptyState icon={Sprout} title="Sin cultivos registrados" message="Cuando haya siembras, aquí aparece cada cultivo con su producción y costos." /></Card>
        ) : (
          <>
            <SectionTitle caption="Por número de siembras">Cultivos más registrados</SectionTitle>
            <Card><BarList rows={crops.map((c) => ({ label: c.name, value: c.plantings, text: formatNumber(c.plantings) }))} /></Card>
            <SectionTitle caption="Duración media de los ciclos cerrados">Los que más tiempo llevan</SectionTitle>
            <Card>
              {closed.length === 0 ? (
                <EmptyState icon={Sprout} title="Aún no hay ciclos cerrados" message="Cuando se cierren ciclos, aquí se compara cuánto tarda cada cultivo." />
              ) : (
                <BarList rows={closed.map((c) => ({ label: c.name, value: c.averageDays, text: days(c.averageDays) }))} />
              )}
            </Card>
            <SectionTitle>Detalle por cultivo</SectionTitle>
            <div className="stack gap-12">
              {crops.map((c) => (
                <div key={c.id} className="stack gap-12">
                  <div className="row gap-12">
                    <span className="grow"><h3 className="headline-md clamp-2" style={{ fontSize: 18 }}>{c.name}</h3></span>
                    <StatusPill tone={c.profit >= 0 ? 'ok' : 'danger'}>{`Utilidad ${formatCop(c.profit)}`}</StatusPill>
                  </div>
                  <InfoList>
                    <InfoRow label="Siembras" value={`${plural(c.plantings, 'siembra', 'siembras')} en ${plural(c.farms, 'finca', 'fincas')}`} />
                    <InfoRow label="Agricultores" value={formatNumber(c.farmers)} />
                    <InfoRow label="Área sembrada" value={formatHa(c.areaHa)} />
                    <InfoRow label="Plantas" value={formatNumber(c.plants)} />
                    <InfoRow label="Ciclos" value={`${plural(c.openCycles, 'abierto', 'abiertos')} · ${plural(c.closedCycles, 'cerrado', 'cerrados')}`} />
                    <InfoRow label="Duración media" value={days(c.averageDays)} />
                    <InfoRow label="Ciclo más largo" value={days(c.longestDays)} />
                    <InfoRow label="Cosechas" value={formatNumber(c.harvests)} />
                    <InfoRow label="Producción" value={formatUnits(c.production)} />
                    <InfoRow label="Primera cosecha" value={c.firstHarvest ? formatDate(c.firstHarvest) : 'Sin datos'} />
                    <InfoRow label="Última cosecha" value={c.lastHarvest ? formatDate(c.lastHarvest) : 'Sin datos'} />
                    <InfoRow label="Entre cosechas" value={days(c.daysBetweenHarvests)} />
                    <InfoRow label="Gastos" value={formatCop(c.expenses)} />
                    <InfoRow label="Ingresos" value={formatCop(c.income)} />
                  </InfoList>
                </div>
              ))}
            </div>
          </>
        )
      }}
    </Loadable>
  )
}
