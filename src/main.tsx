import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import './i18n/i18n'
import './index.css'
import { AuthProvider } from './auth/AuthContext'
import { InventoryProvider } from './store/inventoryStore'
import { BuyerProvider } from './store/buyerStore'
import App from './App'

const rootEl = document.getElementById('root')
if (!rootEl) {
  document.body.innerHTML =
    '<p style="padding:2rem;font-family:sans-serif;">Error: #root element not found.</p>'
} else {
  createRoot(rootEl).render(
    <StrictMode>
      <BrowserRouter>
        <AuthProvider>
          <InventoryProvider>
            <BuyerProvider>
              <App />
            </BuyerProvider>
          </InventoryProvider>
        </AuthProvider>
      </BrowserRouter>
    </StrictMode>,
  )
}

// ─── Service Worker registration with update handling ───
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/sw.js')
      .then((reg) => {
        // Check for updates every 30 minutes
        setInterval(() => reg.update(), 30 * 60 * 1000)

        // Notify when a new SW is waiting
        reg.addEventListener('updatefound', () => {
          const newWorker = reg.installing
          if (!newWorker) return
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              // New version available — auto-activate on next navigation
              newWorker.postMessage('SKIP_WAITING')
            }
          })
        })
      })
      .catch(() => {
        // SW registration failed — app works fine without it
      })
  })

  // Refresh page when new SW takes control
  let refreshing = false
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (!refreshing) {
      refreshing = true
      window.location.reload()
    }
  })
}

// ─── Performance: report long tasks in dev ───
if (import.meta.env.DEV && typeof PerformanceObserver !== 'undefined') {
  try {
    const obs = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (entry.duration > 50) {
          // eslint-disable-next-line no-console
          console.warn(`[Perf] Long task: ${entry.duration.toFixed(1)}ms`, entry)
        }
      }
    })
    obs.observe({ entryTypes: ['longtask'] })
  } catch {
    // PerformanceObserver not supported
  }
}
