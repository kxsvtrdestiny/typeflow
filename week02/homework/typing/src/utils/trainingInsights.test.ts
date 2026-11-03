import { beforeEach, describe, expect, it } from 'vitest'
import { dailyGoal, trainingHabits, localDayNumber, collectCharacterAnalysis, errorInsights } from './trainingInsights'
import { splitGraphemes } from './typingCharacters'
import { historyFixture } from '../test/historyFixtures'
import type { TrainingRecord } from '../types'
import { useHistoryStore } from '../stores/useHistoryStore'
import { historySnapshot, readHistory, validOutcome } from './historyStorage'
import { DEFAULT_SETTINGS, readSettings } from './settingsStorage'
import { useSettingsStore } from '../stores/useSettingsStore'
const now = new Date(2026, 10, 3, 12)
function record(day: number, id = String(day), minutes = 5): TrainingRecord {
  const fixture = historyFixture({ completedAt: new Date(2026, 10, day, 10).toISOString() })
  return { id, ...fixture, metrics: { ...fixture.metrics, elapsedMs: minutes * 60000 } }
}
function analyzed(expected: string, actual: string, language: 'zh' | 'en' = 'zh', id = 'a'): TrainingRecord {
  const targets = splitGraphemes(expected), inputs = splitGraphemes(actual)
  const errors = inputs.filter((char, i) => char !== targets[i]).length
  const fixture = record(3, id)
  return { ...fixture, language, characterAnalysis: collectCharacterAnalysis(targets, inputs), metrics: { ...fixture.metrics, submittedCharacters: inputs.length, correctCharacters: inputs.length - errors, incorrectCharacters: errors } }
}
beforeEach(() => { localStorage.clear(); useHistoryStore.setState({ records: [], error: null, blocked: false }); useSettingsStore.setState({ settings: { ...DEFAULT_SETTINGS }, error: null, blocked: false }) })
describe('saved daily goals and local calendar habits', () => {
  it('starts at zero with a twenty-minute default, safely handles zero goal', () => {
    expect(DEFAULT_SETTINGS.dailyGoalMinutes).toBe(20)
    expect(dailyGoal([], 20, now)).toEqual({ elapsedMs: 0, goalMinutes: 20, percent: 0, completed: false })
    expect(dailyGoal([], 0, now).percent).toBe(0)
    expect(trainingHabits([], now)).toEqual({ current: 0, longest: 0, thisWeek: 0 })
  })
  it('adds only completion-day effective durations and updates with the goal', () => {
    const records = [record(2), record(3, 'a', 5), record(3, 'b', 10)]
    expect(dailyGoal(records, 20, now)).toMatchObject({ elapsedMs: 900000, percent: 75, completed: false })
    expect(dailyGoal(records, 10, now)).toMatchObject({ percent: 100, completed: true })
    expect(dailyGoal(records.filter(r => r.id !== 'b'), 20, now).percent).toBe(25)
  })
  it('counts unique local days, current streak and historical longest', () => {
    const records = [record(3), record(3, 'again'), record(2), record(1), record(-5), record(-4), record(-3), record(-2)]
    expect(trainingHabits(records, now)).toEqual({ current: 3, longest: 4, thisWeek: 2 })
    expect(trainingHabits(records.filter(r => r.id !== '3' && r.id !== 'again'), now).current).toBe(2)
    expect(trainingHabits([record(1)], now).current).toBe(0)
  })
  it('uses Monday weeks and deduplicates repeated Sunday sessions', () => {
    const sunday = new Date(2026, 10, 8, 12)
    expect(trainingHabits([record(1), record(2), record(3), record(8), record(8, 'twice')], sunday).thisWeek).toBe(3)
  })
  it('assigns cross-midnight completions to their local completion date', () => {
    const cross = { ...record(4), startedAt: new Date(2026, 10, 3, 23, 59).toISOString(), completedAt: new Date(2026, 10, 4, 0, 1).toISOString() }
    expect(dailyGoal([cross], 20, new Date(2026, 10, 3, 23, 59)).elapsedMs).toBe(0)
    expect(dailyGoal([cross], 20, new Date(2026, 10, 4, 0, 2)).elapsedMs).toBe(300000)
    expect(localDayNumber(new Date(2026, 10, 4)) - localDayNumber(new Date(2026, 10, 3))).toBe(1)
  })
  it('record deletion recalculates goal, habits and errors from the same store', () => {
    const entry = analyzed('你好', '你错')
    expect(useHistoryStore.getState().add(entry.id, entry)).toBe('saved')
    expect(dailyGoal(useHistoryStore.getState().records, 20, now).percent).toBe(25)
    expect(errorInsights(useHistoryStore.getState().records, 'zh').frequent).toHaveLength(1)
    useHistoryStore.getState().remove(entry.id)
    expect(dailyGoal(useHistoryStore.getState().records, 20, now).percent).toBe(0)
    expect(trainingHabits(useHistoryStore.getState().records, now).longest).toBe(0)
    expect(errorInsights(useHistoryStore.getState().records, 'zh').frequent).toHaveLength(0)
  })
})
describe('final retained grapheme aggregates', () => {
  it('segments Chinese, emoji and combining characters without normalizing case or Unicode', () => {
    const entry = analyzed('你👨‍👩‍👧‍👦e\u0301', '错👨‍👩‍👧‍👦é')
    expect(entry.characterAnalysis!.characters).toEqual([{ expected: '你', attempts: 1, errors: 1 }, { expected: '👨‍👩‍👧‍👦', attempts: 1, errors: 0 }, { expected: 'e\u0301', attempts: 1, errors: 1 }])
  })
  it('separates languages, treats uppercase as distinct and ranks frequency/rates', () => {
    const records = [analyzed('AaAA', 'aAAA', 'en'), analyzed('你好', '你错', 'zh', 'zh')]
    expect(errorInsights(records, 'en').frequent).toEqual(expect.arrayContaining([expect.objectContaining({ expected: 'A', errors: 1, attempts: 3 }), expect.objectContaining({ expected: 'a', errors: 1, attempts: 1 })]))
    expect(errorInsights(records, 'en').highRate[0]).toMatchObject({ expected: 'a', rate: 100 })
    expect(errorInsights(records, 'zh').frequent).toMatchObject([{ expected: '好', errors: 1 }])
  })
  it('counts spaces, punctuation, newlines and overflow with the same strict match', () => {
    const entry = analyzed('a \n!', 'aX?!W', 'en')
    expect(entry.characterAnalysis!.characters).toEqual([{ expected: 'a', attempts: 1, errors: 0 }, { expected: ' ', attempts: 1, errors: 1 }, { expected: '\n', attempts: 1, errors: 1 }, { expected: '!', attempts: 1, errors: 0 }, { expected: null, attempts: 1, errors: 1 }])
  })
  it('removed and retyped errors are absent from the final result', () => {
    expect(analyzed('ABC', 'AX', 'en').characterAnalysis!.characters[1].errors).toBe(1)
    expect(analyzed('ABC', 'A', 'en').characterAnalysis!.characters).toHaveLength(1)
    expect(errorInsights([analyzed('ABC', 'ABC', 'en')], 'en').frequent).toEqual([])
  })
  it('does not invent missing legacy distributions and merges new aggregate counts', () => {
    const records = [record(3), analyzed('AA', 'XX', 'en'), analyzed('A', 'A', 'en', 'b')]
    expect(errorInsights(records, 'zh')).toMatchObject({ covered: 0, legacy: 1, frequent: [] })
    expect(errorInsights(records, 'en').frequent[0]).toMatchObject({ attempts: 3, errors: 2 })
    expect(errorInsights(records, 'en').frequent[0].rate).toBeCloseTo(200 / 3)
  })
})
describe('version compatibility and aggregate validation', () => {
  it('loads v1 unchanged, writes v2, preserves old records without analysis', () => {
    localStorage.setItem('typeflow.history', JSON.stringify({ version: 1, data: [record(3, 'old')] }))
    useHistoryStore.getState().reload()
    expect(useHistoryStore.getState().add('new', analyzed('AB', 'AX', 'en'))).toBe('saved')
    expect(JSON.parse(localStorage.getItem('typeflow.history')!).version).toBe(2)
    const loaded = readHistory()
    expect(loaded.blocked).toBe(false)
    expect(loaded.records[0].characterAnalysis).toBeUndefined()
    expect(loaded.records[1].characterAnalysis!.characters[1].errors).toBe(1)
  })
  it('rejects malformed counts/duplicates/versions and strips extra user text', () => {
    const entry = analyzed('AB', 'AX', 'en')
    expect(validOutcome(entry)).toBe(true)
    for (const characters of [[{ expected: 'B', attempts: 2, errors: 9 }], [{ expected: 'AB', attempts: 2, errors: 1 }], [{ expected: 'A', attempts: 1, errors: 0 }, { expected: 'A', attempts: 1, errors: 1 }]]) {
      expect(validOutcome({ ...entry, characterAnalysis: { version: 1, characters } })).toBe(false)
    }
    expect(validOutcome({ ...entry, characterAnalysis: { ...entry.characterAnalysis, version: 99 } })).toBe(false)
    const snapshot = historySnapshot('new', { ...entry, characterAnalysis: { version: 1, characters: entry.characterAnalysis!.characters.map(char => ({ ...char, actualText: 'secret-input' })) } })
    expect(JSON.stringify(snapshot)).not.toContain('secret-input')
    entry.characterAnalysis!.characters[0].errors = 500
    expect(snapshot.characterAnalysis!.characters[0].errors).toBe(0)
  })
  it('migrates the unexposed v1 goal to twenty minutes without dropping preferences', () => {
    localStorage.setItem('typeflow.settings', JSON.stringify({ version: 1, data: { ...DEFAULT_SETTINGS, dailyGoalMinutes: 15, theme: 'dark', autoSave: false } }))
    useSettingsStore.getState().reload()
    expect(useSettingsStore.getState().settings).toMatchObject({ dailyGoalMinutes: 20, theme: 'dark', autoSave: false })
    expect(useSettingsStore.getState().update({ dailyGoalMinutes: 30 })).toBe(true)
    expect(JSON.parse(localStorage.getItem('typeflow.settings')!).version).toBe(2)
    expect(readSettings().settings.dailyGoalMinutes).toBe(30)
    for (const dailyGoalMinutes of [0, 1.5, 1441, Infinity, NaN]) expect(useSettingsStore.getState().update({ dailyGoalMinutes })).toBe(false)
  })
})

