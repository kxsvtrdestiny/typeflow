import { beforeEach, describe, expect, it, vi } from 'vitest'
import { useSettingsStore } from './useSettingsStore'
import { DEFAULT_SETTINGS, readSettings, SETTINGS_KEY } from '../utils/settingsStorage'
import { resetTypeflowData } from '../utils/resetData'
import { selectTypingTone, createTonePlayer } from '../utils/typingAudio'
beforeEach(() => { vi.restoreAllMocks(); localStorage.clear(); useSettingsStore.setState({ settings: { ...DEFAULT_SETTINGS }, error: null, blocked: false }) })
describe('settings persistence and reset', () => {
  it('uses quiet defaults, persists all settings and rejects invalid updates', () => {
    expect(useSettingsStore.getState().settings).toMatchObject({ autoSave: true, correctSound: false, incorrectSound: false })
    expect(useSettingsStore.getState().update({ theme: 'dark', defaultLanguage: 'en', defaultMode: 'timed', defaultTimedMinutes: 3, autoSave: false, correctSound: true })).toBe(true)
    useSettingsStore.getState().reload()
    expect(useSettingsStore.getState().settings).toMatchObject({ theme: 'dark', defaultLanguage: 'en', autoSave: false })
    expect(useSettingsStore.getState().update({ defaultTimedMinutes: 2 as 1 })).toBe(false)
  })
  it('preserves invalid versions and failed writes rather than pretending to save', () => {
    localStorage.setItem(SETTINGS_KEY, '{bad')
    useSettingsStore.getState().reload()
    expect(useSettingsStore.getState().blocked).toBe(true)
    expect(useSettingsStore.getState().update({ autoSave: false })).toBe(false)
    expect(localStorage.getItem(SETTINGS_KEY)).toBe('{bad')
    localStorage.removeItem(SETTINGS_KEY); useSettingsStore.getState().reload()
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => { throw new Error('quota') })
    expect(useSettingsStore.getState().update({ theme: 'dark' })).toBe(false)
    expect(useSettingsStore.getState().settings.theme).toBe('light')
    expect(useSettingsStore.getState().error).toContain('保存失败')
  })
  it('removes only three owned keys and reports partial deletion failure', () => {
    for (const key of ['typeflow.library', 'typeflow.history', SETTINGS_KEY, 'another-app']) localStorage.setItem(key, 'data')
    const remove = Storage.prototype.removeItem
    vi.spyOn(Storage.prototype, 'removeItem').mockImplementation(function(this: Storage, key) { if (key === 'typeflow.history') throw new Error('denied'); remove.call(this, key) })
    const report = resetTypeflowData()
    expect(report.failed).toEqual(['训练历史'])
    expect(report.cleared).toEqual(['自定义词库', '用户设置'])
    expect(localStorage.getItem('another-app')).toBe('data')
    expect(localStorage.getItem('typeflow.history')).toBe('data')
    vi.restoreAllMocks()
    expect(resetTypeflowData().failed).toEqual([])
    expect(localStorage.getItem('another-app')).toBe('data')
    expect(readSettings().settings).toEqual(DEFAULT_SETTINGS)
  })
})
describe('short local tones', () => {
  it('selects only enabled new-character tones, never deletion', () => {
    expect(selectTypingTone(0, 0, true, true)).toBeNull()
    expect(selectTypingTone(2, 2, true, false)).toBe('correct')
    expect(selectTypingTone(2, 0, true, false)).toBeNull()
    expect(selectTypingTone(2, 1, true, true)).toBe('incorrect')
  })
  it('contains audio failures and unsupported APIs', async () => {
    const player = createTonePlayer(() => { throw new Error('unsupported') })
    await expect(player.unlock()).resolves.toBeUndefined()
    expect(() => player.play('correct')).not.toThrow()
    expect(() => player.close()).not.toThrow()
  })
})
