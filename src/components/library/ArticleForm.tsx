import { useState } from 'react'
import type { LibraryTheme, TrainingArticle } from '../../types'
import { useLibraryStore } from '../../stores/useLibraryStore'
import type { ArticleDraft } from '../../stores/useLibraryStore'
import { characterCount } from '../../utils/textParser'
import Modal from '../common/Modal'
import { difficultyLabels } from './labels'
interface Props { initialDraft?: ArticleDraft; allowThemeChoice?: boolean; theme: LibraryTheme; article?: TrainingArticle; onClose: () => void }
export default function ArticleForm({ theme, article, initialDraft, allowThemeChoice, onClose }: Props) {
  const [draft, setDraft] = useState<ArticleDraft>(article ?? initialDraft ?? { title: '', content: '', difficulty: theme.difficulty })
  const themes = useLibraryStore((state) => state.customThemes)
  const [selectedTheme, setSelectedTheme] = useState(theme.id)
  const [error, setError] = useState('')
  const save = useLibraryStore((s) => s.saveArticle)
  return <Modal title={article ? '编辑文章' : '添加文章'} onClose={onClose}><form className="editor-form" onSubmit={(event) => {
    event.preventDefault()
    if (save(selectedTheme, draft, article?.id)) onClose()
    else setError('无法保存，请检查必填项或本地存储状态。')
  }}>
    {allowThemeChoice && <label>保存到主题<select value={selectedTheme} onChange={(event) => setSelectedTheme(event.target.value)}>{themes.map((item) => <option key={item.id} value={item.id}>{item.name}（{item.language === 'zh' ? '中文' : 'English'}）</option>)}</select></label>}
    <label>文章标题<input autoFocus required maxLength={120} value={draft.title} onChange={(e) => setDraft({ ...draft, title: e.target.value })} /></label>
    <label>文章内容<textarea required rows={10} maxLength={100000} value={draft.content} onChange={(e) => setDraft({ ...draft, content: e.target.value })} /></label>
    <div className="article-form-meta"><span className="muted small">{characterCount(draft.content)} 字符（含空格与换行）</span><label>文章难度<select value={draft.difficulty} onChange={(e) => setDraft({ ...draft, difficulty: e.target.value as ArticleDraft['difficulty'] })}>{Object.entries(difficultyLabels).map(([value, text]) => <option key={value} value={value}>{text}</option>)}</select></label></div>
    {error && <p role="alert" className="form-error">{error}</p>}
    <div className="form-actions"><button className="button secondary" type="button" onClick={onClose}>取消</button><button className="button primary" type="submit">保存文章</button></div>
  </form></Modal>
}
