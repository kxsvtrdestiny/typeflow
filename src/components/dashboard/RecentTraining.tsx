import { History, ArrowRight } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useHistoryStore } from '../../stores/useHistoryStore'
import { historyDate, historyMode, sortHistory } from '../../utils/historyStats'
export default function RecentTraining() {
  const records = useHistoryStore((state) => state.records)
  const recent = sortHistory(records).slice(0, 3)
  return <section aria-labelledby="recent-heading"><div className="section-heading"><h2 id="recent-heading">最近训练</h2><Link to="/history" className="text-link">全部记录<ArrowRight size={15} /></Link></div>{recent.length ? <div className="card recent-records">{recent.map((record) => <div className="recent-record" key={record.id}><div><h3>{record.articleTitle}</h3><time dateTime={record.completedAt}>{historyDate(record.completedAt)} · {historyMode(record)}</time></div><strong>{(record.language === 'zh' ? record.metrics.cpm : record.metrics.wpm).toFixed(1)} {record.language === 'zh' ? 'CPM' : 'WPM'}</strong><span>{record.metrics.accuracy.toFixed(1)}%</span></div>)}</div> : <div className="card recent-empty"><span className="empty-icon"><History size={25} /></span><h3>还没有训练记录</h3><Link className="text-link" to="/practice">前往打字训练<ArrowRight size={15} /></Link></div>}</section>
}
