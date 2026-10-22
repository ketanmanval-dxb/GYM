import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import request from 'supertest'
import { SignJWT } from 'jose'
import { makeApp, signedInAgent, uniqueEmail, cleanup } from '../helpers/app.js'

let app, pg
beforeAll(async () => ({ app, pg } = await makeApp()))
afterAll(() => cleanup(pg))

const valid = () => ({ full_name: 'Sam Lifter', email: uniqueEmail('signup'), password: 'Test1234!', weekly_goal_workouts: 5, weekly_goal_minutes: 240 })
const cookieHeader = (res) => [].concat(res.headers['set-cookie'] || []).join('\n')

describe('POST /api/auth/signup', () => {
  it('creates the account, returns the user and sets an HttpOnly session cookie', async () => {
    const body = valid()
    const res = await request(app).post('/api/auth/signup').send(body)
    expect(res.status).toBe(200)
    expect(res.body.user).toMatchObject({ email: body.email, full_name: 'Sam Lifter', weekly_goal_workouts: 5, weekly_goal_minutes: 240 })
    expect(res.body.user.password_hash).toBeUndefined()
    expect(cookieHeader(res)).toMatch(/pf_session=[^;]+;.*HttpOnly/i)
    expect(cookieHeader(res)).toMatch(/pf_auth=1/)
  })

  it('stores a bcrypt hash, never the plain password', async () => {
    const body = valid()
    await request(app).post('/api/auth/signup').send(body)
    const { rows } = await pg.query('SELECT password_hash FROM users WHERE email = $1', [body.email])
    expect(rows[0].password_hash).toMatch(/^\$2[aby]\$/)
    expect(rows[0].password_hash).not.toContain(body.password)
  })

  it('blocks a duplicate email (case-insensitive)', async () => {
    const body = valid()
    expect((await request(app).post('/api/auth/signup').send(body)).status).toBe(200)
    const dup = await request(app).post('/api/auth/signup').send({ ...body, email: body.email.toUpperCase() })
    expect(dup.status).toBe(409)
    expect(dup.body.error).toMatch(/already exists/i)
  })

  it.each([
    ['empty password', { password: '' }],
    ['weak (short) password', { password: 'abc123' }],
    ['missing password', { password: undefined }],
    ['empty name', { full_name: '   ' }],
    ['invalid email', { email: 'not-an-email' }],
    ['goal out of range', { weekly_goal_workouts: 0 }],
    ['minutes goal out of range', { weekly_goal_minutes: 99999 }],
  ])('rejects %s with 400', async (_label, patch) => {
    const res = await request(app).post('/api/auth/signup').send({ ...valid(), ...patch })
    expect(res.status).toBe(400)
    expect(res.body.error).toBeTruthy()
  })
})

describe('POST /api/auth/login + logout', () => {
  it('logs in with the right password', async () => {
    const { user, password } = await signedInAgent(app)
    const res = await request(app).post('/api/auth/login').send({ email: user.email, password })
    expect(res.status).toBe(200)
    expect(res.body.user.id).toBe(user.id)
    expect(cookieHeader(res)).toMatch(/pf_session=[^;]+;.*HttpOnly/i)
  })

  it('accepts the email in any letter case', async () => {
    const { user, password } = await signedInAgent(app)
    expect((await request(app).post('/api/auth/login').send({ email: user.email.toUpperCase(), password })).status).toBe(200)
  })

  it('fails with the wrong password', async () => {
    const { user } = await signedInAgent(app)
    const res = await request(app).post('/api/auth/login').send({ email: user.email, password: 'Wrong999!' })
    expect(res.status).toBe(401)
    expect(res.headers['set-cookie']).toBeUndefined()
  })

  it('fails for an unknown email with the same message (no account enumeration)', async () => {
    const a = await request(app).post('/api/auth/login').send({ email: uniqueEmail('nobody'), password: 'Test1234!' })
    const { user } = await signedInAgent(app)
    const b = await request(app).post('/api/auth/login').send({ email: user.email, password: 'nope-nope' })
    expect(a.status).toBe(401)
    expect(a.body.error).toBe(b.body.error)
  })

  it('rejects empty credentials with 400', async () => {
    expect((await request(app).post('/api/auth/login').send({})).status).toBe(400)
  })

  it('logout clears both cookies and ends the session', async () => {
    const { agent } = await signedInAgent(app)
    expect((await agent.get('/api/auth/me')).status).toBe(200)
    const out = await agent.post('/api/auth/logout')
    expect(out.status).toBe(200)
    expect(cookieHeader(out)).toMatch(/pf_session=;.*Max-Age=0/)
    expect(cookieHeader(out)).toMatch(/pf_auth=;.*Max-Age=0/)
    expect((await agent.get('/api/auth/me')).status).toBe(401)
  })
})

