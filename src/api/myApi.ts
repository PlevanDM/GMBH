import { authHeader } from '../auth/session'

export async function uploadInventoryFile(file: File): Promise<unknown | null> {
  const form = new FormData()
  form.append('file', file)
  const res = await fetch('/api/my/inventory/import', {
    method: 'POST',
    headers: { ...authHeader() },
    body: form,
  })
  if (!res.ok) return null
  return res.json()
}

/** Скачивает CSV по URL экспорта Google Таблицы (через прокси, обход CORS). */
export async function fetchGoogleSheetsCsv(exportUrl: string): Promise<string> {
  const res = await fetch(
    `/api/my/inventory/google-sheets?url=${encodeURIComponent(exportUrl)}`,
    { headers: { ...authHeader() } }
  )
  if (!res.ok) {
    const t = await res.text()
    throw new Error(t || `Ошибка загрузки: ${res.status}`)
  }
  return res.text()
}
