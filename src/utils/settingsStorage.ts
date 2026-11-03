import type { UserSettings } from '../types'
export const SETTINGS_KEY = 'typeflow.settings'
export const DEFAULT_SETTINGS: UserSettings = { theme: 'light', defaultLanguage: 'zh', defaultMode: 'free', defaultTimedMinutes: 1, correctSound: false, incorrectSound: false, autoSave: true, dailyGoalMinutes: 15 }
export function validSettings(value: unknown): value is UserSettings {
  if (typeof value !== 'object' || value === null) return false
  const s = value as Record<string, unknown>
  return ['light', 'dark'].includes(String(s.theme)) && ['zh', 'en'].includes(String(s.defaultLanguage)) && ['free', 'timed'].includes(String(s.defaultMode)) && typeof s.defaultTimedMinutes === 'number' && [1, 3, 5, 10].includes(s.defaultTimedMinutes) && ['correctSound', 'incorrectSound', 'autoSave'].every((key) => typeof s[key] === 'boolean') && typeof s.dailyGoalMinutes === 'number' && Number.isFinite(s.dailyGoalMinutes) && s.dailyGoalMinutes > 0
}
export function readSettings(): { settings: UserSettings; error: string | null; blocked: boolean } {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY)
    if (!raw) return { settings: { ...DEFAULT_SETTINGS }, error: null, blocked: false }
    const saved = JSON.parse(raw)
    if (saved.version !== 1 || !validSettings(saved.data)) throw new Error('schema')
    return { settings: { ...DEFAULT_SETTINGS, ...saved.data }, error: null, blocked: false }
  } catch { return { settings: { ...DEFAULT_SETTINGS }, error: '设置无法读取或版本不兼容，原始数据已保留。当前使用默认设置，请修复后重试。', blocked: true } }
}
