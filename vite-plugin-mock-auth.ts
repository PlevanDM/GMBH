/**
 * В режиме dev подменяет API входа.
 * Кабинет покупателя: вход по созданным пользователям (email + пароль из «Управление пользователями») или демо пароль 0909.
 * Мой кабинет: PIN 0909. Инструменты: пароль 0909.
 */
import type { Plugin } from 'vite'
import { checkBuyerPassword } from './mock-buyer-users-store'

const DEMO_PASSWORD = '0909'
const DEMO_PIN = '0909'

function parseBody(req: import('http').IncomingMessage): Promise<Record<string, unknown>> {
  return new Promise((resolve, reject) => {
    let body = ''
    req.on('data', (chunk) => { body += chunk })
    req.on('end', () => {
      try {
        resolve(body ? JSON.parse(body) : {})
      } catch {
        resolve({})
      }
    })
    req.on('error', reject)
  })
}

function jsonRes(res: import('http').ServerResponse, status: number, data: object) {
  res.statusCode = status
  res.setHeader('Content-Type', 'application/json')
  res.end(JSON.stringify(data))
}

export function mockAuthApi(): Plugin {
  return {
    name: 'mock-auth-api',
    apply: 'serve',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        const fullUrl = req.url ?? ''
        const [pathPart, queryPart] = fullUrl.split('?')
        const url = pathPart ?? ''

        // GET: прокси для экспорта Google Таблиц (обход CORS)
        if (req.method === 'GET' && url === '/api/my/inventory/google-sheets') {
          const params = new URLSearchParams(queryPart ?? '')
          const targetUrl = params.get('url')
          if (!targetUrl || !targetUrl.startsWith('https://docs.google.com/')) {
            res.statusCode = 400
            res.setHeader('Content-Type', 'text/plain; charset=utf-8')
            res.end('Некорректный URL')
            return
          }
          try {
            const resp = await fetch(targetUrl, { headers: { 'Accept': 'text/csv' } })
            if (!resp.ok) {
              res.statusCode = resp.status
              res.setHeader('Content-Type', 'text/plain; charset=utf-8')
              res.end(await resp.text())
              return
            }
            const csv = await resp.text()
            res.statusCode = 200
            res.setHeader('Content-Type', 'text/csv; charset=utf-8')
            res.end(csv)
          } catch (e) {
            res.statusCode = 502
            res.setHeader('Content-Type', 'text/plain; charset=utf-8')
            res.end(e instanceof Error ? e.message : 'Ошибка загрузки таблицы')
          }
          return
        }

        if (req.method !== 'POST' || !url) return next()

        if (url === '/api/auth/buyer/login') {
          const data = await parseBody(req)
          const password = String(data.password ?? '').trim()
          const email = String(data.email ?? '').trim()
          if (!email) {
            jsonRes(res, 401, { message: 'Введите email.' })
            return
          }
          if (checkBuyerPassword(email, password)) {
            jsonRes(res, 200, { token: 'demo-buyer-token' })
            return
          }
          if (password === DEMO_PASSWORD) {
            jsonRes(res, 200, { token: 'demo-buyer-token' })
            return
          }
          jsonRes(res, 401, { message: 'Неверный email или пароль. Используйте данные созданного пользователя или демо: пароль 0909.' })
          return
        }

        if (url === '/api/auth/my/login') {
          const data = await parseBody(req)
          const pin = String(data.pin ?? '').trim()
          if (pin === DEMO_PIN) {
            jsonRes(res, 200, { token: 'demo-my-token' })
            return
          }
          jsonRes(res, 401, { message: 'Неверный PIN. Для демо: PIN 0909.' })
          return
        }

        if (url === '/api/auth/tools/login') {
          const data = await parseBody(req)
          const password = String(data.password ?? '').trim()
          if (password === DEMO_PASSWORD) {
            jsonRes(res, 200, { token: 'demo-tools-token' })
            return
          }
          jsonRes(res, 401, { message: 'Неверный пароль. Для демо: пароль 0909.' })
          return
        }

        next()
      })
    },
  }
}
