import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import type { InventoryItem } from '../types/inventory'
import {
  getCategories,
  getLocations,
  suggestBrandFromDescription,
  normalizeLocationKey,
} from '../data/catalogs'
import { getDemoImageUrl } from '../data/demoImages'
import { dataStorage as ds } from '../api/storageAdapter'
import { estimatePrice, parseDeviceFromQuery } from '../utils/priceEstimator'
import type {
  BuyerCompany,
  BuyerUser,
  BuyerNotificationSettings,
  StockItem,
  StockFilter,
  StockCurrency,
  Rfq,
  RfqItem,
  RfqStatus,
  RfqStatusHistory,
  RfqMessage,
  StockCondition,
} from '../types/buyer'

const PREFIX = 'restart-buyer'
const KEYS = {
  company: `${PREFIX}-company`,
  users: `${PREFIX}-users`,
  rfqs: `${PREFIX}-rfqs`,
  history: `${PREFIX}-rfq-history`,
  messages: `${PREFIX}-rfq-messages`,
  notifications: `${PREFIX}-notifications`,
} as const

const DEFAULT_COMPANY_ID = 'company-1'
const DEFAULT_USER_ID = 'user-1'

function loadJson<T>(key: string, fallback: T): T {
  return ds.getItem<T>(key, fallback)
}

function saveJson(key: string, value: unknown) {
  ds.setItem(key, value)
}

const defaultCompany: BuyerCompany = {
  id: DEFAULT_COMPANY_ID,
  name: 'ООО Покупатель',
  legalName: 'Общество с ограниченной ответственностью «Покупатель»',
  vatNumber: null,
  registrationNumber: '1234567890',
  legalAddress: 'Киев, ул. Примерная, 1',
  billingAddress: null,
  logisticsContact: 'Иванов И.И.',
  logisticsPhone: '+7 (495) 000-00-00',
  billingEmail: 'billing@example.com',
  logoUrl: null,
  creditLimit: 1_000_000,
  currentCreditUsed: 120_000,
  paymentTerms: '14 days',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
}

const defaultUser: BuyerUser = {
  id: DEFAULT_USER_ID,
  companyId: DEFAULT_COMPANY_ID,
  email: 'buyer@example.com',
  fullName: 'Менеджер Покупатель',
  phone: null,
  role: 'OWNER',
  isActive: true,
  createdAt: new Date().toISOString(),
}

const defaultNotifications: BuyerNotificationSettings = {
  companyId: DEFAULT_COMPANY_ID,
  channels: ['EMAIL'],
  notifyOnNewStock: true,
  notifyOnRequestStatusChange: true,
  notifyOnQuoteExpiring: true,
}

function mapCondition(s?: string): StockCondition {
  if (!s) return 'USED'
  const u = s.toUpperCase()
  if (u.includes('NEW') || u === 'A') return 'NEW'
  if (u.includes('REFURB') || u === 'B') return 'REFURBISHED'
  if (u.includes('PARTS') || u === 'C') return 'FOR_PARTS'
  return 'USED'
}

