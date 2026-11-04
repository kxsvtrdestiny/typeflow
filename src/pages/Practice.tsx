import { useState } from 'react'
import { useSettingsStore } from '../stores/useSettingsStore'
import { Link, useSearchParams } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import PageHeading from '../components/common/PageHeading'
import TrainingSession from '../components/typing/TrainingSession'
import { defaultThemes, useLibraryStore } from '../stores/useLibraryStore'
import type { Language } from '../types'

export default function Practice() {
  const [query, setQuery] = useSearchParams()
  const custom = useLibraryStore((s) => s.customThemes)
  const themes = [...defaultThemes, ...custom]
  const [defaults] = useState(() => useSettingsStore.getState().settings)
  const requestedLanguage = query.has('language') ? (query.get('language') === 'en' ? 'en' : 'zh') : defaults.defaultLanguage
  const themeId = query.get('themeId')
  const themeName = query.get('theme')
  const theme = themeId ? themes.find((t) => t.id === themeId)
    : themeName ? themes.find((t) => t.name === themeName && t.language === requestedLanguage)
    : themes.find((t) => t.language === requestedLanguage && t.articles.length)
  const articleId = query.get('articleId')
  const article = articleId ? theme?.articles.find((a) => a.id === articleId) : theme?.articles[0]
  const language = theme?.language ?? requestedLanguage

  function changeSelection(nextLanguage: Language, nextThemeId?: string, nextArticleId?: string) {
    const status = document.querySelector('[data-training-status]')?.getAttribute('data-training-status')
    if ((status === 'running' || status === 'paused') && !window.confirm('切换文章将清空本次输入，确定继续吗？')) return
    const nextTheme = nextThemeId ? themes.find((t) => t.id === nextThemeId) : themes.find((t) => t.language === nextLanguage && t.articles.length)
    const nextArticle = nextArticleId ?? nextTheme?.articles[0]?.id
    setQuery({ language: nextLanguage, ...(query.has('mode') ? { mode: query.get('mode')! } : {}), ...(query.has('minutes') ? { minutes: query.get('minutes')! } : {}), ...(nextTheme ? { themeId: nextTheme.id } : {}), ...(nextArticle ? { articleId: nextArticle } : {}) })
  }

  return <div className="practice-page">
    <div className="page-title-row"><PageHeading title="打字训练" /><Link className="text-link" to={theme ? `/library/${theme.id}` : '/library'}><ArrowLeft size={16} />返回词库</Link></div>
    <section className="card practice-selection">
      <h2>已选练习</h2>
      <div className="practice-selectors">
        <label>训练语言<select value={language} onChange={(e) => changeSelection(e.target.value as Language)}><option value="zh">中文</option><option value="en">English</option></select></label>
        <label>训练主题<select value={theme?.id ?? ''} onChange={(e) => changeSelection(language, e.target.value)}><option value="" disabled>选择主题</option>{themes.filter((t) => t.language === language).map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}</select></label>
        <label>训练文章<select value={article?.id ?? ''} onChange={(e) => changeSelection(language, theme?.id, e.target.value)}><option value="" disabled>选择文章</option>{theme?.articles.map((a) => <option key={a.id} value={a.id}>{a.title}</option>)}</select></label>
      </div>
      {theme && article && <p className="muted small">{theme.name} · {article.title}</p>}
    </section>
    {theme && article ? <TrainingSession key={`${theme.id}:${article.id}:${query.get('mode') ?? ''}:${query.get('minutes') ?? ''}`} initialMode={query.get('mode') === 'timed' || query.get('mode') === 'free' ? query.get('mode') as 'timed' | 'free' : defaults.defaultMode} initialMinutes={[1, 3, 5, 10].includes(Number(query.get('minutes'))) ? Number(query.get('minutes')) as 1 | 3 | 5 | 10 : defaults.defaultTimedMinutes} article={article} language={language} themeId={theme.id} themeName={theme.name} /> : <div className="card empty-state"><p role="status">主题或文章不存在，或此主题暂无文章。</p><Link className="text-link" to="/library">前往词库选择</Link></div>}
    <Link className="text-link" to="/">返回首页</Link>
  </div>
}
