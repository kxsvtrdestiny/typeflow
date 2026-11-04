import { Clock3, Target, Languages, Type } from 'lucide-react'
import { useHistoryStore } from '../../stores/useHistoryStore'
import { historySummary } from '../../utils/historyStats'
export default function StatsOverview() {
  const records = useHistoryStore((state) => state.records)
  const summary = historySummary(records)
  const stats = [
    { label: '累计训练时间', value: (summary.elapsedMs / 60000).toFixed(1), unit: '分钟', icon: Clock3 },
    { label: '累计训练次数', value: summary.count.toString(), unit: '次', icon: Target },
    { label: '中文最高速度', value: records.some((record) => record.language === 'zh') ? Math.round(summary.bestCpm).toString() : '—', unit: 'CPM', icon: Languages },
    { label: '英文最高速度', value: records.some((record) => record.language === 'en') ? Math.round(summary.bestWpm).toString() : '—', unit: 'WPM', icon: Type },
  ]
  return <section className="stats-grid" aria-label="训练数据统计">{stats.map(({ label, value, unit, icon: Icon }) => <article className="card stat-card" key={label}><div className="stat-label"><span>{label}</span><Icon size={19} /></div><p className="stat-value">{value}<span>{unit}</span></p></article>)}</section>
}
