// User A must never be able to see or change user B's data.
import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import request from 'supertest'
import { makeApp, signedInAgent, insertCompleted, cleanup } from '../helpers/app.js'

let app, pg, A, B, workoutB, setIdsB, exerciseId
const DATE = '2026-10-15'

beforeAll(async () => {
  ;({ app, pg } = await makeApp())
  A = await signedInAgent(app, { full_name: 'User A' })
  B = await signedInAgent(app, { full_name: 'User B' })
  const exercises = (await request(app).get('/api/exercises')).body.exercises
  exerciseId = exercises.find((e) => e.name === 'Back Squat').id
  workoutB = (await B.agent.post('/api/workouts').send({ exercise_id: exerciseId, date: DATE })).body.workout
  setIdsB = workoutB.exercises[0].sets.map((s) => s.id)
  await B.agent.patch('/api/sets').send({ set_id: setIdsB[0], completed: true })
  await insertCompleted(pg, B.user.id, '2026-10-14', 90)
})
afterAll(() => cleanup(pg))

const bState = async () => (await B.agent.get(`/api/workouts?date=${DATE}`)).body.workout

describe('cross-user isolation', () => {
  it('A cannot see B’s workout', async () => {
    expect((await A.agent.get(`/api/workouts?date=${DATE}`)).body.workout).toBeNull()
  })

  it('A’s dashboard does not include any of B’s numbers', async () => {
    const { body } = await A.agent.get(`/api/dashboard?date=${DATE}`).expect(200)
    expect(body.user.id).toBe(A.user.id)
    expect(body.today).toBeNull()
    expect(body.last7Minutes).toBe(0)
    expect(body.streak.current).toBe(0)
  })

  it('A cannot tick or untick B’s sets', async () => {
    expect((await A.agent.patch('/api/sets').send({ set_id: setIdsB[1], completed: true })).status).toBe(404)
    expect((await A.agent.patch('/api/sets').send({ set_id: setIdsB[0], completed: false })).status).toBe(404)
    const w = await bState()
    expect(w.exercises[0].sets.map((s) => s.completed)).toEqual(setIdsB.map((_, i) => i === 0))
  })

  it('A cannot finish or reset B’s workout', async () => {
    expect((await A.agent.patch('/api/workouts').send({ workout_id: workoutB.id, action: 'finish', date: DATE })).status).toBe(404)
    expect((await A.agent.patch('/api/workouts').send({ workout_id: workoutB.id, action: 'reset', date: DATE })).status).toBe(404)
    const w = await bState()
    expect(w.status).toBe('in_progress')
    expect(w.done_sets).toBe(1)
  })

  it('A removing an exercise only affects A’s own workout', async () => {
    await A.agent.delete(`/api/workouts?exercise_id=${exerciseId}&date=${DATE}`).expect(200)
    expect((await bState()).exercises).toHaveLength(1)
  })

  it('A adding exercises never lands in B’s workout', async () => {
    const mine = (await A.agent.post('/api/workouts').send({ exercise_id: exerciseId, date: DATE })).body.workout
    expect(mine.id).not.toBe(workoutB.id)
    expect((await bState()).exercises).toHaveLength(1)
  })

  it('/api/auth/me only ever returns the caller', async () => {
    expect((await A.agent.get('/api/auth/me')).body.user.id).toBe(A.user.id)
    expect((await B.agent.get('/api/auth/me')).body.user.id).toBe(B.user.id)
  })

  it('a user id in the request body is ignored (identity comes only from the cookie)', async () => {
    const res = await A.agent.get(`/api/workouts?date=${DATE}&user_id=${B.user.id}`)
    expect(res.body.workout?.id).not.toBe(workoutB.id)
  })
})
