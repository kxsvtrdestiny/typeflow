import { describe, expect, it } from 'vitest'
import { layoutNaturalRows, naturalWidths } from './naturalTextLayout'
import { matchCharacters, splitGraphemes } from './typingCharacters'

describe('natural English layout', () => {
  it('uses the maximum answer and actual width at every index', () => {
    const slots = matchCharacters(splitGraphemes('iii WWW'), splitGraphemes('WWW iii'))
    const widths = naturalWidths(slots, (text) => text === 'i' ? 4 : text === 'W' ? 18 : 5)
    expect(widths).toEqual([18, 18, 18, 5, 18, 18, 18, 5])
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
  it('shrinks shared widths after deleting errors and leaves indexes intact', () => {
    const measure = (text: string) => text === 'W' ? 18.75 : text === 'i' ? 4.25 : 5.5
    const answer = splitGraphemes('iiiiiiii')
    const wrong = matchCharacters(answer, splitGraphemes('WWWW'))
    expect(naturalWidths(wrong, measure).slice(0, 4)).toEqual([18.75, 18.75, 18.75, 18.75])
    const deleted = matchCharacters(answer, [])
    expect(naturalWidths(deleted, measure).slice(0, 4)).toEqual([4.25, 4.25, 4.25, 4.25])
    expect(deleted.map((s) => s.index)).toEqual(wrong.map((s) => s.index))
    expect(naturalWidths(matchCharacters(answer, answer), measure)).toEqual(naturalWidths(deleted, measure))
  })
})
