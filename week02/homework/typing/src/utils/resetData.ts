import { LIBRARY_KEY } from './storage'
import { HISTORY_KEY } from './historyStorage'
import { SETTINGS_KEY } from './settingsStorage'
import { useLibraryStore } from '../stores/useLibraryStore'
import { useHistoryStore } from '../stores/useHistoryStore'
import { useSettingsStore } from '../stores/useSettingsStore'
export function resetTypeflowData() {
  const cleared: string[] = [], failed: string[] = []
  for (const [key, name, reload] of [
    [LIBRARY_KEY, '自定义词库', useLibraryStore.getState().retryRead],
    [HISTORY_KEY, '训练历史', useHistoryStore.getState().reload],
    [SETTINGS_KEY, '用户设置', useSettingsStore.getState().reload],
  ] as const) {
    try { localStorage.removeItem(key); reload(); cleared.push(name) }
    catch { failed.push(name) }
  }
  return { cleared, failed }
}
