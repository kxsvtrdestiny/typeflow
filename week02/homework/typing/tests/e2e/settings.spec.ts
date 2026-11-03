import { test, expect } from '@playwright/test'
import type { Page } from '@playwright/test'
const defaults = { theme: 'light', defaultLanguage: 'zh', defaultMode: 'free', defaultTimedMinutes: 1, correctSound: false, incorrectSound: false, autoSave: true, dailyGoalMinutes: 15 }
async function seed(page: Page, settings = defaults, text = 'ABCDEF', language = 'en') {
  await page.addInitScript(({ preferences, content, lang }) => {
    if (!localStorage.getItem('typeflow.settings')) localStorage.setItem('typeflow.settings', JSON.stringify({ version: 1, data: preferences }))
    if (!localStorage.getItem('typeflow.library')) {
      const now = new Date().toISOString()
      localStorage.setItem('typeflow.library', JSON.stringify({ version: 1, data: [{ id: 'custom-preferences', name: '设置测试', language: lang, description: '', difficulty: 'beginner', isDefault: false, createdAt: now, updatedAt: now, articles: [{ id: 'pref-a', title: '设置文章', content, difficulty: 'beginner', createdAt: now, updatedAt: now }] }] }))
    }
  }, { preferences: settings, content: text, lang: language })
}
async function updateInOtherTab(page: Page, patch: Record<string, unknown>) {
  await page.evaluate((changes) => {
    const data = JSON.parse(localStorage.getItem('typeflow.settings')!).data
    localStorage.setItem('typeflow.settings', JSON.stringify({ version: 1, data: { ...data, ...changes } }))
    window.dispatchEvent(new StorageEvent('storage', { key: 'typeflow.settings' }))
  }, patch)
}

test('settings persist and explicit route choices override defaults', async ({ page }) => {
  await page.goto('/#/settings')
  await expect(page.getByRole('checkbox', { name: '正确输入音效', exact: true })).not.toBeChecked()
  await page.getByRole('combobox', { name: '显示模式' }).selectOption('dark')
  await page.getByRole('combobox', { name: '默认训练语言' }).selectOption('en')
  await page.getByRole('combobox', { name: '默认训练模式' }).selectOption('timed')
  await page.getByRole('combobox', { name: '默认限时时长' }).selectOption('3')
  await page.getByRole('checkbox', { name: '自动保存成绩', exact: true }).uncheck()
  await page.reload()
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark')
  await expect(page.getByRole('checkbox', { name: '自动保存成绩', exact: true })).not.toBeChecked()
  await page.getByRole('navigation').getByRole('link', { name: '打字训练', exact: true }).click()
  await expect(page.getByRole('combobox', { name: '训练语言', exact: true })).toHaveValue('en')
  await expect(page.getByRole('combobox', { name: '训练模式', exact: true })).toHaveValue('timed')
  await expect(page.getByRole('combobox', { name: '限时时长' })).toHaveValue('3')
  await page.goto('/#/practice?language=zh&mode=free')
  await expect(page.getByRole('combobox', { name: '训练语言', exact: true })).toHaveValue('zh')
  await expect(page.getByRole('combobox', { name: '训练模式', exact: true })).toHaveValue('free')
})

test('auto-save choice freezes per round and disabled results are never backfilled', async ({ page }) => {
  await seed(page, { ...defaults, autoSave: false })
  await page.clock.install()
  await page.goto('/#/practice?themeId=custom-preferences&articleId=pref-a')
  await page.clock.pauseAt(new Date(await page.evaluate(() => Date.now()) + 1000))
  const input = page.getByRole('textbox', { name: '训练输入' })
  await page.getByRole('button', { name: '开始训练', exact: true }).click()
  await input.pressSequentially('A')
  await updateInOtherTab(page, { autoSave: true, defaultLanguage: 'zh', defaultMode: 'timed' })
  await expect(input).toHaveValue('A')
  await expect(page.getByRole('combobox', { name: '训练模式', exact: true })).toHaveValue('free')
  await page.clock.fastForward(1000)
  await input.pressSequentially('BCDEF')
  await expect(page.getByText('本轮自动保存已关闭，成绩未写入训练记录。', { exact: true })).toBeVisible()
  expect(await page.evaluate(() => localStorage.getItem('typeflow.history'))).toBeNull()
  await updateInOtherTab(page, { autoSave: true })
  expect(await page.evaluate(() => localStorage.getItem('typeflow.history'))).toBeNull()
  await page.getByRole('button', { name: '再练一次', exact: true }).click()
  await page.getByRole('button', { name: '开始训练', exact: true }).click()
  await input.pressSequentially('A'); await page.clock.fastForward(1000); await input.pressSequentially('BCDEF')
  await expect(page.getByText('成绩已保存到训练记录', { exact: true })).toBeVisible()
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem('typeflow.history')!).data.length)).toBe(1)
})

