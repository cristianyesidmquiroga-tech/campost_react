import { useState } from 'react'
import { Check, ChevronDown, MapPin } from 'lucide-react'
import { useApp } from '../../context/AppContext'
import { IconBadge, ListRow, RowGroup, Sheet } from '../ui'
import { formatHa } from '../../lib/format'

export function FarmSelector({ compact }) {
  const app = useApp()
  const [open, setOpen] = useState(false)
  const farm = app.activeFarm
  let title = farm?.name
  let caption = 'Finca activa'
  if (app.farmsLoading) title = 'Cargando fincas'
  else if (app.farmsError) {
    title = 'No se pudieron cargar las fincas'
    caption = 'Toque para reintentar'
  } else if (!farm) title = 'Sin fincas registradas'
  const canPick = app.farms.length > 1

  const onClick = () => {
    if (app.farmsError) app.loadFarms()
    else if (canPick) setOpen(true)
  }

  return (
    <>
      <button type="button" className={`farm-selector ${compact ? 'farm-selector--compact' : ''}`} onClick={onClick} aria-label={`${caption}: ${title}`}>
        <IconBadge icon={MapPin} size={32} />
        <span className="farm-selector__text">
          <span>{caption}</span>
          <strong className="clamp-1">{title}</strong>
        </span>
        {canPick && <ChevronDown size={20} aria-hidden />}
      </button>
      {open && (
        <Sheet title="Elegir finca" onClose={() => setOpen(false)}>
          <RowGroup>
            {app.farms.map((f) => (
              <ListRow
                key={f.id}
                title={f.name}
                subtitle={f.areaHa ? formatHa(f.areaHa) : undefined}
                trailing={f.id === farm?.id ? <Check size={20} color="var(--primary-container)" /> : null}
                onClick={() => {
                  app.selectFarm(f.id)
                  setOpen(false)
                }}
              />
            ))}
          </RowGroup>
        </Sheet>
      )}
    </>
  )
}

export function InPageFarm() {
  return (
    <div className="inpage-farm">
      <FarmSelector />
      <div className="gap" />
    </div>
  )
}
