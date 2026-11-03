import type { TrainingOutcome, TrainingRecord } from '../types'
import type { LiveMetrics } from './typingMetrics'
export const HISTORY_KEY = 'typeflow.history'
export const HISTORY_VERSION = 1
const metricKeys: (keyof LiveMetrics)[] = ['cpm', 'wpm', 'accuracy', 'cumulativeAccuracy', 'correctCharacters', 'incorrectCharacters', 'submittedCharacters', 'totalInputCharacters', 'totalCorrectInputCharacters', 'elapsedMs', 'progress']
function object(value: unknown): value is Record<string, unknown> { return typeof value === 'object' && value !== null }
function date(value: unknown): value is string { return typeof value === 'string' && Number.isFinite(Date.parse(value)) }
function text(value: unknown): value is string { return typeof value === 'string' && value.trim().length > 0 }
export function validOutcome(value: unknown): value is TrainingOutcome {
  if (!object(value) || !text(value.articleId) || !text(value.articleTitle) || !text(value.themeId) || !text(value.themeName) || !date(value.startedAt) || !date(value.completedAt)) return false
  if (!['zh', 'en'].includes(String(value.language)) || !['free', 'timed'].includes(String(value.mode)) || (typeof value.timedMinutes !== 'number' || ![1, 3, 5, 10].includes(value.timedMinutes)) || !['article-completed', 'time-expired'].includes(String(value.finishReason))) return false
  if (value.finishReason === 'time-expired' && value.mode !== 'timed') return false
  const m = value.metrics
  if (!object(m) || !metricKeys.every((key) => typeof m[key] === 'number' && Number.isFinite(m[key]) && (m[key] as number) >= 0)) return false
  for (const key of ['correctCharacters', 'incorrectCharacters', 'submittedCharacters', 'totalInputCharacters', 'totalCorrectInputCharacters']) if (!Number.isInteger(m[key])) return false
  return (m.elapsedMs as number) > 0 && (m.submittedCharacters as number) > 0 && (m.totalInputCharacters as number) > 0 && (m.accuracy as number) <= 100 && (m.cumulativeAccuracy as number) <= 100 && (m.progress as number) <= 1 &&
    (m.correctCharacters as number) + (m.incorrectCharacters as number) === m.submittedCharacters && (m.totalCorrectInputCharacters as number) <= (m.totalInputCharacters as number)
}
/** Explicit allowlist prevents accidental persistence of value/text fields in future callers. */
export function historySnapshot(id: string, result: TrainingOutcome): TrainingRecord {
  const metrics = Object.fromEntries(metricKeys.map((key) => [key, result.metrics[key]])) as unknown as LiveMetrics
  return { id, articleId: result.articleId, articleTitle: result.articleTitle, themeId: result.themeId, themeName: result.themeName, language: result.language, mode: result.mode, timedMinutes: result.timedMinutes, startedAt: result.startedAt, completedAt: result.completedAt, finishReason: result.finishReason, metrics }
}
export function readHistory(): { records: TrainingRecord[]; error: string | null; blocked: boolean } {
  try {
    const raw = localStorage.getItem(HISTORY_KEY)
    if (raw === null) return { records: [], error: null, blocked: false }
    const envelope: unknown = JSON.parse(raw)
    if (!object(envelope) || envelope.version !== HISTORY_VERSION || !Array.isArray(envelope.data)) throw new Error('version')
    const ids = new Set<string>()
    const records = envelope.data.map((record: unknown) => {
      if (!object(record) || !text(record.id) || ids.has(record.id) || !validOutcome(record)) throw new Error('record')
      ids.add(record.id)
      return historySnapshot(record.id, record)
    })
    return { records, error: null, blocked: false }
  } catch {
    return { records: [], error: '训练记录无法读取或版本不兼容。原始数据已保留，自动保存已暂停；请备份并修复后重试，或明确清空历史记录。', blocked: true }
  }
}
export function writeHistory(records: TrainingRecord[]) {
  localStorage.setItem(HISTORY_KEY, JSON.stringify({ version: HISTORY_VERSION, data: records }))
}
