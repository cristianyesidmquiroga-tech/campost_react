import { useState } from 'react'
import { BookOpen, ShieldCheck, ArrowRight } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { acceptConsent, getPolicy } from '../../services/content'
import { useAsync } from '../../hooks/useAsync'
import { Button, CheckField, Loadable, ListRow, RowGroup, SectionTitle } from '../../components/ui'
import { Page, Gap } from '../../components/layout/Page'
import { PolicySheet } from '../account/PolicySheet'
import { Card } from '../../components/ui'

export function ConsentPage({ onAccepted }) {
  const { signOut } = useAuth()
  const policy = useAsync(getPolicy, [])
  const [accepted, setAccepted] = useState(false)
  const [ai, setAi] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(null)
  const [showPolicy, setShowPolicy] = useState(false)

  const submit = async (version) => {
    setBusy(true)
    setError(null)
    try {
      await acceptConsent(version, ai)
      onAccepted()
    } catch (e) {
      setError(e.message)
      setBusy(false)
    }
  }

  return (
    <>
      <header className="detail-header" style={{ paddingLeft: 16 }}>
        <div className="detail-header__text"><h1>Sus datos</h1></div>
        <Button variant="text" onClick={signOut}>Salir</Button>
      </header>
      <Page compact>
        <Loadable state={policy}>
          {(data) => (
            <>
              <p style={{ lineHeight: 1.5 }}>
                Para operar y proteger su información agronómica necesitamos su autorización expresa
                (Ley 1581 de 2012, Habeas Data).
              </p>
              <SectionTitle>Datos que se tratan</SectionTitle>
              <RowGroup>
                {data.dataUsed.map((item) => (
                  <ListRow key={item} icon={ShieldCheck} title={item} titleLines={2} />
                ))}
              </RowGroup>
              <Gap />
              <Card>
                <CheckField checked={accepted} onChange={setAccepted} hint="REQUERIDO">
                  Acepto el tratamiento de mis datos personales según la política de privacidad.
                </CheckField>
                <hr className="divider" />
                <CheckField checked={ai} onChange={setAi} hint="OPCIONAL">
                  Autorizo enviar fotos de cultivos al asistente de inteligencia artificial.
                </CheckField>
              </Card>
              <Gap size="sm" />
              <p className="body-sm">Puede retirar la autorización de fotos en cualquier momento.</p>
              {error && <p role="alert" style={{ color: 'var(--error)', marginTop: 12 }}>{error}</p>}
              <Gap />
              <div className="btn-stack">
                <Button wide icon={ArrowRight} busy={busy} disabled={!accepted} onClick={() => submit(data.version)}>
                  Aceptar y continuar
                </Button>
                <Button wide variant="outline" icon={BookOpen} onClick={() => setShowPolicy(true)}>
                  Ver política completa
                </Button>
              </div>
              <p className="mono-sm" style={{ textAlign: 'center', marginTop: 16 }}>Versión de la política {data.version}</p>
              {showPolicy && <PolicySheet policy={data} onClose={() => setShowPolicy(false)} />}
            </>
          )}
        </Loadable>
      </Page>
    </>
  )
}
