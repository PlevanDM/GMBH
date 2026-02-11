/**
 * Типы кабинета оптового покупателя (контракт API / модель данных).
 */

export type BuyerUserRole = 'OWNER' | 'BUYER' | 'FINANCE'

export interface BuyerCompany {
  id: string
  name: string
  legalName: string | null
  vatNumber: string | null
  registrationNumber: string | null
  legalAddress: string | null
  billingAddress: string | null
  logisticsContact: string | null
  logisticsPhone: string | null
  billingEmail: string | null
  logoUrl: string | null
  creditLimit: number | null
  currentCreditUsed: number | null
  paymentTerms: string | null
  createdAt: string
  updatedAt: string
}

export interface BuyerUser {
  id: string
  companyId: string
  email: string
  fullName: string
  phone: string | null
  role: BuyerUserRole
  isActive: boolean
  createdAt: string
}

export type NotificationChannel = 'EMAIL' | 'TELEGRAM'

export interface BuyerNotificationSettings {
  companyId: string
  channels: NotificationChannel[]
  notifyOnNewStock: boolean
  notifyOnRequestStatusChange: boolean
  notifyOnQuoteExpiring: boolean
}

// --- Витрина (stock) ---
export type StockCondition = 'NEW' | 'USED' | 'REFURBISHED' | 'FOR_PARTS'

export type StockCurrency = 'EUR' | 'UAH' | 'USD'

export interface StockItem {
  id: string
  sku: string
  model: string
  brand: string
  category: string
  condition: StockCondition
  quantityAvailable: number
  location: string
  basePrice: number
  buyerPrice: number | null
  currency: StockCurrency
  minOrderQty: number
  lotSize: number | null
  images: string[]
  labels: string[]
  updatedAt: string
  /** Характеристики для отображения в карточке/таблице без перехода */
  processor?: string
  ram?: string
  video?: string
  battery?: string
}

export interface StockFilter {
  search?: string
  brand?: string[]
  category?: string[]
  condition?: string[]
  location?: string[]
  showOnlyMyPrice?: boolean
}

// --- RFQ ---
export type RfqStatus =
  | 'DRAFT'
  | 'SENT'
  | 'UNDER_REVIEW'
  | 'QUOTED'
  | 'APPROVED_BY_BUYER'
  | 'REJECTED_BY_BUYER'
  | 'CLOSED'
  | 'CANCELLED'

export interface RfqItem {
  id: string
  rfqId: string
  stockItemId: string | null
  description: string
  sku?: string | null
  quantity: number
  targetPrice: number | null
  currency: string
  inventoryNumber?: string | null
  serialNumber?: string | null
}

export interface RfqQuoteItem {
  id: string
  rfqItemId: string
  offeredPrice: number
  currency: string
  minOrderQty: number | null
  availableQty: number | null
}

export interface Rfq {
  id: string
  companyId: string
  createdByUserId: string
  status: RfqStatus
  title: string
  comment: string | null
  desiredDeliveryDate: string | null
  createdAt: string
  updatedAt: string
  expiresAt: string | null
  items: RfqItem[]
  quoteItems?: RfqQuoteItem[]
}

export interface RfqStatusHistory {
  id: string
  rfqId: string
  status: RfqStatus
  changedByUserId: string | null
  changedAt: string
  comment: string | null
}

export type RfqMessageAuthorType = 'BUYER' | 'SELLER' | 'SYSTEM'

export interface RfqMessage {
  id: string
  rfqId: string
  authorType: RfqMessageAuthorType
  authorId: string | null
  message: string
  attachments: string[]
  createdAt: string
}
