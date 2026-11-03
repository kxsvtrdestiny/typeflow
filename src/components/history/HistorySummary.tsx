import type { TrainingRecord } from '../../types'
import { historySummary } from '../../utils/historyStats'
export default function HistorySummary({ records }: { records: TrainingRecord[] }) {
  const summary = historySummary(records)
  const entries = [
    ['累计训练次数', `${summary.count}`, '次'],
    ['累计训练时长', (summary.elapsedMs / 60000).toFixed(1), '分钟'],
    ['平均准确率', `${summary.averageAccuracy.toFixed(1)}`, '%'],
    ['最佳中文速度', records.some((record) => record.language === 'zh') ? Math.round(summary.bestCpm).toString() : '—', 'CPM'],
    ['最佳英文速度', records.some((record) => record.language === 'en') ? Math.round(summary.bestWpm).toString() : '—', 'WPM'],
  ]
  return <section className="history-summary" aria-label="全部记录统计">{entries.map(([label, value, unit]) => <article className="card stat-card" key={label}><div className="stat-label">{label}</div><p className="stat-value">{value}<span>{unit}</span></p></article>)}</section>
}
