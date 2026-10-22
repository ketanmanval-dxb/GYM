import { SignJWT, jwtVerify } from 'jose'
import { HttpError, parseCookies } from './http.js'

const COOKIE = 'pf_session'
const MAX_AGE = 60 * 60 * 24 * 7 // 7 days

function secret() {
  const s = process.env.JWT_SECRET
  if (!s || s.length < 32) throw new HttpError(500, 'JWT_SECRET is missing or too short.', 'SERVER_ERROR')
  return new TextEncoder().encode(s)
}

// A second, non-secret cookie lets the browser know a session *may* exist, so logged-out
// visitors skip the /api/auth/me call (and its 401 in the console). It grants no access.
const HINT = 'pf_auth'

function cookies(value, maxAge) {
  const secure = process.env.VERCEL || process.env.NODE_ENV === 'production' ? '; Secure' : ''
  return [
    `${COOKIE}=${value}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${maxAge}${secure}`,
    `${HINT}=${value ? '1' : ''}; Path=/; SameSite=Lax; Max-Age=${maxAge}${secure}`,
  ]
}

export async function startSession(res, userId) {
  const token = await new SignJWT({})
    .setProtectedHeader({ alg: 'HS256' })
    .setSubject(String(userId))
    .setIssuedAt()
    .setExpirationTime(`${MAX_AGE}s`)
    .sign(secret())
  res.setHeader('Set-Cookie', cookies(token, MAX_AGE))
}

export function endSession(res) {
  res.setHeader('Set-Cookie', cookies('', 0))
}

/** Returns the logged-in user's id, or throws 401. */
export async function requireUserId(req) {
  const token = parseCookies(req)[COOKIE]
  if (!token) throw new HttpError(401, 'Please log in to continue.', 'UNAUTHENTICATED')
  try {
    const { payload } = await jwtVerify(token, secret(), { algorithms: ['HS256'] })
    const id = Number(payload.sub)
    if (!Number.isInteger(id)) throw new Error('bad subject')
    return id
  } catch {
    throw new HttpError(401, 'Your session has expired. Please log in again.', 'UNAUTHENTICATED')
  }
}

export const publicUser = (u) => ({
  id: u.id,
  email: u.email,
  full_name: u.full_name,
  weekly_goal_workouts: u.weekly_goal_workouts,
  weekly_goal_minutes: u.weekly_goal_minutes,
  created_at: u.created_at,
})
