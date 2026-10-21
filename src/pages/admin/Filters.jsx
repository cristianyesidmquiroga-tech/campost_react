import { useAsync } from '../../hooks/useAsync'
import { adminCrops, adminZones } from '../../services/admin'
import { SelectField } from '../../components/ui'
import { zoneName } from '../../lib/dane'

export function CropFilter({ value, onChange }) {
  const crops = useAsync(adminCrops, [])
  return <SelectField label="Cultivo" name="crop" value={value} placeholder="Todos los cultivos" onChange={onChange} options={(crops.data ?? []).map((c) => [c.id, c.name])} />
}

export function ZoneFilter({ value, onChange }) {
  const zones = useAsync(() => adminZones('departamento'), [])
  return <SelectField label="Departamento" name="zone" value={value} placeholder="Todo el país" onChange={onChange} options={(zones.data ?? []).map((z) => [z.zone, zoneName(z.zone)])} />
}
