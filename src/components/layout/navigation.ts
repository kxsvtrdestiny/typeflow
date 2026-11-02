import { LayoutDashboard, Keyboard, BookOpen, ChartNoAxesCombined, Settings } from 'lucide-react'

export const navigation = [
  { to: '/', label: '首页', english: 'Dashboard', icon: LayoutDashboard },
  { to: '/practice', label: '打字训练', english: 'Practice', icon: Keyboard },
  { to: '/library', label: '词库管理', english: 'Library', icon: BookOpen },
  { to: '/history', label: '训练记录', english: 'History', icon: ChartNoAxesCombined },
  { to: '/settings', label: '设置', english: 'Settings', icon: Settings },
] as const
