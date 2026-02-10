/**
 * Полное тестирование сайта Restart B2B.
 * Запуск: node scripts/test-full.mjs
 * Опционально: TEST_BASE=http://localhost:5173 для HTTP-проверок маршрутов.
 */
import { readFileSync, existsSync, readdirSync } from 'fs'
import { execSync } from 'child_process'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = join(__dirname, '..')
const BASE = process.env.TEST_BASE || ''
let passed = 0
let failed = 0
const fails = []

function ok(name, cond, detail = '') {
  if (cond) {
    passed++
    console.log(`  ✓ ${name}${detail ? ` (${detail})` : ''}`)
    return true
  }
  failed++
  const msg = detail ? `${name} — ${detail}` : name
  fails.push(msg)
  console.log(`  ✗ ${msg}`)
  return false
}

function read(path) {
  return readFileSync(join(root, path), 'utf8')
}

function has(path) {
  return existsSync(join(root, path))
}

async function fetchOk(url) {
  try {
    const res = await fetch(url, { redirect: 'follow' })
    const text = await res.text()
    return res.ok && text.includes('root')
  } catch {
    return false
  }
}

console.log('\n========== ПОЛНОЕ ТЕСТИРОВАНИЕ ==========\n')

// ---- 1. Сборка и типы ----
console.log('--- 1. Сборка и TypeScript ---')
try {
  execSync('npm run build', { cwd: root, stdio: 'pipe' })
  ok('Build (npm run build)', true)
} catch (e) {
  ok('Build', false, e.message)
}
try {
  execSync('npx tsc --noEmit', { cwd: root, stdio: 'pipe' })
  ok('TypeScript (tsc --noEmit)', true)
} catch (e) {
  ok('TypeScript', false, e.message)
}

// ---- 2. Структура и точка входа ----
console.log('\n--- 2. Структура проекта ---')
ok('index.html существует', has('index.html'))
const indexHtml = read('index.html')
ok('index.html: id="root"', indexHtml.includes('id="root"'))
ok('index.html: viewport', indexHtml.includes('viewport'))
ok('index.html: script main', indexHtml.includes('main.tsx'))
ok('src/main.tsx', has('src/main.tsx'))
ok('src/App.tsx', has('src/App.tsx'))
ok('src/components/Layout.tsx', has('src/components/Layout.tsx'))

// ---- 3. Маршруты в App ----
console.log('\n--- 3. Маршруты (App.tsx) ---')
const app = read('src/App.tsx')
const routes = [
  'index element={<Home />}',
  'path="contacts"',
  'path="solutions"',
  'path="tools"',
  'path="marketplace/stock"',
  'path="buyer"',
  'path="my"',
  'path="faq"',
  'path="security-management"',
  'path="equipment-support"',
  'path="global-logistics"',
  'path="offices"',
  'path="impressum"',
  'path="privacy"',
  'element={<NotFound />}',
]
routes.forEach((r, i) => ok(`Маршрут ${i + 1}: ${r.slice(0, 30)}...`, app.includes(r)))

// ---- 4. Layout и Home ----
console.log('\n--- 4. Layout и главная ---')
const layout = read('src/components/Layout.tsx')
ok('Layout: Suspense', layout.includes('Suspense'))
ok('Layout: Outlet', layout.includes('Outlet'))
ok('Layout: Header, Footer', layout.includes('Header') && layout.includes('Footer'))
const home = read('src/pages/Home.tsx')
ok('Home: id="quote"', home.includes('id="quote"'))
ok('Home: id="callback"', home.includes('id="callback"'))
ok('Home: FeatureSection', home.includes('FeatureSection'))
ok('Home: BeamsBackground', home.includes('BeamsBackground'))

// ---- 5. Данные: knowledge ----
console.log('\n--- 5. База знаний (data/knowledge.ts) ---')
const knowledge = read('src/data/knowledge.ts')
ok('KNOWLEDGE_CATEGORIES', knowledge.includes('KNOWLEDGE_CATEGORIES'))
ok('KNOWLEDGE_ARTICLES', knowledge.includes('KNOWLEDGE_ARTICLES'))
ok('getArticleById', knowledge.includes('getArticleById'))
ok('getCategoryById', knowledge.includes('getCategoryById'))
ok('searchArticles', knowledge.includes('searchArticles'))
const categoryIds = [...knowledge.matchAll(/categoryId:\s*['"]([^'"]+)['"]/g)].map((m) => m[1])
const categoryDefs = [...knowledge.matchAll(/id:\s*['"]([^'"]+)['"].*order:/gs)].length
ok('Статьи привязаны к категориям', categoryIds.length >= 1)

