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

import { exportRfqToExcel, exportRfqToPdf } from '../utils/exportRfq'

export async function exportRfq(id: string, format: 'pdf' | 'xlsx'): Promise<void> {
  // In a real app, this would be an API call.
  // For now, we fetch from the store and use our client-side utility.
  // Note: this assumes we can access the store data.
  // Since we are in a SPA with localStorage stores, we can just load from localStorage here
  // or let the components handle it.
  // To keep session.ts clean, we'll implement a basic redirect for now.

  const rfqsRaw = localStorage.getItem('restart-buyer-rfqs')
  if (!rfqsRaw) return
  try {
    const rfqs = JSON.parse(rfqsRaw)
    const rfq = rfqs.find((r: any) => r.id === id)
    if (!rfq) return

    if (format === 'xlsx') {
      exportRfqToExcel(rfq)
    } else {
      await exportRfqToPdf(rfq)
    }
  } catch (e) {
    console.error('Export failed', e)
  }
}
