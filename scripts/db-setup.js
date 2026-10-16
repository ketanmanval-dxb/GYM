// npm run db:setup — creates the tables (db/schema.sql) and loads sample data (db/seed.sql).
// Safe to run again: tables use IF NOT EXISTS and seed rows use ON CONFLICT.
import { readFileSync } from 'node:fs'
import path from 'node:path'
import { Pool } from '@neondatabase/serverless'
import { loadEnv, ensureGitignore, NEON_HELP, root } from './env.js'

ensureGitignore()
const { hasDatabaseUrl } = loadEnv()
if (!hasDatabaseUrl) {
  // No Neon yet: set up the built-in local Postgres instead (pulsefit/.localdb).
  const inUse = await fetch(`http://localhost:${process.env.API_PORT || 3001}/api/stats`).then(() => true, () => false)
  if (inUse) {
    console.log('ℹ️  The dev server is running and already set up the local database on start-up.')
    console.log('   (Stop "npm run dev" first if you want to run db:setup yourself.)')
    process.exit(0)
  }
  const { setupLocalDb } = await import('../server/local-db.js')
  const rows = await setupLocalDb(root)
  console.log('✅ Local database ready (pulsefit/.localdb). To use Neon instead:')
  console.log(NEON_HELP)
  console.table(rows)
  process.exit(0)
}

const pool = new Pool({ connectionString: process.env.DATABASE_URL })
const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC'

try {
  const client = await pool.connect()
  try {
    await client.query(`SET TIME ZONE '${tz.replace(/'/g, '')}'`)
    console.log('📐 Running db/schema.sql …')
    await client.query(readFileSync(path.join(root, 'db', 'schema.sql'), 'utf8'))
    console.log('🌱 Running db/seed.sql …')
    await client.query(readFileSync(path.join(root, 'db', 'seed.sql'), 'utf8'))

    const { rows } = await client.query(`
      SELECT 'exercises' AS table_name, count(*)::int AS rows FROM exercises
      UNION ALL SELECT 'classes', count(*)::int FROM classes
      UNION ALL SELECT 'classes this week', count(*)::int FROM classes
        WHERE start_time >= date_trunc('week', now()) AND start_time < date_trunc('week', now()) + interval '7 days'
      UNION ALL SELECT 'users', count(*)::int FROM users`)
    console.log(`\n✅ Database ready (time zone: ${tz})`)
    console.table(rows)
  } finally {
    client.release()
  }
} catch (err) {
  console.error('\n❌ Database setup failed:', err.message)
  if (/password|authentication/i.test(err.message)) console.error('   Check the password in DATABASE_URL (copy it again from Neon → Connect).')
  if (/ENOTFOUND|getaddrinfo|fetch failed|ECONN|timeout/i.test(err.message)) console.error('   Could not reach Neon. Check your internet connection and the host in DATABASE_URL.')
  process.exitCode = 1
} finally {
  await pool.end()
}
