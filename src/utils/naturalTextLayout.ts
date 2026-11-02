import type { CharacterSlot } from './typingCharacters'

/** Widths are derived from the answer, so a wrong glyph cannot move later slots. */
export function naturalWidths(slots: CharacterSlot[], measure: (text: string) => number): number[] {
  return slots.map((slot) => measure(slot.expected === '\n' ? '↵' : slot.expected === '\t' ? '    ' : slot.expected ?? slot.actual ?? ' '))
}

/** Prefer word boundaries, but split words longer than a viewport. */
export function layoutNaturalRows(slots: CharacterSlot[], widths: number[], available: number): CharacterSlot[][] {
  const rows: CharacterSlot[][] = []
  let row: CharacterSlot[] = []
  let width = 0
  for (const slot of slots) {
    if (row.length && width + widths[slot.index] > available) {
      let breakAt = -1
      for (let i = 0; i < row.length; i++) if (row[i].expected === ' ' || row[i].expected === '-') breakAt = i
      if (breakAt >= 0) {
        rows.push(row.slice(0, breakAt + 1))
        row = row.slice(breakAt + 1)
        width = row.reduce((sum, item) => sum + widths[item.index], 0)
      }
      if (row.length && width + widths[slot.index] > available) { rows.push(row); row = []; width = 0 }
    }
    row.push(slot)
    width += widths[slot.index]
    if (slot.expected === '\n') { rows.push(row); row = []; width = 0 }
  }
  if (row.length) rows.push(row)
  return rows
}
