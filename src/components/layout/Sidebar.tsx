import { NavLink } from 'react-router-dom'
import { Keyboard, X } from 'lucide-react'
import { navigation } from './navigation'
import { useLayoutStore } from '../../stores/useLayoutStore'

export default function Sidebar() {
  const open = useLayoutStore((s) => s.menuOpen)
  const close = useLayoutStore((s) => s.setMenuOpen)
  return (
    <aside id="app-sidebar" className={`sidebar ${open ? 'is-open' : ''}`} aria-label="应用侧边栏">
      <div className="brand"><span className="brand-icon"><Keyboard size={24} /></span><span>字律<small>TypeRhythm</small></span>
        <button className="icon-button mobile-only" aria-label="关闭菜单" onClick={() => close(false)}><X size={20} /></button>
      </div>
      <p className="nav-caption">工作空间</p>
      <nav aria-label="主导航">
        {navigation.map(({ to, label, english, icon: Icon }) => (
          <NavLink key={to} aria-label={label} to={to} end={to === '/'} onClick={() => close(false)} className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
            <Icon size={20} /><span>{label}<small>{english}</small></span>
          </NavLink>
        ))}
      </nav>
      <div className="sidebar-footer"><small>中英文输入训练空间</small></div>
    </aside>
  )
}
