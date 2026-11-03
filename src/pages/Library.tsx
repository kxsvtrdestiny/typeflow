import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Plus, Search, BookOpen, LockKeyhole, Pencil, Trash2 } from 'lucide-react'
import PageHeading from '../components/common/PageHeading'
import ImportArticle from '../components/library/ImportArticle'
import ThemeForm from '../components/library/ThemeForm'
import DeleteConfirmation from '../components/library/DeleteConfirmation'
import StorageNotice from '../components/library/StorageNotice'
import { difficultyLabels } from '../components/library/labels'
import { defaultThemes, useLibraryStore } from '../stores/useLibraryStore'
import type { Language, LibraryTheme } from '../types'
export default function Library() {
  const custom = useLibraryStore((s) => s.customThemes)
  const remove = useLibraryStore((s) => s.deleteTheme)
  const blocked = useLibraryStore((s) => s.blocked)
  const [language, setLanguage] = useState<Language>('zh')
  const [search, setSearch] = useState('')
  const [difficulty, setDifficulty] = useState('all')
  const [editor, setEditor] = useState<LibraryTheme | 'new' | null>(null)
  const [importing, setImporting] = useState(false)
  const [deleting, setDeleting] = useState<LibraryTheme | null>(null)
  const themes = [...defaultThemes, ...custom].filter((t) => t.language === language && (difficulty === 'all' || t.difficulty === difficulty) && t.name.toLocaleLowerCase().includes(search.trim().toLocaleLowerCase()))
  return <div className="library-page"><div className="page-title-row"><PageHeading title="词库管理" /><button className="button primary" disabled={blocked} onClick={() => setEditor('new')}><Plus size={17} />新建主题</button></div><StorageNotice />
    <div className="library-toolbar"><button className="button secondary" disabled={blocked} onClick={() => setImporting(true)}>导入文章</button><div className="theme-language-switch" role="group" aria-label="词库语言"><button aria-pressed={language === 'zh'} onClick={() => setLanguage('zh')}>中文</button><button aria-pressed={language === 'en'} onClick={() => setLanguage('en')}>English</button></div><label className="search-field"><Search size={17} /><input aria-label="搜索主题" placeholder="搜索主题" value={search} onChange={(e) => setSearch(e.target.value)} /></label><select aria-label="筛选难度" value={difficulty} onChange={(e) => setDifficulty(e.target.value)}><option value="all">全部难度</option>{Object.entries(difficultyLabels).map(([value, text]) => <option key={value} value={value}>{text}</option>)}</select></div>
    <div className="library-grid">{themes.map((theme) => <article className="card library-card" key={theme.id}><div className="theme-top"><BookOpen size={21} /><span className="library-origin">{theme.isDefault ? <><LockKeyhole size={12} />默认 · 只读</> : '自定义'}</span></div><h2>{theme.name}</h2><div className="badge-row"><span className="badge">{theme.language === 'zh' ? '中文' : 'English'}</span><span className="badge subtle">{difficultyLabels[theme.difficulty]}</span><span className="muted small">{theme.articles.length} 篇文章</span></div><div className="library-card-footer"><Link className="text-link" to={`/library/${theme.id}`}>查看文章</Link>{!theme.isDefault && <div className="row-actions"><button className="icon-button" aria-label={`编辑${theme.name}`} disabled={blocked} onClick={() => setEditor(theme)}><Pencil size={16} /></button><button className="icon-button" aria-label={`删除${theme.name}`} disabled={blocked} onClick={() => setDeleting(theme)}><Trash2 size={16} /></button></div>}</div></article>)}</div>
    {themes.length === 0 && <div className="card empty-state"><BookOpen size={26} /><h2>暂无匹配主题</h2><p>试试其他搜索条件，或新建自己的主题。</p></div>}
    {importing && <ImportArticle onClose={() => setImporting(false)} />}
    {editor && <ThemeForm theme={editor === 'new' ? undefined : editor} initialLanguage={language} onClose={() => setEditor(null)} onSaved={(id) => { const saved = useLibraryStore.getState().customThemes.find((t) => t.id === id); if (saved) setLanguage(saved.language); setSearch(''); setDifficulty('all'); setEditor(null) }} />}
    {deleting && <DeleteConfirmation name={deleting.name} onConfirm={() => remove(deleting.id)} onClose={() => setDeleting(null)} />}
  </div>
}
