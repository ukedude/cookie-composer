/** Cubic ease-in: slow start, accelerating. */
export function easeInCubic(u: number): number {
  return u ** 3
}

/** Cubic ease-in-out: slow start, fast middle, slow end. */
export function easeInOutCubic(u: number): number {
  return u < 0.5 ? 4 * u ** 3 : 1 - (-2 * u + 2) ** 3 / 2
}

/** Cubic ease-out: fast start, decelerating to a stop. */
export function easeOutCubic(u: number): number {
  return 1 - (1 - u) ** 3
}

/** Overshoots past 1 before settling back to 1 — used for a gentle "pop and settle". */
export function easeOutBack(u: number, overshoot = 1.2): number {
  const c = overshoot
  return 1 + (c + 1) * (u - 1) ** 3 + c * (u - 1) ** 2
}
