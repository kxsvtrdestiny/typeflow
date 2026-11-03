import type { CharacterSlot } from './typingCharacters'

export function measurementText(text: string | undefined): string {
  return text === '\n' ? '↵' : text === '\t' ? '    ' : text ?? ' '
}

/** The answer width is independent of everything the user types. */
export function naturalWidths(slots: CharacterSlot[], measure: (text: string) => number): number[] {
  return slots.map((slot) => slot.expected === undefined ? 0 : measure(measurementText(slot.expected)))
}
export function actualWidths(slots: CharacterSlot[], measure: (text: string) => number): number[] {
  return slots.map((slot) => slot.actual === undefined ? 0 : measure(measurementText(slot.actual)))
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
