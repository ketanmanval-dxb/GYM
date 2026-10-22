import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import request from 'supertest'
import { makeApp, signedInAgent, insertCompleted, cleanup } from '../helpers/app.js'

let app, pg
beforeAll(async () => ({ app, pg } = await makeApp()))
afterAll(() => cleanup(pg))

const GROUPS = ['Chest', 'Back', 'Legs', 'Arms', 'Core', 'Cardio']

describe('GET /api/stats', () => {
  it('returns members, workouts completed and classes this week as numbers', async () => {
    const res = await request(app).get('/api/stats')
    expect(res.status).toBe(200)
    for (const k of ['members', 'workouts_completed', 'classes_this_week']) {
      expect(typeof res.body[k]).toBe('number')
      expect(Number.isInteger(res.body[k])).toBe(true)
    }
    expect(res.body.classes_this_week).toBe(10)
  })

  it('counts go up after a sign-up and a completed workout', async () => {
    const before = (await request(app).get('/api/stats')).body
    const { user } = await signedInAgent(app)
    await insertCompleted(pg, user.id, '2026-10-15')
    const after = (await request(app).get('/api/stats')).body
    expect(after.members).toBe(before.members + 1)
    expect(after.workouts_completed).toBe(before.workouts_completed + 1)
  })

  it('is public and exposes no personal data', async () => {
    const res = await request(app).get('/api/stats')
    expect(Object.keys(res.body).sort()).toEqual(['classes_this_week', 'members', 'workouts_completed'])
  })
})

describe('GET /api/exercises', () => {
  it('returns all 30 exercises with the expected fields', async () => {
    const res = await request(app).get('/api/exercises')
    expect(res.status).toBe(200)
    expect(res.body.exercises).toHaveLength(30)
    for (const e of res.body.exercises) {
      expect(e).toMatchObject({ id: expect.any(Number), name: expect.any(String), sets: expect.any(Number), reps: expect.any(String), rest_seconds: expect.any(Number) })
      expect(GROUPS).toContain(e.muscle_group)
      expect(['Beginner', 'Intermediate', 'Advanced']).toContain(e.difficulty)
      expect(e.description.length).toBeGreaterThan(10)
    }
  })

  it.each(GROUPS)('filter muscle_group=%s returns exactly its 5 exercises', async (group) => {
    const res = await request(app).get(`/api/exercises?muscle_group=${group}`)
    expect(res.status).toBe(200)
    expect(res.body.exercises).toHaveLength(5)
    expect(res.body.exercises.every((e) => e.muscle_group === group)).toBe(true)
  })

  it('rejects an unknown muscle group', async () => {
    expect((await request(app).get('/api/exercises?muscle_group=Toes')).status).toBe(400)
  })
})

