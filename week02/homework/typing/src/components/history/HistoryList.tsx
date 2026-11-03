import { Trash2 } from 'lucide-react'
import type { TrainingRecord } from '../../types'
import { historyDate, historyMode } from '../../utils/historyStats'
interface Props { records: TrainingRecord[]; onDetails: (record: TrainingRecord) => void; onDelete: (record: TrainingRecord) => void }
export default function HistoryList({ records, onDetails, onDelete }: Props) {
  if (!records.length) return <div className="card empty-state"><h2>暂无匹配记录</h2><p>完成训练后会自动保存在这里。</p></div>
  return <div className="history-list">{records.map((record) => <article className="card history-record" key={record.id} data-record-id={record.id}>
    <div className="record-title"><h3>{record.articleTitle}</h3><time dateTime={record.completedAt}>{historyDate(record.completedAt)}</time></div>
    <div className="record-meta"><span className="badge">{record.language === 'zh' ? '中文' : 'English'}</span><span>{historyMode(record)}</span><strong>{(record.language === 'zh' ? record.metrics.cpm : record.metrics.wpm).toFixed(1)} {record.language === 'zh' ? 'CPM' : 'WPM'}</strong><span>{record.metrics.accuracy.toFixed(1)}%</span><span>{(record.metrics.elapsedMs / 1000).toFixed(1)} 秒</span></div>
    <div className="record-actions"><button className="text-link" onClick={() => onDetails(record)} aria-label={`查看${record.articleTitle}详情`}>详情</button><button className="icon-button" aria-label={`删除${record.articleTitle}记录`} onClick={() => onDelete(record)}><Trash2 size={16} /></button></div>
  </article>)}</div>
}
