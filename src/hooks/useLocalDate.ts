import { useEffect, useState } from 'react'
/** Refresh on the next local midnight and on return from a background tab. */
export function useLocalDate() {
  const [now, setNow] = useState(() => new Date())
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>
    function refresh() {
      const current = new Date()
      setNow(current)
      clearTimeout(timer)
      const midnight = new Date(current.getFullYear(), current.getMonth(), current.getDate() + 1)
      timer = setTimeout(refresh, Math.max(1, midnight.getTime() - current.getTime()))
    }
    function visible() { if (!document.hidden) refresh() }
    refresh()
    window.addEventListener('focus', refresh)
    document.addEventListener('visibilitychange', visible)
    return () => { clearTimeout(timer); window.removeEventListener('focus', refresh); document.removeEventListener('visibilitychange', visible) }
  }, [])
  return now
}
