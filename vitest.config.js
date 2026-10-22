import { defineConfig } from 'vitest/config'

// Backend + logic tests. Each test file gets its own in-memory Postgres (see tests/helpers/app.js),
// so tests never touch .localdb or Neon.
export default defineConfig({
  test: {
    environment: 'node',
    pool: 'forks',
    include: ['tests/unit/**/*.test.js', 'tests/api/**/*.test.js'],
    testTimeout: 30_000,
    hookTimeout: 60_000,
  },
})
