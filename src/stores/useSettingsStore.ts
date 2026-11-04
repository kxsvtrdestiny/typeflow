import { create } from 'zustand'
import type { UserSettings } from '../types'
import { readSettings, SETTINGS_KEY, SETTINGS_VERSION, validSettings } from '../utils/settingsStorage'
interface SettingsState {
  settings: UserSettings; error: string | null; blocked: boolean
  update: (patch: Partial<UserSettings>) => boolean
  reload: () => void
}
export const useSettingsStore = create<SettingsState>((set, get) => ({
  ...readSettings(),
  reload: () => set(readSettings()),
  update: (patch) => {
    if (get().blocked) return false
    const settings = { ...get().settings, ...patch }
    if (!validSettings(settings)) return false
    try { localStorage.setItem(SETTINGS_KEY, JSON.stringify({ version: SETTINGS_VERSION, data: settings })); set({ settings, error: null }); return true }
    catch { set({ error: '设置保存失败：浏览器存储不可用或空间不足，本次修改未生效。' }); return false }
  },
}))
