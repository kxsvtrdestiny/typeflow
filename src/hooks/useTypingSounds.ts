import { useEffect, useRef, useState } from 'react'
import type { UserSettings } from '../types'
import type { TypingSession } from './useTyping'
import { createTonePlayer, selectTypingTone } from '../utils/typingAudio'
export function useTypingSounds(id: string, session: TypingSession, settings: UserSettings) {
  const [error, setError] = useState<string | null>(null)
  const current = useRef({ id, status: session.status })
  current.current = { id, status: session.status }
  const player = useRef<ReturnType<typeof createTonePlayer> | null>(null)
  const previous = useRef({ id, total: 0, correct: 0 })
  useEffect(() => {
    const prior = previous.current.id === id ? previous.current : { total: 0, correct: 0 }
    const total = session.totalInputCharacters - prior.total, correct = session.totalCorrectInputCharacters - prior.correct
    previous.current = { id, total: session.totalInputCharacters, correct: session.totalCorrectInputCharacters }
    if (session.status !== 'running') return
    const tone = selectTypingTone(total, correct, settings.correctSound, settings.incorrectSound)
    if (tone) player.current?.play(tone, () => current.current.id === id && current.current.status === 'running')
  }, [id, session.status, session.totalInputCharacters, session.totalCorrectInputCharacters, settings.correctSound, settings.incorrectSound])
  useEffect(() => () => { player.current?.close(); player.current = null }, [])
  return { error, unlock(enabled = settings.correctSound || settings.incorrectSound) { if (enabled) { player.current ??= createTonePlayer(undefined, setError); void player.current.unlock() } } }
}
