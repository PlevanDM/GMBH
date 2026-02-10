/**
 * Smoke test: проверка основных маршрутов (SPA отдаёт index.html, проверяем 200 и наличие корня).
 * Запуск: node scripts/test-scenarios.mjs
 * Требуется запущенный dev (npm run dev) или preview (npm run preview). По умолчанию порт 5173.
 */
const BASE = process.env.TEST_BASE || 'http://localhost:5173'
const routes = ['/', '/contacts', '/solutions', '/tools/knowledge', '/marketplace/stock', '/faq', '/buyer', '/my']

async function run() {
  let failed = 0
  for (const path of routes) {
    const url = BASE + path
    try {
      const res = await fetch(url, { redirect: 'follow' })
      const text = await res.text()
      const ok = res.ok && (text.includes('id="root"') || text.includes('root'))
      if (!ok) {
        console.error(`FAIL ${path} status=${res.status} body length=${text.length}`)
        failed++
      } else {
        console.log(`OK   ${path}`)
      }
    } catch (e) {
      console.error(`FAIL ${path} ${e.message}`)
      failed++
    }
  }
  process.exit(failed > 0 ? 1 : 0)
}

run()