test('sound responds only to enabled formal new input, not IME preview, deletion or paused input', async ({ page }) => {
  await seed(page, { ...defaults, correctSound: true, incorrectSound: true, autoSave: false }, '你好，世界。继续练习。', 'zh')
  await page.addInitScript(() => {
    const tones: number[] = []
    Object.assign(window, { testTones: tones })
    Object.defineProperty(window, 'AudioContext', { value: class {
      state = 'running'; currentTime = 0; destination = {}
      async resume() { this.state = 'running' }
      async close() { this.state = 'closed' }
      createGain() { return { gain: { setValueAtTime() {}, exponentialRampToValueAtTime() {} }, connect() {}, disconnect() {} } }
      createOscillator() { return { frequency: { value: 0 }, type: '', onended: null as (() => void) | null, connect() {}, disconnect() {}, start() { tones.push(this.frequency.value) }, stop() { this.onended?.() } } }
    } })
  })
  const tones = () => page.evaluate(() => (window as unknown as { testTones: number[] }).testTones)
  await page.goto('/#/practice?themeId=custom-preferences&articleId=pref-a')
  await page.getByRole('button', { name: '开始训练', exact: true }).click()
  const input = page.getByRole('textbox', { name: '训练输入' })
  await input.pressSequentially('你')
  await expect.poll(tones).toEqual([660])
  await input.press('Backspace')
  expect(await tones()).toEqual([660])
  await input.evaluate((node: HTMLTextAreaElement) => {
    node.dispatchEvent(new CompositionEvent('compositionstart', { bubbles: true }))
    node.value = 'nihao'
    node.dispatchEvent(new CompositionEvent('compositionupdate', { data: 'nihao', bubbles: true }))
    node.dispatchEvent(new InputEvent('input', { bubbles: true, isComposing: true }))
  })
  expect(await tones()).toEqual([660])
  await input.evaluate((node: HTMLTextAreaElement) => {
    node.value = '你好'
    node.dispatchEvent(new CompositionEvent('compositionend', { bubbles: true, data: '你好' }))
    node.dispatchEvent(new InputEvent('input', { bubbles: true, data: '你好' }))
  })
  await expect.poll(tones).toEqual([660, 660])
  await input.evaluate((node: HTMLTextAreaElement) => {
    node.dispatchEvent(new CompositionEvent('compositionstart', { bubbles: true }))
    node.value = '你好cuo'
    node.dispatchEvent(new CompositionEvent('compositionupdate', { bubbles: true, data: 'cuo' }))
    node.dispatchEvent(new InputEvent('input', { bubbles: true, isComposing: true }))
  })
  expect(await tones()).toEqual([660, 660])
  await input.evaluate((node: HTMLTextAreaElement) => {
    node.value = '你好错'
    node.dispatchEvent(new CompositionEvent('compositionend', { bubbles: true, data: '错' }))
    node.dispatchEvent(new InputEvent('input', { bubbles: true, data: '错' }))
  })
  await expect.poll(tones).toEqual([660, 660, 440])
  await page.getByRole('button', { name: '暂停', exact: true }).click()
  await input.evaluate((node: HTMLTextAreaElement) => { node.value += '坏'; node.dispatchEvent(new InputEvent('input', { bubbles: true })) })
  expect(await tones()).toEqual([660, 660, 440])
  await page.getByRole('button', { name: '继续', exact: true }).click()
  await input.fill('你好，世界。继续练习。')
  await expect(page.locator('[data-training-status]')).toHaveAttribute('data-training-status', 'completed')
  expect(await tones()).toEqual([660, 660, 440])
})

