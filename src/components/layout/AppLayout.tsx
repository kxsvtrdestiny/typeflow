import { useEffect, useRef } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { useAppTheme } from '../../hooks/useAppTheme'
import { useHistorySync } from '../../hooks/useHistorySync'
import { useSettingsStore } from '../../stores/useSettingsStore'
import Sidebar from './Sidebar'
import Header from './Header'
import { useLayoutStore } from '../../stores/useLayoutStore'

export default function AppLayout() {
  useHistorySync()
  useAppTheme()
  const open = useLayoutStore((s) => s.menuOpen)
  const setOpen = useLayoutStore((s) => s.setMenuOpen)
  const path = useLocation().pathname
  const settingsError = useSettingsStore((state) => state.error)
  const sidebarRef = useRef<HTMLDivElement>(null)
  useEffect(() => { setOpen(false) }, [path, setOpen])
  useEffect(() => {
    if (!open) return
    const previous = document.activeElement as HTMLElement | null
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const items = () => Array.from(sidebarRef.current?.querySelectorAll<HTMLElement>('button, a') ?? [])
    items()[0]?.focus()
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false)
      if (event.key !== 'Tab') return
      const elements = items()
      const first = elements[0], last = elements.at(-1)
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus() }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus() }
    }
    const onResize = () => { if (window.innerWidth >= 1024) setOpen(false) }
    document.addEventListener('keydown', onKey)
    window.addEventListener('resize', onResize)
    return () => {
      document.body.style.overflow = previousOverflow
      document.removeEventListener('keydown', onKey)
      window.removeEventListener('resize', onResize)
      previous?.focus()
    }
  }, [open, setOpen])
  return (
    <div className="app-shell">
      <a className="skip-link" href="#main-content" onClick={(event) => { event.preventDefault(); document.getElementById('main-content')?.focus() }}>跳到主内容</a>
      {open && <button className="menu-backdrop" aria-label="关闭导航遮罩" tabIndex={-1} onClick={() => setOpen(false)} />}
      <div ref={sidebarRef}><Sidebar /></div>
      <div className="main-shell" inert={open || undefined}>
        <Header />
        <main id="main-content" className="main-content" tabIndex={-1}>{settingsError && path !== '/settings' && <div className="storage-notice" role="alert">{settingsError}</div>}<Outlet /></main>
      </div>
    </div>
  )
}
