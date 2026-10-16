// The only place that touches DATABASE_URL. Never import this from /src.
import { neon } from '@neondatabase/serverless'
import { HttpError } from './http.js'

let sql

export function db() {
  const url = process.env.DATABASE_URL?.trim()
  if (url) {
    sql ??= neon(url)
    return sql
  }
  // Local development only: server/dev.js provides a built-in Postgres when no DATABASE_URL is set.
  if (globalThis.__pulsefitLocalDb) return globalThis.__pulsefitLocalDb
  throw new HttpError(503, 'The database is not configured yet. Add DATABASE_URL to .env and restart.', 'DB_UNAVAILABLE')
}
