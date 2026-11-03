import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts'
import type { Language, TrainingMode, TrainingRecord } from '../../types'
import { historyTrend } from '../../utils/historyStats'
interface Props { records: TrainingRecord[]; language: Language; mode: TrainingMode | 'all'; onLanguage: (language: Language) => void }
export default function HistoryTrend({ records, language, mode, onLanguage }: Props) {
  const data = historyTrend(records, language, mode)
  const unit = language === 'zh' ? 'CPM' : 'WPM'
  return <section className="card history-trend" aria-labelledby="trend-heading">
    <div className="section-heading"><h2 id="trend-heading">速度趋势 <span className="muted small">最近 7 次 · {unit}</span></h2><div className="theme-language-switch" role="group" aria-label="趋势语言"><button aria-pressed={language === 'zh'} onClick={() => onLanguage('zh')}>中文 CPM</button><button aria-pressed={language === 'en'} onClick={() => onLanguage('en')}>English WPM</button></div></div>
    {data.length ? <div className="trend-chart" role="img" aria-label={`${language === 'zh' ? '中文' : '英文'}速度趋势，共 ${data.length} 次训练，单位 ${unit}`} data-trend-unit={unit} data-record-ids={data.map((point) => point.id).join(',')}>
      <ResponsiveContainer width="100%" height="100%" minWidth={0}>
        <LineChart data={data} margin={{ top: 14, right: 18, bottom: 12, left: 4 }}>
          <CartesianGrid stroke="#ededf4" vertical={false} />
          <XAxis dataKey="label" tick={{ fontSize: 10, fill: '#85859a' }} minTickGap={24} tickLine={false} axisLine={false} />
          <YAxis width={48} tick={{ fontSize: 10, fill: '#85859a' }} tickLine={false} axisLine={false} domain={[0, 'auto']} />
          <Tooltip formatter={(value) => [`${Number(value).toFixed(1)} ${unit}`, '速度']} labelFormatter={(_, payload) => payload?.[0]?.payload?.date ?? ''} />
          <Line dataKey="speed" stroke="#635bdb" strokeWidth={2} dot={{ r: 4, fill: '#635bdb', strokeWidth: 0 }} activeDot={{ r: 6 }} isAnimationActive={false} />
        </LineChart>
      </ResponsiveContainer>
    </div> : <div className="history-chart-empty">暂无{language === 'zh' ? '中文' : '英文'}训练记录</div>}
  </section>
}
