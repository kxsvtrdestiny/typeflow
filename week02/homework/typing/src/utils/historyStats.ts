import { format } from 'date-fns'
import type { Language, TrainingMode, TrainingRecord } from '../types'
export function sortHistory(records: TrainingRecord[], oldestFirst = false) {
  return [...records].sort((a, b) => (Date.parse(a.completedAt) - Date.parse(b.completedAt) || a.id.localeCompare(b.id)) * (oldestFirst ? 1 : -1))
}
export function historySummary(records: TrainingRecord[]) {
  return {
    count: records.length,
    elapsedMs: records.reduce((sum, record) => sum + record.metrics.elapsedMs, 0),
    averageAccuracy: records.length ? records.reduce((sum, record) => sum + record.metrics.accuracy, 0) / records.length : 0,
    bestCpm: Math.max(0, ...records.filter((record) => record.language === 'zh').map((record) => record.metrics.cpm)),
    bestWpm: Math.max(0, ...records.filter((record) => record.language === 'en').map((record) => record.metrics.wpm)),
  }
}
export function filteredHistory(records: TrainingRecord[], language: Language | 'all', mode: TrainingMode | 'all', oldestFirst = false) {
  return sortHistory(records.filter((record) => (language === 'all' || record.language === language) && (mode === 'all' || record.mode === mode)), oldestFirst)
}
export function historyTrend(records: TrainingRecord[], language: Language, mode: TrainingMode | 'all' = 'all') {
  return filteredHistory(records, language, mode, true).slice(-7).map((record) => ({ id: record.id, date: historyDate(record.completedAt), label: format(new Date(record.completedAt), 'MM-dd HH:mm'), speed: language === 'zh' ? record.metrics.cpm : record.metrics.wpm }))
}
export function historyDate(iso: string) { return format(new Date(iso), 'yyyy-MM-dd HH:mm:ss') }
export function historyMode(record: TrainingRecord) { return record.mode === 'free' ? '自由训练' : `限时 ${record.timedMinutes} 分钟` }
