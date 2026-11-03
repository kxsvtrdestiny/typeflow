import { Link } from 'react-router-dom'
import { RotateCcw } from 'lucide-react'
import type { TrainingOutcome } from '../../types'
interface Props { result: TrainingOutcome; onRetry: () => void }
export default function TrainingResult({ result, onRetry }: Props) {
  const m = result.metrics
  const entries = [
    ['训练语言', result.language === 'zh' ? '中文' : 'English'],
    ['训练模式', result.mode === 'free' ? '自由训练' : `限时 ${result.timedMinutes} 分钟`],
    ['有效训练时间', `${(m.elapsedMs / 1000).toFixed(2)} 秒`],
    [result.language === 'zh' ? 'CPM' : 'WPM', Math.round(result.language === 'zh' ? m.cpm : m.wpm).toString()],
    ['当前准确率', `${m.accuracy.toFixed(1)}%`], ['累计准确率', `${m.cumulativeAccuracy.toFixed(1)}%`],
    ['正确字符数', m.correctCharacters.toString()], ['错误字符数', m.incorrectCharacters.toString()],
    ['完成进度', `${(m.progress * 100).toFixed(1)}%`],
  ]
  return <section className="training-result" aria-labelledby="result-heading" data-testid="training-result">
    <div className="section-heading"><h2 id="result-heading">训练结果</h2><span>{result.finishReason === 'time-expired' ? '限时结束' : '文章完成'}</span></div>
    <p className="result-article">{result.articleTitle}</p>
    <dl className="result-grid">{entries.map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{value}</dd></div>)}</dl>
    <div className="result-actions"><button className="button primary" onClick={onRetry}><RotateCcw size={15} />再练一次</button><Link className="button secondary" to={`/library/${result.themeId}`}>返回词库</Link><Link className="button secondary" to="/">返回首页</Link></div>
  </section>
}
