import { splitGraphemes } from './typingCharacters'

export interface SubmittedEdit {
  id?: number
  inputType?: string
  selectionStart?: number
  selectionEnd?: number
  insertedText?: string | null
}
/** Count only newly inserted/replaced graphemes, never surviving shifted characters. */
export function countSubmittedEdit(previous: string, next: string, expected: string[], edit?: SubmittedEdit) {
  const before = splitGraphemes(previous), after = splitGraphemes(next)
  let from = 0, inserted: string[] = []
  const start = edit?.selectionStart, end = edit?.selectionEnd, text = edit?.insertedText
  const boundary = (characters: string[], offset: number) => {
    if (offset === 0) return true
    let position = 0
    for (const character of characters) { position += character.length; if (position === offset) return true; if (position > offset) return false }
    return false
  }
  if (start !== undefined && end !== undefined && text != null && boundary(before, start) && boundary(before, end) && boundary(after, start) && boundary(after, start + text.length) && previous.slice(0, start) + text + previous.slice(end) === next) {
    from = splitGraphemes(previous.slice(0, start)).length
    inserted = splitGraphemes(text)
  } else {
    while (from < before.length && from < after.length && before[from] === after[from]) from++
    let oldEnd = before.length, newEnd = after.length
    while (oldEnd > from && newEnd > from && before[oldEnd - 1] === after[newEnd - 1]) { oldEnd--; newEnd-- }
    inserted = after.slice(from, newEnd)
  }
  return { total: inserted.length, correct: inserted.filter((character, index) => character === expected[from + index]).length }
}
export function safeRatio(numerator: number, denominator: number) {
  if (!Number.isFinite(numerator) || !Number.isFinite(denominator) || denominator <= 0) return 0
  const value = numerator / denominator
  return Number.isFinite(value) ? Math.max(0, value) : 0
}
export interface LiveMetrics {
  cpm: number; wpm: number; accuracy: number; cumulativeAccuracy: number
  correctCharacters: number; incorrectCharacters: number; submittedCharacters: number
  totalInputCharacters: number; totalCorrectInputCharacters: number
  elapsedMs: number; progress: number
}
export function calculateMetrics(correct: number, submitted: number, totalInput: number, totalCorrect: number, elapsedMs: number, expectedLength: number): LiveMetrics {
  const elapsed = Number.isFinite(elapsedMs) ? Math.max(0, elapsedMs) : 0
  return {
    cpm: safeRatio(correct * 60000, elapsed), wpm: safeRatio(correct * 12000, elapsed),
    accuracy: Math.min(100, safeRatio(correct * 100, submitted)),
    cumulativeAccuracy: Math.min(100, safeRatio(totalCorrect * 100, totalInput)),
    correctCharacters: correct, incorrectCharacters: Math.max(0, submitted - correct), submittedCharacters: submitted,
    totalInputCharacters: totalInput, totalCorrectInputCharacters: totalCorrect,
    elapsedMs: elapsed, progress: Math.min(1, safeRatio(submitted, expectedLength)),
  }
}
export function formatDuration(ms: number) {
  const seconds = Math.floor(Math.max(0, Number.isFinite(ms) ? ms : 0) / 1000)
  return `${Math.floor(seconds / 60).toString().padStart(2, '0')}:${(seconds % 60).toString().padStart(2, '0')}`
}
