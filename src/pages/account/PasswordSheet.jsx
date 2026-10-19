import { useState } from 'react'
import { changePassword } from '../../services/auth'
import { FormSheet, PasswordField } from '../../components/ui'

export function PasswordSheet({ onClose }) {
  const [form, setForm] = useState({ current: '', next: '', repeat: '' })
  const input = (key) => ({ value: form[key], onChange: (e) => setForm((f) => ({ ...f, [key]: e.target.value })) })
  return (
    <FormSheet
      title="Cambiar contraseña"
      subtitle="Use al menos 10 caracteres."
      submitLabel="Guardar contraseña"
      onClose={onClose}
      validate={() => ({
        current: form.current ? null : 'Escriba su contraseña actual.',
        next: form.next.length < 10 ? 'Debe tener al menos 10 caracteres.' : form.next === form.current ? 'Debe ser distinta de la actual.' : null,
        repeat: form.repeat === form.next ? null : 'Las contraseñas no coinciden.',
      })}
      onSubmit={() => changePassword(form.current, form.next)}
    >
      <PasswordField label="Contraseña actual" name="current" autoComplete="current-password" {...input('current')} />
      <PasswordField label="Contraseña nueva" name="next" autoComplete="new-password" {...input('next')} />
      <PasswordField label="Repita la contraseña nueva" name="repeat" autoComplete="new-password" {...input('repeat')} />
    </FormSheet>
  )
}