/** Строит витрину из инвентаря + мок персональных цен (часть позиций с buyerPrice). */
export function buildStockFromInventory(
  inventoryItems: InventoryItem[],
  companyId: string,
  filter?: StockFilter
): StockItem[] {
  const locations = getLocations()
  const categories = getCategories()
  let list: StockItem[] = inventoryItems
    .filter((it) => it.status === 'available')
    .map((it, i) => {
      // Use smart estimation instead of random high numbers
      const device = parseDeviceFromQuery(it.brand || '', it.description || '')
      const estimatedRetail = estimatePrice(device, 'retail').mid
      const fallbackPrice = estimatedRetail > 0 ? estimatedRetail : 450

      const basePrice = it.price != null && it.price > 0 ? Math.round(it.price) : fallbackPrice
      const hasMyPrice = (it.id.length + companyId.length) % 3 === 0
      const brand =
        it.brand ||
        suggestBrandFromDescription(it.description) ||
        'Other'
      const ram = it.ram_raw ?? (it.laptopRamGb != null ? `${it.laptopRamGb} GB` : undefined)
      const video = it.gpu_raw ?? it.laptopGpuType
      const battery = it.batteryCycles ?? it.batteryHealth ?? undefined
      return {
        id: it.id,
        sku: it.sku || it.inventoryNumber || it.id.slice(0, 8),
        model: it.description,
        brand,
        category: it.category || (categories as readonly string[])[i % categories.length],
        condition: mapCondition(it.condition),
        quantityAvailable: it.quantity != null && it.quantity >= 0 ? Math.floor(it.quantity) : 1 + (i % 20),
        location: normalizeLocationKey(it.location || (locations as readonly string[])[i % locations.length]),
        basePrice,
        buyerPrice: hasMyPrice ? Math.round(basePrice * 0.92) : null,
        currency: 'EUR' as StockCurrency,
        minOrderQty: 1,
        lotSize: null,
        images: [getDemoImageUrl(i, brand, it.category)],
        labels: hasMyPrice ? ['Personal price'] : [],
        updatedAt: it.updatedAt,
        processor: it.processor,
        ram,
        video,
        battery,
      }
    })

  if (filter?.search) {
    const q = filter.search.toLowerCase()
    list = list.filter(
      (s) =>
        s.sku.toLowerCase().includes(q) ||
        s.model.toLowerCase().includes(q) ||
        s.brand.toLowerCase().includes(q)
    )
  }
  if (filter?.brand?.length) {
    const set = new Set(filter.brand)
    list = list.filter((s) => set.has(s.brand))
  }
  if (filter?.category?.length) {
    const set = new Set(filter.category)
    list = list.filter((s) => set.has(s.category))
  }
  if (filter?.condition?.length) {
    const set = new Set(filter.condition)
    list = list.filter((s) => set.has(s.condition))
  }
  if (filter?.location?.length) {
    const set = new Set(filter.location)
    list = list.filter((s) => set.has(s.location))
  }
  if (filter?.showOnlyMyPrice) {
    list = list.filter((s) => s.buyerPrice != null)
  }
  return list
}

export interface BuyerStoreValue {
  company: BuyerCompany
  currentUser: BuyerUser
  notificationSettings: BuyerNotificationSettings
  users: BuyerUser[]
  rfqs: Rfq[]
  updateCompany: (patch: Partial<BuyerCompany>) => void
  updateNotificationSettings: (patch: Partial<BuyerNotificationSettings>) => void
  getRfqById: (id: string) => Rfq | undefined
  getRfqStatusHistory: (rfqId: string) => RfqStatusHistory[]
  getRfqMessages: (rfqId: string) => RfqMessage[]
  addRfqMessage: (rfqId: string, message: string, attachments?: string[]) => void
  createRfq: (payload: { title: string; comment?: string | null; desiredDeliveryDate?: string | null; items: Omit<RfqItem, 'id' | 'rfqId'>[] }) => Rfq
  updateRfq: (id: string, payload: Partial<Pick<Rfq, 'title' | 'comment' | 'desiredDeliveryDate' | 'items'>>) => void
  sendRfq: (id: string) => void
  approveRfq: (id: string) => void
  rejectRfq: (id: string) => void
  cancelRfq: (id: string) => void
  /** Seller: mark as under review */
  reviewRfq: (id: string) => void
  /** Seller: send quote (QUOTED status) */
  quoteRfq: (id: string) => void
  /** Seller: close RFQ */
  closeRfq: (id: string) => void
  deleteRfq: (id: string) => void
  removeRfqItem: (rfqId: string, itemId: string) => void
  updateRfqItem: (rfqId: string, itemId: string, patch: Partial<Pick<RfqItem, 'quantity' | 'targetPrice' | 'description'>>) => void
  duplicateRfq: (id: string) => Rfq
  addRfqStatusHistory: (rfqId: string, status: RfqStatus, comment?: string | null) => void
  bulkQuoteFromStock: (stockItemIds: string[], stockItems: StockItem[], options?: { comment?: string | null; desiredDeliveryDate?: string | null }) => Rfq
  addUser: (user: Omit<BuyerUser, 'id' | 'companyId' | 'createdAt'>) => BuyerUser
  updateUser: (id: string, patch: Partial<BuyerUser>) => void
  deleteUser: (id: string) => void
}

const BuyerContext = createContext<BuyerStoreValue | null>(null)

