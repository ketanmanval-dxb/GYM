// Spins up the real /api routes on a throwaway in-memory Postgres (schema + seed applied).
// .env is never read here, so a Neon DATABASE_URL can't be touched by tests.
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import request from 'supertest'

export const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..')

export async function makeApp() {
  delete process.env.DATABASE_URL
  process.env.PULSEFIT_LOCAL_DB = 'memory://'
  process.env.JWT_SECRET = 'test-only-secret-that-is-long-enough-for-hs256-signing'
  const { setupLocalDb, openLocalDb, neonCompatible } = await import('../../server/local-db.js')
  await setupLocalDb(root)
  const pg = await openLocalDb(root)
  globalThis.__pulsefitLocalDb = neonCompatible(pg)
  const { createApp } = await import('../../server/app.js')
  const app = await createApp(root)
  return { app, pg }
}

let n = 0
export const uniqueEmail = (tag = 'user') => `test-${tag}-${Date.now()}-${++n}@pulsefit.test`

/** Signs up a fresh test user and returns a cookie-keeping agent. */
export async function signedInAgent(app, overrides = {}) {
  const agent = request.agent(app)
  const body = {
    full_name: 'Test Runner',
    email: uniqueEmail(),
    password: 'Test1234!',
    weekly_goal_workouts: 4,
    weekly_goal_minutes: 180,
    ...overrides,
  }
  const res = await agent.post('/api/auth/signup').send(body)
  if (res.status !== 200) throw new Error(`signup failed: ${res.status} ${JSON.stringify(res.body)}`)
  return { agent, user: res.body.user, password: body.password }
}

/** Inserts a completed workout directly, for fake-date streak/stat scenarios. */
export async function insertCompleted(pg, userId, date, minutes = 30) {
  await pg.query(
    `INSERT INTO workouts (user_id, name, workout_date, status, duration_minutes, started_at, completed_at)
     VALUES ($1, 'Seeded', $2::date, 'completed', $3, now(), now())`,
    [userId, date, minutes],
  )
}

export async function cleanup(pg) {
  if (!pg) return
  await pg.query(`DELETE FROM users WHERE email LIKE 'test-%@pulsefit.test'`)
  await pg.close()
}
