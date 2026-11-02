import { useCallback, useMemo, useRef, useState } from 'react'
import { matchCharacters, splitGraphemes } from '../utils/typingCharacters'
import { normalizeText } from '../utils/textParser'
import type { TrainingStatus } from '../types'

export interface TypingSession {
  status: TrainingStatus
  value: string
  startedAt: string | null
  accumulatedMs: number
  activeSegmentStart: number | null
}
function initialSession(): TypingSession {
  return { status: 'idle', value: '', startedAt: null, accumulatedMs: 0, activeSegmentStart: null }
}
export function useTyping(text: string) {
  // The owning training panel is keyed by article identity and freezes its content.
  const expected = useMemo(() => splitGraphemes(normalizeText(text)), [text])
  const [session, setSession] = useState<TypingSession>(initialSession)
  const latest = useRef(session)
  const publish = useCallback((next: TypingSession) => { latest.current = next; setSession(next) }, [])
  const elapsedMs = useCallback(() => {
    const s = latest.current
    return s.accumulatedMs + (s.activeSegmentStart === null ? 0 : performance.now() - s.activeSegmentStart)
  }, [])
  const start = useCallback(() => {
    const s = latest.current
    if (s.status === 'idle' && expected.length) publish({ ...s, status: 'running' })
  }, [expected.length, publish])
  const commit = useCallback((raw: string) => {
    const s = latest.current
    if (s.status !== 'running') return
    const value = normalizeText(raw)
    if (value === s.value) return
    const now = performance.now()
    const next = { ...s, value }
    if (value && !next.startedAt) { next.startedAt = new Date().toISOString(); next.activeSegmentStart = now }
    if (splitGraphemes(value).length >= expected.length) {
      next.status = 'completed'
      next.accumulatedMs += next.activeSegmentStart === null ? 0 : now - next.activeSegmentStart
      next.activeSegmentStart = null
    }
    publish(next)
  }, [expected.length, publish])
  const pause = useCallback(() => {
    const s = latest.current
    if (s.status !== 'running') return
    publish({ ...s, status: 'paused', accumulatedMs: elapsedMs(), activeSegmentStart: null })
  }, [elapsedMs, publish])
  const resume = useCallback(() => {
    const s = latest.current
    if (s.status !== 'paused') return
    publish({ ...s, status: 'running', activeSegmentStart: s.startedAt ? performance.now() : null })
  }, [publish])
  const restart = useCallback(() => publish(initialSession()), [publish])
  const actual = useMemo(() => splitGraphemes(session.value), [session.value])
  const slots = useMemo(() => matchCharacters(expected, actual), [expected, actual])
  const correctCharacters = slots.filter((slot) => slot.status === 'correct').length
  const incorrectCharacters = slots.filter((slot) => slot.status === 'incorrect').length
  return { session, expected, actual, slots, start, commit, pause, resume, restart, elapsedMs,
    correctCharacters, incorrectCharacters, submittedCharacters: actual.length,
    progress: expected.length ? Math.min(actual.length / expected.length, 1) : 0 }
}
