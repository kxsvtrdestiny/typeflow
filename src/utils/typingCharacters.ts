import type { CharacterStatus } from '../types'

const segmenter = new Intl.Segmenter(undefined, { granularity: 'grapheme' })
export function splitGraphemes(text: string): string[] {
  return Array.from(segmenter.segment(text), (part) => part.segment)
}
/** Native selection offsets use UTF-16; visual slots use grapheme indexes. */
export function offsetToIndex(text: string, offset: number): number {
  const clamped = Math.max(0, Math.min(offset, text.length))
  let index = 0
  for (const part of segmenter.segment(text)) {
    if (part.index >= clamped) break
    index++
  }
  return index
}
export interface CharacterSlot {
  index: number
  expected: string | undefined
  actual: string | undefined
  status: CharacterStatus
}
export function matchCharacters(expected: string[], actual: string[]): CharacterSlot[] {
  return Array.from({ length: Math.max(expected.length, actual.length) + 1 }, (_, index) => ({
    index, expected: expected[index], actual: actual[index],
    status: actual[index] === undefined ? 'pending' : actual[index] === expected[index] ? 'correct' : 'incorrect',
  }))
}
/** Only standard-answer newlines split rows; erroneous user newlines stay in their slot. */
export function layoutRows(slots: CharacterSlot[], columns: number): CharacterSlot[][] {
  const rows: CharacterSlot[][] = []
  let row: CharacterSlot[] = []
  for (const slot of slots) {
    row.push(slot)
    if (row.length >= Math.max(1, columns) || slot.expected === '\n') { rows.push(row); row = [] }
  }
  if (row.length) rows.push(row)
  return rows
}
export function visibleCharacter(value: string | undefined): string {
  return value === '\n' ? '↵' : value === ' ' ? '·' : value === '\t' ? '⇥' : value ?? '\u00a0'
}
