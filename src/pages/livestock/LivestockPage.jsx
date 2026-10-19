import { useState } from 'react'
import { Beef, ChevronRight, Layers, Plus, Tag } from 'lucide-react'
import { useApp } from '../../context/AppContext'
import { useAuth } from '../../context/AuthContext'
import { useAsync } from '../../hooks/useAsync'
import { listAnimals, listLots, listSpecies, SEXES } from '../../services/livestock'
import { Card, EmptyState, ListRow, Loadable, RowGroup, SegmentedTabs, SkeletonList, Sheet } from '../../components/ui'
import { DetailPage } from '../../components/layout/Page'
import { formatNumber } from '../../lib/format'
import { AnimalForm, LotForm, SpeciesForm } from './LivestockForms'

export function LivestockPage() {
  const app = useApp()
  const { access } = useAuth()
  const farm = app.activeFarm
  const [tab, setTab] = useState(0)
  const [sheet, setSheet] = useState(null)
  const state = useAsync(async () => {
    if (!farm) return { species: [], lots: [], animals: [] }
    const [species, lots, animals] = await Promise.all([listSpecies(farm.id), listLots(farm.id), listAnimals(farm.id)])
    return { species, lots, animals }
  }, [farm?.id, app.revision])
  const close = (saved) => {
    setSheet(null)
    if (saved) app.markChanged()
  }

  return (
    <DetailPage title="Mis animales" subtitle={farm?.name ?? 'Sin finca activa'} fab={farm && access.managesLivestock ? { icon: Plus, label: 'Registrar', onClick: () => setSheet('choose') } : undefined}>
      {!farm ? (
        <Card><EmptyState icon={Beef} title="Sin finca activa" message="Registre una finca para llevar sus animales." /></Card>
      ) : (
        <Loadable state={state} skeleton={<SkeletonList height={72} />}>
          {({ species, lots, animals }) => {
            const speciesName = (id) => species.find((s) => s.id === id)?.name ?? 'Especie'
            const create = (kind) => setSheet(kind)
            return (
              <>
                <SegmentedTabs labels={['Lotes', 'Animales', 'Especies']} icons={[Layers, Tag, Beef]} selected={tab} onSelect={setTab} />
                <div style={{ height: 12 }} />
                {tab === 0 &&
                  (lots.length === 0 ? (
                    <Card><EmptyState icon={Layers} title="Sin lotes" message="Agrupe sus animales en lotes para registrar producción y alimentación." /></Card>
                  ) : (
                    <RowGroup>
                      {lots.map((l) => (
                        <ListRow key={l.id} to={`/mas/animales/lotes/${l.id}`} icon={Layers} title={l.name} subtitle={`${speciesName(l.speciesId)} · ${formatNumber(l.quantity)} animales${l.location ? ` · ${l.location}` : ''}`} trailing={<ChevronRight size={20} className="chevron" aria-hidden />} />
                      ))}
                    </RowGroup>
                  ))}
                {tab === 1 &&
                  (animals.length === 0 ? (
                    <Card><EmptyState icon={Tag} title="Sin animales" message="Registre cada animal con su número de arete." /></Card>
                  ) : (
                    <RowGroup>
                      {animals.map((a) => (
                        <ListRow key={a.id} to={`/mas/animales/animal/${a.id}`} icon={Tag} title={a.name ? `${a.name} (${a.tag})` : `Arete ${a.tag}`} subtitle={`${speciesName(a.speciesId)} · ${SEXES[a.sex] ?? a.sex}`} trailing={<ChevronRight size={20} className="chevron" aria-hidden />} />
                      ))}
                    </RowGroup>
                  ))}
                {tab === 2 &&
                  (species.length === 0 ? (
                    <Card><EmptyState icon={Beef} title="Sin especies" message="Registre primero la especie, por ejemplo bovinos o gallinas." /></Card>
                  ) : (
                    <RowGroup>
                      {species.map((s) => (
                        <ListRow key={s.id} to={`/mas/animales/especies/${s.id}`} icon={Beef} title={s.name} subtitle={s.description ?? 'Sin descripción'} trailing={<ChevronRight size={20} className="chevron" aria-hidden />} />
                      ))}
                    </RowGroup>
                  ))}
                {sheet === 'choose' && (
                  <Sheet title="Registrar" onClose={() => setSheet(null)}>
                    <RowGroup>
                      <ListRow icon={Beef} title="Especie" subtitle="Bovinos, gallinas, cerdos" onClick={() => create('species')} />
                      <ListRow icon={Layers} title="Lote de animales" subtitle="Un grupo con su ubicación" onClick={() => create('lot')} />
                      <ListRow icon={Tag} title="Animal" subtitle="Uno con su número de arete" onClick={() => create('animal')} />
                    </RowGroup>
                  </Sheet>
                )}
                {sheet === 'species' && <SpeciesForm farm={farm} onClose={close} />}
                {sheet === 'lot' && <LotForm farm={farm} species={species} onClose={close} />}
                {sheet === 'animal' && <AnimalForm farm={farm} species={species} lots={lots} onClose={close} />}
              </>
            )
          }}
        </Loadable>
      )}
    </DetailPage>
  )
}
