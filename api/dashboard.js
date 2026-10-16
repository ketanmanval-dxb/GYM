// Everything the Dashboard needs for the logged-in user, in one request.
import { db } from './_lib/db.js'
import { route, localDate } from './_lib/http.js'
import { requireUserId, publicUser } from './_lib/auth.js'
import { loadWorkout, loadStreak } from './_lib/workouts.js'

export default route({
  async GET(req) {
    const userId = await requireUserId(req)
    const date = localDate(req.query.date)
    const sql = db()

    const [[user], today, weekly, [totals], streak, [nextClass]] = await Promise.all([
      sql`SELECT * FROM users WHERE id = ${userId}`,
      loadWorkout(sql, userId, date),
      sql`
        SELECT to_char(d, 'YYYY-MM-DD') AS date, to_char(d, 'Dy') AS day,
               COALESCE(sum(w.duration_minutes), 0)::int AS minutes
        FROM generate_series(${date}::date - 6, ${date}::date, interval '1 day') AS d
        LEFT JOIN workouts w
          ON w.workout_date = d::date AND w.user_id = ${userId} AND w.status = 'completed'
        GROUP BY d
        ORDER BY d`,
      sql`
        SELECT
          COALESCE(sum(duration_minutes) FILTER (WHERE workout_date BETWEEN ${date}::date - 13 AND ${date}::date - 7), 0)::int AS prev_7_minutes,
          count(*) FILTER (WHERE workout_date BETWEEN date_trunc('week', ${date}::date)::date AND ${date}::date)::int AS week_workouts,
          COALESCE(sum(duration_minutes) FILTER (WHERE workout_date BETWEEN date_trunc('week', ${date}::date)::date AND ${date}::date), 0)::int AS week_minutes
        FROM workouts
        WHERE user_id = ${userId} AND status = 'completed'`,
      loadStreak(sql, userId, date),
      sql`
        SELECT id, title, coach_name, start_time, duration_minutes, capacity, intensity
        FROM classes WHERE start_time > now() ORDER BY start_time LIMIT 1`,
    ])

    const goalsTotal = 2
    const goalsHit =
      Number(totals.week_workouts >= user.weekly_goal_workouts) + Number(totals.week_minutes >= user.weekly_goal_minutes)

    return {
      user: publicUser(user),
      today,
      weekly,
      last7Minutes: weekly.reduce((s, d) => s + d.minutes, 0),
      prev7Minutes: totals.prev_7_minutes,
      streak,
      rings: [
        { key: 'workouts', label: 'Workouts', value: totals.week_workouts, goal: user.weekly_goal_workouts },
        { key: 'minutes', label: 'Active min', value: totals.week_minutes, goal: user.weekly_goal_minutes },
        { key: 'goals', label: 'Goals hit', value: goalsHit, goal: goalsTotal },
      ],
      nextClass: nextClass || null,
    }
  },
})
