import { BookOpen, Bell, GraduationCap, LogOut, Map as MapIcon, Shield, Sprout, TriangleAlert, Users } from 'lucide-react'
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
        {access.managesCatalog && <ListRow to="/produccion/cultivos" icon={Sprout} title="Catálogo de cultivos" subtitle="Perfiles que gobiernan el ciclo" />}
        {access.seesRisks && <ListRow to="/mas/eventos" icon={TriangleAlert} title="Eventos adversos" subtitle="Heladas, plagas y lluvias" />}
      </RowGroup>
      <SectionTitle>Conocimiento y ayuda</SectionTitle>
      <RowGroup>
        <ListRow to="/mas/conocimiento" icon={BookOpen} title="Biblioteca de conocimiento" subtitle="Problemas y manejo validado" />
        <ListRow to="/mas/glosario" icon={GraduationCap} title="Glosario del campo" subtitle="Términos del agro explicados" />
        <ListRow to="/mas/novedades" icon={Bell} title="Novedades de mi región" subtitle="Noticias y alertas vigentes" />
      </RowGroup>
      <SectionTitle>Cuenta y privacidad</SectionTitle>
      <RowGroup>
        <ListRow to="/mas/cuenta" icon={Shield} title="Mi cuenta" subtitle="Datos, privacidad y autorización" />
      </RowGroup>
      <Gap size="lg" />
      <Button wide variant="outline danger" icon={LogOut} onClick={leave}>Cerrar sesión</Button>
      <p className="body-sm" style={{ textAlign: 'center', marginTop: 8 }}>Su sesión dura 60 minutos y se guarda de forma segura en este dispositivo.</p>
      {dialog}
    </Page>
  )
}
