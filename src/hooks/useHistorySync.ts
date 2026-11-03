import { useEffect } from 'react'
import { HISTORY_KEY } from '../utils/historyStorage'
import { useHistoryStore } from '../stores/useHistoryStore'
export function useHistorySync() {
  useEffect(() => {
    const refresh = (event: StorageEvent) => { if (event.key === HISTORY_KEY || event.key === null) useHistoryStore.getState().reload() }
    window.addEventListener('storage', refresh)
    return () => window.removeEventListener('storage', refresh)
  }, [])
}
