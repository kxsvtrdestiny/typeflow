import { describe, expect, it } from 'vitest'
import { layoutNaturalRows, naturalWidths } from './naturalTextLayout'
import { matchCharacters, splitGraphemes } from './typingCharacters'

describe('natural English layout', () => {
  it('uses answer widths even when wrong glyphs are wider', () => {
    const slots = matchCharacters(splitGraphemes('iii WWW'), splitGraphemes('WWW iii'))
    const widths = naturalWidths(slots, (text) => text === 'i' ? 4 : text === 'W' ? 18 : 5)
    expect(widths).toEqual([4, 4, 4, 5, 18, 18, 18, 5])
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