it('preserves corrupted v2 aggregate data and blocks overwriting it', () => {
  const entry = analyzed('AB', 'AX', 'en')
  entry.characterAnalysis!.characters[0].attempts = 9
  const raw = JSON.stringify({ version: 2, data: [entry] })
  localStorage.setItem('typeflow.history', raw)
  useHistoryStore.getState().reload()
  expect(useHistoryStore.getState().blocked).toBe(true)
  expect(useHistoryStore.getState().add('new', analyzed('AB', 'AB', 'en'))).toBe('failed')
  expect(localStorage.getItem('typeflow.history')).toBe(raw)
})

it('all-correct analyzed records have an empty error ranking but retain match denominators', () => {
  const result = errorInsights([analyzed('Aa  !', 'Aa  !', 'en')], 'en')
  expect(result).toMatchObject({ covered: 1, legacy: 0, frequent: [], highRate: [] })
})

it('returns every error character in both rankings instead of truncating to eight', () => {
  const expected = 'AbCdEfGhIjKlMn'
  const record = analyzed(expected, 'xxxxxxxxxxxxxx', 'en')
  const result = errorInsights([record], 'en')
  expect(result.frequent).toHaveLength(14)
  expect(result.highRate).toHaveLength(14)
  expect(new Set(result.frequent.map(entry => entry.expected))).toEqual(new Set(expected))
})
