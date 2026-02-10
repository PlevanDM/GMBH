export type UserRole = 'buyer' | 'my' | 'tools'

export type Session = {
  token: string
  role: UserRole
  expiresAt: number
}

const SESSION_KEY = 'restart-session'

export function getSession(): Session | null {
  const raw = localStorage.getItem(SESSION_KEY)
  if (!raw) return null
  try {
    const s = JSON.parse(raw) as Session
    if (s.expiresAt < Date.now()) {
      localStorage.removeItem(SESSION_KEY)
      return null
    }
    return s
  } catch {
    localStorage.removeItem(SESSION_KEY)
    return null
  }
}

export function setSession(s: Session): void {
  localStorage.setItem(SESSION_KEY, JSON.stringify(s))
}

export function clearSession(): void {
  localStorage.removeItem(SESSION_KEY)
}

export function requireRole(role: UserRole): boolean {
  const s = getSession()
  if (!s) return false
  return s.role === role
}

export function authHeader(): Record<string, string> {
  const s = getSession()
  if (!s) return {}
  return { Authorization: `Bearer ${s.token}` }
}

export async function exportRfq(id: string, format: 'pdf' | 'xlsx'): Promise<void> {
  const res = await fetch(`/api/buyer/rfqs/${id}/export?format=${format}`, {
    method: 'GET',
    headers: { ...authHeader() },
  })
  if (!res.ok) return
  const blob = await res.blob()
  const url = window.URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `rfq-${id}.${format}`
  document.body.appendChild(a)
  a.click()
  a.remove()
  window.URL.revokeObjectURL(url)
}
