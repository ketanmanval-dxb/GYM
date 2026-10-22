import { db } from '../_lib/db.js'
import { route, localDate, HttpError } from '../_lib/http.js'
import { requireUserId, publicUser, endSession } from '../_lib/auth.js'
import { loadStreak } from '../_lib/workouts.js'

export default route({
  async GET(req, res) {
    const userId = await requireUserId(req).catch((err) => {
      endSession(res) // expired or invalid: clear both cookies so the browser stops asking
      throw err
    })
    const sql = db()
    const [[user], streak] = await Promise.all([
      sql`SELECT * FROM users WHERE id = ${userId}`,
      loadStreak(sql, userId, localDate(req.query.date)),
    ])
    if (!user) {
      endSession(res)
      throw new HttpError(401, 'Your account no longer exists.', 'UNAUTHENTICATED')
    }
    return { user: publicUser(user), streak }
  },
})
