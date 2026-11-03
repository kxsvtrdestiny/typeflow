import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ArrowLeft, Plus, Pencil, Trash2, Play, LockKeyhole } from 'lucide-react'
import PageHeading from '../components/common/PageHeading'
import ImportArticle from '../components/library/ImportArticle'
import ArticleForm from '../components/library/ArticleForm'
import DeleteConfirmation from '../components/library/DeleteConfirmation'
import StorageNotice from '../components/library/StorageNotice'
import { difficultyLabels } from '../components/library/labels'
import { defaultThemes, useLibraryStore } from '../stores/useLibraryStore'
import { characterCount } from '../utils/textParser'
import type { TrainingArticle } from '../types'
export default function LibraryDetail() {
  const { themeId } = useParams()
  const custom = useLibraryStore((s) => s.customThemes)
  const remove = useLibraryStore((s) => s.deleteArticle)
  const blocked = useLibraryStore((s) => s.blocked)
  const theme = [...defaultThemes, ...custom].find((t) => t.id === themeId)
  const [editor, setEditor] = useState<TrainingArticle | 'new' | null>(null)
  const [importing, setImporting] = useState(false)
  const [deleting, setDeleting] = useState<TrainingArticle | null>(null)
  if (!theme) return <><PageHeading title="词库详情" /><StorageNotice /><div className="card empty-state"><h2>主题不存在或已删除</h2><Link className="text-link" to="/library">返回词库</Link></div></>
  return <div className="library-page"><Link className="text-link" to="/library"><ArrowLeft size={16} />返回词库</Link><div className="page-title-row"><PageHeading title="词库详情" /><span className="muted small">{theme.isDefault ? <><LockKeyhole size={14} className="inline-icon" />默认主题 · 只读</> : <button className="button primary" disabled={blocked} onClick={() => setEditor('new')}><Plus size={16} />添加文章</button>}</span></div><StorageNotice /><section className="card detail-summary"><h2>{theme.name}</h2><div className="badge-row"><span className="badge">{theme.language === 'zh' ? '中文' : 'English'}</span><span className="badge subtle">{difficultyLabels[theme.difficulty]}</span><span className="muted small">{theme.articles.length} 篇文章</span></div>{theme.description && <p className="muted small">{theme.description}</p>}</section>
    {!theme.isDefault && <button className="button secondary import-button" disabled={blocked} onClick={() => setImporting(true)}>导入文章</button>}
    <div className="article-list">{theme.articles.map((article) => <article className="card article-card" key={article.id}><div className="article-heading"><h2>{article.title}</h2><div className="badge-row"><span className="badge subtle">{difficultyLabels[article.difficulty]}</span><span className="muted small">{characterCount(article.content)} 字符</span></div></div><p className="article-preview">{article.content}</p><div className="library-card-footer"><Link className="text-link" to={`/practice?${new URLSearchParams({ language: theme.language, theme: theme.name, themeId: theme.id, articleId: article.id })}`}><Play size={14} />开始练习</Link>{!theme.isDefault && <div className="row-actions"><button className="icon-button" aria-label={`编辑${article.title}`} disabled={blocked} onClick={() => setEditor(article)}><Pencil size={16} /></button><button className="icon-button" aria-label={`删除${article.title}`} disabled={blocked} onClick={() => setDeleting(article)}><Trash2 size={16} /></button></div>}</div></article>)}</div>
    {!theme.articles.length && <div className="card empty-state"><h2>暂无文章</h2><p>添加一篇文章，开始建立自己的词库。</p></div>}
    {importing && <ImportArticle themeId={theme.id} onClose={() => setImporting(false)} />}
    {editor && <ArticleForm theme={theme} article={editor === 'new' ? undefined : editor} onClose={() => setEditor(null)} />}
    {deleting && <DeleteConfirmation name={deleting.title} onConfirm={() => remove(theme.id, deleting.id)} onClose={() => setDeleting(null)} />}
  </div>
}
