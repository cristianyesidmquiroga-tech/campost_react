import { useState } from 'react'
import { UserPlus, Users } from 'lucide-react'
import { createUser, USER_ROLES } from '../../services/users'
import { Button, Card, EmptyState, Field, ListRow, Note, PasswordField, RowGroup, SectionTitle, SelectField, StatusPill } from '../../components/ui'
import { ROLE_LABELS } from '../../lib/access'

const EMPTY = { name: '', email: '', password: '', role: 'agricultor' }
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export function UserCreate() {
  const [form, setForm] = useState(EMPTY)
  const [errors, setErrors] = useState({})
  const [error, setError] = useState(null)
  const [busy, setBusy] = useState(false)
  const [created, setCreated] = useState([])
  const input = (key) => ({ value: form[key], onChange: (e) => setForm((f) => ({ ...f, [key]: e.target.value })), error: errors[key] })

  const submit = async (event) => {
    event.preventDefault()
    const found = {
      name: form.name.trim().length >= 2 ? null : 'Escriba el nombre completo.',
      email: EMAIL.test(form.email.trim()) ? null : 'Escriba un correo válido.',
      password: form.password.length >= 10 ? null : 'Debe tener al menos 10 caracteres.',
    }
    setErrors(Object.fromEntries(Object.entries(found).filter(([, m]) => m)))
    if (Object.values(found).some(Boolean)) return
    setBusy(true)
    setError(null)
    try {
      const user = await createUser({ email: form.email.trim(), name: form.name.trim(), password: form.password, role: form.role })
      setCreated((list) => [user, ...list])
      setForm(EMPTY)
    } catch (e) {
      setError(e.message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <>
      <Card>
        <form onSubmit={submit} noValidate>
          <Field label="Nombre completo" name="name" maxLength={150} {...input('name')} />
          <Field label="Correo" name="email" type="email" maxLength={150} autoComplete="off" {...input('email')} />
          <PasswordField label="Contraseña inicial" name="password" autoComplete="new-password" {...input('password')} />
          <SelectField label="Perfil" name="role" value={form.role} onChange={(v) => setForm((f) => ({ ...f, role: v ?? 'agricultor' }))} options={USER_ROLES} />
          {error && <div className="form-error" role="alert"><span>{error}</span></div>}
          <Button type="submit" wide icon={UserPlus} busy={busy}>Crear usuario</Button>
        </form>
      </Card>
      <Note icon={Users}>El perfil define qué pantallas ve la persona. Entréguele la contraseña por un medio seguro; podrá cambiarla desde Mi cuenta.</Note>
      <SectionTitle>Creados en esta sesión</SectionTitle>
      {created.length === 0 ? (
        <Card><EmptyState icon={Users} title="Aún no ha creado usuarios" message="Los usuarios que cree aparecen aquí." /></Card>
      ) : (
        <RowGroup>
          {created.map((u) => (
            <ListRow key={u.id} icon={Users} title={u.name} subtitle={u.email} trailing={<StatusPill tone="ok">{ROLE_LABELS[u.role] ?? u.role}</StatusPill>} />
          ))}
        </RowGroup>
      )}
    </>
  )
}
