import { create } from 'zustand'
import type { TrainingOutcome, TrainingRecord } from '../types'
import { historySnapshot, readHistory, validOutcome, writeHistory } from '../utils/historyStorage'
export type SaveStatus = 'saved' | 'duplicate' | 'invalid' | 'failed'
interface HistoryState {
  records: TrainingRecord[]; error: string | null; blocked: boolean
  reload: () => void
  add: (id: string, outcome: TrainingOutcome) => SaveStatus
  remove: (id: string) => boolean
  clear: () => boolean
}
export const useHistoryStore = create<HistoryState>((set) => {
  function persist(records: TrainingRecord[]) {
    try { writeHistory(records); set({ records, error: null, blocked: false }); return true }
    catch { set({ error: '训练记录保存失败：浏览器存储不可用或空间不足。本次变更未保存。' }); return false }
  }
  function current() {
    const loaded = readHistory()
    if (loaded.blocked) { set({ error: loaded.error, blocked: true }); return null }
    return loaded.records
  }
  return {
    ...readHistory(),
    reload: () => set(readHistory()),
    add: (id, outcome) => {
      if (!id.trim() || !validOutcome(outcome)) return 'invalid'
      const records = current()
      if (!records) return 'failed'
      if (records.some((record) => record.id === id)) { set({ records, error: null, blocked: false }); return 'duplicate' }
      return persist([...records, historySnapshot(id, outcome)]) ? 'saved' : 'failed'
    },
    remove: (id) => { const records = current(); return records !== null && persist(records.filter((record) => record.id !== id)) },
    clear: () => persist([]),
  }
})
