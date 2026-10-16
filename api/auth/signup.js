import bcrypt from 'bcryptjs'
import { db } from '../_lib/db.js'
import { route, body, HttpError } from '../_lib/http.js'
import { startSession, publicUser } from '../_lib/auth.js'

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export default route({
  async POST(req, res) {
    const b = body(req)
    const email = String(b.email || '').trim().toLowerCase()
    const password = String(b.password || '')
    const fullName = String(b.full_name || '').trim()
    const goalWorkouts = Number(b.weekly_goal_workouts ?? 4)
    const goalMinutes = Number(b.weekly_goal_minutes ?? 180)

    if (!fullName || fullName.length > 80) throw new HttpError(400, 'Please enter your name.')
    if (!EMAIL.test(email)) throw new HttpError(400, 'Please enter a valid email address.')
    if (password.length < 8) throw new HttpError(400, 'Password must be at least 8 characters.')
    if (!Number.isInteger(goalWorkouts) || goalWorkouts < 1 || goalWorkouts > 14) throw new HttpError(400, 'Weekly workouts goal must be between 1 and 14.')
    if (!Number.isInteger(goalMinutes) || goalMinutes < 10 || goalMinutes > 3000) throw new HttpError(400, 'Weekly minutes goal must be between 10 and 3000.')

    const sql = db()
    const hash = await bcrypt.hash(password, 10)
    const [user] = await sql`
      INSERT INTO users (email, password_hash, full_name, weekly_goal_workouts, weekly_goal_minutes)
      VALUES (${email}, ${hash}, ${fullName}, ${goalWorkouts}, ${goalMinutes})
      ON CONFLICT (email) DO NOTHING
      RETURNING *`
    if (!user) throw new HttpError(409, 'An account with this email already exists. Try logging in.', 'EMAIL_TAKEN')

    await startSession(res, user.id)
    return { user: publicUser(user) }
  },
})
