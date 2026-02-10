/**
 * В режиме dev подменяет API управления пользователями кабинета покупателя.
 * GET /api/my/buyer-users — список, POST /api/my/buyer-users — создание.
 * Пароли сохраняются в общем хранилище для проверки при входе в кабинет покупателя.
 */
import type { Plugin } from 'vite'
import {
  getBuyerUsers,
  addBuyerUser,
  findBuyerUserByEmail,
} from './mock-buyer-users-store'

const API_PATH = '/api/my/buyer-users'

export function mockBuyerUsersApi(): Plugin {
  return {
    name: 'mock-buyer-users-api',
    apply: 'serve',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        if (req.url !== API_PATH || !req.method) return next()

        if (req.method === 'GET') {
          res.setHeader('Content-Type', 'application/json')
          res.end(JSON.stringify(getBuyerUsers()))
          return
        }

        if (req.method === 'POST') {
          let body = ''
          req.on('data', (chunk) => { body += chunk })
          req.on('end', () => {
            try {
              const data = JSON.parse(body || '{}')
              const email = (data.email || '').trim()
              if (!email) {
                res.statusCode = 400
                res.setHeader('Content-Type', 'application/json')
                res.end(JSON.stringify({ message: 'Email обязателен.' }))
                return
              }
              if (findBuyerUserByEmail(email)) {
                res.statusCode = 409
                res.setHeader('Content-Type', 'application/json')
                res.end(JSON.stringify({ message: 'Пользователь с таким email уже существует.' }))
                return
              }
              const user = addBuyerUser({
                email,
                password: data.password != null ? String(data.password) : undefined,
                name: data.name?.trim(),
                company: data.company?.trim(),
              })
              res.statusCode = 201
              res.setHeader('Content-Type', 'application/json')
              res.end(JSON.stringify(user))
            } catch {
              res.statusCode = 400
              res.setHeader('Content-Type', 'application/json')
              res.end(JSON.stringify({ message: 'Неверный формат данных.' }))
            }
          })
          return
        }

        next()
      })
    },
  }
}
