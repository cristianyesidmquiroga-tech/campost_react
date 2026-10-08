import { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react'
import { AlertCircle, CheckCircle2 } from 'lucide-react'

const ToastContext = createContext(null)

export function ToastProvider({ children }) {
  const [toast, setToast] = useState(null)
  const timer = useRef(null)

  const show = useCallback((message, error = false) => {
    clearTimeout(timer.current)
    setToast({ message, error })
    timer.current = setTimeout(() => setToast(null), 4000)
  }, [])

  const value = useMemo(() => ({ show }), [show])
  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="toast-region" role="status" aria-live="polite">
        {toast && (
          <div className="toast">
            {toast.error ? <AlertCircle size={20} aria-hidden /> : <CheckCircle2 size={20} aria-hidden />}
            <span>{toast.message}</span>
          </div>
        )}
      </div>
    </ToastContext.Provider>
  )
}

export function useToast() {
  const value = useContext(ToastContext)
  if (!value) throw new Error('useToast debe usarse dentro de ToastProvider')
  return value.show
}