// ---- 6. Данные: partners, NEXX ----
console.log('\n--- 6. Данные: partners и NEXX ---')
const partners = read('src/data/partners.ts')
ok('PARTNERS массив', partners.includes('PARTNERS'))
ok('RESTART_LOGO', partners.includes('RESTART_LOGO'))
const nexxPower = read('src/data/nexxPowerStations.ts')
ok('NEXX_POWER_STATIONS', nexxPower.includes('NEXX_POWER_STATIONS'))
const nexxPmic = read('src/data/nexxPmicReference.ts')
ok('NEXX_PMIC_REFERENCE, pmicBySeries', nexxPmic.includes('pmicBySeries'))

// ---- 7. Утилиты и store ----
console.log('\n--- 7. Утилиты и store ---')
ok('lib/utils.ts (cn)', has('src/lib/utils.ts'))
ok('marketplaceUrls', has('src/utils/marketplaceUrls.ts'))
ok('parseInventoryFile', has('src/utils/parseInventoryFile.ts'))
ok('inventoryStore', has('src/store/inventoryStore.tsx'))
ok('types/inventory', has('src/types/inventory.ts'))

// ---- 8. SEO ----
console.log('\n--- 8. SEO config ---')
const seo = read('src/seo/config.ts')
ok('SEO: путь /', seo.includes("'/':"))
ok('SEO: getPageSEO', seo.includes('getPageSEO'))
ok('SEO: canonical', seo.includes('canonical'))

// ---- 9. Публичные файлы и dist после сборки ----
console.log('\n--- 9. Публичные файлы ---')
ok('public/favicon.svg', has('public/favicon.svg'))
ok('public/robots.txt', has('public/robots.txt'))
ok('public/sitemap.xml', has('public/sitemap.xml'))
if (has('dist/index.html')) {
  ok('dist/index.html после сборки', true)
  const distIndex = read('dist/index.html')
  ok('dist: подключает assets/', distIndex.includes('/assets/'))
} else {
  ok('dist после сборки', false, 'запустите npm run build')
}

// ---- 10. Существование страниц (файлы) ----
console.log('\n--- 10. Страницы (файлы) ---')
const pages = [
  'src/pages/Home.tsx',
  'src/pages/Contacts.tsx',
  'src/pages/Solutions.tsx',
  'src/pages/Faq.tsx',
  'src/pages/NotFound.tsx',
  'src/pages/marketplace/Stock.tsx',
  'src/pages/tools/KnowledgeList.tsx',
  'src/pages/tools/KnowledgeArticlePage.tsx',
  'src/pages/tools/ReferencesNexx.tsx',
  'src/pages/buyer/BuyerLayout.tsx',
  'src/pages/my/MyLayout.tsx',
]
pages.forEach((p) => ok(p.replace('src/', ''), has(p)))

// ---- 11. HTTP (если задан TEST_BASE и сервер доступен) ----
let httpSkipped = false
if (BASE) {
  console.log('\n--- 11. HTTP: доступность маршрутов ---')
  const first = await fetchOk(BASE + '/')
  if (!first) {
    console.log('  (сервер недоступен, HTTP-тесты пропущены)')
    httpSkipped = true
  } else {
    const urls = ['/', '/contacts', '/solutions', '/tools/knowledge', '/marketplace/stock', '/faq', '/buyer', '/my']
    for (const path of urls) {
      const url = BASE + path
      const res = await fetchOk(url)
      ok(`GET ${path}`, res, res ? '200 + root' : 'нет ответа или нет root')
    }
  }
} else {
  console.log('\n--- 11. HTTP --- пропущено (задайте TEST_BASE=http://localhost:5173)')
  httpSkipped = true
}

// ---- Итог ----
const total = passed + failed
console.log('\n========== ИТОГ ==========')
console.log(`Пройдено: ${passed}`)
console.log(`Провалено: ${failed}`)
console.log(`Всего: ${total}`)
if (httpSkipped) console.log('HTTP-тесты: пропущены (нет сервера или TEST_BASE)')
if (fails.length > 0) {
  console.log('\nПроваленные тесты:')
  fails.forEach((f) => console.log('  -', f))
}
process.exit(failed > 0 ? 1 : 0)
