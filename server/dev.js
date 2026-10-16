// Local stand-in for Vercel's serverless runtime.
// Every file in /api (except _-prefixed helpers) becomes a route, exactly like on Vercel:
//   api/auth/login.js → /api/auth/login
import express from 'express'
import { readdirSync } from 'node:fs'
import path from 'node:path'
import { pathToFileURL } from 'node:url'
import { loadEnv, ensureGitignore, root } from '../scripts/env.js'

ensureGitignore()
const { hasDatabaseUrl } = loadEnv()
if (hasDatabaseUrl) {
  console.log('🐘 Using the Neon database from DATABASE_URL')
} else {
  // No Neon yet: run a real Postgres locally (data saved in .localdb) so the whole app works.
  const { openLocalDb, setupLocalDb, neonCompatible } = await import('./local-db.js')
  const counts = await setupLocalDb(root)
  globalThis.__pulsefitLocalDb = neonCompatible(await openLocalDb(root))
  console.log('🐘 DATABASE_URL is empty, so using the built-in local Postgres (pulsefit/.localdb)')
  console.table(counts)
  console.log('   Add your Neon DATABASE_URL to .env whenever you are ready; the API restarts and switches automatically.')
}

const apiDir = path.join(root, 'api')

function findRoutes(dir) {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    if (entry.name.startsWith('_') || entry.name.startsWith('.')) return []
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) return findRoutes(full)
    if (!/\.(js|mjs)$/.test(entry.name)) return []
    const rel = path.relative(apiDir, full).replace(/\\/g, '/').replace(/\.(js|mjs)$/, '').replace(/\/index$/, '')
    return [{ url: `/api/${rel}`, file: full }]
  })
}

const app = express()
app.disable('x-powered-by')
app.use(express.json({ limit: '1mb' }))

for (const { url, file } of findRoutes(apiDir)) {
  const mod = await import(pathToFileURL(file).href)
  app.all(url, (req, res) => mod.default(req, res))
  console.log(`  ↳ ${url}`)
}

app.use('/api', (req, res) => res.status(404).json({ error: `No API route for ${req.method} ${req.originalUrl}` }))

const port = Number(process.env.API_PORT) || 3001
app.listen(port, () => console.log(`\n🟢 API ready on http://localhost:${port} (Vite proxies /api here)\n`))
