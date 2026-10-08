import { useState } from 'react'
import { ChevronRight, CircleDollarSign, Archive, Receipt, TriangleAlert, Users } from 'lucide-react'
import { useApp } from '../../context/AppContext'
import { useAuth } from '../../context/AuthContext'
import { Card, IconBadge, Sheet, StatusPill } from '../../components/ui'
import { ExpenseForm, IncomeForm } from '../money/MoneyForms'
import { EventForm } from '../risks/EventForm'
import { HarvestForm, WorkForm } from './WorkForms'

function buildActions(access) {
  return [
    access.registersFieldWork && { key: 'work', title: 'Labor con jornales', description: 'Cuadrilla o trabajador, siembra, fase y jornales del día.', tag: 'Jornal', icon: Users, tone: 'ok' },
    access.registersMoney && { key: 'expense', title: 'Gasto', description: 'Compra de insumos, fletes, mantenimiento o combustible.', tag: 'Egreso', icon: Receipt, tone: 'danger' },
    access.registersMoney && { key: 'income', title: 'Ingreso', description: 'Venta de cosecha o subproductos, con cantidad y precio.', tag: 'Venta', icon: CircleDollarSign, tone: 'ok' },
    access.registersFieldWork && { key: 'harvest', title: 'Cosecha', description: 'Cantidad recolectada por siembra, en kilos, arrobas o cargas.', tag: 'Pesaje', icon: Archive, tone: 'ok' },
    access.registersFieldWork && access.seesRisks && { key: 'event', title: 'Evento adverso', description: 'Helada, plaga, sequía o daño, con severidad y pérdida.', tag: 'Riesgo', icon: TriangleAlert, tone: 'warn' },
  ].filter(Boolean)
}

const FORMS = { work: WorkForm, expense: ExpenseForm, income: IncomeForm, harvest: HarvestForm, event: EventForm }

export function QuickRegister({ onClose }) {
  const app = useApp()
  const { access } = useAuth()
  const [chosen, setChosen] = useState(null)

  if (chosen) {
    const Form = FORMS[chosen]
    return (
      <Form
        onClose={(saved) => {
          if (saved) app.markChanged()
          onClose()
        }}
      />
    )
  }

  return (
    <Sheet title="Registro rápido" subtitle={app.activeFarm?.name ?? 'Sin finca activa'} onClose={onClose}>
      <div className="quick">
        {buildActions(access).map((action) => (
          <Card key={action.key} flat onClick={() => setChosen(action.key)} className="quick__tile">
            <IconBadge icon={action.icon} tone={action.tone} size={48} />
            <div className="quick__text">
              <div className="quick__title">
                <span className="label-md clamp-1">{action.title}</span>
                <StatusPill tone={action.tone}>{action.tag}</StatusPill>
              </div>
              <p className="body-sm clamp-2">{action.description}</p>
            </div>
            <ChevronRight size={20} className="chevron" aria-hidden />
          </Card>
        ))}
      </div>
    </Sheet>
  )
}
