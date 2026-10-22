/** Fraction (0–1) of a progress ring to fill. Never NaN, never above 100%, never below 0. */
export function ringFraction(value, max) {
  const v = Number(value)
  const m = Number(max)
  if (!Number.isFinite(v) || !Number.isFinite(m) || m <= 0 || v <= 0) return 0
  return Math.min(v / m, 1)
}
