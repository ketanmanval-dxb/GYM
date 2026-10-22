// Local development database: real Postgres (PGlite, WebAssembly) stored in pulsefit/.localdb.
// Used only when DATABASE_URL is empty. It mimics the Neon driver's `sql` tagged template and
// `sql.transaction([...])`, so the /api code is identical locally and on Vercel.
import { readFileSync } from 'node:fs'
import path from 'node:path'
import { PGlite } from '@electric-sql/pglite'

let pg

// PULSEFIT_LOCAL_DB can point somewhere else; "memory://" gives a throwaway database for tests.
export async function openLocalDb(root) {
  const target = process.env.PULSEFIT_LOCAL_DB || path.join(root, '.localdb')
  pg ??= await PGlite.create(target)
  return pg
}

/** Runs db/schema.sql then db/seed.sql (both are safe to re-run). */
export async function setupLocalDb(root) {
  const db = await openLocalDb(root)
  const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC'
  await db.exec(`SET TIME ZONE '${tz.replace(/'/g, '')}'`)
  await db.exec(readFileSync(path.join(root, 'db', 'schema.sql'), 'utf8'))
  await db.exec(readFileSync(path.join(root, 'db', 'seed.sql'), 'utf8'))
  await db.exec(`SET TIME ZONE 'UTC'`)
  const { rows } = await db.query(`
    SELECT 'exercises' AS table_name, count(*)::int AS rows FROM exercises
    UNION ALL SELECT 'classes', count(*)::int FROM classes
    UNION ALL SELECT 'users', count(*)::int FROM users`)
  return rows
}

/** A Neon-compatible `sql` function backed by PGlite. */
export function neonCompatible(db) {
  const build = (strings, values) => ({
    text: strings.reduce((acc, s, i) => acc + `$${i}` + s),
    params: values,
  })

  function sql(strings, ...values) {
    const q = build(strings, values)
    // Lazy, like Neon: runs when awaited, or inside sql.transaction().
    return {
      ...q,
      then(resolve, reject) {
        return db.query(q.text, q.params).then((r) => r.rows).then(resolve, reject)
      },
    }
  }

  sql.transaction = (queries) =>
    db.transaction(async (tx) => {
      const out = []
      for (const q of queries) out.push((await tx.query(q.text, q.params)).rows)
      return out
    })

  return sql
}
