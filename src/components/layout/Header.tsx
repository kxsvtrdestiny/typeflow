import { Menu, ChevronRight } from 'lucide-react'
import { useLocation } from 'react-router-dom'
import { navigation } from './navigation'
import { useLayoutStore } from '../../stores/useLayoutStore'

export default function Header() {
  const path = useLocation().pathname
  const current = navigation.find((item) => item.to === '/' ? path === '/' : path.startsWith(item.to))
  const open = useLayoutStore((s) => s.menuOpen)
  const setOpen = useLayoutStore((s) => s.setMenuOpen)
  return (
    <header className="app-header">
      <div className="breadcrumb"><button className="icon-button mobile-only" aria-label="打开菜单" aria-expanded={open} aria-controls="app-sidebar" onClick={() => setOpen(true)}><Menu size={22} /></button><span>工作空间</span><ChevronRight size={14} /><strong>{current?.label ?? '页面未找到'}</strong></div>
      <span className="header-label">专注当下 · 稳步提升</span>
    </header>
  )
}
