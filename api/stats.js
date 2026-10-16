// Public landing-page counters. Aggregate counts only, no personal data.
import { db } from './_lib/db.js'
import { route } from './_lib/http.js'

export default route({
  async GET() {
    const sql = db()
    const [row] = await sql`
      SELECT
        (SELECT count(*) FROM users)::int AS members,
        (SELECT count(*) FROM workouts WHERE status = 'completed')::int AS workouts_completed,
        (SELECT count(*) FROM classes
          WHERE start_time >= date_trunc('week', now())
            AND start_time <  date_trunc('week', now()) + interval '7 days')::int AS classes_this_week`
    return row
  },
})
