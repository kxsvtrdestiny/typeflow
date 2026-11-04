import { useState } from 'react'
import type { LibraryTheme } from '../../types'
import { useLibraryStore } from '../../stores/useLibraryStore'
import type { ThemeDraft } from '../../stores/useLibraryStore'
import Modal from '../common/Modal'
import { difficultyLabels } from './labels'
interface Props { theme?: LibraryTheme; initialLanguage: 'zh' | 'en'; onClose: () => void; onSaved: (id: string) => void }
export default function ThemeForm({ theme, initialLanguage, onClose, onSaved }: Props) {
  const [draft, setDraft] = useState<ThemeDraft>(theme ?? { name: '', description: '', language: initialLanguage, difficulty: 'beginner' })
  const [error, setError] = useState('')
  const save = useLibraryStore((s) => s.saveTheme)
  return <Modal title={theme ? '编辑主题' : '新建主题'} onClose={onClose}><form className="editor-form" onSubmit={(event) => {
    event.preventDefault()
    const id = save(draft, theme?.id)
    if (id) onSaved(id)
    else setError('无法保存，请检查必填项或本地存储状态。')
  }}>
    <label>主题名称<input autoFocus required maxLength={80} value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} /></label>
    <label>主题描述<textarea maxLength={1000} rows={3} value={draft.description} onChange={(e) => setDraft({ ...draft, description: e.target.value })} /></label>
    <div className="form-grid"><label>语言<select value={draft.language} onChange={(e) => setDraft({ ...draft, language: e.target.value as ThemeDraft['language'] })}><option value="zh">中文</option><option value="en">English</option></select></label>
    <label>难度<select value={draft.difficulty} onChange={(e) => setDraft({ ...draft, difficulty: e.target.value as ThemeDraft['difficulty'] })}>{Object.entries(difficultyLabels).map(([value, text]) => <option key={value} value={value}>{text}</option>)}</select></label></div>
    {error && <p role="alert" className="form-error">{error}</p>}
    <div className="form-actions"><button type="button" className="button secondary" onClick={onClose}>取消</button><button className="button primary" type="submit">保存主题</button></div>
  </form></Modal>
}
