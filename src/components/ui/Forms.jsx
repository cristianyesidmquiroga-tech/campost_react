import { createContext, useContext, useId, useState } from 'react'
import { Eye, EyeOff, Lock } from 'lucide-react'

export const FormErrors = createContext({})

export function Button({ children, icon: Icon, variant, wide, busy, className = '', type = 'button', ...rest }) {
  const classes = ['btn', wide && 'btn--wide', variant && variant.split(' ').map((v) => `btn--${v}`).join(' '), className]
    .filter(Boolean)
    .join(' ')
  return (
    <button type={type} className={classes} disabled={busy || rest.disabled} {...rest}>
      {busy ? <span className="skeleton" style={{ width: 22, height: 22, borderRadius: '50%' }} aria-label="Procesando" /> : (
        <>
          {Icon && <Icon size={20} aria-hidden />}
          {children}
        </>
      )}
    </button>
  )
}

export function Field({ label, name, prefix, hint, icon: Icon, multiline, error: errorProp, children, className = '', ...input }) {
  const id = useId()
  const errors = useContext(FormErrors)
  const error = errorProp ?? errors[name]
  const Control = multiline ? 'textarea' : 'input'
  return (
    <div className="field">
      <label htmlFor={id} className="label-md">{label}</label>
      <div className={`field__wrap ${prefix ? 'field__wrap--prefix' : ''} ${Icon ? 'field__wrap--icon' : ''}`}>
        {Icon && <Icon size={20} aria-hidden />}
        {prefix && <span className="field__prefix">{prefix}</span>}
        <Control
          id={id}
          name={name}
          aria-invalid={Boolean(error)}
          className={`field__control ${error ? 'field__control--error' : ''} ${className}`}
          placeholder={hint}
          {...input}
        />
        {children}
      </div>
      {error && <span className="field__error" role="alert">{error}</span>}
    </div>
  )
}

export function PasswordField({ label, ...props }) {
  const [shown, setShown] = useState(false)
  return (
    <Field label={label} icon={Lock} className="field__control--trail" type={shown ? 'text' : 'password'} {...props}>
      <button
        type="button"
        className="btn btn--icon"
        aria-label={shown ? 'Ocultar contraseña' : 'Mostrar contraseña'}
        onClick={() => setShown((v) => !v)}
      >
        {shown ? <EyeOff size={20} /> : <Eye size={20} />}
      </button>
    </Field>
  )
}

export function SelectField({ label, name, value, onChange, options, placeholder }) {
  const id = useId()
  const errors = useContext(FormErrors)
  const error = errors[name]
  return (
    <div className="field">
      <label htmlFor={id} className="label-md">{label}</label>
      <select
        id={id}
        name={name}
        value={value ?? ''}
        onChange={(e) => onChange(e.target.value || null)}
        aria-invalid={Boolean(error)}
        className={`field__control ${error ? 'field__control--error' : ''}`}
      >
        {placeholder !== undefined && <option value="">{placeholder}</option>}
        {options.map(([key, text]) => (
          <option key={key} value={key}>{text}</option>
        ))}
      </select>
      {error && <span className="field__error" role="alert">{error}</span>}
    </div>
  )
}

export function DateField({ label, value, onChange, max }) {
  const id = useId()
  return (
    <div className="field">
      <label htmlFor={id} className="label-md">{label}</label>
      <input id={id} type="date" value={value} max={max} onChange={(e) => onChange(e.target.value)} className="field__control mono-md" />
    </div>
  )
}

export function InfoTotal({ label, value }) {
  return (
    <div className="total-box">
      <span className="label-md">{label}</span>
      <span className="mono-md">{value}</span>
    </div>
  )
}

export function CheckField({ checked, onChange, children, hint }) {
  const id = useId()
  return (
    <div className="check">
      <input id={id} type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} />
      <label htmlFor={id}>
        <span>{children}</span>
        {hint && <span className="label-sm" style={{ display: 'block', marginTop: 2 }}>{hint}</span>}
      </label>
    </div>
  )
}

export const required = (value, message = 'Este campo es obligatorio.') =>
  String(value ?? '').trim() === '' ? message : null

export const positive = (value) => {
  const n = Number(String(value ?? '').trim().replace(',', '.'))
  return Number.isFinite(n) && n > 0 ? null : 'Escriba un valor mayor a cero.'
}
