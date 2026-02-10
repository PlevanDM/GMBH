/**
 * 20 последовательных тестов для сайта Restart B2B.
 * Запуск: node scripts/test-20.mjs
 * Для тестов 16–18 нужен запущенный сервер (npm run dev на порту 5173).
 */
import { readFileSync, existsSync } from 'fs'
import { execSync } from 'child_process'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = join(__dirname, '..')
let passed = 0
let failed = 0

function ok(name, cond, detail = '') {
  if (cond) {
    passed++
    console.log(`  ✓ ${name}${detail ? ` (${detail})` : ''}`)
    return true
  }
  failed++
  console.log(`  ✗ ${name}${detail ? ` — ${detail}` : ''}`)
  return false
}

function read(path) {
  return readFileSync(join(root, path), 'utf8')
}

function has(path) {
  return existsSync(join(root, path))
}

console.log('\n--- 20 тестов по очереди ---\n')

// 1. Сборка проходит
try {
  execSync('npm run build', { cwd: root, stdio: 'pipe' })
  ok('1. Build (npm run build)', true)
} catch (e) {
  ok('1. Build (npm run build)', false, e.message)
}

// 2. TypeScript без ошибок
try {
  execSync('npx tsc --noEmit', { cwd: root, stdio: 'pipe' })
  ok('2. TypeScript (tsc --noEmit)', true)
} catch (e) {
  ok('2. TypeScript (tsc --noEmit)', false, e.message)
}

// 3. index.html существует и содержит root
const indexHtml = has('index.html') ? read('index.html') : ''
ok('3. index.html есть и содержит id="root"', indexHtml.includes('id="root"'))

// 4. viewport в index.html
ok('4. index.html viewport', indexHtml.includes('viewport'))

// 5. Точка входа main.tsx
ok('5. src/main.tsx существует', has('src/main.tsx'))

// 6. App.tsx экспортирует маршруты
const app = read('src/App.tsx')
ok('6. App.tsx объявляет Routes', app.includes('<Routes>'))
ok('7. App.tsx маршрут /', app.includes('Route index element={<Home />}'))
ok('8. App.tsx маршрут /contacts', app.includes('path="contacts"'))
ok('9. App.tsx маршрут /tools', app.includes('path="tools"'))

// 10. Layout с Suspense и Outlet
const layout = read('src/components/Layout.tsx')
ok('10. Layout: Suspense и Outlet', layout.includes('Suspense') && layout.includes('Outlet'))

// 11. Home: секция #quote и якорь #callback
const home = read('src/pages/Home.tsx')
ok('11. Home: id="quote"', home.includes('id="quote"'))
ok('12. Home: id="callback"', home.includes('id="callback"'))

// 13. База знаний: категории и статьи
const knowledge = read('src/data/knowledge.ts')
ok('13. knowledge: KNOWLEDGE_CATEGORIES', knowledge.includes('KNOWLEDGE_CATEGORIES'))
ok('14. knowledge: getArticleById', knowledge.includes('getArticleById'))

// 15. Партнёры и лого
const partners = read('src/data/partners.ts')
ok('15. partners: PARTNERS и RESTART_LOGO', partners.includes('PARTNERS') && partners.includes('RESTART_LOGO'))

// 16. NEXX данные
const nexxPower = read('src/data/nexxPowerStations.ts')
ok('16. nexxPowerStations: массив данных', nexxPower.includes('NEXX_POWER_STATIONS'))
const nexxPmic = read('src/data/nexxPmicReference.ts')
ok('17. nexxPmicReference: pmicBySeries', nexxPmic.includes('pmicBySeries'))

// 18. Публичные файлы
ok('18. public/favicon.svg', has('public/favicon.svg'))
ok('19. public/robots.txt', has('public/robots.txt'))
ok('20. public/sitemap.xml', has('public/sitemap.xml'))

// Итог
console.log('\n--- Итог ---')
console.log(`Пройдено: ${passed}, провалено: ${failed}, всего: ${passed + failed}`)
process.exit(failed > 0 ? 1 : 0)
