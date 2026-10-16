// Tiny request helpers shared by every /api route. Works the same on Vercel and on the local Express server.

export class HttpError extends Error {
  constructor(status, message, code) {
    super(message)
    this.status = status
    this.code = code
  }
}

const CONNECTION_HINTS = /fetch failed|connecting to database|ENOTFOUND|EAI_AGAIN|ECONNREFUSED|ECONNRESET|ETIMEDOUT|getaddrinfo|socket hang up|network/i

function toHttpError(err) {
  if (err instanceof HttpError) return err
  const code = String(err?.code || '')
  // 08xxx = connection failure, 28xxx = bad credentials, 3D000 = database does not exist
  if (code.startsWith('08') || code.startsWith('28') || code === '3D000' || CONNECTION_HINTS.test(err?.message || '')) {
    return new HttpError(503, 'We can’t reach the PulseFit database right now. Check your connection and try again.', 'DB_UNAVAILABLE')
  }
  if (code === '42P01') {
    return new HttpError(503, 'The database tables are missing. Run "npm run db:setup" first.', 'DB_NOT_SETUP')
  }
  console.error('[api] Unexpected error:', err)
  return new HttpError(500, 'Something went wrong on our side. Please try again.', 'SERVER_ERROR')
}

/** Wraps a map of { GET, POST, ... } handlers into a Vercel-style (req, res) function. */
export function route(methods) {
  return async function handler(req, res) {
    res.setHeader('Cache-Control', 'no-store')
    const fn = methods[req.method]
    if (!fn) {
      res.setHeader('Allow', Object.keys(methods).join(', '))
      return res.status(405).json({ error: 'Method not allowed' })
    }
    try {
      const data = await fn(req, res)
      if (!res.headersSent) res.status(200).json(data ?? { ok: true })
    } catch (err) {
      const e = toHttpError(err)
      res.status(e.status).json({ error: e.message, code: e.code })
    }
  }
}

export function body(req) {
  if (!req.body) return {}
  if (typeof req.body === 'string') {
    try {
      return JSON.parse(req.body)
    } catch {
      throw new HttpError(400, 'Invalid JSON body')
    }
  }
  return req.body
}

export function parseCookies(req) {
  const out = {}
  for (const part of (req.headers.cookie || '').split(';')) {
    const i = part.indexOf('=')
    if (i > 0) out[part.slice(0, i).trim()] = decodeURIComponent(part.slice(i + 1).trim())
  }
  return out
}

/** The browser sends its local calendar date so "today" matches the user's time zone. */
export function localDate(value) {
  if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(Date.parse(value))) return value
  return new Date().toISOString().slice(0, 10)
}

export function toInt(value, name) {
  const n = Number(value)
  if (!Number.isInteger(n) || n < 1) throw new HttpError(400, `Invalid ${name}`)
  return n
}
