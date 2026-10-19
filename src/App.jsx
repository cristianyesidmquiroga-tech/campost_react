import { useState } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import { AppProvider } from './context/AppContext'
import { useAuth } from './context/AuthContext'
import { useAsync } from './hooks/useAsync'
import { getConsent } from './services/content'
import { AppShell } from './components/layout/AppShell'
import { SkeletonList } from './components/ui'
import { LoginPage } from './pages/auth/LoginPage'
import { ConsentPage } from './pages/auth/ConsentPage'
import { HomePage } from './pages/home/HomePage'
import { MorePage } from './pages/home/MorePage'
import { ProductionPage } from './pages/production/ProductionPage'
import { PlantingDetailPage } from './pages/production/PlantingDetailPage'
import { CyclePage } from './pages/production/CyclePage'
import { CropsPage } from './pages/production/CropsPage'
import { CropDetailPage } from './pages/production/CropDetailPage'
import { MoneyPage } from './pages/money/MoneyPage'
import { MovementsPage } from './pages/money/MovementsPage'
import { MovementDetailPage } from './pages/money/MovementDetailPage'
import { FarmsPage } from './pages/farms/FarmsPage'
import { FarmDetailPage } from './pages/farms/FarmDetailPage'
import { LotDetailPage } from './pages/farms/LotDetailPage'
import { WorkersPage } from './pages/workers/WorkersPage'
import { WorkerDetailPage } from './pages/workers/WorkerDetailPage'
import { EventsPage } from './pages/risks/EventsPage'
import { EventDetailPage } from './pages/risks/EventDetailPage'
import { AlertSourcesPage } from './pages/content/AlertSourcesPage'
import { KnowledgeReviewPage } from './pages/content/KnowledgeReviewPage'
import { UsersPage } from './pages/account/UsersPage'
import { ActivityDetailPage } from './pages/production/ActivityDetailPage'
import { AssistantPage } from './pages/assistant/AssistantPage'
import { AssistantQualityPage, ConsultationDetailPage, ConsultationHistoryPage } from './pages/assistant/ConsultationPages'
import { AnimalDetailPage, AnimalLotDetailPage, SpeciesDetailPage } from './pages/livestock/LivestockDetailPages'
import { LivestockPage } from './pages/livestock/LivestockPage'
import { NurseryPage } from './pages/nursery/NurseryPage'
import { NewsPage } from './pages/content/NewsPage'
import { ReportViewerPage } from './pages/reports/ReportViewerPage'
import { ReportsPage } from './pages/reports/ReportsPage'
import { GlossaryPage } from './pages/content/GlossaryPage'
import { KnowledgePage, KnowledgeDetailPage } from './pages/content/KnowledgePage'
import { PaymentsPage } from './pages/payments/PaymentsPage'
import { InventoryPage } from './pages/inventory/InventoryPage'
import { SupplyDetailPage } from './pages/inventory/SupplyDetailPage'
import { ProcessesPage } from './pages/processes/ProcessesPage'
import { ProcessDetailPage } from './pages/processes/ProcessDetailPage'
import { AccountPage } from './pages/account/AccountPage'

function Guarded({ allowed, children }) {
  return allowed ? children : <Navigate to="/inicio" replace />
}

