import type { CharacterAnalysis, Language, TrainingRecord } from '../types'

/** Final retained graphemes only: deleting/replacing an error removes it from this snapshot. */
export function collectCharacterAnalysis(expected: string[], actual: string[]): CharacterAnalysis {
  const counts = new Map<string | null, { expected: string | null; attempts: number; errors: number }>()
  actual.forEach((character, index) => {
    const target = expected[index] ?? null
    const entry = counts.get(target) ?? { expected: target, attempts: 0, errors: 0 }
    entry.attempts++; if (target !== character) entry.errors++
    counts.set(target, entry)
  })
  return { version: 1, characters: [...counts.values()] }
}

/** Day numbers use local calendar fields, not elapsed 24-hour periods (DST-safe). */
export function localDayNumber(date: Date) {
  return Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()) / 86400000
}
export function dailyGoal(records: TrainingRecord[], goalMinutes: number, now = new Date()) {
  const today = localDayNumber(now)
  const elapsedMs = records.filter(record => localDayNumber(new Date(record.completedAt)) === today).reduce((sum, record) => sum + record.metrics.elapsedMs, 0)
  goalMinutes = Number.isFinite(goalMinutes) && goalMinutes > 0 ? goalMinutes : 20
  const goalMs = goalMinutes * 60000
  return { elapsedMs, goalMinutes, percent: Math.min(100, elapsedMs / goalMs * 100), completed: elapsedMs >= goalMs }
}
export function trainingHabits(records: TrainingRecord[], now = new Date()) {
  const today = localDayNumber(now)
  const days = new Set(records.map(record => localDayNumber(new Date(record.completedAt))).filter(day => Number.isFinite(day) && day <= today))
  const ordered = [...days].sort((a, b) => a - b)
  let longest = 0, run = 0, previous = -Infinity
  for (const day of ordered) { run = day === previous + 1 ? run + 1 : 1; longest = Math.max(longest, run); previous = day }
  let current = 0, cursor = days.has(today) ? today : today - 1
  while (days.has(cursor)) { current++; cursor-- }
  const monday = today - (now.getDay() + 6) % 7
  return { current, longest, thisWeek: ordered.filter(day => day >= monday).length }
}
export function errorInsights(records: TrainingRecord[], language: Language) {
  const relevant = records.filter(record => record.language === language)
  const covered = relevant.filter(record => record.characterAnalysis !== undefined)
  const counts = new Map<string | null, { expected: string | null; attempts: number; errors: number; rate: number }>()
  for (const record of covered) for (const character of record.characterAnalysis!.characters) {
    const entry = counts.get(character.expected) ?? { expected: character.expected, attempts: 0, errors: 0, rate: 0 }
    entry.attempts += character.attempts; entry.errors += character.errors
    entry.rate = entry.errors / entry.attempts * 100
    counts.set(entry.expected, entry)
  }
  const errors = [...counts.values()].filter(entry => entry.errors > 0)
  const tie = (a: typeof errors[number], b: typeof errors[number]) => String(a.expected).localeCompare(String(b.expected))
  return { covered: covered.length, legacy: relevant.length - covered.length,
    frequent: [...errors].sort((a,b) => b.errors - a.errors || tie(a,b)).slice(0, 8),
    highRate: [...errors].sort((a,b) => b.rate - a.rate || b.attempts - a.attempts || tie(a,b)).slice(0, 8) }
}
export function characterLabel(character: string | null) {
  return character === null ? '超出文本' : character === ' ' ? '空格' : character === '\n' ? '换行' : character === '\t' ? 'Tab' : character
}
