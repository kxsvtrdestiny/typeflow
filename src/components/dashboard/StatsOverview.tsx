import { Clock3, Target, Languages, Type } from 'lucide-react'
const stats = [
  { label: '累计训练时间', value: '0', unit: '分钟', icon: Clock3 },
  { label: '累计训练次数', value: '0', unit: '次', icon: Target },
  { label: '中文最高速度', value: '—', unit: 'CPM', icon: Languages },
  { label: '英文最高速度', value: '—', unit: 'WPM', icon: Type },
]
export default function StatsOverview() {
  return <section className="stats-grid" aria-label="训练数据统计">{stats.map(({ label, value, unit, icon: Icon }) => <article className="card stat-card" key={label}><div className="stat-label"><span>{label}</span><Icon size={19} /></div><p className="stat-value">{value}<span>{unit}</span></p></article>)}</section>
}
