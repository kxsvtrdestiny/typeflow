/// <reference types="node" />
import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { decodeText, validateDocxZip, validateImportedText } from './fileImporter'
function bytes(array: number[]) { return new Uint8Array(array).buffer }
describe('safe text imports', () => {
  it('decodes UTF-8 BOM and normalizes CRLF without deleting spaces', () => {
    expect(decodeText(new TextEncoder().encode('\uFEFF你好\r\nHello.  ').buffer)).toBe('你好\nHello.  ')
  })
  it('reports malformed UTF-8 and supports explicit GB18030 decoding', () => {
    expect(() => decodeText(bytes([0xc4, 0xe3, 0xba, 0xc3]))).toThrow('UTF-8')
    expect(decodeText(bytes([0xc4, 0xe3, 0xba, 0xc3]), 'gb18030')).toBe('你好')
  })
  it('rejects empty and oversized text', () => {
    expect(() => validateImportedText('  \n')).toThrow('正文')
    expect(() => validateImportedText('a'.repeat(100001))).toThrow('100000')
  })
  it('checks DOCX structure and its declared expanded size', () => {
    const file = readFileSync('tests/fixtures/plain-text.docx')
    const data = file.buffer.slice(file.byteOffset, file.byteOffset + file.byteLength) as ArrayBuffer
    expect(() => validateDocxZip(data)).not.toThrow()
    const oversized = data.slice(0), view = new DataView(oversized)
    for (let i = 0; i < view.byteLength - 46; i++) if (view.getUint32(i, true) === 0x02014b50) { view.setUint32(i + 24, 9 * 1024 * 1024, true); break }
    expect(() => validateDocxZip(oversized)).toThrow('8 MiB')
    expect(() => validateDocxZip(bytes([1, 2, 3]))).toThrow('DOCX')
  })
})