describe('GET /api/auth/me', () => {
  it('returns the logged-in user and their streak', async () => {
    const { agent, user } = await signedInAgent(app)
    const res = await agent.get('/api/auth/me?date=2026-10-15')
    expect(res.status).toBe(200)
    expect(res.body.user).toMatchObject({ id: user.id, email: user.email })
    expect(res.body.streak).toEqual({ current: 0, best: 0, trainedToday: false })
  })

  it('returns 401 when logged out', async () => {
    const res = await request(app).get('/api/auth/me')
    expect(res.status).toBe(401)
    expect(res.body.code).toBe('UNAUTHENTICATED')
  })

  it('returns 401 for a token signed with a different secret', async () => {
    const forged = await new SignJWT({}).setProtectedHeader({ alg: 'HS256' }).setSubject('1').setExpirationTime('1h')
      .sign(new TextEncoder().encode('attacker-secret-attacker-secret-attacker-secret'))
    const res = await request(app).get('/api/auth/me').set('Cookie', `pf_session=${forged}`)
    expect(res.status).toBe(401)
  })

  it('returns 401 for a garbage cookie', async () => {
    expect((await request(app).get('/api/auth/me').set('Cookie', 'pf_session=not.a.jwt')).status).toBe(401)
  })
})

describe('protected routes without login → 401', () => {
  it.each([
    ['get', '/api/auth/me'],
    ['get', '/api/dashboard'],
    ['get', '/api/workouts'],
    ['post', '/api/workouts'],
    ['delete', '/api/workouts?exercise_id=1'],
    ['patch', '/api/workouts'],
    ['patch', '/api/sets'],
  ])('%s %s', async (method, url) => {
    const res = await request(app)[method](url).send({ workout_id: 1, set_id: 1, exercise_id: 1, action: 'finish', completed: true })
    expect(res.status).toBe(401)
  })
})

describe('API hygiene', () => {
  it('unknown routes return JSON 404', async () => {
    const res = await request(app).get('/api/does-not-exist')
    expect(res.status).toBe(404)
    expect(res.headers['content-type']).toMatch(/json/)
  })

  it('wrong HTTP method returns 405', async () => {
    expect((await request(app).get('/api/sets')).status).toBe(405)
    expect((await request(app).delete('/api/stats')).status).toBe(405)
  })

  it('malformed JSON returns 400 JSON, not a stack trace', async () => {
    const res = await request(app).post('/api/auth/login').set('Content-Type', 'application/json').send('{"email":')
    expect(res.status).toBe(400)
    expect(res.headers['content-type']).toMatch(/json/)
    expect(JSON.stringify(res.body)).not.toMatch(/at .*\.js/)
  })

  it('a JSON array or a body getter that throws (Vercel, malformed JSON) gives 400, not 500', async () => {
    const { route, body } = await import('../../api/_lib/http.js')
    const handler = route({ POST: (req) => body(req) })
    const run = async (bodyDescriptor) => {
      const req = Object.defineProperty({ method: 'POST', headers: {}, query: {} }, 'body', bodyDescriptor)
      const res = { headersSent: false, setHeader() {}, status(c) { this.code = c; return this }, json(d) { this.data = d; return this } }
      await handler(req, res)
      return res
    }
    expect((await run({ get() { throw new SyntaxError('Unexpected end of JSON') } })).code).toBe(400)
    expect((await run({ value: [1, 2] })).code).toBe(400)
    expect((await run({ value: '{bad' })).code).toBe(400)
    expect((await run({ value: '{"ok":true}' })).data).toEqual({ ok: true })
  })

  it('responses are not cached', async () => {
    expect((await request(app).get('/api/stats')).headers['cache-control']).toBe('no-store')
  })
})
