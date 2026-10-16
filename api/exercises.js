// The exercise catalogue (shared by all users).
import { db } from './_lib/db.js'
import { route, HttpError } from './_lib/http.js'

const GROUPS = ['Chest', 'Back', 'Legs', 'Arms', 'Core', 'Cardio']

export default route({
  async GET(req) {
    const group = req.query.muscle_group
    if (group && !GROUPS.includes(group)) throw new HttpError(400, 'Unknown muscle group')
    const sql = db()
    const exercises = group
      ? await sql`SELECT * FROM exercises WHERE muscle_group = ${group} ORDER BY id`
      : await sql`SELECT * FROM exercises ORDER BY id`
    return { exercises, muscle_groups: GROUPS }
  },
})
