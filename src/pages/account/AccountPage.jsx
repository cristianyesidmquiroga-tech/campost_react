import { useState } from 'react'
import { BookOpen, FileText, KeyRound, LogOut, Mail, Mountain, Camera, ShieldCheck, CalendarDays } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { getConsent, getPolicy } from '../../services/content'
import { useAsync } from '../../hooks/useAsync'
import { useToast } from '../../context/ToastContext'
import { useConfirm } from '../../hooks/useConfirm'
import { Button, Card, InfoList, InfoRow, Loadable, SectionTitle, SkeletonList, StatusPill } from '../../components/ui'
import { DetailPage, Gap } from '../../components/layout/Page'
import { formatDate, formatNumber } from '../../lib/format'
import { PasswordSheet } from './PasswordSheet'
import { PolicySheet } from './PolicySheet'

export function AccountPage() {
  const { session, access, signOut } = useAuth()
  const [confirm, dialog] = useConfirm()
  const [policyOpen, setPolicyOpen] = useState(false)
  const [passwordOpen, setPasswordOpen] = useState(false)
  const show = useToast()
  const privacy = useAsync(async () => ({ consent: await getConsent(), policy: await getPolicy() }), [])

  const leave = async () => {
    const yes = await confirm({
      title: 'Cerrar sesión',
      message: 'Tendrá que volver a ingresar su correo y contraseña.',
      confirmLabel: 'Cerrar sesión',
    })
    if (yes) signOut()
  }

  return (
    <DetailPage title="Mi cuenta" subtitle="Datos y privacidad">
      <Card>
        <div className="row gap-16">
          <span className="avatar">{(session.name[0] ?? '?').toUpperCase()}</span>
          <div className="grow stack gap-8">
            <span className="headline-md clamp-2">{session.name}</span>
            <span><StatusPill tone="ok">{access.roleLabel}</StatusPill></span>
          </div>
        </div>
        <div style={{ height: 12 }} />
        <hr className="divider" />
        <InfoRow icon={Mail} label="Correo" value={session.email} />
        <hr className="divider" />
        <InfoRow icon={Mountain} label="Fincas asignadas" value={formatNumber(session.farmIds.length)} />
      </Card>
      <SectionTitle caption="Ley 1581 de 2012">Privacidad y Habeas Data</SectionTitle>
      <Loadable state={privacy} skeleton={<SkeletonList count={1} height={140} />}>
        {({ consent, policy }) => (
          <>
            <InfoList>
              <InfoRow icon={ShieldCheck} label="Tratamiento de datos" value={consent ? 'Autorizado' : 'Pendiente'} />
              <InfoRow icon={Camera} label="Fotos al asistente" value={consent?.aiTransfer ? 'Autorizado' : 'No autorizado'} />
              <InfoRow icon={FileText} label="Política aceptada" value={consent?.version ?? '—'} mono />
              {consent && <InfoRow icon={CalendarDays} label="Fecha" value={formatDate(consent.acceptedAt)} />}
            </InfoList>
            <Gap size="sm" />
            <Button wide variant="outline" icon={BookOpen} onClick={() => setPolicyOpen(true)}>Ver política completa</Button>
            {policyOpen && <PolicySheet policy={policy} onClose={() => setPolicyOpen(false)} />}
          </>
        )}
      </Loadable>
      <Gap size="sm" />
      <Button wide variant="outline" icon={KeyRound} onClick={() => setPasswordOpen(true)}>Cambiar contraseña</Button>
      {passwordOpen && <PasswordSheet onClose={(saved) => { setPasswordOpen(false); if (saved) show('Contraseña actualizada.') }} />}
      <Gap size="lg" />
      <Button wide variant="outline danger" icon={LogOut} onClick={leave}>Cerrar sesión en este dispositivo</Button>
      {dialog}
    </DetailPage>
  )
}