export function BuyerProvider({ children }: { children: ReactNode }) {
  const [company, setCompany] = useState<BuyerCompany>(() => loadJson(KEYS.company, defaultCompany))
  const [users, setUsers] = useState<BuyerUser[]>(() => loadJson(KEYS.users, [defaultUser]))
  const [rfqs, setRfqs] = useState<Rfq[]>(() => loadJson(KEYS.rfqs, []))
  const [history, setHistory] = useState<RfqStatusHistory[]>(() => loadJson(KEYS.history, []))
  const [messages, setMessages] = useState<RfqMessage[]>(() => loadJson(KEYS.messages, []))
  const [notificationSettings, setNotificationSettings] = useState<BuyerNotificationSettings>(() =>
    loadJson(KEYS.notifications, defaultNotifications)
  )

  const currentUser = useMemo(() => users.find((u) => u.id === DEFAULT_USER_ID) ?? defaultUser, [users])

  const persistCompany = useCallback((next: BuyerCompany) => {
    setCompany(next)
    saveJson(KEYS.company, next)
  }, [])
  const persistUsers = useCallback((next: BuyerUser[]) => {
    setUsers(next)
    saveJson(KEYS.users, next)
  }, [])
  const persistNotifications = useCallback((next: BuyerNotificationSettings) => {
    setNotificationSettings(next)
    saveJson(KEYS.notifications, next)
  }, [])

  const updateCompany = useCallback(
    (patch: Partial<BuyerCompany>) => {
      const next = { ...company, ...patch, updatedAt: new Date().toISOString() }
      persistCompany(next)
    },
    [company, persistCompany]
  )

  const updateNotificationSettings = useCallback(
    (patch: Partial<BuyerNotificationSettings>) => {
      persistNotifications({ ...notificationSettings, ...patch })
    },
    [notificationSettings, persistNotifications]
  )

  const getRfqById = useCallback(
    (id: string) => rfqs.find((r) => r.id === id),
    [rfqs]
  )

  const getRfqStatusHistory = useCallback(
    (rfqId: string) => history.filter((h) => h.rfqId === rfqId).sort((a, b) => a.changedAt.localeCompare(b.changedAt)),
    [history]
  )

  const getRfqMessages = useCallback(
    (rfqId: string) => messages.filter((m) => m.rfqId === rfqId).sort((a, b) => a.createdAt.localeCompare(b.createdAt)),
    [messages]
  )

  const addRfqMessage = useCallback(
    (rfqId: string, message: string, attachments: string[] = []) => {
      const msg: RfqMessage = {
        id: crypto.randomUUID(),
        rfqId,
        authorType: 'BUYER',
        authorId: currentUser.id,
        message,
        attachments,
        createdAt: new Date().toISOString(),
      }
      const next = [...messages, msg]
      setMessages(next)
      saveJson(KEYS.messages, next)
    },
    [messages, currentUser.id]
  )

  const addRfqStatusHistory = useCallback(
    (rfqId: string, status: RfqStatus, comment?: string | null) => {
      const entry: RfqStatusHistory = {
        id: crypto.randomUUID(),
        rfqId,
        status,
        changedByUserId: currentUser.id,
        changedAt: new Date().toISOString(),
        comment: comment ?? null,
      }
      const next = [...history, entry]
      setHistory(next)
      saveJson(KEYS.history, next)
    },
    [history, currentUser.id]
  )

  const createRfq = useCallback(
    (payload: {
      title: string
      comment?: string | null
      desiredDeliveryDate?: string | null
      items: Omit<RfqItem, 'id' | 'rfqId'>[]
    }): Rfq => {
      const id = crypto.randomUUID()
      const now = new Date().toISOString()
      const items: RfqItem[] = payload.items.map((it) => ({
        ...it,
        id: crypto.randomUUID(),
        rfqId: id,
      }))
      const rfq: Rfq = {
        id,
        companyId: company.id,
        createdByUserId: currentUser.id,
        status: 'DRAFT',
        title: payload.title,
        comment: payload.comment ?? null,
        desiredDeliveryDate: payload.desiredDeliveryDate ?? null,
        createdAt: now,
        updatedAt: now,
        expiresAt: null,
        items,
      }
      const next = [...rfqs, rfq]
      setRfqs(next)
      saveJson(KEYS.rfqs, next)
      addRfqStatusHistory(id, 'DRAFT')
      return rfq
    },
    [company.id, currentUser.id, rfqs, addRfqStatusHistory]
  )

  const updateRfq = useCallback(
    (id: string, payload: Partial<Pick<Rfq, 'title' | 'comment' | 'desiredDeliveryDate' | 'items'>>) => {
      const r = rfqs.find((x) => x.id === id)
      if (!r || r.status !== 'DRAFT') return
      const nextList = rfqs.map((x) =>
        x.id === id
          ? {
              ...x,
              ...payload,
              items: payload.items ?? x.items,
              updatedAt: new Date().toISOString(),
            }
          : x
      )
      setRfqs(nextList)
      saveJson(KEYS.rfqs, nextList)
    },
    [rfqs]
  )

  const sendRfq = useCallback(
    (id: string) => {
      const next = rfqs.map((r) =>
        r.id === id ? { ...r, status: 'SENT' as const, updatedAt: new Date().toISOString() } : r
      )
      setRfqs(next)
      saveJson(KEYS.rfqs, next)
      addRfqStatusHistory(id, 'SENT')
    },
    [rfqs, addRfqStatusHistory]
  )

  const approveRfq = useCallback(
    (id: string) => {
      const next = rfqs.map((r: Rfq) =>
        r.id === id ? { ...r, status: 'APPROVED_BY_BUYER' as const, updatedAt: new Date().toISOString() } : r
      )
      setRfqs(next)
      saveJson(KEYS.rfqs, next)
      addRfqStatusHistory(id, 'APPROVED_BY_BUYER')
    },
    [rfqs, addRfqStatusHistory]
  )

  const rejectRfq = useCallback(
    (id: string) => {
      const next = rfqs.map((r) =>
        r.id === id ? { ...r, status: 'REJECTED_BY_BUYER' as const, updatedAt: new Date().toISOString() } : r
      )
      setRfqs(next)
      saveJson(KEYS.rfqs, next)
      addRfqStatusHistory(id, 'REJECTED_BY_BUYER')
    },
    [rfqs, addRfqStatusHistory]
  )

  const cancelRfq = useCallback(
    (id: string) => {
      const next = rfqs.map((r) =>
        r.id === id ? { ...r, status: 'CANCELLED' as const, updatedAt: new Date().toISOString() } : r
      )
      setRfqs(next)
      saveJson(KEYS.rfqs, next)
      addRfqStatusHistory(id, 'CANCELLED')
    },
    [rfqs, addRfqStatusHistory]
  )

  const reviewRfq = useCallback(
    (id: string) => {
      const next = rfqs.map((r) =>
        r.id === id ? { ...r, status: 'UNDER_REVIEW' as const, updatedAt: new Date().toISOString() } : r
      )
      setRfqs(next)
      saveJson(KEYS.rfqs, next)
      addRfqStatusHistory(id, 'UNDER_REVIEW')
    },
    [rfqs, addRfqStatusHistory]
  )

  const quoteRfq = useCallback(
    (id: string) => {
      const next = rfqs.map((r) =>
        r.id === id ? { ...r, status: 'QUOTED' as const, updatedAt: new Date().toISOString() } : r
      )
      setRfqs(next)
      saveJson(KEYS.rfqs, next)
      addRfqStatusHistory(id, 'QUOTED')
    },
    [rfqs, addRfqStatusHistory]
  )

  const closeRfq = useCallback(
    (id: string) => {
      const next = rfqs.map((r) =>
        r.id === id ? { ...r, status: 'CLOSED' as const, updatedAt: new Date().toISOString() } : r
      )
      setRfqs(next)
      saveJson(KEYS.rfqs, next)
      addRfqStatusHistory(id, 'CLOSED')
    },
    [rfqs, addRfqStatusHistory]
  )

  const deleteRfq = useCallback(
    (id: string) => {
      const next = rfqs.filter((r) => r.id !== id)
      setRfqs(next)
      saveJson(KEYS.rfqs, next)
      // Also clean up history and messages
      const nextHistory = history.filter((h) => h.rfqId !== id)
      setHistory(nextHistory)
      saveJson(KEYS.history, nextHistory)
      const nextMessages = messages.filter((m) => m.rfqId !== id)
      setMessages(nextMessages)
      saveJson(KEYS.messages, nextMessages)
    },
    [rfqs, history, messages]
  )

  const removeRfqItem = useCallback(
    (rfqId: string, itemId: string) => {
      const r = rfqs.find((x) => x.id === rfqId)
      if (!r || r.status !== 'DRAFT') return
      const nextItems = r.items.filter((it) => it.id !== itemId)
      const nextList = rfqs.map((x) =>
        x.id === rfqId ? { ...x, items: nextItems, updatedAt: new Date().toISOString() } : x
      )
      setRfqs(nextList)
      saveJson(KEYS.rfqs, nextList)
    },
    [rfqs]
  )

  const updateRfqItem = useCallback(
    (rfqId: string, itemId: string, patch: Partial<Pick<RfqItem, 'quantity' | 'targetPrice' | 'description'>>) => {
      const r = rfqs.find((x) => x.id === rfqId)
      if (!r || r.status !== 'DRAFT') return
      const nextItems = r.items.map((it) => (it.id === itemId ? { ...it, ...patch } : it))
      const nextList = rfqs.map((x) =>
        x.id === rfqId ? { ...x, items: nextItems, updatedAt: new Date().toISOString() } : x
      )
      setRfqs(nextList)
      saveJson(KEYS.rfqs, nextList)
    },
    [rfqs]
  )

  const duplicateRfq = useCallback(
    (id: string): Rfq => {
      const src = rfqs.find((r) => r.id === id)
      if (!src) throw new Error('RFQ not found')
      return createRfq({
        title: `${src.title} (copy)`,
        comment: src.comment,
        desiredDeliveryDate: src.desiredDeliveryDate,
        items: src.items.map((it) => ({
          stockItemId: it.stockItemId,
          description: it.description,
          quantity: it.quantity,
          targetPrice: it.targetPrice,
          currency: it.currency,
        })),
      })
    },
    [rfqs, createRfq]
  )

  const bulkQuoteFromStock = useCallback(
    (
      stockItemIds: string[],
      stockItems: StockItem[],
      options?: { comment?: string | null; desiredDeliveryDate?: string | null }
    ): Rfq => {
      const items = stockItemIds
        .map((sid) => stockItems.find((s) => s.id === sid))
        .filter(Boolean) as StockItem[]
      const rfqItems: Omit<RfqItem, 'id' | 'rfqId'>[] = items.map((s) => ({
        stockItemId: s.id,
        description: `${s.brand} ${s.model} (${s.sku})`,
        quantity: s.minOrderQty,
        targetPrice: s.buyerPrice ?? s.basePrice,
        currency: s.currency,
      }))
      const title = items.length === 1
        ? `Request: ${items[0].brand} ${items[0].model}`
        : `Request: ${items.length} items`
      return createRfq({
        title,
        items: rfqItems,
        comment: options?.comment ?? null,
        desiredDeliveryDate: options?.desiredDeliveryDate ?? null,
      })
    },
    [createRfq]
  )

  const addUser = useCallback(
    (user: Omit<BuyerUser, 'id' | 'companyId' | 'createdAt'>): BuyerUser => {
      const newUser: BuyerUser = {
        ...user,
        id: crypto.randomUUID(),
        companyId: company.id,
        createdAt: new Date().toISOString(),
      }
      const next = [...users, newUser]
      persistUsers(next)
      return newUser
    },
    [company.id, users, persistUsers]
  )

  const updateUser = useCallback(
    (id: string, patch: Partial<BuyerUser>) => {
      persistUsers(users.map((u) => (u.id === id ? { ...u, ...patch } : u)))
    },
    [users, persistUsers]
  )

  const deleteUser = useCallback(
    (id: string) => {
      persistUsers(users.filter((u) => u.id !== id))
    },
    [users, persistUsers]
  )

  const value = useMemo<BuyerStoreValue>(
    () => ({
      company,
      currentUser,
      notificationSettings,
      users,
      rfqs,
      updateCompany,
      updateNotificationSettings,
      getRfqById,
      getRfqStatusHistory,
      getRfqMessages,
      addRfqMessage,
      createRfq,
      updateRfq,
      sendRfq,
      approveRfq,
      rejectRfq,
      cancelRfq,
      reviewRfq,
      quoteRfq,
      closeRfq,
      deleteRfq,
      removeRfqItem,
      updateRfqItem,
      duplicateRfq,
      addRfqStatusHistory,
      bulkQuoteFromStock,
      addUser,
      updateUser,
      deleteUser,
    }),
    [
      company,
      currentUser,
      notificationSettings,
      users,
      rfqs,
      updateCompany,
      updateNotificationSettings,
      getRfqById,
      getRfqStatusHistory,
      getRfqMessages,
      addRfqMessage,
      createRfq,
      updateRfq,
      sendRfq,
      approveRfq,
      rejectRfq,
      cancelRfq,
      reviewRfq,
      quoteRfq,
      closeRfq,
      deleteRfq,
      removeRfqItem,
      updateRfqItem,
      duplicateRfq,
      addRfqStatusHistory,
      bulkQuoteFromStock,
      addUser,
      updateUser,
      deleteUser,
    ]
  )

  return <BuyerContext.Provider value={value}>{children}</BuyerContext.Provider>
}

export function useBuyer() {
  const ctx = useContext(BuyerContext)
  if (!ctx) throw new Error('useBuyer must be used within BuyerProvider')
  return ctx
}

export function useBuyerOptional() {
  return useContext(BuyerContext)
}
