import type { LibraryTheme, TrainingArticle } from '../types'
export const LIBRARY_KEY = 'typeflow.library'
export const LIBRARY_VERSION = 1
const difficulties = ['beginner', 'intermediate', 'advanced']
function object(value: unknown): value is Record<string, unknown> { return typeof value === 'object' && value !== null }
function timestamp(value: unknown) { return typeof value === 'string' && Number.isFinite(Date.parse(value)) }
function article(value: unknown): value is TrainingArticle {
  return object(value) && typeof value.id === 'string' && value.id.length > 0 && typeof value.title === 'string' && value.title.trim().length > 0 && typeof value.content === 'string' && value.content.trim().length > 0 && difficulties.includes(String(value.difficulty)) && timestamp(value.createdAt) && timestamp(value.updatedAt)
}
function theme(value: unknown): value is LibraryTheme {
  return object(value) && typeof value.id === 'string' && value.id.startsWith('custom-') && typeof value.name === 'string' && value.name.trim().length > 0 && typeof value.description === 'string' && ['zh', 'en'].includes(String(value.language)) && difficulties.includes(String(value.difficulty)) && value.isDefault === false && timestamp(value.createdAt) && timestamp(value.updatedAt) && Array.isArray(value.articles) && value.articles.every(article)
}
export function readLibrary(): { customThemes: LibraryTheme[]; error: string | null; blocked: boolean } {
  try {
    const raw = localStorage.getItem(LIBRARY_KEY)
    if (raw === null) return { customThemes: [], error: null, blocked: false }
    const saved: unknown = JSON.parse(raw)
    if (!object(saved) || saved.version !== LIBRARY_VERSION || !Array.isArray(saved.data) || !saved.data.every(theme)) throw new Error('schema')
    const ids = saved.data.flatMap((item) => [item.id, ...item.articles.map((a: TrainingArticle) => a.id)])
    if (new Set(ids).size !== ids.length) throw new Error('duplicate')
    return { customThemes: saved.data, error: null, blocked: false }
  } catch {
    return { customThemes: [], error: '本地词库无法读取或版本不兼容。原始数据已保留，请先备份浏览器数据，再重试读取。默认词库仍可使用。', blocked: true }
  }
}
export function writeLibrary(themes: LibraryTheme[]) {
  localStorage.setItem(LIBRARY_KEY, JSON.stringify({ version: LIBRARY_VERSION, data: themes }))
}
