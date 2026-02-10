import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import type { InventoryItem, InventoryBatch } from '../types/inventory'
import { getSeedTradeInItems } from '../data/seedTradeIn'
import { dataStorage as ds } from '../api/storageAdapter'

const STORAGE_KEY = 'restart-inventory'
const STORAGE_META_KEY = 'restart-inventory-meta'
const STORAGE_BATCHES_KEY = 'restart-inventory-batches'
/** Флаг: пользователь нажал «Очистить всё» — не подставлять сиды при пустом хранилище */
const STORAGE_CLEARED_FLAG = 'restart-inventory-user-cleared'
/** Seed data version — bump when seed data changes to force re-seed on next load */
const SEED_VERSION = 2
const SEED_VERSION_KEY = 'restart-seed-version'

interface InventoryMeta {
  lastUpdated: string | null
}

function loadBatches(): InventoryBatch[] {
  return ds.getItem<InventoryBatch[]>(STORAGE_BATCHES_KEY) || []
}

function saveBatches(batches: InventoryBatch[]) {
  ds.setItem(STORAGE_BATCHES_KEY, batches)
}

function loadFromStorage(): { items: InventoryItem[]; meta: InventoryMeta; batches: InventoryBatch[] } {
  const items: InventoryItem[] = ds.getItem<InventoryItem[]>(STORAGE_KEY) || []
  const meta: InventoryMeta = ds.getItem<InventoryMeta>(STORAGE_META_KEY) || { lastUpdated: null }
  const batches = loadBatches()
  const batchIds = new Set(batches.map((b) => b.id))
  const cleaned = items.map((it) => (it.batchId && !batchIds.has(it.batchId) ? { ...it, batchId: undefined } : it))

  if (cleaned.some((it, i) => it.batchId !== items[i]?.batchId))
    saveToStorage(cleaned, meta.lastUpdated)

  return { items: cleaned, meta, batches }
}

function saveToStorage(items: InventoryItem[], lastUpdated: string | null) {
  ds.setItem(STORAGE_KEY, items)
  ds.setItem(STORAGE_META_KEY, { lastUpdated })
}

interface InventoryContextValue {
  items: InventoryItem[]
  batches: InventoryBatch[]
  lastUpdated: string | null
  setItems: (items: InventoryItem[]) => void
  replaceItems: (items: InventoryItem[]) => void
  addItems: (items: InventoryItem[]) => void
  updateItem: (id: string, patch: Partial<InventoryItem>) => void
  removeItem: (id: string) => void
  getAvailable: () => InventoryItem[]
  addBatch: (batch: Omit<InventoryBatch, 'id' | 'createdAt'>) => InventoryBatch
  updateBatch: (id: string, patch: Partial<InventoryBatch>) => void
  removeBatch: (id: string) => void
  getBatchById: (id: string) => InventoryBatch | undefined
  /** Очистить весь инвентарь и батчи (для загрузки новых стоков с нуля) */
  clearAll: () => void
}

const InventoryContext = createContext<InventoryContextValue | null>(null)

