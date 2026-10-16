// Tick / untick a set in one of the logged-in user's unfinished workouts.
//   PATCH { set_id, completed }
import { db } from './_lib/db.js'
import { route, body, toInt, HttpError } from './_lib/http.js'
import { requireUserId } from './_lib/auth.js'

export default route({
  async PATCH(req) {
    const userId = await requireUserId(req)
    const b = body(req)
    const setId = toInt(b.set_id, 'set_id')
    const completed = b.completed === true
    const sql = db()

    const [row] = await sql`
      WITH s AS (
        UPDATE workout_sets ws
        SET completed = ${completed}::boolean,
            completed_at = CASE WHEN ${completed}::boolean THEN now() END
        FROM workout_exercises we
        JOIN workouts w ON w.id = we.workout_id
        WHERE ws.id = ${setId} AND ws.workout_exercise_id = we.id
          AND w.user_id = ${userId} AND w.status <> 'completed'
        RETURNING ws.id, ws.completed, w.id AS workout_id
      ),
      started AS (
        UPDATE workouts
        SET status = 'in_progress', started_at = COALESCE(started_at, now())
        WHERE id IN (SELECT workout_id FROM s) AND status = 'planned' AND ${completed}::boolean
        RETURNING started_at
      )
      SELECT s.id, s.completed, s.workout_id,
             COALESCE((SELECT started_at FROM started), (SELECT started_at FROM workouts WHERE id = s.workout_id)) AS started_at
      FROM s`
    if (!row) throw new HttpError(404, 'Set not found, or that workout is already finished.')
    return row
  },
})
