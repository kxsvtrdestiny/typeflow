import { normalizeText } from './textParser'
export const MAX_IMPORT_BYTES = 2 * 1024 * 1024
export const MAX_EXPANDED_BYTES = 8 * 1024 * 1024
export const MAX_ARTICLE_LENGTH = 100000
export class ImportError extends Error { constructor(message: string, public code = 'INVALID') { super(message) } }
export function validateImportedText(text: string) {
  const normalized = normalizeText(text)
  if (!normalized.trim()) throw new ImportError('文件没有可练习的正文。')
  if (normalized.length > MAX_ARTICLE_LENGTH) throw new ImportError('正文超过 100000 字符，请缩短后再导入。')
  return normalized
}
export function decodeText(buffer: ArrayBuffer, encoding: 'utf-8' | 'gb18030' = 'utf-8') {
  let decoder: TextDecoder
  try { decoder = new TextDecoder(encoding, { fatal: true }) }
  catch { throw new ImportError(`当前浏览器不支持 ${encoding.toUpperCase()} 解码。`) }
  try { return validateImportedText(decoder.decode(buffer)) }
  catch (error) {
    if (error instanceof ImportError) throw error
    throw new ImportError(`文件不是有效的 ${encoding.toUpperCase()} 文本。请核实编码，或尝试 GB18030 重读。`, 'ENCODING')
  }
}
/** Bound declared expanded size before passing a ZIP to the isolated parser. */
export function validateDocxZip(buffer: ArrayBuffer) {
  const view = new DataView(buffer)
  let end = -1
  for (let i = view.byteLength - 22; i >= Math.max(0, view.byteLength - 65557); i--) {
    if (view.getUint32(i, true) === 0x06054b50 && i + 22 + view.getUint16(i + 20, true) === view.byteLength) { end = i; break }
  }
  if (end < 0 || view.getUint16(end + 4, true) !== 0 || view.getUint16(end + 6, true) !== 0) throw new ImportError('DOCX 文件损坏，或不是受支持的 Word 文档。')
  const count = view.getUint16(end + 10, true), offset = view.getUint32(end + 16, true)
  if (count > 512 || offset === 0xffffffff) throw new ImportError('文档结构过大或使用了不支持的 ZIP64 格式。')
  let cursor = offset, expanded = 0, documentFound = false
  for (let entry = 0; entry < count; entry++) {
    if (cursor + 46 > end || view.getUint32(cursor, true) !== 0x02014b50) throw new ImportError('DOCX 压缩结构无效。')
    const flags = view.getUint16(cursor + 8, true), size = view.getUint32(cursor + 24, true)
    const nameLength = view.getUint16(cursor + 28, true), extra = view.getUint16(cursor + 30, true), comment = view.getUint16(cursor + 32, true)
    if (flags & 1 || size === 0xffffffff) throw new ImportError('暂不支持加密或 ZIP64 文档。')
    expanded += size
    if (expanded > MAX_EXPANDED_BYTES) throw new ImportError('文档解压后超过 8 MiB，请简化文档后重试。')
    if (cursor + 46 + nameLength + extra + comment > end) throw new ImportError('DOCX 目录损坏。')
    const name = new TextDecoder().decode(new Uint8Array(buffer, cursor + 46, nameLength))
    if (name === 'word/document.xml') documentFound = true
    cursor += 46 + nameLength + extra + comment
  }
  if (!documentFound) throw new ImportError('文件中没有 Word 正文。')
}
export async function importArticleFile(file: File, encoding: 'utf-8' | 'gb18030' = 'utf-8', signal?: AbortSignal): Promise<string> {
  if (file.size > MAX_IMPORT_BYTES) throw new ImportError('文件超过 2 MiB，请缩小后再导入。')
  if (!file.size) throw new ImportError('不能导入空文件。')
  const extension = file.name.split('.').pop()?.toLowerCase()
  if (!['txt', 'docx'].includes(extension ?? '')) throw new ImportError('仅支持 TXT 和 DOCX 文件。')
  const buffer = await file.arrayBuffer()
  if (signal?.aborted) throw new ImportError('导入已取消。')
  if (extension === 'txt') return decodeText(buffer, encoding)
  validateDocxZip(buffer)
  return new Promise((resolve, reject) => {
    const worker = new Worker(new URL('./docxImporter.worker.ts', import.meta.url), { type: 'module' })
    const finish = (value?: string, error?: string) => {
      clearTimeout(timeout); worker.terminate(); signal?.removeEventListener('abort', abort)
      if (error) reject(new ImportError(error)); else { try { resolve(validateImportedText(value ?? '')) } catch (reason) { reject(reason) } }
    }
    const abort = () => finish(undefined, '导入已取消。')
    const timeout = window.setTimeout(() => finish(undefined, 'DOCX 解析超时，请简化文档后重试。'), 10000)
    worker.onmessage = (event: MessageEvent<{ text?: string; error?: string }>) => finish(event.data.text, event.data.error)
    worker.onerror = () => finish(undefined, 'DOCX 解析失败，请检查文件是否损坏。')
    signal?.addEventListener('abort', abort, { once: true })
    worker.postMessage(buffer, [buffer])
  })
}
