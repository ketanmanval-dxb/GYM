// Today's workout for the logged-in user.
//   GET    ?date=YYYY-MM-DD                      → { workout | null }
//   POST   { exercise_id, date }                 → add an exercise to today's (unfinished) workout
//   DELETE ?exercise_id=&date=                   → remove it again
//   PATCH  { workout_id, action: 'finish' | 'reset', elapsed_seconds, date }
import { db } from './_lib/db.js'
import { route, body, localDate, toInt, HttpError } from './_lib/http.js'
import { requireUserId } from './_lib/auth.js'
import { loadWorkout, loadStreak, workoutNameFor } from './_lib/workouts.js'

export default route({
  async GET(req) {
    const userId = await requireUserId(req)
    return { workout: await loadWorkout(db(), userId, localDate(req.query.date)) }
  },

  async POST(req) {
    const userId = await requireUserId(req)
    const b = body(req)
    const exerciseId = toInt(b.exercise_id, 'exercise_id')
    const date = localDate(b.date)
    const sql = db()

    const [exercise] = await sql`SELECT id, name, muscle_group FROM exercises WHERE id = ${exerciseId}`
    if (!exercise) throw new HttpError(404, 'That exercise no longer exists.')

    // Create today's unfinished workout if there isn't one (the partial unique index prevents duplicates).
    await sql`
      INSERT INTO workouts (user_id, name, workout_date)
      VALUES (${userId}, ${workoutNameFor(exercise.muscle_group)}, ${date}::date)
      ON CONFLICT (user_id, workout_date) WHERE status <> 'completed' DO NOTHING`
    const [workout] = await sql`
      SELECT id FROM workouts
      WHERE user_id = ${userId} AND workout_date = ${date}::date AND status <> 'completed'`

    const added = await sql`
      WITH we AS (
        INSERT INTO workout_exercises (workout_id, exercise_id, order_index)
        VALUES (${workout.id}, ${exerciseId},
                COALESCE((SELECT max(order_index) + 1 FROM workout_exercises WHERE workout_id = ${workout.id}), 0))
        ON CONFLICT (workout_id, exercise_id) DO NOTHING
        RETURNING id, exercise_id
      )
      INSERT INTO workout_sets (workout_exercise_id, set_number)
      SELECT we.id, gs
      FROM we
      JOIN exercises e ON e.id = we.exercise_id
      CROSS JOIN LATERAL generate_series(1, e.sets) AS gs
      RETURNING workout_exercise_id`

    return { added: added.length > 0, workout: await loadWorkout(sql, userId, date) }
  },

  async DELETE(req) {
    const userId = await requireUserId(req)
    const exerciseId = toInt(req.query.exercise_id, 'exercise_id')
    const date = localDate(req.query.date)
    const sql = db()

    await sql`
      DELETE FROM workout_exercises we
      USING workouts w
      WHERE we.workout_id = w.id AND we.exercise_id = ${exerciseId}
        AND w.user_id = ${userId} AND w.workout_date = ${date}::date AND w.status <> 'completed'`
    // Drop the workout itself if it's now empty and hasn't been started.
    await sql`
      DELETE FROM workouts w
      WHERE w.user_id = ${userId} AND w.workout_date = ${date}::date AND w.status = 'planned'
        AND NOT EXISTS (SELECT 1 FROM workout_exercises WHERE workout_id = w.id)`

    return { workout: await loadWorkout(sql, userId, date) }
  },

  async PATCH(req) {
    const userId = await requireUserId(req)
    const b = body(req)
    const workoutId = toInt(b.workout_id, 'workout_id')
    const date = localDate(b.date)
    const sql = db()

    if (b.action === 'finish') {
      const elapsed = Math.max(0, Math.min(Number(b.elapsed_seconds) || 0, 6 * 3600))
      const [done] = await sql`
        UPDATE workouts SET
          status = 'completed',
          completed_at = now(),
          started_at = COALESCE(started_at, now() - make_interval(secs => ${elapsed}::float8)),
          duration_minutes = LEAST(300, GREATEST(1, ROUND(EXTRACT(EPOCH FROM
            now() - COALESCE(started_at, now() - make_interval(secs => ${elapsed}::float8))) / 60)::int))
        WHERE id = ${workoutId} AND user_id = ${userId} AND status <> 'completed'
        RETURNING id, duration_minutes`
      if (!done) throw new HttpError(404, 'Workout not found or already finished.')
      const streak = await loadStreak(sql, userId, date)
      return { duration_minutes: done.duration_minutes, streak }
    }

    if (b.action === 'reset') {
      const [w] = await sql`SELECT id FROM workouts WHERE id = ${workoutId} AND user_id = ${userId} AND status <> 'completed'`
      if (!w) throw new HttpError(404, 'Workout not found or already finished.')
      await sql.transaction([
        sql`UPDATE workout_sets SET completed = false, completed_at = NULL
            WHERE workout_exercise_id IN (SELECT id FROM workout_exercises WHERE workout_id = ${w.id})`,
        sql`UPDATE workouts SET status = 'planned', started_at = NULL WHERE id = ${w.id}`,
      ])
      return { workout: await loadWorkout(sql, userId, date) }
    }

    throw new HttpError(400, 'Unknown action')
  },
})
