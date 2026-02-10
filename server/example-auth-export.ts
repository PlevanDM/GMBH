/**
 * Пример backend на Hono: auth (login) + RFQ export.
 * Требуется: npm i hono jose; для Node: npm i @hono/node-server
 * Запуск (Node): в конце файла добавить:
 *   import { serve } from '@hono/node-server'
 *   serve(app, { port: 3000 })
 * Документация: https://hono.dev/docs/middleware/builtin/jwt
 */
import { Hono } from 'hono'
import { jwt } from 'hono/jwt'
import { SignJWT } from 'jose'

const JWT_SECRET = process.env.JWT_SECRET ?? 'change-me'
const app = new Hono()

app.post('/api/auth/buyer/login', async (c) => {
  const body = await c.req.json().catch(() => ({}))
  const email = body.email ?? ''
  const password = body.password ?? ''
  if (!email || !password) return c.json({ error: 'invalid' }, 400)
  const token = await new SignJWT({ role: 'buyer' })
    .setProtectedHeader({ alg: 'HS256' })
    .setExpirationTime('8h')
    .sign(new TextEncoder().encode(JWT_SECRET))
  return c.json({ token })
})

app.post('/api/auth/my/login', async (c) => {
  const body = await c.req.json().catch(() => ({}))
  const pin = body.pin ?? ''
  if (!pin) return c.json({ error: 'invalid' }, 400)
  const token = await new SignJWT({ role: 'my' })
    .setProtectedHeader({ alg: 'HS256' })
    .setExpirationTime('8h')
    .sign(new TextEncoder().encode(JWT_SECRET))
  return c.json({ token })
})

app.post('/api/auth/tools/login', async (c) => {
  const body = await c.req.json().catch(() => ({}))
  const login = body.login ?? ''
  const password = body.password ?? ''
  if (!login || !password) return c.json({ error: 'invalid' }, 400)
  const token = await new SignJWT({ role: 'tools' })
    .setProtectedHeader({ alg: 'HS256' })
    .setExpirationTime('8h')
    .sign(new TextEncoder().encode(JWT_SECRET))
  return c.json({ token })
})

app.use('/api/buyer/rfqs/*', jwt({ secret: JWT_SECRET }))

app.get('/api/buyer/rfqs/:id/export', async (c) => {
  const id = c.req.param('id')
  const format = c.req.query('format') ?? 'pdf'
  const content = `RFQ ${id}`
  if (format === 'pdf') {
    const blob = new Blob([content], { type: 'application/pdf' })
    return new Response(blob, {
      headers: { 'Content-Disposition': `attachment; filename=rfq-${id}.pdf` },
    })
  }
  const blob = new Blob([content], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  })
  return new Response(blob, {
    headers: { 'Content-Disposition': `attachment; filename=rfq-${id}.xlsx` },
  })
})

export default app
