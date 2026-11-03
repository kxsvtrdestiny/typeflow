const segmenter = new Intl.Segmenter(undefined, { granularity: 'grapheme' })
export function normalizeText(text: string) { return text.replace(/^\uFEFF/, '').replace(/\r\n?/g, '\n') }
export function characterCount(text: string) { return Array.from(segmenter.segment(text)).length }
