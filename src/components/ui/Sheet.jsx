import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { AlertCircle } from 'lucide-react'
import { Button, FormErrors } from './Forms'

const FOCUSABLE = 'a[href],button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])'

function useModal(onClose) {
  const ref = useRef(null)
  useEffect(() => {
    const previous = document.activeElement
    const node = ref.current
    node?.querySelector(FOCUSABLE)?.focus()
    const onKey = (event) => {
      if (event.key === 'Escape') onClose()
      if (event.key !== 'Tab' || !node) return
      const items = [...node.querySelectorAll(FOCUSABLE)]
      if (items.length === 0) return
      const first = items[0]
      const last = items[items.length - 1]
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault()
        last.focus()
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault()
        first.focus()
      }
    }
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('keydown', onKey)
      previous?.focus?.()
    }
  }, [onClose])
  return ref
}

export function Sheet({ title, subtitle, onClose, children }) {
  const ref = useModal(onClose)
  return createPortal(
    <div className="overlay" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="sheet" role="dialog" aria-modal="true" aria-label={title} ref={ref}>
        <div className="sheet__handle" aria-hidden />
        <h2 className="headline-md">{title}</h2>
        {subtitle && <p className="body-sm">{subtitle}</p>}
        <div style={{ height: 16 }} />
        {children}
      </div>
    </div>,
    document.body,
  )
}

export function FormSheet({ title, subtitle, submitLabel, onSubmit, onClose, validate, children }) {
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(null)
  const [errors, setErrors] = useState({})

  const submit = async (event) => {
    event.preventDefault()
    const found = Object.fromEntries(Object.entries(validate?.() ?? {}).filter(([, message]) => message))
    setErrors(found)
    if (Object.keys(found).length > 0) return
    setBusy(true)
    setError(null)
    try {
      await onSubmit()
      onClose(true)
    } catch (e) {
      setError(e.message ?? 'No se pudo guardar. Intente de nuevo.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <Sheet title={title} subtitle={subtitle} onClose={() => onClose(false)}>
      <form onSubmit={submit} noValidate>
        <FormErrors.Provider value={errors}>{children}</FormErrors.Provider>
        {error && (
          <div className="form-error" role="alert">
            <AlertCircle size={20} aria-hidden />
            <span>{error}</span>
          </div>
        )}
        <Button type="submit" wide busy={busy}>{submitLabel}</Button>
      </form>
    </Sheet>
  )
}

export function ConfirmDialog({ title, message, confirmLabel, destructive, onResult }) {
  const ref = useModal(() => onResult(false))
  return createPortal(
    <div className="overlay" onMouseDown={(e) => e.target === e.currentTarget && onResult(false)}>
      <div className="dialog" role="alertdialog" aria-modal="true" aria-label={title} ref={ref}>
        <h2 className="headline-md">{title}</h2>
        <p style={{ marginTop: 8 }}>{message}</p>
        <div className="dialog__actions">
          <Button variant="text" onClick={() => onResult(false)}>Cancelar</Button>
          <Button variant={destructive ? 'danger' : undefined} onClick={() => onResult(true)}>{confirmLabel}</Button>
        </div>
      </div>
    </div>,
    document.body,
  )
}
