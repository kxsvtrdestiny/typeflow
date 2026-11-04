import { create } from 'zustand'
import { defaultChinese } from '../data/defaultChinese'
import { defaultEnglish } from '../data/defaultEnglish'
import type { Difficulty, Language, LibraryTheme, TrainingArticle } from '../types'
import { readLibrary, writeLibrary } from '../utils/storage'
import { normalizeText } from '../utils/textParser'
export const defaultThemes = [...defaultChinese, ...defaultEnglish]
export interface ThemeDraft { name: string; description: string; language: Language; difficulty: Difficulty }
export interface ArticleDraft { title: string; content: string; difficulty: Difficulty }
interface LibraryState {
  customThemes: LibraryTheme[]
  error: string | null
  blocked: boolean
  retryRead: () => void
  saveTheme: (draft: ThemeDraft, id?: string) => string | null
  deleteTheme: (id: string) => boolean
  saveArticle: (themeId: string, draft: ArticleDraft, id?: string) => boolean
  deleteArticle: (themeId: string, id: string) => boolean
}
export const useLibraryStore = create<LibraryState>((set, get) => {
  function commit(customThemes: LibraryTheme[]) {
    if (get().blocked) return false
    try { writeLibrary(customThemes); set({ customThemes, error: null }); return true }
    catch { set({ error: '保存失败：浏览器存储不可用或空间不足。本次修改未保存，请保留表单内容并重试。' }); return false }
  }
  return {
    ...readLibrary(),
    retryRead: () => set(readLibrary()),
    saveTheme: (draft, id) => {
      if (!draft.name.trim() || draft.name.trim().length > 80 || draft.description.length > 1000 || !['zh', 'en'].includes(draft.language) || !['beginner', 'intermediate', 'advanced'].includes(draft.difficulty)) return null
      const existing = id ? get().customThemes.find((item) => item.id === id) : undefined
      if (id && !existing) return null
      const now = new Date().toISOString()
      const item: LibraryTheme = { ...draft, name: draft.name.trim(), id: existing?.id ?? `custom-${crypto.randomUUID()}`, isDefault: false, articles: existing?.articles ?? [], createdAt: existing?.createdAt ?? now, updatedAt: now }
      const next = existing ? get().customThemes.map((t) => t.id === id ? item : t) : [...get().customThemes, item]
      return commit(next) ? item.id : null
    },
    deleteTheme: (id) => get().customThemes.some((t) => t.id === id) && commit(get().customThemes.filter((t) => t.id !== id)),
    saveArticle: (themeId, draft, id) => {
      const theme = get().customThemes.find((t) => t.id === themeId)
      if (!theme || !draft.title.trim() || draft.title.trim().length > 120 || !draft.content.trim() || draft.content.length > 100000 || !['beginner', 'intermediate', 'advanced'].includes(draft.difficulty)) return false
      const existing = id ? theme.articles.find((a) => a.id === id) : undefined
      if (id && !existing) return false
      const now = new Date().toISOString()
      const item: TrainingArticle = { ...draft, title: draft.title.trim(), content: normalizeText(draft.content), id: existing?.id ?? `article-${crypto.randomUUID()}`, createdAt: existing?.createdAt ?? now, updatedAt: now }
      const articles = existing ? theme.articles.map((a) => a.id === id ? item : a) : [...theme.articles, item]
      return commit(get().customThemes.map((t) => t.id === themeId ? { ...t, articles, updatedAt: now } : t))
    },
    deleteArticle: (themeId, id) => {
      const theme = get().customThemes.find((t) => t.id === themeId)
      if (!theme?.articles.some((a) => a.id === id)) return false
      return commit(get().customThemes.map((t) => t.id === themeId ? { ...t, articles: t.articles.filter((a) => a.id !== id), updatedAt: new Date().toISOString() } : t))
    },
  }
})
