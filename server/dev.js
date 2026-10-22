// Local stand-in for Vercel's serverless runtime (npm run dev).
import { loadEnv, ensureGitignore, root } from '../scripts/env.js'
import { createApp } from './app.js'

ensureGitignore()
const { hasDatabaseUrl } = loadEnv()
// Browser tests set PULSEFIT_LOCAL_DB to force a throwaway database, so real data is never touched.
const forceLocal = Boolean(process.env.PULSEFIT_LOCAL_DB)
if (forceLocal) delete process.env.DATABASE_URL

if (hasDatabaseUrl && !forceLocal) {
  console.log('🐘 Using the Neon database from DATABASE_URL')
} else {
  // No Neon yet: run a real Postgres locally (data saved in .localdb) so the whole app works.
  const { openLocalDb, setupLocalDb, neonCompatible } = await import('./local-db.js')
  const counts = await setupLocalDb(root)
  globalThis.__pulsefitLocalDb = neonCompatible(await openLocalDb(root))
  console.log(`🐘 Using the built-in local Postgres (${process.env.PULSEFIT_LOCAL_DB || 'pulsefit/.localdb'})`)
  console.table(counts)
  if (!forceLocal) console.log('   Add your Neon DATABASE_URL to .env whenever you are ready; the API restarts and switches automatically.')
}

const app = await createApp(root, { log: true })
const port = Number(process.env.API_PORT) || 3001
app.listen(port, () => console.log(`\n🟢 API ready on http://localhost:${port} (Vite proxies /api here)\n`))