function Authenticated() {
  const { access } = useAuth()
  const consent = useAsync(getConsent, [])
  const [accepted, setAccepted] = useState(false)

  if (consent.loading && !consent.data && !consent.error) {
    return <div className="splash"><SkeletonList count={1} /></div>
  }
  if (!accepted && !consent.error && consent.data === null) {
    return <ConsentPage onAccepted={() => setAccepted(true)} />
  }

  return (
    <AppProvider>
      <Routes>
        <Route element={<AppShell />}>
          <Route index element={<Navigate to="/inicio" replace />} />
          <Route path="inicio" element={<HomePage />} />
          <Route path="produccion" element={<Guarded allowed={access.seesProduction}><ProductionPage /></Guarded>} />
          <Route path="produccion/siembras/:id" element={<Guarded allowed={access.seesProduction}><PlantingDetailPage /></Guarded>} />
          <Route path="produccion/siembras/:id/ciclos/:cycleId" element={<Guarded allowed={access.seesProduction}><CyclePage /></Guarded>} />
          <Route path="produccion/labores/:id" element={<Guarded allowed={access.seesProduction}><ActivityDetailPage /></Guarded>} />
          <Route path="produccion/cultivos" element={<Guarded allowed={access.managesCatalog}><CropsPage /></Guarded>} />
          <Route path="produccion/cultivos/:id" element={<Guarded allowed={access.managesCatalog}><CropDetailPage /></Guarded>} />
          <Route path="dinero" element={<Guarded allowed={access.seesMoney}><MoneyPage /></Guarded>} />
          <Route path="dinero/movimientos" element={<Guarded allowed={access.seesMoney}><MovementsPage /></Guarded>} />
          <Route path="dinero/movimientos/:id" element={<Guarded allowed={access.seesMoney}><MovementDetailPage /></Guarded>} />
          <Route path="mas" element={<MorePage />} />
          <Route path="mas/fincas" element={<FarmsPage />} />
          <Route path="mas/fincas/:id" element={<FarmDetailPage />} />
          <Route path="mas/fincas/:farmId/lotes/:lotId" element={<Guarded allowed={access.seesProduction}><LotDetailPage /></Guarded>} />
          <Route path="mas/trabajadores" element={<Guarded allowed={access.seesWorkers}><WorkersPage /></Guarded>} />
          <Route path="mas/trabajadores/:id" element={<Guarded allowed={access.seesWorkers}><WorkerDetailPage /></Guarded>} />
          <Route path="mas/pagos" element={<Guarded allowed={access.seesPayments}><PaymentsPage /></Guarded>} />
          <Route path="mas/inventario" element={<Guarded allowed={access.seesInventory}><InventoryPage /></Guarded>} />
          <Route path="mas/insumos/:id" element={<Guarded allowed={access.seesInventory}><SupplyDetailPage /></Guarded>} />
          <Route path="mas/procesos" element={<Guarded allowed={access.seesProcesses}><ProcessesPage /></Guarded>} />
          <Route path="mas/procesos/:id" element={<Guarded allowed={access.seesProcesses}><ProcessDetailPage /></Guarded>} />
          <Route path="mas/eventos" element={<Guarded allowed={access.seesRisks}><EventsPage /></Guarded>} />
          <Route path="mas/eventos/:id" element={<Guarded allowed={access.seesRisks}><EventDetailPage /></Guarded>} />
          <Route path="mas/asistente" element={<Guarded allowed={access.seesAssistant}><AssistantPage /></Guarded>} />
          <Route path="mas/asistente/historial" element={<Guarded allowed={access.seesAssistant}><ConsultationHistoryPage /></Guarded>} />
          <Route path="mas/asistente/consultas/:id" element={<Guarded allowed={access.seesAssistant}><ConsultationDetailPage /></Guarded>} />
          <Route path="mas/asistente/calidad" element={<Guarded allowed={access.seesAssistantQuality}><AssistantQualityPage /></Guarded>} />
          <Route path="mas/animales" element={<Guarded allowed={access.seesLivestock}><LivestockPage /></Guarded>} />
          <Route path="mas/animales/lotes/:id" element={<Guarded allowed={access.seesLivestock}><AnimalLotDetailPage /></Guarded>} />
          <Route path="mas/animales/animal/:id" element={<Guarded allowed={access.seesLivestock}><AnimalDetailPage /></Guarded>} />
          <Route path="mas/animales/especies/:id" element={<Guarded allowed={access.seesLivestock}><SpeciesDetailPage /></Guarded>} />
          <Route path="mas/vivero" element={<Guarded allowed={access.seesNursery}><NurseryPage /></Guarded>} />
          <Route path="mas/reportes" element={<Guarded allowed={access.seesReports}><ReportsPage /></Guarded>} />
          <Route path="mas/reportes/:id" element={<Guarded allowed={access.seesReports}><ReportViewerPage /></Guarded>} />
          <Route path="mas/alertas" element={<Guarded allowed={access.managesAlerts}><AlertSourcesPage /></Guarded>} />
          <Route path="mas/novedades" element={<NewsPage />} />
          <Route path="mas/glosario" element={<GlossaryPage />} />
          <Route path="mas/conocimiento/revision" element={<Guarded allowed={access.reviewsKnowledge}><KnowledgeReviewPage /></Guarded>} />
          <Route path="mas/conocimiento" element={<KnowledgePage />} />
          <Route path="mas/conocimiento/:id" element={<KnowledgeDetailPage />} />
          <Route path="mas/usuarios" element={<Guarded allowed={access.createsUsers}><UsersPage /></Guarded>} />
          <Route path="mas/cuenta" element={<AccountPage />} />
          <Route path="*" element={<Navigate to="/inicio" replace />} />
        </Route>
      </Routes>
    </AppProvider>
  )
}

export default function App() {
  const { session, restoring } = useAuth()
  if (restoring) return <div className="splash"><SkeletonList count={1} /></div>
  return session ? <Authenticated /> : <LoginPage />
}
