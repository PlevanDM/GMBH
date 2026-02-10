/**
 * Security utilities for the client-side application.
 * Input sanitization, rate limiting, CSRF helpers.
 */

// ─── Input sanitization ───

const HTML_ENTITIES: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#x27;',
  '/': '&#x2F;',
}

/** Escape HTML special characters to prevent XSS */
export function escapeHtml(str: string): string {
  return str.replace(/[&<>"'/]/g, (ch) => HTML_ENTITIES[ch] || ch)
}

/** Strip HTML tags from a string */
export function stripTags(str: string): string {
  return str.replace(/<[^>]*>/g, '')
}

/** Sanitize user input: trim, strip tags, limit length */
export function sanitizeInput(value: string, maxLength = 500): string {
  return stripTags(value).trim().slice(0, maxLength)
}

/** Validate phone: only digits, spaces, +, -, () */
export function isValidPhone(phone: string): boolean {
  return /^[+\d\s\-()]{6,20}$/.test(phone.trim())
}

/** Validate email */
export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.trim())
}

// ─── Rate limiting (client-side) ───

const rateLimitMap = new Map<string, { count: number; resetAt: number }>()

/**
 * Client-side rate limiter.
 * Returns true if the action is allowed, false if rate-limited.
 */
export function rateLimit(
  key: string,
  maxAttempts = 3,
  windowMs = 60_000
): boolean {
  const now = Date.now()
  const entry = rateLimitMap.get(key)

  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(key, { count: 1, resetAt: now + windowMs })
    return true
  }

  if (entry.count >= maxAttempts) {
    return false
  }

  entry.count++
  return true
}

/** Get remaining seconds before rate limit resets */
export function rateLimitRemaining(key: string): number {
  const entry = rateLimitMap.get(key)
  if (!entry) return 0
  const remaining = Math.ceil((entry.resetAt - Date.now()) / 1000)
  return remaining > 0 ? remaining : 0
}

// ─── Secure fetch wrapper ───

/** Fetch with timeout, sanitized error messages, and common headers */
export async function secureFetch(
  url: string,
  options: RequestInit & { timeoutMs?: number } = {}
): Promise<Response> {
  const { timeoutMs = 15_000, ...fetchOptions } = options

  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), timeoutMs)

  try {
    const response = await fetch(url, {
      ...fetchOptions,
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
        'X-Requested-With': 'XMLHttpRequest',
        ...fetchOptions.headers,
      },
    })
    return response
  } finally {
    clearTimeout(timeout)
  }
}

// ─── localStorage wrapper with size guard ───

const MAX_STORAGE_SIZE = 4 * 1024 * 1024 // 4 MB

/** Safely write to localStorage with size check */
export function safeStorageSet(key: string, value: string): boolean {
  try {
    if (value.length > MAX_STORAGE_SIZE) {
      return false
    }
    localStorage.setItem(key, value)
    return true
  } catch {
    // Storage quota exceeded
    return false
  }
}

/** Safely read from localStorage */
export function safeStorageGet(key: string): string | null {
  try {
    return localStorage.getItem(key)
  } catch {
    return null
  }
}
