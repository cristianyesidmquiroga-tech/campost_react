import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { createAccess } from '../lib/access'
import { restoreSession, signIn as doSignIn, signOut as doSignOut } from '../services/auth'
import { setOnUnauthorized } from '../services/http'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null)
  const [restoring, setRestoring] = useState(true)

  const signOut = useCallback(() => {
    doSignOut()
    setSession(null)
  }, [])

  useEffect(() => {
    setOnUnauthorized(signOut)
    let alive = true
    restoreSession().then((restored) => {
      if (!alive) return
      setSession(restored)
      setRestoring(false)
    })
    return () => {
      alive = false
    }
  }, [signOut])

  const signIn = useCallback(async (email, password) => {
    setSession(await doSignIn(email, password))
  }, [])

  const value = useMemo(
    () => ({ session, restoring, access: createAccess(session), signIn, signOut }),
    [session, restoring, signIn, signOut],
  )
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const value = useContext(AuthContext)
  if (!value) throw new Error('useAuth debe usarse dentro de AuthProvider')
  return value
}
