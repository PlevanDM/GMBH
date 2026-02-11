/**
 * Storage Adapter — abstracts data persistence.
 * Currently uses localStorage for demo/testing, but structured to be easily replaced with API calls.
 */

export interface StorageAdapter {
  getItem<T>(key: string, fallback: T): T
  setItem<T>(key: string, value: T): void
  removeItem(key: string): void
  pushToList<T>(key: string, item: T): void
}

export const localST: StorageAdapter = {
  getItem<T>(key: string, fallback: T): T {
    try {
      const val = localStorage.getItem(key)
      if (val === null) return fallback
      return JSON.parse(val) as T
    } catch { return fallback }
  },
  setItem<T>(key: string, value: T): void {
    try {
      localStorage.setItem(key, JSON.stringify(value))
    } catch (e) { console.warn('Storage write failed', e) }
  },
  removeItem(key: string): void {
    try {
      localStorage.removeItem(key)
    } catch (e) { console.warn('Storage remove failed', e) }
  },
  pushToList<T>(key: string, item: T): void {
    const list = this.getItem<T[]>(key, [])
    list.push(item)
    this.setItem(key, list)
  }
}

// Rename for export consistency
export const dataStorage = localST
export const storageAdapter = localST
