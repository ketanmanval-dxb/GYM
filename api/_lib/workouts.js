// Shared queries for "today's workout" and streaks. Every query is scoped to a user id.

const NAME_BY_GROUP = {
  Chest: 'Push Power',
  Back: 'Pull Power',
  Legs: 'Leg Day',
  Arms: 'Arm Blast',
  Core: 'Core Crusher',
  Cardio: 'Cardio Burn',
}

export const workoutNameFor = (group) => NAME_BY_GROUP[group] || 'Today’s Workout'

/**
 * Today's workout for a user with its exercises and sets.
 * Prefers an unfinished workout; otherwise returns the latest completed one (or null).
 */
export async function loadWorkout(sql, userId, date) {
  const [w] = await sql`
    SELECT w.id, w.name, to_char(w.workout_date, 'YYYY-MM-DD') AS workout_date, w.status,
           w.duration_minutes, w.started_at, w.completed_at,
           COALESCE((
             SELECT json_agg(x ORDER BY x.order_index, x.workout_exercise_id)
             FROM (
               SELECT we.id AS workout_exercise_id, we.order_index, e.id AS exercise_id, e.name, e.muscle_group,
                      e.reps, e.difficulty, e.rest_seconds, e.description,
                      COALESCE((
                        SELECT json_agg(json_build_object('id', s.id, 'set_number', s.set_number, 'completed', s.completed)
                                        ORDER BY s.set_number)
                        FROM workout_sets s WHERE s.workout_exercise_id = we.id
                      ), '[]'::json) AS sets
               FROM workout_exercises we
               JOIN exercises e ON e.id = we.exercise_id
               WHERE we.workout_id = w.id
             ) x
           ), '[]'::json) AS exercises
    FROM workouts w
    WHERE w.user_id = ${userId} AND w.workout_date = ${date}::date
    ORDER BY (w.status = 'completed'), w.id DESC
    LIMIT 1`
  if (!w) return null

  const groups = [...new Set(w.exercises.map((e) => e.muscle_group))]
  const totalSets = w.exercises.reduce((s, e) => s + e.sets.length, 0)
  const doneSets = w.exercises.reduce((s, e) => s + e.sets.filter((x) => x.completed).length, 0)
  // ~45 s of work per set plus the prescribed rest
  const estMinutes = Math.max(1, Math.round(w.exercises.reduce((s, e) => s + e.sets.length * (45 + e.rest_seconds), 0) / 60))
  return { ...w, subtitle: groups.join(' · '), total_sets: totalSets, done_sets: doneSets, est_minutes: estMinutes }
}

export const addDays = (iso, n) => {
  const d = new Date(`${iso}T00:00:00Z`)
  d.setUTCDate(d.getUTCDate() + n)
  return d.toISOString().slice(0, 10)
}

/** Current streak (consecutive days with a completed workout, ending today or yesterday) and best streak. */
export async function loadStreak(sql, userId, today) {
  const rows = await sql`
    SELECT DISTINCT to_char(workout_date, 'YYYY-MM-DD') AS d
    FROM workouts
    WHERE user_id = ${userId} AND status = 'completed' AND workout_date <= ${today}::date
    ORDER BY d DESC`
  return computeStreak(rows.map((r) => r.d), today)
}

/** Pure streak maths on a list of 'YYYY-MM-DD' dates that had a completed workout. */
export function computeStreak(dates, today) {
  const days = new Set(dates.filter((d) => d <= today))

  let current = 0
  let cursor = days.has(today) ? today : addDays(today, -1)
  while (days.has(cursor)) {
    current++
    cursor = addDays(cursor, -1)
  }

  let best = 0
  let run = 0
  let prev = null
  for (const d of [...days].sort()) {
    run = prev && addDays(prev, 1) === d ? run + 1 : 1
    best = Math.max(best, run)
    prev = d
  }
  return { current, best, trainedToday: days.has(today) }
}
