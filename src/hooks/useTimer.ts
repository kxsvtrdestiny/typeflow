import { useEffect, useState } from 'react'
import type { TrainingStatus } from '../types'

/** The interval refreshes the display/checks a deadline; it never accumulates time. */
export function useTimer(status: TrainingStatus, readElapsed: () => number, tick: () => void) {
  const [displayMs, setDisplayMs] = useState(0)
  useEffect(() => {
    setDisplayMs(readElapsed())
    if (status !== 'running') return
    const timer = window.setInterval(() => { tick(); setDisplayMs(readElapsed()) }, 200)
    return () => window.clearInterval(timer)
  }, [status, readElapsed, tick])
  return status === 'running' ? displayMs : readElapsed()
}
