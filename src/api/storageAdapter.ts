/**
 * Storage Adapter — abstracts data persistence.
 * Currently uses localStorage for demo/testing, but structured to be easily replaced with API calls.
 */

export interface StorageAdapter {
  getItem<T>(key: string): T | null
  setItem<T>(key: string, value: T): void
  removeItem(key: string): void
}

export const localST: StorageAdapter = {
  getItem<T>(key: string): T | null {
    try {
      const val = localStorage.getItem(key)
      return val ? JSON.parse(val) : null
    } catch { return null }
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
  }
}

// In the future, this could be an ApiAdapter
export const dataStorage = localST
