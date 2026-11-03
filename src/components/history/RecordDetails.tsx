import Modal from '../common/Modal'
import type { TrainingRecord } from '../../types'
import { historyDate, historyMode } from '../../utils/historyStats'
export default function RecordDetails({ record, onClose }: { record: TrainingRecord; onClose: () => void }) {
  const m = record.metrics
  const fields = [
    ['完成时间', historyDate(record.completedAt)], ['文章', record.articleTitle], ['主题', record.themeName],
    ['语言', record.language === 'zh' ? '中文' : 'English'], ['模式', historyMode(record)],
    ['有效训练时间', `${(m.elapsedMs / 1000).toFixed(2)} 秒`],
    ['速度', `${(record.language === 'zh' ? m.cpm : m.wpm).toFixed(1)} ${record.language === 'zh' ? 'CPM' : 'WPM'}`],
    ['当前准确率', `${m.accuracy.toFixed(1)}%`], ['累计准确率', `${m.cumulativeAccuracy.toFixed(1)}%`],
    ['正确 / 错误字符', `${m.correctCharacters} / ${m.incorrectCharacters}`], ['完成进度', `${(m.progress * 100).toFixed(1)}%`],
    ['结束原因', record.finishReason === 'article-completed' ? '文章完成' : '限时结束'],
  ]
  return <Modal title="记录详情" onClose={onClose}><dl className="result-grid record-details">{fields.map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{value}</dd></div>)}</dl><div className="form-actions"><button className="button secondary" onClick={onClose}>关闭</button></div></Modal>
}