test('dark mode changes colors only and keeps English answer coordinates stable', async ({ page }) => {
  await seed(page)
  await page.goto('/#/practice?language=en')
  const positions = () => page.locator('[data-answer-index]').evaluateAll((nodes) => nodes.map((node) => ({ x: node.getBoundingClientRect().x, y: node.getBoundingClientRect().y, width: node.getBoundingClientRect().width, font: getComputedStyle(node).font })))
  const before = await positions()
  await updateInOtherTab(page, { theme: 'dark' })
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark')
  expect(await positions()).toEqual(before)
  await page.getByRole('button', { name: '开始训练', exact: true }).click()
  await page.getByRole('textbox', { name: '训练输入' }).pressSequentially('X')
  await expect(page.locator('[data-input-index="0"]')).toHaveCSS('color', 'rgb(255, 154, 172)')
  await expect(page.locator('[data-answer-index="1"]')).toHaveCSS('color', 'rgb(181, 179, 201)')
})

test('settings write failure and partial reset are explicit and unrelated keys survive', async ({ page }) => {
  await seed(page)
  await page.addInitScript(() => {
    const remove = Storage.prototype.removeItem
    Storage.prototype.removeItem = function(key) { if (key === 'typeflow.history' && !localStorage.getItem('allow-history-remove')) throw new Error('denied'); return remove.call(this, key) }
  })
  await page.goto('/#/settings')
  await page.evaluate(() => { localStorage.setItem('foreign-app', 'KEEP'); localStorage.setItem('typeflow.history', '{"version":1,"data":[]}') })
  await page.evaluate(() => {
    const write = Storage.prototype.setItem
    Storage.prototype.setItem = function(key, value) { if (key === 'typeflow.settings' && !localStorage.getItem('allow-settings-write')) throw new Error('full'); return write.call(this, key, value) }
  })
  await page.getByRole('combobox', { name: '显示模式' }).selectOption('dark')
  await expect(page.getByRole('alert')).toContainText('设置保存失败')
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'light')
  await page.evaluate(() => localStorage.setItem('allow-settings-write', '1'))

  await page.getByRole('button', { name: '重置本地数据', exact: true }).click()
  await page.getByRole('button', { name: '取消', exact: true }).click()
  expect(await page.evaluate(() => localStorage.getItem('typeflow.library'))).not.toBeNull()
  await page.getByRole('button', { name: '重置本地数据', exact: true }).click()
  await page.getByRole('button', { name: '确认重置', exact: true }).click()
  await expect(page.getByRole('dialog')).toContainText('未能删除：训练历史')
  await expect(page.getByText('字律数据已重置，默认词库已保留。', { exact: true })).toHaveCount(0)
  await page.evaluate(() => localStorage.setItem('allow-history-remove', '1'))
  await page.getByRole('button', { name: '确认重置', exact: true }).click()
  await expect(page.getByText('字律数据已重置，默认词库已保留。', { exact: true })).toBeVisible()
  expect(await page.evaluate(() => localStorage.getItem('foreign-app'))).toBe('KEEP')
  expect(await page.evaluate(() => localStorage.getItem('typeflow.history'))).toBeNull()
  expect(await page.evaluate(() => localStorage.getItem('typeflow.library'))).toBeNull()
  await page.getByRole('navigation').getByRole('link', { name: '词库管理', exact: true }).click()
  await expect(page.locator('.library-card')).toHaveCount(6)
})

for (const correctSound of [false, true]) for (const incorrectSound of [false, true]) {
  test(`independent sound switches: correct=${correctSound}, incorrect=${incorrectSound}`, async ({ page }) => {
    await seed(page, { ...defaults, correctSound, incorrectSound, autoSave: false })
    await page.addInitScript(() => {
      const tones: number[] = []
      Object.assign(window, { testTones: tones })
      Object.defineProperty(window, 'AudioContext', { value: class {
        state = 'suspended'; currentTime = 0; destination = {}
        async resume() { this.state = 'running' }
        async close() { this.state = 'closed' }
        createGain() { return { gain: { setValueAtTime() {}, exponentialRampToValueAtTime() {} }, connect() {}, disconnect() {} } }
        createOscillator() { return { frequency: { value: 0 }, type: '', onended: null as (() => void) | null, connect() {}, disconnect() {}, start() { tones.push(this.frequency.value) }, stop() { this.onended?.() } } }
      } })
    })
    await page.goto('/#/practice?themeId=custom-preferences&articleId=pref-a')
    await page.getByRole('button', { name: '开始训练', exact: true }).click()
    const input = page.getByRole('textbox', { name: '训练输入' })
    await input.pressSequentially('AX')
    const expected = [...(correctSound ? [660] : []), ...(incorrectSound ? [440] : [])]
    await expect.poll(() => page.evaluate(() => (window as unknown as { testTones: number[] }).testTones)).toEqual(expected)
    await input.press('Backspace')
    expect(await page.evaluate(() => (window as unknown as { testTones: number[] }).testTones)).toEqual(expected)
  })
}

