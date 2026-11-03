import { useState } from 'react'
import type { Language, TrainingRecord } from '../../types'
import { useLocalDate } from '../../hooks/useLocalDate'
import { characterLabel, errorInsights, trainingHabits } from '../../utils/trainingInsights'
export default function TrainingInsights({ records }: { records: TrainingRecord[] }) {
  const [language, setLanguage] = useState<Language>('zh')
  const [ranking, setRanking] = useState<'frequent' | 'highRate'>('frequent')
  const habits = trainingHabits(records, useLocalDate())
  const errors = errorInsights(records, language)
  const data = errors[ranking]
  return <section className="card training-insights" aria-label="训练习惯与错误分析">
    <div className="habit-grid" aria-label="训练习惯">{[['当前连续', habits.current], ['最长连续', habits.longest], ['本周训练', habits.thisWeek]].map(([label, days]) => <div key={label}><span className="muted small">{label}</span><strong>{days}<small> 天</small></strong></div>)}</div>
    <details className="error-analysis"><summary>错误字符分析</summary><div className="error-analysis-body">
      <div className="section-heading"><div className="theme-language-switch" role="group" aria-label="错误分析语言"><button aria-pressed={language === 'zh'} onClick={() => setLanguage('zh')}>中文</button><button aria-pressed={language === 'en'} onClick={() => setLanguage('en')}>English</button></div><label className="small">排序<select aria-label="错误分析排序" value={ranking} onChange={event => setRanking(event.target.value as typeof ranking)}><option value="frequent">错误次数</option><option value="highRate">错误率</option></select></label></div>
      <p className="muted small">按标准字符与最终保留输入统计 · {errors.covered} 次训练{errors.legacy > 0 ? ` · ${errors.legacy} 条旧记录无字符明细` : ''}</p>
      <p className="muted small">已比较次数：该标准字符已参与实际输入比较的次数。</p>
      {data.length ? <ul className="error-character-list" aria-label="易错字符">{data.map(entry => <li key={entry.expected ?? '__extra'} data-error-character={entry.expected ?? '__extra'}><strong className="error-character-glyph">{characterLabel(entry.expected)}</strong><div className="error-character-details"><span>{entry.errors} 次错误 / 已比较 {entry.attempts} 次</span><span className="error-character-rate">错误率 <b>{entry.rate.toFixed(1)}%</b></span></div></li>)}</ul> : <div className="insights-empty">{errors.covered ? '暂无错误字符' : '暂无字符分析数据，完成新训练后查看'}</div>}
    </div></details>
  </section>
}