export function InventoryProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState(loadFromStorage)

  const setItems = useCallback((items: InventoryItem[]) => {
    if (items.length > 0) {
      ds.removeItem(STORAGE_CLEARED_FLAG)
    }
    const now = new Date().toISOString()
    setState((prev) => {
      const next = { ...prev, items, meta: { lastUpdated: now } }
      saveToStorage(items, now)
      return next
    })
  }, [])

  const replaceItems = useCallback((items: InventoryItem[]) => {
    setItems(items)
  }, [setItems])

  const addItems = useCallback((newItems: InventoryItem[]) => {
    ds.removeItem(STORAGE_CLEARED_FLAG)
    const now = new Date().toISOString()
    setState((prev) => {
      const items = [...prev.items, ...newItems]
      saveToStorage(items, now)
      return { ...prev, items, meta: { lastUpdated: now } }
    })
  }, [])

  const updateItem = useCallback((id: string, patch: Partial<InventoryItem>) => {
    const now = new Date().toISOString()
    setState((prev) => {
      const items = prev.items.map((it) =>
        it.id === id ? { ...it, ...patch, updatedAt: now } : it
      )
      saveToStorage(items, now)
      return { ...prev, items, meta: { lastUpdated: now } }
    })
  }, [])

  const removeItem = useCallback((id: string) => {
    const now = new Date().toISOString()
    setState((prev) => {
      const items = prev.items.filter((it) => it.id !== id)
      saveToStorage(items, now)
      return { ...prev, items, meta: { lastUpdated: now } }
    })
  }, [])

  const getAvailable = useCallback(
    () => state.items.filter((it) => it.status === 'available'),
    [state.items]
  )

  const addBatch = useCallback((batch: Omit<InventoryBatch, 'id' | 'createdAt'>): InventoryBatch => {
    const now = new Date().toISOString()
    const newBatch: InventoryBatch = {
      ...batch,
      id: crypto.randomUUID(),
      createdAt: now,
    }
    setState((prev) => {
      const batches = [...prev.batches, newBatch]
      saveBatches(batches)
      return { ...prev, batches }
    })
    return newBatch
  }, [])

  const updateBatch = useCallback((id: string, patch: Partial<InventoryBatch>) => {
    setState((prev) => {
      const batches = prev.batches.map((b) => (b.id === id ? { ...b, ...patch } : b))
      saveBatches(batches)
      return { ...prev, batches }
    })
  }, [])

  const removeBatch = useCallback((id: string) => {
    setState((prev) => {
      const batches = prev.batches.filter((b) => b.id !== id)
      saveBatches(batches)
      const items = prev.items.map((it) => (it.batchId === id ? { ...it, batchId: undefined } : it))
      saveToStorage(items, prev.meta.lastUpdated)
      return { ...prev, batches, items }
    })
  }, [])

  const getBatchById = useCallback(
    (id: string) => state.batches.find((b) => b.id === id),
    [state.batches]
  )

  const clearAll = useCallback(() => {
    const now = new Date().toISOString()
    ds.setItem(STORAGE_KEY, [])
    ds.setItem(STORAGE_META_KEY, { lastUpdated: now })
    saveBatches([])
    ds.setItem(STORAGE_CLEARED_FLAG, '1')
    setState({ items: [], batches: [], meta: { lastUpdated: now } })
  }, [])

  const value = useMemo<InventoryContextValue>(
    () => ({
      items: state.items,
      batches: state.batches,
      lastUpdated: state.meta.lastUpdated,
      setItems,
      replaceItems,
      addItems,
      updateItem,
      removeItem,
      getAvailable,
      addBatch,
      updateBatch,
      removeBatch,
      getBatchById,
      clearAll,
    }),
    [
      state.items,
      state.batches,
      state.meta.lastUpdated,
      setItems,
      replaceItems,
      addItems,
      updateItem,
      removeItem,
      getAvailable,
      addBatch,
      updateBatch,
      removeBatch,
      getBatchById,
      clearAll,
    ]
  )

  return (
    <InventoryContext.Provider value={value}>
      <LoadSeedIfEmpty />
      {children}
    </InventoryContext.Provider>
  )
}

function LoadSeedIfEmpty() {
  const { items, replaceItems } = useInventory()
  useEffect(() => {
    // Check seed version — re-seed if outdated or empty
    const storedVersion = Number(ds.getItem(SEED_VERSION_KEY)) || 0
    const userCleared = ds.getItem(STORAGE_CLEARED_FLAG) === '1'

    const needReseed = !userCleared && (items.length === 0 || storedVersion < SEED_VERSION)

    if (needReseed) {
      replaceItems(getSeedTradeInItems())
      ds.setItem(SEED_VERSION_KEY, String(SEED_VERSION))
    }
  }, [])
  return null
}

export function useInventory() {
  const ctx = useContext(InventoryContext)
  if (!ctx) throw new Error('useInventory must be used within InventoryProvider')
  return ctx
}

export function useInventoryOptional() {
  return useContext(InventoryContext)
}
