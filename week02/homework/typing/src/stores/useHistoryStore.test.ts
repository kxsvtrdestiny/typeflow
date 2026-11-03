import { beforeEach, describe, expect, it, vi } from 'vitest'
import { useHistoryStore } from './useHistoryStore'
import { HISTORY_KEY, readHistory } from '../utils/historyStorage'
import { filteredHistory, historySummary, historyTrend, sortHistory } from '../utils/historyStats'
import { historyFixture } from '../test/historyFixtures'

beforeEach(() => {
  vi.restoreAllMocks()
  localStorage.clear()
  useHistoryStore.setState({ records: [], error: null, blocked: false })
})

describe('history persistence and identity', () => {
  it('saves settled snapshots once, reloads, and excludes arbitrary input fields', () => {
    const outcome = Object.assign(historyFixture(), { value: 'DO-NOT-STORE-USER-TEXT' })
    expect(useHistoryStore.getState().add('attempt-1', outcome)).toBe('saved')
    expect(useHistoryStore.getState().add('attempt-1', outcome)).toBe('duplicate')
    useHistoryStore.getState().reload()
    const records = useHistoryStore.getState().records
    expect(records).toHaveLength(1)
    expect(records[0].metrics).toEqual(outcome.metrics)
    expect(records[0].themeName).toBe('测试主题')
    expect(localStorage.getItem(HISTORY_KEY)).not.toContain('DO-NOT-STORE')
  })
  it('rejects incomplete or meaningless sessions', () => {
    const outcome = historyFixture()
    expect(useHistoryStore.getState().add('empty-time', { ...outcome, metrics: { ...outcome.metrics, elapsedMs: 0 } })).toBe('invalid')
    expect(useHistoryStore.getState().add('empty-input', { ...outcome, metrics: { ...outcome.metrics, submittedCharacters: 0 } })).toBe('invalid')
    expect(useHistoryStore.getState().add('bad-start', { ...outcome, startedAt: null })).toBe('invalid')
    expect(localStorage.getItem(HISTORY_KEY)).toBeNull()
  })
  it('preserves pending result on write failure, then allows an idempotent retry', () => {
    const fail = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => { throw new DOMException('quota', 'QuotaExceededError') })
    expect(useHistoryStore.getState().add('attempt-1', historyFixture())).toBe('failed')
    expect(useHistoryStore.getState().records).toHaveLength(0)
    expect(useHistoryStore.getState().error).toContain('保存失败')
    fail.mockRestore()
    expect(useHistoryStore.getState().add('attempt-1', historyFixture())).toBe('saved')
    expect(useHistoryStore.getState().add('attempt-1', historyFixture())).toBe('duplicate')
    expect(readHistory().records).toHaveLength(1)
  })
  it('deletes and clears only history, and does not pretend failed deletion succeeded', () => {
    useHistoryStore.getState().add('a', historyFixture())
    localStorage.setItem('typeflow.library', 'preserve-library')
    const fail = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => { throw new Error('disk') })
    expect(useHistoryStore.getState().remove('a')).toBe(false)
    expect(useHistoryStore.getState().records).toHaveLength(1)
    fail.mockRestore()
    expect(useHistoryStore.getState().remove('a')).toBe(true)
    expect(historySummary(useHistoryStore.getState().records).count).toBe(0)
    useHistoryStore.getState().add('b', historyFixture())
    expect(useHistoryStore.getState().clear()).toBe(true)
    expect(readHistory().records).toHaveLength(0)
    expect(localStorage.getItem('typeflow.library')).toBe('preserve-library')
  })
  it.each(['not-json', JSON.stringify({ version: 99, data: [] }), JSON.stringify({ version: 1, data: [{}] })])('keeps unreadable raw data untouched: %s', (raw) => {
    localStorage.setItem(HISTORY_KEY, raw)
    useHistoryStore.getState().reload()
    expect(useHistoryStore.getState().blocked).toBe(true)
    expect(useHistoryStore.getState().add('a', historyFixture())).toBe('failed')
    expect(localStorage.getItem(HISTORY_KEY)).toBe(raw)
    expect(useHistoryStore.getState().clear()).toBe(true)
    expect(readHistory().blocked).toBe(false)
  })
  it('handles read exceptions and duplicate ids', () => {
    const fail = vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => { throw new Error('security') })
    expect(readHistory().blocked).toBe(true)
    fail.mockRestore()
    useHistoryStore.getState().add('a', historyFixture())
    const record = readHistory().records[0]
    localStorage.setItem(HISTORY_KEY, JSON.stringify({ version: 1, data: [record, record] }))
    expect(readHistory().blocked).toBe(true)
  })
  it('reads the latest disk state before adding to avoid ordinary stale-tab overwrites', () => {
    useHistoryStore.getState().add('a', historyFixture())
    useHistoryStore.setState({ records: [] })
    useHistoryStore.getState().add('b', historyFixture())
    expect(readHistory().records).toHaveLength(2)
  })
})

describe('one statistical source for history and dashboard', () => {
  it('uses arithmetic accuracy, active time and separate per-language bests', () => {
    const a = { id: 'a', ...historyFixture() }
    const b = { id: 'b', ...historyFixture({ language: 'en', metrics: { ...a.metrics, accuracy: 100, wpm: 50, cpm: 250, elapsedMs: 30000 } }) }
    expect(historySummary([a, b])).toEqual({ count: 2, elapsedMs: 90000, averageAccuracy: 90, bestCpm: 120.5, bestWpm: 50 })
    expect(historySummary([])).toEqual({ count: 0, elapsedMs: 0, averageAccuracy: 0, bestCpm: 0, bestWpm: 0 })
  })
  it('sorts by completion time rather than stored order, filters mode/language, and selects seven ascending points', () => {
    const records = Array.from({ length: 10 }, (_, index) => ({ id: `${index}`, ...historyFixture({ completedAt: `2026-11-03T00:${String(index + 1).padStart(2, '0')}:00.000Z` }) })).reverse()
    expect(sortHistory(records, true)[0].id).toBe('0')
    expect(historyTrend(records, 'zh').map((point) => point.id)).toEqual(['3', '4', '5', '6', '7', '8', '9'])
    expect(historyTrend(records, 'en')).toHaveLength(0)
    expect(filteredHistory(records, 'zh', 'timed')).toHaveLength(0)
    expect(historySummary(records.slice(1)).count).toBe(9)
  })
})
