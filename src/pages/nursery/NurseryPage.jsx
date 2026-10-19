import { useState } from 'react'
import { Leaf, Plus, Sprout } from 'lucide-react'
import { useApp } from '../../context/AppContext'
import { useAuth } from '../../context/AuthContext'
import { useAsync } from '../../hooks/useAsync'
import { listBatches } from '../../services/nursery'
import { Button, Card, EmptyState, IconBadge, Loadable, ProgressLine, SkeletonList } from '../../components/ui'
import { DetailPage } from '../../components/layout/Page'
import { formatDate, formatNumber } from '../../lib/format'
import { methodLabel } from '../../lib/labels'
import { BatchForm, BatchProgressSheet, TransplantSheet } from './NurserySheets'

export function NurseryPage() {
  const app = useApp()
  const { access } = useAuth()
  const farm = app.activeFarm
  const [sheet, setSheet] = useState(null)
  const state = useAsync(() => (farm ? listBatches(farm.id) : Promise.resolve([])), [farm?.id, app.revision])
  const close = (saved) => {
    setSheet(null)
    if (saved) app.markChanged()
  }

  return (
    <DetailPage title="Vivero" subtitle={farm?.name ?? 'Sin finca activa'} fab={farm && access.managesProduction ? { icon: Plus, label: 'Nuevo lote', onClick: () => setSheet({ kind: 'new' }) } : undefined}>
      {!farm ? (
        <Card><EmptyState icon={Sprout} title="Sin finca activa" message="Registre una finca para llevar su vivero." /></Card>
      ) : (
        <Loadable state={state} skeleton={<SkeletonList height={150} />}>
          {(batches) =>
            batches.length === 0 ? (
              <Card><EmptyState icon={Leaf} title="Sin lotes de vivero" message="Registre un lote para seguir cuántas plantas germinan y cuándo están listas." /></Card>
            ) : (
              <div className="stack gap-12">
                {batches.map((b) => {
                  const pending = b.ready - b.transplanted
                  return (
                    <Card key={b.id}>
                      <div className="row gap-12">
                        <IconBadge icon={Leaf} />
                        <div className="grow">
                          <h3 className="headline-md clamp-1" style={{ fontSize: 18 }}>{app.cropName(b.cropId)}</h3>
                          <p className="body-sm">{methodLabel(b.method)} · desde el {formatDate(b.start)}</p>
                        </div>
                      </div>
                      <div style={{ margin: '12px 0' }}>
                        <ProgressLine value={b.total ? Math.min(100, (b.ready / b.total) * 100) : 0} />
                        <p className="body-sm" style={{ marginTop: 6, overflowWrap: 'anywhere' }}>
                          {formatNumber(b.total)} puestas · {formatNumber(b.germinated)} germinadas · {formatNumber(b.ready)} listas · {formatNumber(b.lost)} perdidas · {formatNumber(b.transplanted)} trasplantadas
                        </p>
                      </div>
                      {access.managesProduction && (
                        <div className="row gap-8" style={{ flexWrap: 'wrap' }}>
                          <Button variant="outline" onClick={() => setSheet({ kind: 'progress', batch: b })}>Actualizar avance</Button>
                          <Button disabled={pending <= 0} onClick={() => setSheet({ kind: 'transplant', batch: b })}>Trasplantar</Button>
                        </div>
                      )}
                    </Card>
                  )
                })}
              </div>
            )
          }
        </Loadable>
      )}
      {sheet?.kind === 'new' && <BatchForm farm={farm} onClose={close} />}
      {sheet?.kind === 'progress' && <BatchProgressSheet batch={sheet.batch} onClose={close} />}
      {sheet?.kind === 'transplant' && <TransplantSheet batch={sheet.batch} onClose={close} />}
    </DetailPage>
  )
}
