import mammoth from 'mammoth'
const scope = self as unknown as { onmessage: ((event: MessageEvent<ArrayBuffer>) => void) | null; postMessage: (message: unknown) => void }
scope.onmessage = async (event) => {
  try {
    const result = await mammoth.extractRawText({ arrayBuffer: event.data })
    scope.postMessage({ text: result.value })
  } catch { scope.postMessage({ error: 'DOCX 解析失败，请检查文件是否损坏、加密或格式不受支持。' }) }
}
