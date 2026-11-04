export interface ClockSnapshot { accumulatedMs: number; activeSegmentStart: number | null }
export function effectiveElapsed(clock: ClockSnapshot, now: number, limitMs?: number): number {
  const elapsed = Math.max(0, clock.accumulatedMs + (clock.activeSegmentStart === null ? 0 : Math.max(0, now - clock.activeSegmentStart)))
  return limitMs === undefined ? elapsed : Math.min(elapsed, Math.max(0, limitMs))
}
