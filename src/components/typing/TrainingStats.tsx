import type { Language } from '../../types'
import type { LiveMetrics } from '../../utils/typingMetrics'
import { formatDuration } from '../../utils/typingMetrics'
interface Props { language: Language; metrics: LiveMetrics; remainingMs?: number }
export default function TrainingStats({ language, metrics, remainingMs }: Props) {
  return <div className="live-stats" aria-label="实时统计" data-total-input={metrics.totalInputCharacters} data-total-correct={metrics.totalCorrectInputCharacters}>
    <div><span>当前速度</span><strong data-testid="live-speed">{Math.round(language === 'zh' ? metrics.cpm : metrics.wpm)}<small>{language === 'zh' ? 'CPM' : 'WPM'}</small></strong></div>
    <div><span>当前准确率</span><strong data-testid="live-accuracy">{metrics.accuracy.toFixed(1)}%</strong></div>
    <div><span>累计准确率</span><strong data-testid="live-cumulative">{metrics.cumulativeAccuracy.toFixed(1)}%</strong></div>
    <div><span>已用时间</span><strong data-testid="live-elapsed" data-elapsed-ms={metrics.elapsedMs}>{formatDuration(metrics.elapsedMs)}</strong></div>
    {remainingMs !== undefined && <div><span>剩余时间</span><strong data-testid="live-remaining">{formatDuration(Math.ceil(remainingMs / 1000) * 1000)}</strong></div>}
    <div><span>训练进度</span><strong>{Math.round(metrics.progress * 100)}%</strong></div>
  </div>
}
