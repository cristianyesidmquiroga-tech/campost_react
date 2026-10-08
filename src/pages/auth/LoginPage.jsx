import { useState } from 'react'
import { AlertCircle, Leaf, Mail, ShieldCheck } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { Button, Card, Field, IconBadge, Note, PasswordField } from '../../components/ui'

export function LoginPage() {
  const { signIn } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [errors, setErrors] = useState({})
  const [failure, setFailure] = useState(null)
  const [busy, setBusy] = useState(false)

  const submit = async (event) => {
    event.preventDefault()
    const found = {}
    if (!email.trim().includes('@')) found.email = 'Escriba un correo válido.'
    if (!password) found.password = 'Escriba su contraseña.'
    setErrors(found)
    if (Object.keys(found).length > 0) return
    setBusy(true)
    setFailure(null)
    try {
      await signIn(email, password)
    } catch (error) {
      setFailure(error.message)
      setBusy(false)
    }
  }

  return (
    <div className="login">
      <div className="login__inner">
        <div className="row gap-12" style={{ marginBottom: 24 }}>
          <IconBadge icon={Leaf} size={44} tone="ok" />
          <span className="headline-md" style={{ color: 'var(--primary)', fontWeight: 800 }}>AgroGestión</span>
        </div>
        <Card style={{ padding: 24 }}>
          <form onSubmit={submit} noValidate>
            <h1 className="headline-lg">Iniciar sesión</h1>
            <p style={{ margin: '6px 0 20px', color: 'var(--on-surface-variant)' }}>
              Su finca, sus labores y sus cuentas en un solo lugar.
            </p>
            {failure && (
              <div className="form-error" role="alert">
                <AlertCircle size={20} aria-hidden />
                <span>{failure}</span>
              </div>
            )}
            <Field
              label="Correo electrónico"
              name="email"
              type="email"
              icon={Mail}
              autoComplete="username"
              hint="nombre@correo.com"
              value={email}
              error={errors.email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <PasswordField
              label="Contraseña"
              name="password"
              autoComplete="current-password"
              hint="Ingrese su contraseña"
              value={password}
              error={errors.password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <Button type="submit" wide busy={busy}>Entrar</Button>
            <p className="body-sm" style={{ textAlign: 'center', marginTop: 16 }}>
              ¿Olvidó su clave? Pida al administrador que la restablezca.
            </p>
          </form>
        </Card>
        <div style={{ height: 16 }} />
        <Note icon={ShieldCheck}>Su sesión dura 60 minutos. Después se le pedirá ingresar de nuevo.</Note>
      </div>
    </div>
  )
}
