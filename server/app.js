// Builds the local Express app that serves every /api route file, exactly like Vercel:
//   api/auth/login.js → /api/auth/login
// Used by server/dev.js (npm run dev) and by the backend tests (Supertest).
import express from 'express'
import { readdirSync } from 'node:fs'
import path from 'node:path'
import { pathToFileURL } from 'node:url'

export function findRoutes(apiDir) {
  const walk = (dir) =>
    readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
      if (entry.name.startsWith('_') || entry.name.startsWith('.')) return []
      const full = path.join(dir, entry.name)
      if (entry.isDirectory()) return walk(full)
      if (!/\.(js|mjs)$/.test(entry.name)) return []
      const rel = path.relative(apiDir, full).replace(/\\/g, '/').replace(/\.(js|mjs)$/, '').replace(/\/index$/, '')
      return [{ url: `/api/${rel}`, file: full }]
    })
  return walk(apiDir)
}

export async function createApp(root, { log = false } = {}) {
  const app = express()
  app.disable('x-powered-by')
  app.use(express.json({ limit: '1mb' }))

  for (const { url, file } of findRoutes(path.join(root, 'api'))) {
    // Node needs a file:// URL; Vitest's loader needs a plain path (it can't decode %20 in folder names).
    const mod = await import(process.env.VITEST ? file.replace(/\\/g, '/') : pathToFileURL(file).href)
    app.all(url, (req, res) => mod.default(req, res))
    if (log) console.log(`  ↳ ${url}`)
  }

  app.use('/api', (req, res) => res.status(404).json({ error: `No API route for ${req.method} ${req.originalUrl}` }))
  // Malformed JSON bodies and other middleware errors → JSON, never an HTML stack trace.
  app.use((err, req, res, next) => {
    if (res.headersSent) return next(err)
    const status = err.status || err.statusCode || 500
    res.status(status).json({ error: status === 400 ? 'Invalid JSON body' : 'Something went wrong on our side.' })
  })
  return app
}
