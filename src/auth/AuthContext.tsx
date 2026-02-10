import React, { useEffect, useCallback } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { getSession, setSession, clearSession, type Session, type UserRole } from './session'

const AuthContext = React.createContext<{
  session: Session | null
  login: (role: UserRole, token: string) => void
  logout: () => void
}>({
  session: null,
  login: () => {},
  logout: () => {},
})

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [session, setStateSession] = React.useState<Session | null>(() => getSession())

  const login = useCallback((role: UserRole, token: string) => {
    const s: Session = {
      role,
      token,
      expiresAt: Date.now() + 1000 * 60 * 60 * 8,
    }
    setSession(s)
    setStateSession(s)
  }, [])

  const logout = useCallback(() => {
    clearSession()
    setStateSession(null)
  }, [])

  // Periodic session expiry check (every 60s)
  useEffect(() => {
    const check = () => {
      const current = getSession()
      if (!current && session) {
        setStateSession(null)
      }
    }
    const id = setInterval(check, 60_000)
    return () => clearInterval(id)
  }, [session])

  // Re-validate session on window focus (e.g. tab switch)
  useEffect(() => {
    const onFocus = () => {
      const current = getSession()
      if (!current && session) setStateSession(null)
    }
    window.addEventListener('focus', onFocus)
    return () => window.removeEventListener('focus', onFocus)
  }, [session])

  return (
    <AuthContext.Provider value={{ session, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => React.useContext(AuthContext)

export const ProtectedRoute: React.FC<{ role: UserRole; children: React.ReactNode }> = ({ role, children }) => {
  const { session } = useAuth()
  const location = useLocation()
  if (!session || session.role !== role) {
    const loginPaths: Record<UserRole, string> = {
      buyer: '/buyer/login',
      my: '/my/login',
      tools: '/tools/login',
    }
    return <Navigate to={loginPaths[role]} state={{ from: location }} replace />
  }
  return <>{children}</>
}