test('native Web Audio unlocks from start click and produces an error-tone signal', async ({ page }) => {
  await seed(page, { ...defaults, incorrectSound: true, autoSave: false })
  await page.addInitScript(() => {
    const Native = window.AudioContext
    const probe = { state: '', frequencies: [] as number[], peak: 0 }
    Object.assign(window, { audioProbe: probe })
    Object.defineProperty(window, 'AudioContext', { value: class extends Native {
      constructor() {
        super()
        this.addEventListener('statechange', () => { probe.state = this.state })
      }
      createGain() {
        const gain = super.createGain()
        const analyser = this.createAnalyser()
        gain.connect(analyser)
        const samples = new Float32Array(analyser.fftSize)
        const timer = setInterval(() => {
          analyser.getFloatTimeDomainData(samples)
          for (const value of samples) probe.peak = Math.max(probe.peak, Math.abs(value))
        }, 5)
        setTimeout(() => clearInterval(timer), 1000)
        return gain
      }
      createOscillator() {
        const osc = super.createOscillator()
        const start = osc.start.bind(osc)
        osc.start = (when) => { probe.frequencies.push(osc.frequency.value); start(when) }
        return osc
      }
    } })
  })
  await page.goto('/#/practice?themeId=custom-preferences&articleId=pref-a')
  await page.getByRole('button', { name: '开始训练', exact: true }).click()
  await page.getByRole('textbox', { name: '训练输入' }).pressSequentially('X')
  await expect.poll(() => page.evaluate(() => (window as unknown as { audioProbe: { peak: number } }).audioProbe.peak)).toBeGreaterThan(0.01)
  const probe = await page.evaluate(() => (window as unknown as { audioProbe: { state: string; frequencies: number[] } }).audioProbe)
  expect(probe.state).toBe('running')
  expect(probe.frequencies).toEqual([440])
  await expect(page.getByRole('alert')).toHaveCount(0)
})

test('blocked audio is reported and can be retried without interrupting training', async ({ page }) => {
  await seed(page, { ...defaults, incorrectSound: true, autoSave: false })
  await page.addInitScript(() => {
    Object.assign(window, { allowAudio: false, testTones: [] as number[] })
    Object.defineProperty(window, 'AudioContext', { value: class {
      state = 'suspended'; currentTime = 0; destination = {}
      async resume() {
        if (!(window as unknown as { allowAudio: boolean }).allowAudio) throw new Error('NotAllowedError')
        this.state = 'running'
      }
      async close() { this.state = 'closed' }
      createGain() { return { gain: { setValueAtTime() {}, exponentialRampToValueAtTime() {} }, connect() {}, disconnect() {} } }
      createOscillator() { return { frequency: { value: 0 }, onended: null as (() => void) | null, connect() {}, disconnect() {}, start() { (window as unknown as { testTones: number[] }).testTones.push(this.frequency.value) }, stop() { this.onended?.() } } }
    } })
  })
  await page.goto('/#/practice?themeId=custom-preferences&articleId=pref-a')
  await page.getByRole('button', { name: '开始训练', exact: true }).click()
  await expect(page.getByRole('alert')).toContainText('音效未能播放')
  const input = page.getByRole('textbox', { name: '训练输入' })
  await input.pressSequentially('X')
  await expect(page.getByTestId('training-counts')).toContainText('错误 1')
  await page.evaluate(() => { (window as unknown as { allowAudio: boolean }).allowAudio = true })
  await page.getByRole('button', { name: '重试音效', exact: true }).click()
  await expect(page.getByRole('alert')).toHaveCount(0)
  await input.pressSequentially('Y')
  await expect.poll(() => page.evaluate(() => (window as unknown as { testTones: number[] }).testTones)).toEqual([440])
})
