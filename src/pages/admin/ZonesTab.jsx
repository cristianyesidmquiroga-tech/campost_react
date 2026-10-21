import { useState } from 'react'
import { Landmark, MapPin } from 'lucide-react'
import { useAsync } from '../../hooks/useAsync'
import { adminZones } from '../../services/admin'
import { Card, EmptyState, InfoList, InfoRow, Loadable, SectionTitle, SegmentedTabs, SkeletonList, StatusPill } from '../../components/ui'
import { zoneName } from '../../lib/dane'
import { formatCop, formatHa, formatNumber, formatUnits, plural } from '../../lib/format'
import { BarList } from './BarList'

const LEVELS = ['departamento', 'municipio']

export function ZonesTab() {
  const [level, setLevel] = useState(0)
  const state = useAsync(() => adminZones(LEVELS[level]), [level])
  return (
    <>
      <SegmentedTabs labels={['Departamentos', 'Municipios']} icons={[MapPin, MapPin]} selected={level} onSelect={setLevel} />
      <div style={{ height: 12 }} />
      <Loadable state={state} skeleton={<SkeletonList height={140} />}>
        {(zones) =>
          zones.length === 0 ? (
            <Card><EmptyState icon={Landmark} title="Sin zonas" message="Cuando haya fincas con zona, aquí se comparan." /></Card>
          ) : (
            <>
              <SectionTitle caption="Por número de cosechas">Dónde se produce más</SectionTitle>
              <Card>
                <BarList rows={[...zones].sort((a, b) => b.harvests - a.harvests).map((z) => ({ label: zoneName(z.zone), value: z.harvests, text: formatNumber(z.harvests) }))} />
              </Card>
              <SectionTitle caption="Gastos sobre hectáreas sembradas">Costo por hectárea</SectionTitle>
              <Card>
                <BarList
                  rows={zones
                    .filter((z) => z.expensePerHa !== null)
                    .sort((a, b) => b.expensePerHa - a.expensePerHa)
                    .map((z) => ({ label: zoneName(z.zone), value: z.expensePerHa, text: formatCop(z.expensePerHa) }))}
                />
              </Card>
              <SectionTitle>Detalle por zona</SectionTitle>
              <div className="stack gap-12">
                {zones.map((z) => (
                  <div key={z.zone} className="stack gap-12">
                    <div className="row gap-12">
                      <span className="grow"><h3 className="headline-md clamp-2" style={{ fontSize: 18 }}>{zoneName(z.zone)}</h3></span>
                      <StatusPill tone={z.profit >= 0 ? 'ok' : 'danger'}>{`Utilidad ${formatCop(z.profit)}`}</StatusPill>
                    </div>
                    <InfoList>
                      <InfoRow label="Fincas" value={`${plural(z.farms, 'finca', 'fincas')} de ${plural(z.farmers, 'agricultor', 'agricultores')}`} />
                      <InfoRow label="Área de fincas" value={formatHa(z.farmAreaHa)} />
                      <InfoRow label="Siembras" value={`${plural(z.plantings, 'siembra', 'siembras')} en ${formatHa(z.plantedHa)}`} />
                      <InfoRow label="Cosechas" value={formatNumber(z.harvests)} />
                      <InfoRow label="Producción" value={formatUnits(z.production)} />
                      <InfoRow label="Gastos" value={formatCop(z.expenses)} />
                      <InfoRow label="Ingresos" value={formatCop(z.income)} />
                      <InfoRow label="Cultivos principales" value={z.topCrops.length ? z.topCrops.join(', ') : 'Sin siembras'} />
                    </InfoList>
                  </div>
                ))}
              </div>
            </>
          )
        }
      </Loadable>
    </>
  )
}
