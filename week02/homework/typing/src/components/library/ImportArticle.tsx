import { useEffect, useRef, useState } from 'react'
import Modal from '../common/Modal'
import ArticleForm from './ArticleForm'
import { importArticleFile, ImportError } from '../../utils/fileImporter'
import { useLibraryStore } from '../../stores/useLibraryStore'
import type { ArticleDraft } from '../../stores/useLibraryStore'
interface Props { themeId?: string; onClose: () => void }
export default function ImportArticle({ themeId, onClose }: Props) {
  const themes = useLibraryStore((state) => state.customThemes)
  const theme = themes.find((item) => item.id === themeId) ?? themes[0]
  const [file, setFile] = useState<File | null>(null)
  const [draft, setDraft] = useState<ArticleDraft | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [encodingError, setEncodingError] = useState(false)
  const controller = useRef<AbortController | null>(null)
  useEffect(() => () => controller.current?.abort(), [])
  async function read(selected: File, encoding: 'utf-8' | 'gb18030' = 'utf-8') {
    controller.current?.abort()
    const request = new AbortController(); controller.current = request
    setBusy(true); setError(''); setEncodingError(false)
    try {
      const content = await importArticleFile(selected, encoding, request.signal)
      if (!request.signal.aborted) setDraft({ title: selected.name.replace(/\.[^.]+$/, '').slice(0, 120), content, difficulty: theme?.difficulty ?? 'beginner' })
    } catch (reason) {
      if (!request.signal.aborted) { setError(reason instanceof Error ? reason.message : '文件读取失败。'); setEncodingError(reason instanceof ImportError && reason.code === 'ENCODING') }
    } finally { if (!request.signal.aborted) setBusy(false) }
  }
  if (draft && theme) return <ArticleForm theme={theme} initialDraft={draft} allowThemeChoice onClose={onClose} />
  return <Modal title="导入文章" onClose={onClose}><div className="editor-form">
    {!theme ? <p>请先新建一个自定义主题，再导入文章。默认词库只读。</p> : <label>选择 TXT / DOCX 文件<input type="file" accept=".txt,.docx" disabled={busy} onChange={(event) => { const selected = event.target.files?.[0]; if (selected) { setFile(selected); void read(selected) } }} /></label>}
    <p className="muted small">仅在浏览器本地读取。文件上限 2 MiB，正文上限 100000 字符。</p>
    {busy && <p role="status">正在解析…</p>}
    {error && <p className="form-error" role="alert">{error}</p>}
    {encodingError && file && <button className="button secondary" onClick={() => void read(file, 'gb18030')}>按 GB18030 重读</button>}
    <div className="form-actions"><button className="button secondary" onClick={onClose}>取消</button></div>
  </div></Modal>
}
