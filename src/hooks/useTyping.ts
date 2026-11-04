import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { matchCharacters, splitGraphemes } from '../utils/typingCharacters'
import { normalizeText } from '../utils/textParser'
import { countSubmittedEdit } from '../utils/typingMetrics'
import type { SubmittedEdit } from '../utils/typingMetrics'
import { effectiveElapsed } from '../utils/trainingTime'
import type { TrainingStatus } from '../types'

export interface TypingSession {
  status: TrainingStatus; value: string; startedAt: string | null
  accumulatedMs: number; activeSegmentStart: number | null
  totalInputCharacters: number; totalCorrectInputCharacters: number
  completedAt: string | null; finishReason: 'article-completed' | 'time-expired' | null
}
function initialSession(): TypingSession {
  return { status: 'idle', value: '', startedAt: null, accumulatedMs: 0, activeSegmentStart: null,
    totalInputCharacters: 0, totalCorrectInputCharacters: 0, completedAt: null, finishReason: null }
}
export function useTyping(text: string, limitMs?: number) {
  const expected = useMemo(() => splitGraphemes(normalizeText(text)), [text])
  const [session, setSession] = useState<TypingSession>(initialSession)
  const latest = useRef(session)
  const publish = useCallback((next: TypingSession) => { latest.current = next; setSession(next) }, [])
  const elapsedMs = useCallback(() => effectiveElapsed(latest.current, performance.now(), limitMs), [limitMs])
  const finish = useCallback((s: TypingSession, reason: 'article-completed' | 'time-expired', now: number) => {
    publish({ ...s, status: 'completed', accumulatedMs: effectiveElapsed(s, now, limitMs), activeSegmentStart: null, completedAt: new Date().toISOString(), finishReason: reason })
  }, [limitMs, publish])
  const tick = useCallback(() => {
    const s = latest.current
    if (s.status === 'running' && s.startedAt && limitMs !== undefined && effectiveElapsed(s, performance.now()) >= limitMs) finish(s, 'time-expired', performance.now())
  }, [finish, limitMs])
  const start = useCallback(() => {
    const s = latest.current
    if (s.status === 'idle' && expected.length) publish({ ...s, status: 'running' })
  }, [expected.length, publish])
  const commit = useCallback((raw: string, edit?: SubmittedEdit) => {
    tick()
    const s = latest.current
    if (s.status !== 'running') return
    const value = normalizeText(raw)
    const added = countSubmittedEdit(s.value, value, expected, edit)
    if (value === s.value && added.total === 0) return
    const now = performance.now()
    const next = { ...s, value, totalInputCharacters: s.totalInputCharacters + added.total, totalCorrectInputCharacters: s.totalCorrectInputCharacters + added.correct }
    if (added.total && !next.startedAt) { next.startedAt = new Date().toISOString(); next.activeSegmentStart = now }
    if (splitGraphemes(value).length >= expected.length) finish(next, 'article-completed', now)
    else publish(next)
  }, [expected, finish, publish, tick])
  const pause = useCallback(() => {
    tick()
    const s = latest.current
    if (s.status !== 'running') return
    publish({ ...s, status: 'paused', accumulatedMs: elapsedMs(), activeSegmentStart: null })
  }, [elapsedMs, publish, tick])
  const resume = useCallback(() => {
    const s = latest.current
    if (s.status !== 'paused' || document.hidden) return
    publish({ ...s, status: 'running', activeSegmentStart: s.startedAt ? performance.now() : null })
  }, [publish])
  const restart = useCallback(() => publish(initialSession()), [publish])
  useEffect(() => {
    const hidden = () => { if (document.hidden) pause() }
    window.addEventListener('blur', pause)
    document.addEventListener('visibilitychange', hidden)
    return () => { window.removeEventListener('blur', pause); document.removeEventListener('visibilitychange', hidden) }
  }, [pause])
  const actual = useMemo(() => splitGraphemes(session.value), [session.value])
  const slots = useMemo(() => matchCharacters(expected, actual), [expected, actual])
  const correctCharacters = slots.filter((slot) => slot.status === 'correct').length
  const incorrectCharacters = slots.filter((slot) => slot.status === 'incorrect').length
  return { session, expected, actual, slots, start, commit, pause, resume, restart, elapsedMs, tick,
    correctCharacters, incorrectCharacters, submittedCharacters: actual.length,
    progress: expected.length ? Math.min(actual.length / expected.length, 1) : 0 }
}
