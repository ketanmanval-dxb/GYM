// Local-only helper: makes sure .env exists, has a JWT_SECRET, and loads it into process.env.
// On Vercel these variables come from the project settings instead, so this file is never deployed.
import { randomBytes } from 'node:crypto'
import { existsSync, readFileSync, writeFileSync, appendFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import path from 'node:path'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const envPath = path.join(root, '.env')

export const NEON_HELP = `
  DATABASE_URL is missing from pulsefit/.env

  Where to copy it from:
    1. Go to https://console.neon.tech and sign in (the free plan is fine).
    2. Open your project, or click "New project" (any name, e.g. pulsefit).
    3. On the project Dashboard, click the "Connect" button (top right).
    4. Keep Branch = production, Database = neondb, Role = neondb_owner,
       and make sure "Connection pooling" is switched ON.
    5. Copy the connection string. It looks like:
       postgresql://neondb_owner:xxxx@ep-xxxx-pooler.region.aws.neon.tech/neondb?sslmode=require
    6. Paste it into pulsefit/.env so the line reads:
       DATABASE_URL=postgresql://neondb_owner:xxxx@ep-xxxx-pooler...
    7. Run:  npm run db:setup
`

export function loadEnv() {
  if (!existsSync(envPath)) writeFileSync(envPath, 'DATABASE_URL=\nJWT_SECRET=\n')

  let text = readFileSync(envPath, 'utf8')
  const secret = text.match(/^JWT_SECRET=(.*)$/m)
  if (!secret || !secret[1].trim()) {
    const value = randomBytes(48).toString('base64url')
    if (secret) text = text.replace(/^JWT_SECRET=.*$/m, `JWT_SECRET=${value}`)
    else text = `${text.trimEnd()}\nJWT_SECRET=${value}\n`
    writeFileSync(envPath, text)
    console.log('🔐 Generated a strong JWT_SECRET and saved it to .env')
  }

  process.loadEnvFile(envPath)
  return { hasDatabaseUrl: Boolean(process.env.DATABASE_URL?.trim()) }
}

export function ensureGitignore() {
  const p = path.join(root, '.gitignore')
  const current = existsSync(p) ? readFileSync(p, 'utf8') : ''
  if (!/^\.env$/m.test(current)) appendFileSync(p, `${current && !current.endsWith('\n') ? '\n' : ''}.env\n`)
}

export { root }
