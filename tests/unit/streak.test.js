import { describe, it, expect } from 'vitest'
import { computeStreak, addDays } from '../../api/_lib/workouts.js'
import { ringFraction } from '../../src/lib/progress.js'

const TODAY = '2026-10-15'
const ago = (n) => addDays(TODAY, -n)

describe('streak logic (fake dates)', () => {
  it('no workouts → streak 0', () => {
    expect(computeStreak([], TODAY)).toEqual({ current: 0, best: 0, trainedToday: false })
  })

  it('3 days in a row ending today → streak 3', () => {
    expect(computeStreak([ago(0), ago(1), ago(2)], TODAY)).toMatchObject({ current: 3, best: 3, trainedToday: true })
  })

  it('3 days in a row ending yesterday → streak still alive at 3 (today not trained yet)', () => {
    expect(computeStreak([ago(1), ago(2), ago(3)], TODAY)).toMatchObject({ current: 3, trainedToday: false })
  })

  it('a missed day resets the streak but keeps the best', () => {
    // trained today, missed yesterday, trained the 2 days before
    expect(computeStreak([ago(0), ago(2), ago(3)], TODAY)).toMatchObject({ current: 1, best: 2 })
  })

  it('missing both today and yesterday → streak 0', () => {
    expect(computeStreak([ago(2), ago(3), ago(4)], TODAY)).toMatchObject({ current: 0, best: 3 })
  })

  it('workout today plus yesterday → streak 2', () => {
    expect(computeStreak([ago(0), ago(1)], TODAY)).toMatchObject({ current: 2, best: 2, trainedToday: true })
  })

  it('two workouts on the same day count once', () => {
    expect(computeStreak([ago(0), ago(0), ago(1)], TODAY)).toMatchObject({ current: 2 })
  })

  it('works across month and year boundaries', () => {
    expect(computeStreak(['2026-09-30', '2026-10-01'], '2026-10-01').current).toBe(2)
    expect(computeStreak(['2025-12-31', '2026-01-01'], '2026-01-01').current).toBe(2)
  })

  it('ignores dates in the future', () => {
    expect(computeStreak([addDays(TODAY, 1), ago(0)], TODAY)).toMatchObject({ current: 1, best: 1 })
  })

  it('best streak finds the longest run in history', () => {
    const old = ['2026-09-01', '2026-09-02', '2026-09-03', '2026-09-04', '2026-09-05']
    expect(computeStreak([...old, ago(0)], TODAY)).toMatchObject({ current: 1, best: 5 })
  })
})

describe('progress rings', () => {
  it('fills proportionally', () => {
    expect(ringFraction(2, 4)).toBe(0.5)
    expect(ringFraction(0, 4)).toBe(0)
  })

  it('never goes above 100%', () => {
    expect(ringFraction(9, 4)).toBe(1)
    expect(ringFraction(500, 180)).toBe(1)
  })

  it('never returns NaN or a negative value', () => {
    for (const [v, m] of [[0, 0], [5, 0], [undefined, undefined], [NaN, 4], [3, NaN], [-2, 4], [null, 4], [Infinity, 4]]) {
      const f = ringFraction(v, m)
      expect(Number.isNaN(f)).toBe(false)
      expect(f).toBeGreaterThanOrEqual(0)
      expect(f).toBeLessThanOrEqual(1)
    }
  })
})