describe('GET /api/dashboard (fake dates)', () => {
  // Thursday 15 Oct 2026. The week starts Monday 12 Oct.
  const TODAY = '2026-10-15'

  it('new user: zeros everywhere, 7-day chart, no NaN', async () => {
    const { agent } = await signedInAgent(app)
    const { body } = await agent.get(`/api/dashboard?date=${TODAY}`).expect(200)
    expect(body.today).toBeNull()
    expect(body.streak).toEqual({ current: 0, best: 0, trainedToday: false })
    expect(body.weekly).toHaveLength(7)
    expect(body.weekly.map((d) => d.date)).toEqual(['2026-10-09', '2026-10-10', '2026-10-11', '2026-10-12', '2026-10-13', '2026-10-14', '2026-10-15'])
    expect(body.weekly.map((d) => d.day)).toEqual(['Fri', 'Sat', 'Sun', 'Mon', 'Tue', 'Wed', 'Thu'])
    expect(body.weekly.every((d) => d.minutes === 0)).toBe(true)
    expect(body.rings.map((r) => [r.value, r.goal])).toEqual([[0, 4], [0, 180], [0, 2]])
    for (const r of body.rings) expect(Number.isFinite(r.value) && Number.isFinite(r.goal) && r.goal > 0).toBe(true)
  })

  it('3 days in a row → streak 3; chart and rings add up', async () => {
    const { agent, user } = await signedInAgent(app)
    await insertCompleted(pg, user.id, '2026-10-13', 40)
    await insertCompleted(pg, user.id, '2026-10-14', 50)
    await insertCompleted(pg, user.id, '2026-10-15', 60)
    const { body } = await agent.get(`/api/dashboard?date=${TODAY}`).expect(200)
    expect(body.streak).toEqual({ current: 3, best: 3, trainedToday: true })
    expect(body.weekly.slice(-3).map((d) => d.minutes)).toEqual([40, 50, 60])
    expect(body.last7Minutes).toBe(150)
    expect(body.rings[0]).toMatchObject({ value: 3, goal: 4 })
    expect(body.rings[1]).toMatchObject({ value: 150, goal: 180 })
    expect(body.rings[2]).toMatchObject({ value: 0, goal: 2 })
  })

  it('a missed day resets the streak', async () => {
    const { agent, user } = await signedInAgent(app)
    await insertCompleted(pg, user.id, '2026-10-12')
    await insertCompleted(pg, user.id, '2026-10-13')
    await insertCompleted(pg, user.id, '2026-10-15') // missed the 14th
    const { body } = await agent.get(`/api/dashboard?date=${TODAY}`).expect(200)
    expect(body.streak).toMatchObject({ current: 1, best: 2 })
  })

  it('a workout today plus yesterday → streak 2', async () => {
    const { agent, user } = await signedInAgent(app)
    await insertCompleted(pg, user.id, '2026-10-14')
    await insertCompleted(pg, user.id, '2026-10-15')
    const { body } = await agent.get(`/api/dashboard?date=${TODAY}`).expect(200)
    expect(body.streak).toMatchObject({ current: 2, trainedToday: true })
  })

  it('goals hit, rings above goal, last-week comparison and only-this-week counting', async () => {
    const { agent, user } = await signedInAgent(app, { weekly_goal_workouts: 2, weekly_goal_minutes: 60 })
    await insertCompleted(pg, user.id, '2026-10-05', 45) // previous 7-day window, and last week
    await insertCompleted(pg, user.id, '2026-10-10', 30) // in the chart, but before Monday → not this week
    await insertCompleted(pg, user.id, '2026-10-12', 100)
    await insertCompleted(pg, user.id, '2026-10-13', 100)
    await insertCompleted(pg, user.id, '2026-10-14', 100)
    const { body } = await agent.get(`/api/dashboard?date=${TODAY}`).expect(200)
    expect(body.rings[0]).toMatchObject({ value: 3, goal: 2 }) // above goal: UI clamps the ring to 100%
    expect(body.rings[1]).toMatchObject({ value: 300, goal: 60 })
    expect(body.rings[2]).toMatchObject({ value: 2, goal: 2 })
    expect(body.last7Minutes).toBe(330)
    expect(body.prev7Minutes).toBe(45)
  })

  it('ignores planned and in-progress workouts', async () => {
    const { agent, user } = await signedInAgent(app)
    await pg.query(`INSERT INTO workouts (user_id, name, workout_date, status) VALUES ($1, 'x', '2026-10-15', 'in_progress')`, [user.id])
    const { body } = await agent.get(`/api/dashboard?date=${TODAY}`).expect(200)
    expect(body.streak.current).toBe(0)
    expect(body.rings[0].value).toBe(0)
  })

  it('falls back to the server date when the date parameter is invalid', async () => {
    const { agent } = await signedInAgent(app)
    const { body } = await agent.get('/api/dashboard?date=banana').expect(200)
    expect(body.weekly).toHaveLength(7)
    expect(body.weekly.at(-1).date).toBe(new Date().toISOString().slice(0, 10))
  })
})
