import { useCallback, useEffect, useRef, useState } from 'react'
import type { TrainingOutcome } from '../types'
import { useHistoryStore } from '../stores/useHistoryStore'
import type { SaveStatus } from '../stores/useHistoryStore'
export function useSaveHistory(id: string, result: TrainingOutcome | null, enabled = true) {
  const add = useHistoryStore((state) => state.add)
  const error = useHistoryStore((state) => state.error)
  const [status, setStatus] = useState<SaveStatus | 'disabled' | null>(null)
  const decision = useRef<{ id: string; enabled: boolean } | null>(null)
  const save = useCallback(() => {
    if (!result) return
    if (!decision.current || decision.current.id !== id) decision.current = { id, enabled }
    setStatus(decision.current.enabled ? add(id, result) : 'disabled')
  }, [add, id, result, enabled])
  useEffect(() => { if (result) save(); else setStatus(null) }, [result, save])
  return { status, error, retry: save }
}
