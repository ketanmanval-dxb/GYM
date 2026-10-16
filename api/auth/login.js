import bcrypt from 'bcryptjs'
import { db } from '../_lib/db.js'
import { route, body, HttpError } from '../_lib/http.js'
import { startSession, publicUser } from '../_lib/auth.js'

export default route({
  async POST(req, res) {
    const b = body(req)
    const email = String(b.email || '').trim().toLowerCase()
    const password = String(b.password || '')
    if (!email || !password) throw new HttpError(400, 'Please enter your email and password.')

    const sql = db()
    const [user] = await sql`SELECT * FROM users WHERE email = ${email}`
    const ok = user && (await bcrypt.compare(password, user.password_hash))
    if (!ok) throw new HttpError(401, 'That email and password don’t match.', 'BAD_CREDENTIALS')

    await startSession(res, user.id)
    return { user: publicUser(user) }
  },
})
