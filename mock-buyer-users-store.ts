/**
 * Общее хранилище созданных пользователей кабинета покупателя (только для dev-моков).
 * Используется плагинами mock-buyer-users и mock-auth.
 */
export type BuyerUser = {
  id: string
  email: string
  name?: string
  company?: string
  createdAt: string
  active: boolean
}

const users: BuyerUser[] = []
const passwordsByEmail = new Map<string, string>()

function id() {
  return `bu_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`
}

export function getBuyerUsers(): BuyerUser[] {
  return [...users]
}

export function addBuyerUser(data: {
  email: string
  password?: string
  name?: string
  company?: string
}): BuyerUser {
  const email = data.email.trim()
  const user: BuyerUser = {
    id: id(),
    email,
    name: data.name?.trim() || undefined,
    company: data.company?.trim() || undefined,
    createdAt: new Date().toISOString(),
    active: true,
  }
  users.push(user)
  if (data.password != null && data.password !== '') {
    passwordsByEmail.set(email.toLowerCase(), data.password)
  }
  return user
}

export function findBuyerUserByEmail(email: string): BuyerUser | undefined {
  const lower = email.trim().toLowerCase()
  return users.find((u) => u.email.toLowerCase() === lower)
}

export function checkBuyerPassword(email: string, password: string): boolean {
  const lower = email.trim().toLowerCase()
  const stored = passwordsByEmail.get(lower)
  if (stored == null) return false
  return stored === password
}
