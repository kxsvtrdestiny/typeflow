import { useCallback, useEffect, useState } from 'react'
import type { TrainingOutcome } from '../types'
import { useHistoryStore } from '../stores/useHistoryStore'
import type { SaveStatus } from '../stores/useHistoryStore'
export function useSaveHistory(id: string, result: TrainingOutcome | null) {
  const add = useHistoryStore((state) => state.add)
  const error = useHistoryStore((state) => state.error)
  const [status, setStatus] = useState<SaveStatus | null>(null)
  const save = useCallback(() => { if (result) setStatus(add(id, result)) }, [add, id, result])
  useEffect(() => { if (result) save(); else setStatus(null) }, [result, save])
  return { status, error, retry: save }
}
