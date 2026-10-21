import { useState } from 'react'
import { Navigate, useParams } from 'react-router-dom'
import { Beef, Layers, Tag } from 'lucide-react'
import { useApp } from '../../context/AppContext'
import { useAuth } from '../../context/AuthContext'
import { useAsync } from '../../hooks/useAsync'
import { EVENT_TYPES, listAnimalEvents, listAnimals, listFeeding, listLots, listProduction, listSpecies, SEXES } from '../../services/livestock'
import { Button, Card, EmptyState, InfoList, InfoRow, ListRow, Loadable, RowGroup, SectionTitle, SkeletonList } from '../../components/ui'
import { DetailPage } from '../../components/layout/Page'
import { formatCop, formatDate, formatNumber } from '../../lib/format'
import { AnimalEventForm, FeedingForm, ProductionForm } from './LivestockForms'

function useLivestock() {
  const app = useApp()
  const farm = app.activeFarm
  const state = useAsync(async () => {
    if (!farm) return null
    const [species, lots, animals, events, production, feeding] = await Promise.all([
      listSpecies(farm.id),
      listLots(farm.id),
      listAnimals(farm.id),
      listAnimalEvents(farm.id),
      listProduction(farm.id),
      listFeeding(farm.id),
    ])
    return { farmId: farm.id, species, lots, animals, events, production, feeding }
  }, [farm?.id, app.revision])
  const stale = app.farmsLoading || (farm && !state.error && state.data?.farmId !== farm.id)
  return { app, farm, state: stale ? { ...state, loading: true, data: null } : state }
}

const speciesName = (data, id) => data.species.find((s) => s.id === id)?.name ?? 'Especie'

function EventList({ events }) {
  if (events.length === 0) return <Card><EmptyState icon={Tag} title="Sin eventos" message="Vacunas, tratamientos y pesajes aparecen aquí." /></Card>
  return (
    <RowGroup>
      {[...events].sort((a, b) => b.date.localeCompare(a.date)).map((e) => (
        <ListRow key={e.id} icon={Tag} title={EVENT_TYPES[e.type] ?? e.type} subtitle={`${formatDate(e.date)}${e.product ? ` · ${e.product}` : ''}`} />
      ))}
    </RowGroup>
  )
}

export function AnimalLotDetailPage() {
  const { id } = useParams()
  const { access } = useAuth()
  const { app, farm, state } = useLivestock()
  const [sheet, setSheet] = useState(null)
  const close = (saved) => {
    setSheet(null)
    if (saved) app.markChanged()
  }
  return (
    <DetailPage title="Lote de animales" subtitle={farm?.name}>
      <Loadable state={state} skeleton={<SkeletonList height={120} />}>
        {(data) => {
          const lot = data?.lots.find((l) => l.id === id)
          if (!lot) return <Navigate to="/mas/animales" replace />
          const production = data.production.filter((p) => p.lotId === id)
          const feeding = data.feeding.filter((f) => f.lotId === id)
          return (
            <>
              <div className="stack gap-12">
                <h2 className="headline-md">{lot.name}</h2>
                <InfoList>
                  <InfoRow label="Especie" value={speciesName(data, lot.speciesId)} icon={Beef} />
                  <InfoRow label="Animales" value={formatNumber(lot.quantity)} icon={Layers} />
                  <InfoRow label="Ubicación" value={lot.location ?? 'Sin ubicación'} />
                  <InfoRow label="Costo de alimentación" value={formatCop(feeding.reduce((s, f) => s + f.cost, 0))} />
                </InfoList>
              </div>
              {access.managesLivestock && (
                <div className="row gap-8" style={{ margin: '12px 0', flexWrap: 'wrap' }}>
                  <Button onClick={() => setSheet('production')}>Registrar producción</Button>
                  <Button variant="outline" onClick={() => setSheet('feeding')}>Registrar alimentación</Button>
                  <Button variant="outline" onClick={() => setSheet('event')}>Registrar evento</Button>
                </div>
              )}
              <SectionTitle>Producción</SectionTitle>
              {production.length === 0 ? (
                <Card><EmptyState icon={Layers} title="Sin producción" message="Registre la leche, los huevos o la carne del lote." /></Card>
              ) : (
                <RowGroup>{production.map((p) => <ListRow key={p.id} icon={Layers} title={`${p.type}: ${formatNumber(p.quantity, 1)} ${p.unit}`} subtitle={formatDate(p.date)} />)}</RowGroup>
              )}
              <SectionTitle>Alimentación</SectionTitle>
              {feeding.length === 0 ? (
                <Card><EmptyState icon={Layers} title="Sin alimentación" message="Registre lo que consume el lote y cuánto cuesta." /></Card>
              ) : (
                <RowGroup>{feeding.map((f) => <ListRow key={f.id} icon={Layers} title={`${f.food}: ${formatNumber(f.quantity, 1)} kg`} subtitle={`${formatDate(f.date)} · ${formatCop(f.cost)}`} />)}</RowGroup>
              )}
              <SectionTitle>Eventos</SectionTitle>
              <EventList events={data.events.filter((e) => e.lotId === id)} />
              {sheet === 'production' && <ProductionForm farm={farm} lotId={id} onClose={close} />}
              {sheet === 'feeding' && <FeedingForm farm={farm} lotId={id} onClose={close} />}
              {sheet === 'event' && <AnimalEventForm farm={farm} lotId={id} onClose={close} />}
            </>
          )
        }}
      </Loadable>
    </DetailPage>
  )
}

