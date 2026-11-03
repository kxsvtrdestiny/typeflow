import { lazy, Suspense, useState } from 'react'
import { Trash2 } from 'lucide-react'
import PageHeading from '../components/common/PageHeading'
import ConfirmDialog from '../components/common/ConfirmDialog'
import HistorySummary from '../components/history/HistorySummary'
const HistoryTrend = lazy(() => import('../components/history/HistoryTrend'))
import HistoryList from '../components/history/HistoryList'
import RecordDetails from '../components/history/RecordDetails'
import HistoryStorageNotice from '../components/history/HistoryStorageNotice'
import { useHistoryStore } from '../stores/useHistoryStore'
import { filteredHistory } from '../utils/historyStats'
import type { Language, TrainingMode, TrainingRecord } from '../types'
export default function History() {
  const records = useHistoryStore((state) => state.records)
  const error = useHistoryStore((state) => state.error)
  const remove = useHistoryStore((state) => state.remove)
  const clear = useHistoryStore((state) => state.clear)
  const [language, setLanguage] = useState<Language | 'all'>('all')
  const [mode, setMode] = useState<TrainingMode | 'all'>('all')
  const [oldest, setOldest] = useState(false)
  const [trendLanguage, setTrendLanguage] = useState<Language>(() => records.some((record) => record.language === 'zh') || !records.length ? 'zh' : 'en')
  const [details, setDetails] = useState<TrainingRecord | null>(null)
  const [deleting, setDeleting] = useState<TrainingRecord | 'all' | null>(null)
  return <div className="history-page">
    <div className="page-title-row"><PageHeading title="训练记录" /><button className="button secondary" disabled={!records.length && !error} onClick={() => setDeleting('all')}><Trash2 size={16} />清空记录</button></div>
    <HistoryStorageNotice />
    <HistorySummary records={records} />
    <div className="history-filters"><label>语言<select value={language} onChange={(event) => { const value = event.target.value as Language | 'all'; setLanguage(value); if (value !== 'all') setTrendLanguage(value) }}><option value="all">全部语言</option><option value="zh">中文</option><option value="en">English</option></select></label><label>训练模式<select value={mode} onChange={(event) => setMode(event.target.value as TrainingMode | 'all')}><option value="all">全部模式</option><option value="free">自由训练</option><option value="timed">限时训练</option></select></label><label>日期排序<select value={oldest ? 'oldest' : 'newest'} onChange={(event) => setOldest(event.target.value === 'oldest')}><option value="newest">最新在前</option><option value="oldest">最早在前</option></select></label><span className="muted small">顶部统计包含全部记录</span></div>
    <Suspense fallback={<div className="card history-chart-empty">正在加载趋势图…</div>}><HistoryTrend records={records} language={trendLanguage} mode={mode} onLanguage={setTrendLanguage} /></Suspense>
    <HistoryList records={filteredHistory(records, language, mode, oldest)} onDetails={setDetails} onDelete={setDeleting} />
    {details && <RecordDetails record={details} onClose={() => setDetails(null)} />}
    {deleting && <ConfirmDialog title={deleting === 'all' ? '清空全部历史' : '删除训练记录'} message={deleting === 'all' ? '确定清空全部训练记录？此操作无法撤销，不会删除词库与设置；无法读取的历史数据也将清除。' : `确定删除「${deleting.articleTitle}」的这次记录？删除后统计会同步更新，无法撤销。`} onConfirm={() => deleting === 'all' ? clear() : remove(deleting.id)} onClose={() => setDeleting(null)} />}
  </div>
}
