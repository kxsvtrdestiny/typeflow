import { describe, expect, it } from 'vitest'
import { actualWidths, layoutNaturalRows, naturalWidths } from './naturalTextLayout'
import { matchCharacters, splitGraphemes } from './typingCharacters'

describe('natural English layout', () => {
  it('keeps answer widths independent while measuring actual glyphs separately', () => {
    const slots = matchCharacters(splitGraphemes('iii WWW'), splitGraphemes('WWW iii'))
    const widths = naturalWidths(slots, (text) => text === 'i' ? 4 : text === 'W' ? 18 : 5)
    expect(widths).toEqual([4, 4, 4, 5, 18, 18, 18, 0])
    expect(layoutNaturalRows(slots, widths, 60).map((row) => row.map((s) => s.index))).toEqual([[0, 1, 2, 3], [4, 5, 6, 7]])
  })
  it('splits long words, retains spaces and honors only answer newlines', () => {
    const slots = matchCharacters(splitGraphemes('WWW\ni i'), splitGraphemes('i\nW Wi'))
    const widths = naturalWidths(slots, () => 10)
    const rows = layoutNaturalRows(slots, widths, 20)
    expect(rows.flat().map((s) => s.index)).toEqual(slots.map((s) => s.index))
    expect(rows.map((row) => row.map((s) => s.index))).toEqual([[0, 1], [2, 3], [4, 5], [6, 7]])
  })
})

describe('width recovery after edits', () => {
  it('keeps answer widths stable and removes actual widths after deletion', () => {
    const measure = (text: string) => text === 'W' ? 18.75 : text === 'i' ? 4.25 : 5.5
    const answer = splitGraphemes('iiiiiiii')
    const wrong = matchCharacters(answer, splitGraphemes('WWWW'))
    expect(actualWidths(wrong, measure).slice(0, 4)).toEqual([18.75, 18.75, 18.75, 18.75])
    expect(naturalWidths(wrong, measure).slice(0, 4)).toEqual([4.25, 4.25, 4.25, 4.25])
    const deleted = matchCharacters(answer, [])
    expect(actualWidths(deleted, measure).slice(0, 4)).toEqual([0, 0, 0, 0])
    expect(deleted.map((s) => s.index)).toEqual(wrong.map((s) => s.index))
    expect(naturalWidths(matchCharacters(answer, answer), measure)).toEqual(naturalWidths(deleted, measure))
  })
})


describe('answer stability', () => {
  it('has identical widths and line membership for y, W, i and o errors', () => {
    const answer = splitGraphemes('Maya found a blue notebook on a park bench.')
    const measure = (text: string) => text === 'W' ? 18.25 : text === 'i' ? 4.25 : 9.5
    const baseline = matchCharacters(answer, [])
    const widths = naturalWidths(baseline, measure)
    const lines = layoutNaturalRows(baseline.filter((s) => s.expected !== undefined), widths, 140).map((row) => row.map((s) => s.index))
    for (const glyph of ['y', 'W', 'i', 'o']) {
      const slots = matchCharacters(answer, splitGraphemes(glyph.repeat(16)))
      const next = naturalWidths(slots, measure)
      expect(next).toEqual(widths)
      expect(layoutNaturalRows(slots.filter((s) => s.expected !== undefined), next, 140).map((row) => row.map((s) => s.index))).toEqual(lines)
    }
  })
})
