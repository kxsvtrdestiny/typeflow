import { describe, expect, it } from 'vitest'
import { layoutRows, matchCharacters, offsetToIndex, splitGraphemes } from './typingCharacters'
import { createImeInput } from './imeInput'

describe('fixed Chinese and English text matching', () => {
  it.each([
    ['你好，世界。', '你好，世界。', 6, 0],
    ['你好，世界。', '你错，世界。', 5, 1],
    ['Hi, Bob!\nOK', 'hi, Bob!\nOK', 10, 1],
    ['a b.', 'aXb!', 2, 2],
    ['你好', '你', 1, 0],
    ['abc', 'axc!', 2, 2],
  ])('strictly matches %s with %s', (answer, input, correct, incorrect) => {
    const slots = matchCharacters(splitGraphemes(answer), splitGraphemes(input))
    expect(slots.filter((s) => s.status === 'correct')).toHaveLength(correct)
    expect(slots.filter((s) => s.status === 'incorrect')).toHaveLength(incorrect)
  })
  it('keeps graphemes and native offsets aligned', () => {
    const text = '中e\u0301👩‍💻!'
    expect(splitGraphemes(text)).toEqual(['中', 'e\u0301', '👩‍💻', '!'])
    expect(offsetToIndex(text, 3)).toBe(2)
    expect(offsetToIndex(text, text.length)).toBe(4)
  })
  it('wraps both rows from one slot list and only standard newlines', () => {
    const slots = matchCharacters(splitGraphemes('ab\n中文xyz'), splitGraphemes('a\nc中'))
    const rows = layoutRows(slots, 4)
    expect(rows.map((row) => row.map((s) => s.index))).toEqual([[0, 1, 2], [3, 4, 5, 6], [7, 8]])
  })
})

describe('IME events', () => {
  it('previews pinyin without committing and deduplicates candidate submission', () => {
    const commits: string[] = [], previews: string[] = []
    const ime = createImeInput((v) => commits.push(v), (v) => previews.push(v))
    ime.start(); ime.update('nihao'); ime.input('nihao', true)
    expect(commits).toEqual([])
    expect(previews.at(-1)).toBe('nihao')
    ime.end('你好'); ime.input('你好', false); ime.input('你好', false)
    expect(commits).toEqual(['你好'])
  })
  it('handles continuous composition, input before end, candidate cancellation and reset', () => {
    const commits: string[] = []
    const ime = createImeInput((v) => commits.push(v), () => {})
    ime.start(); ime.input('你', false); ime.end('你')
    ime.start(); ime.input('你好', true); ime.end('你好')
    ime.start(); ime.end('你好')
    expect(commits).toEqual(['你', '你好'])
    ime.reset('你好'); ime.end('你好拼音')
    expect(commits).toHaveLength(2)
    ime.input('你', false)
    expect(commits.at(-1)).toBe('你')
  })
})
