import { describe, expect, it } from 'vitest'
import { calculateMetrics, countSubmittedEdit } from './typingMetrics'
import { splitGraphemes } from './typingCharacters'
import { effectiveElapsed } from './trainingTime'

describe('speed and accuracy formulas', () => {
  it('counts only correct graphemes in CPM/WPM and separates current/cumulative accuracy', () => {
    const result = calculateMetrics(48, 60, 80, 56, 30000, 100)
    expect(result).toMatchObject({ cpm: 96, wpm: 19.2, accuracy: 80, cumulativeAccuracy: 70, progress: 0.6, incorrectCharacters: 12 })
  })
  it.each([0, -1, NaN, Infinity])('never produces non-finite speed for time %s', (time) => {
    const result = calculateMetrics(5, 8, 8, 5, time, 10)
    expect(result.cpm).toBe(0)
    expect(result.wpm).toBe(0)
    for (const value of Object.values(result)) expect(Number.isFinite(value)).toBe(true)
  })
  it('handles empty data and extremely short effective duration', () => {
    expect(calculateMetrics(0, 0, 0, 0, 0, 0)).toMatchObject({ cpm: 0, wpm: 0, accuracy: 0, cumulativeAccuracy: 0, progress: 0 })
    expect(Number.isFinite(calculateMetrics(1000, 1000, 1000, 1000, 0.00001, 1000).wpm)).toBe(true)
  })
})

describe('submitted input event accounting', () => {
  const expected = splitGraphemes('你好，👩‍💻 e\u0301\n!')
  it('counts multi-grapheme IME commits, whitespace, punctuation and newline consistently', () => {
    expect(countSubmittedEdit('', '你好', expected)).toEqual({ total: 2, correct: 2 })
    expect(countSubmittedEdit('你好', '你好，👩‍💻 e\u0301\n!', expected)).toEqual({ total: 6, correct: 6 })
  })
  it('does not count deletion or characters shifted into correct positions as new input', () => {
    expect(countSubmittedEdit('错你好', '你好', expected)).toEqual({ total: 0, correct: 0 })
  })
  it('counts replacement even when text is unchanged, using the native selection', () => {
    expect(countSubmittedEdit('你好', '你好', expected, { selectionStart: 0, selectionEnd: 1, insertedText: '你' })).toEqual({ total: 1, correct: 1 })
  })
  it('resolves ambiguous repeated-character insertions at the actual selection', () => {
    expect(countSubmittedEdit('aa', 'aaa', splitGraphemes('aaZ'), { selectionStart: 1, selectionEnd: 1, insertedText: 'a' })).toEqual({ total: 1, correct: 1 })
  })
  it('treats a combining mark as an updated grapheme rather than a separate character', () => {
    expect(countSubmittedEdit('e', 'e\u0301', splitGraphemes('e\u0301!'), { selectionStart: 1, selectionEnd: 1, insertedText: '\u0301' })).toEqual({ total: 1, correct: 1 })
  })
  it('counts selection replacement but does not credit untouched suffix', () => {
    expect(countSubmittedEdit('错好', '你好', expected, { selectionStart: 0, selectionEnd: 1, insertedText: '你' })).toEqual({ total: 1, correct: 1 })
  })
})

describe('real-time clock arithmetic', () => {
  it('uses segment time, paused time and exact limit clamping', () => {
    expect(effectiveElapsed({ accumulatedMs: 500, activeSegmentStart: 1000 }, 2500)).toBe(2000)
    expect(effectiveElapsed({ accumulatedMs: 500, activeSegmentStart: null }, 100000)).toBe(500)
    expect(effectiveElapsed({ accumulatedMs: 500, activeSegmentStart: 1000 }, 100000, 60000)).toBe(60000)
  })
})
