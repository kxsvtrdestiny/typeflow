import { beforeEach, describe, expect, it, vi } from 'vitest'
import { defaultThemes, useLibraryStore } from './useLibraryStore'
import { LIBRARY_KEY, readLibrary } from '../utils/storage'
import { characterCount } from '../utils/textParser'

beforeEach(() => {
  vi.restoreAllMocks()
  localStorage.clear()
  useLibraryStore.setState({ customThemes: [], blocked: false, error: null })
})
const draft = { name: '我的主题', description: '练习素材', language: 'zh' as const, difficulty: 'beginner' as const }
const article = { title: '练习文章', content: '你好，世界。\nHello world!', difficulty: 'intermediate' as const }

describe('default content', () => {
  it('contains twelve themes and sixty distinct complete passages with unique ids', () => {
    expect(defaultThemes).toHaveLength(12)
    for (const language of ['zh', 'en']) expect(defaultThemes.filter((t) => t.language === language)).toHaveLength(6)
    const articles = defaultThemes.flatMap((t) => t.articles)
    expect(articles).toHaveLength(60)
    expect(new Set(articles.map((a) => a.content)).size).toBe(60)
    const ids = defaultThemes.flatMap((t) => [t.id, ...t.articles.map((a) => a.id)])
    expect(new Set(ids).size).toBe(ids.length)
    for (const theme of defaultThemes) {
      expect(theme.isDefault).toBe(true)
      expect(theme.articles.length).toBeGreaterThanOrEqual(5)
      for (const a of theme.articles) {
        expect(a.title.trim()).not.toBe('')
        expect(characterCount(a.content)).toBeGreaterThan(70)
        expect(a.content).toMatch(theme.language === 'zh' ? /[\u4e00-\u9fff]/ : /[a-zA-Z]/)
        expect(a.difficulty).toBe(theme.difficulty)
      }
    }
  })
  it('rejects all default mutations in the store', () => {
    const theme = defaultThemes[0]
    const snapshot = JSON.stringify(theme)
    const store = useLibraryStore.getState()
    expect(store.saveTheme(draft, theme.id)).toBeNull()
    expect(store.deleteTheme(theme.id)).toBe(false)
    expect(store.saveArticle(theme.id, article)).toBe(false)
    expect(store.deleteArticle(theme.id, theme.articles[0].id)).toBe(false)
    expect(JSON.stringify(theme)).toBe(snapshot)
  })
})

describe('custom library persistence', () => {
  it('creates, edits, reloads and deletes a theme without duplicates', () => {
    const store = useLibraryStore.getState()
    const id = store.saveTheme(draft)!
    expect(id).toMatch(/^custom-/)
    expect(store.saveTheme({ ...draft, name: 'Updated', language: 'en', difficulty: 'advanced' }, id)).toBe(id)
    store.retryRead()
    store.retryRead()
    expect(useLibraryStore.getState().customThemes).toHaveLength(1)
    expect(useLibraryStore.getState().customThemes[0]).toMatchObject({ name: 'Updated', language: 'en', difficulty: 'advanced', isDefault: false })
    expect(store.deleteTheme(id)).toBe(true)
    expect(readLibrary().customThemes).toHaveLength(0)
  })
  it('creates, updates and deletes articles, preserving timestamps and text', () => {
    const store = useLibraryStore.getState()
    const id = store.saveTheme(draft)!
    expect(store.saveArticle(id, article)).toBe(true)
    const saved = useLibraryStore.getState().customThemes[0].articles[0]
    expect(store.saveArticle(id, { ...article, title: '新标题', content: '\uFEFF第一行\r\n第二行' }, saved.id)).toBe(true)
    store.retryRead()
    expect(useLibraryStore.getState().customThemes[0].articles[0]).toMatchObject({ id: saved.id, title: '新标题', content: '第一行\n第二行', createdAt: saved.createdAt })
    expect(store.deleteArticle(id, saved.id)).toBe(true)
    expect(readLibrary().customThemes[0].articles).toHaveLength(0)
  })
  it('rejects empty and oversized submissions and missing references', () => {
    const store = useLibraryStore.getState()
    expect(store.saveTheme({ ...draft, name: '  ' })).toBeNull()
    expect(store.saveTheme({ ...draft, name: 'a'.repeat(81) })).toBeNull()
    const id = store.saveTheme(draft)!
    expect(store.saveArticle(id, { ...article, content: '   ' })).toBe(false)
    expect(store.saveArticle(id, { ...article, content: 'a'.repeat(100001) })).toBe(false)
    expect(store.saveArticle(id, article, 'missing')).toBe(false)
    expect(store.saveArticle('missing', article)).toBe(false)
    expect(store.deleteArticle(id, 'missing')).toBe(false)
  })
  it.each(['{bad-json', JSON.stringify({ version: 99, data: [] }), JSON.stringify({ version: 1, data: [{}] })])('preserves unreadable data and blocks writes: %s', (raw) => {
    localStorage.setItem(LIBRARY_KEY, raw)
    useLibraryStore.getState().retryRead()
    expect(useLibraryStore.getState().blocked).toBe(true)
    expect(useLibraryStore.getState().saveTheme(draft)).toBeNull()
    expect(localStorage.getItem(LIBRARY_KEY)).toBe(raw)
    expect(defaultThemes).toHaveLength(12)
  })
  it('does not claim a failed write succeeded and supports retry', () => {
    const mock = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => { throw new DOMException('Full', 'QuotaExceededError') })
    expect(useLibraryStore.getState().saveTheme(draft)).toBeNull()
    expect(useLibraryStore.getState().customThemes).toHaveLength(0)
    expect(useLibraryStore.getState().error).toContain('保存失败')
    mock.mockRestore()
    expect(useLibraryStore.getState().saveTheme(draft)).toBeTruthy()
    expect(useLibraryStore.getState().error).toBeNull()
  })
  it('detects duplicate ids in stored data', () => {
    const id = useLibraryStore.getState().saveTheme(draft)!
    const theme = readLibrary().customThemes[0]
    localStorage.setItem(LIBRARY_KEY, JSON.stringify({ version: 1, data: [theme, { ...theme, id }] }))
    expect(readLibrary().blocked).toBe(true)
  })
  it('counts grapheme clusters including emoji and combining marks', () => {
    expect(characterCount('中e\u0301👩‍💻\n')).toBe(4)
  })
})