export function AnimalDetailPage() {
  const { id } = useParams()
  const { access } = useAuth()
  const { app, farm, state } = useLivestock()
  const [creating, setCreating] = useState(false)
  return (
    <DetailPage title="Animal" subtitle={farm?.name}>
      <Loadable state={state} skeleton={<SkeletonList height={120} />}>
        {(data) => {
          const animal = data?.animals.find((a) => a.id === id)
          if (!animal) return <Navigate to="/mas/animales" replace />
          const lot = data.lots.find((l) => l.id === animal.lotId)
          return (
            <>
              <div className="stack gap-12">
                <h2 className="headline-md">{animal.name ? `${animal.name} (${animal.tag})` : `Arete ${animal.tag}`}</h2>
                <InfoList>
                  <InfoRow label="Especie" value={speciesName(data, animal.speciesId)} icon={Beef} />
                  <InfoRow label="Sexo" value={SEXES[animal.sex] ?? animal.sex} />
                  <InfoRow label="Raza" value={animal.breed ?? 'Sin dato'} />
                  <InfoRow label="Nacimiento" value={animal.birth ? formatDate(animal.birth) : 'Sin dato'} />
                  <InfoRow label="Lote" value={lot?.name ?? 'Sin lote'} />
                  <InfoRow label="Estado" value={animal.status} />
                </InfoList>
              </div>
              {access.managesLivestock && (
                <div style={{ margin: '12px 0' }}>
                  <Button wide onClick={() => setCreating(true)}>Registrar evento</Button>
                </div>
              )}
              <SectionTitle>Historial</SectionTitle>
              <EventList events={data.events.filter((e) => e.animalId === id)} />
              {creating && <AnimalEventForm farm={farm} animalId={id} onClose={(saved) => { setCreating(false); if (saved) app.markChanged() }} />}
            </>
          )
        }}
      </Loadable>
    </DetailPage>
  )
}

export function SpeciesDetailPage() {
  const { id } = useParams()
  const { farm, state } = useLivestock()
  return (
    <DetailPage title="Especie" subtitle={farm?.name}>
      <Loadable state={state} skeleton={<SkeletonList height={120} />}>
        {(data) => {
          const species = data?.species.find((s) => s.id === id)
          if (!species) return <Navigate to="/mas/animales" replace />
          const lots = data.lots.filter((l) => l.speciesId === id)
          const animals = data.animals.filter((a) => a.speciesId === id)
          return (
            <>
              <div className="stack gap-12">
                <h2 className="headline-md">{species.name}</h2>
                <p className="body-sm">{species.description ?? 'Sin descripción'}</p>
                <InfoList>
                  <InfoRow label="Lotes" value={formatNumber(lots.length)} icon={Layers} />
                  <InfoRow label="Animales individuales" value={formatNumber(animals.length)} icon={Tag} />
                  <InfoRow label="Animales en lotes" value={formatNumber(lots.reduce((s, l) => s + l.quantity, 0))} />
                </InfoList>
              </div>
              <SectionTitle>Lotes de esta especie</SectionTitle>
              {lots.length === 0 ? (
                <Card><EmptyState icon={Layers} title="Sin lotes" message="Todavía no hay lotes de esta especie." /></Card>
              ) : (
                <RowGroup>{lots.map((l) => <ListRow key={l.id} to={`/mas/animales/lotes/${l.id}`} icon={Layers} title={l.name} subtitle={`${formatNumber(l.quantity)} animales`} />)}</RowGroup>
              )}
            </>
          )
        }}
      </Loadable>
    </DetailPage>
  )
}
