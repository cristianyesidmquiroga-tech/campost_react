import { BarChart3, BookCheck, LayoutDashboard, Rss, Beef, UserCog, MessageCircleQuestion, BookOpen, Bell, Boxes, Cog, GraduationCap, Leaf, HandCoins, LogOut, Map as MapIcon, Shield, Sprout, TriangleAlert, Users } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { useConfirm } from '../../hooks/useConfirm'
import { Button, Card, ListRow, RowGroup, SectionTitle, StatusPill } from '../../components/ui'
import { InPageFarm } from '../../components/layout/FarmSelector'
import { Gap, Page } from '../../components/layout/Page'

export function MorePage() {
  const { session, access, signOut } = useAuth()
  const [confirm, dialog] = useConfirm()

  const leave = async () => {
    const yes = await confirm({ title: 'Cerrar sesión', message: 'Tendrá que volver a ingresar su correo y contraseña.', confirmLabel: 'Cerrar sesión' })
    if (yes) signOut()
  }

  return (
    <Page>
      <InPageFarm />
      <Card to="/mas/cuenta">
        <div className="row gap-16">
          <span className="avatar">{(session.name[0] ?? '?').toUpperCase()}</span>
          <div className="grow stack gap-4">
            <h2 className="headline-md clamp-1">{session.name}</h2>
            <span><StatusPill tone="ok">{access.roleLabel}</StatusPill></span>
            <span className="mono-sm clamp-1">{session.email}</span>
          </div>
        </div>
      </Card>
      <SectionTitle>Operación de campo</SectionTitle>
      <RowGroup>
        <ListRow to="/mas/fincas" icon={MapIcon} title="Mis fincas y lotes" subtitle="Fincas, lotes y área" />
        {access.seesWorkers && <ListRow to="/mas/trabajadores" icon={Users} title="Trabajadores" subtitle="Jornaleros, contratistas y fijos" />}
        {access.seesPayments && <ListRow to="/mas/pagos" icon={HandCoins} title="Pagos pendientes" subtitle="Jornales por liquidar" />}
        {access.seesInventory && <ListRow to="/mas/inventario" icon={Boxes} title="Insumos e inventario" subtitle="Existencias, entradas y consumos" />}
        {access.seesProcesses && <ListRow to="/mas/procesos" icon={Cog} title="Procesos de transformación" subtitle="Etapas del secado y beneficio" />}
        {access.seesAssistant && <ListRow to="/mas/asistente" icon={MessageCircleQuestion} title="Consultar" subtitle="Pregunte sobre su cultivo" />}
        {access.seesLivestock && <ListRow to="/mas/animales" icon={Beef} title="Mis animales" subtitle="Lotes, animales y especies" />}
        {access.seesNursery && <ListRow to="/mas/vivero" icon={Leaf} title="Vivero" subtitle="Lotes de plantas por germinar y trasplantar" />}
        {access.managesCatalog && <ListRow to="/produccion/cultivos" icon={Sprout} title="Catálogo de cultivos" subtitle="Perfiles que gobiernan el ciclo" />}
        {access.seesAdminPanel && <ListRow to="/mas/panel" icon={LayoutDashboard} title="Panel de control" subtitle="Estadísticas de toda la aplicación" />}
        {access.seesReports && <ListRow to="/mas/reportes" icon={BarChart3} title="Reportes" subtitle="Índices, tiempos y eventos" />}
        {access.seesRisks && <ListRow to="/mas/eventos" icon={TriangleAlert} title="Eventos adversos" subtitle="Heladas, plagas y lluvias" />}
      </RowGroup>
      <SectionTitle>Conocimiento y ayuda</SectionTitle>
      <RowGroup>
        <ListRow to="/mas/conocimiento" icon={BookOpen} title="Biblioteca de conocimiento" subtitle="Problemas y manejo validado" />
        {access.reviewsKnowledge && <ListRow to="/mas/conocimiento/revision" icon={BookCheck} title="Revisión de conocimiento" subtitle="Validar, retirar o reabrir fichas" />}
        <ListRow to="/mas/glosario" icon={GraduationCap} title="Glosario del campo" subtitle="Términos del agro explicados" />
        {access.managesAlerts && <ListRow to="/mas/alertas" icon={Rss} title="Fuentes y alertas" subtitle="Registrar fuentes y sincronizar alertas" />}
        <ListRow to="/mas/novedades" icon={Bell} title="Novedades de mi región" subtitle="Noticias y alertas vigentes" />
      </RowGroup>
      <SectionTitle>Cuenta y privacidad</SectionTitle>
      <RowGroup>
        {access.createsUsers && <ListRow to="/mas/usuarios" icon={UserCog} title="Usuarios y roles" subtitle="Crear cuentas y asignar perfil" />}
        <ListRow to="/mas/cuenta" icon={Shield} title="Mi cuenta" subtitle="Datos, privacidad y autorización" />
      </RowGroup>
      <Gap size="lg" />
      <Button wide variant="outline danger" icon={LogOut} onClick={leave}>Cerrar sesión</Button>
      <p className="body-sm" style={{ textAlign: 'center', marginTop: 8 }}>Su sesión dura 60 minutos y se guarda de forma segura en este dispositivo.</p>
      {dialog}
    </Page>
  )
}
