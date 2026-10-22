import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import request from 'supertest'
import { makeApp, signedInAgent, cleanup } from '../helpers/app.js'

let app, pg, exercises
beforeAll(async () => {
  ;({ app, pg } = await makeApp())
  exercises = (await request(app).get('/api/exercises')).body.exercises
})
afterAll(() => cleanup(pg))

const DATE = '2026-10-15'
const ex = (name) => exercises.find((e) => e.name === name)

describe('today’s workout lifecycle', () => {
  it('create → add exercises → start (first tick) → complete', async () => {
    const { agent } = await signedInAgent(app)

    // Nothing yet
    expect((await agent.get(`/api/workouts?date=${DATE}`)).body.workout).toBeNull()

    // Adding the first exercise creates today's workout, with one set row per prescribed set
    const push = ex('Tempo Push-Up')
    let res = await agent.post('/api/workouts').send({ exercise_id: push.id, date: DATE }).expect(200)
    expect(res.body.added).toBe(true)
    let w = res.body.workout
    expect(w).toMatchObject({ status: 'planned', workout_date: DATE, name: 'Push Power' })
    expect(w.exercises).toHaveLength(1)
    expect(w.exercises[0].sets).toHaveLength(push.sets)
    expect(w.exercises[0].sets.every((s) => s.completed === false)).toBe(true)
    expect(w.exercises[0].rest_seconds).toBe(push.rest_seconds)

    const plank = ex('Plank Hold')
    res = await agent.post('/api/workouts').send({ exercise_id: plank.id, date: DATE }).expect(200)
    w = res.body.workout
    expect(w.exercises.map((e) => e.name)).toEqual(['Tempo Push-Up', 'Plank Hold'])
    expect(w.subtitle).toBe('Chest · Core')
    expect(w.total_sets).toBe(push.sets + plank.sets)

    // Adding the same exercise twice doesn't duplicate it
    res = await agent.post('/api/workouts').send({ exercise_id: plank.id, date: DATE }).expect(200)
    expect(res.body.added).toBe(false)
    expect(res.body.workout.exercises).toHaveLength(2)

    // Ticking the first set starts the workout
    const setIds = w.exercises.flatMap((e) => e.sets.map((s) => s.id))
    res = await agent.patch('/api/sets').send({ set_id: setIds[0], completed: true }).expect(200)
    expect(res.body).toMatchObject({ id: setIds[0], completed: true })
    expect(res.body.started_at).toBeTruthy()
    w = (await agent.get(`/api/workouts?date=${DATE}`)).body.workout
    expect(w.status).toBe('in_progress')
    expect(w.done_sets).toBe(1)

    // Untick
    res = await agent.patch('/api/sets').send({ set_id: setIds[0], completed: false }).expect(200)
    expect(res.body.completed).toBe(false)
    expect((await agent.get(`/api/workouts?date=${DATE}`)).body.workout.done_sets).toBe(0)

    // Tick everything
    for (const id of setIds) await agent.patch('/api/sets').send({ set_id: id, completed: true }).expect(200)
    w = (await agent.get(`/api/workouts?date=${DATE}`)).body.workout
    expect(w.done_sets).toBe(w.total_sets)

    // Finish
    res = await agent.patch('/api/workouts').send({ workout_id: w.id, action: 'finish', elapsed_seconds: 1500, date: DATE }).expect(200)
    expect(res.body.duration_minutes).toBeGreaterThanOrEqual(1)
    expect(res.body.streak).toMatchObject({ current: 1, trainedToday: true })
    w = (await agent.get(`/api/workouts?date=${DATE}`)).body.workout
    expect(w.status).toBe('completed')
    expect(w.completed_at).toBeTruthy()

    // A finished workout can't be finished again, or have its sets changed
    expect((await agent.patch('/api/workouts').send({ workout_id: w.id, action: 'finish', date: DATE })).status).toBe(404)
    expect((await agent.patch('/api/sets').send({ set_id: setIds[0], completed: false })).status).toBe(404)
  })

  it('finish uses the elapsed time when the workout was never started', async () => {
    const { agent } = await signedInAgent(app)
    const w = (await agent.post('/api/workouts').send({ exercise_id: ex('Lat Pulldown').id, date: DATE })).body.workout
    const res = await agent.patch('/api/workouts').send({ workout_id: w.id, action: 'finish', elapsed_seconds: 25 * 60, date: DATE }).expect(200)
    expect(res.body.duration_minutes).toBe(25)
  })

  it('duration is capped so a forgotten workout can’t log days of exercise', async () => {
    const { agent } = await signedInAgent(app)
    const w = (await agent.post('/api/workouts').send({ exercise_id: ex('Leg Press').id, date: DATE })).body.workout
    await pg.query(`UPDATE workouts SET started_at = now() - interval '2 days', status = 'in_progress' WHERE id = $1`, [w.id])
    const res = await agent.patch('/api/workouts').send({ workout_id: w.id, action: 'finish', date: DATE }).expect(200)
    expect(res.body.duration_minutes).toBe(300)
  })

  it('after finishing, adding an exercise starts a new workout for today', async () => {
    const { agent } = await signedInAgent(app)
    const first = (await agent.post('/api/workouts').send({ exercise_id: ex('Hammer Curl').id, date: DATE })).body.workout
    await agent.patch('/api/workouts').send({ workout_id: first.id, action: 'finish', elapsed_seconds: 600, date: DATE }).expect(200)
    const second = (await agent.post('/api/workouts').send({ exercise_id: ex('Jump Rope').id, date: DATE })).body.workout
    expect(second.id).not.toBe(first.id)
    expect(second.status).toBe('planned')
    expect(second.exercises.map((e) => e.name)).toEqual(['Jump Rope'])
  })

  it('removing the last exercise deletes the empty planned workout', async () => {
    const { agent } = await signedInAgent(app)
    const id = ex('Pallof Press').id
    await agent.post('/api/workouts').send({ exercise_id: id, date: DATE }).expect(200)
    const res = await agent.delete(`/api/workouts?exercise_id=${id}&date=${DATE}`).expect(200)
    expect(res.body.workout).toBeNull()
  })

  it('reset clears every set and returns the workout to planned', async () => {
    const { agent } = await signedInAgent(app)
    let w = (await agent.post('/api/workouts').send({ exercise_id: ex('Plank Hold').id, date: DATE })).body.workout
    await agent.patch('/api/sets').send({ set_id: w.exercises[0].sets[0].id, completed: true }).expect(200)
    w = (await agent.patch('/api/workouts').send({ workout_id: w.id, action: 'reset', date: DATE }).expect(200)).body.workout
    expect(w.status).toBe('planned')
    expect(w.started_at).toBeNull()
    expect(w.done_sets).toBe(0)
  })

  it('workouts on different days are separate', async () => {
    const { agent } = await signedInAgent(app)
    await agent.post('/api/workouts').send({ exercise_id: ex('Back Squat').id, date: '2026-10-14' }).expect(200)
    expect((await agent.get(`/api/workouts?date=${DATE}`)).body.workout).toBeNull()
    expect((await agent.get('/api/workouts?date=2026-10-14')).body.workout.exercises).toHaveLength(1)
  })

  it('validates input', async () => {
    const { agent } = await signedInAgent(app)
    expect((await agent.post('/api/workouts').send({ exercise_id: 'abc', date: DATE })).status).toBe(400)
    expect((await agent.post('/api/workouts').send({ exercise_id: 999999, date: DATE })).status).toBe(404)
    expect((await agent.patch('/api/workouts').send({ workout_id: 1, action: 'explode' })).status).toBe(400)
    expect((await agent.patch('/api/sets').send({ set_id: -4, completed: true })).status).toBe(400)
    expect((await agent.patch('/api/sets').send({ set_id: 999999, completed: true })).status).toBe(404)
  })
})
