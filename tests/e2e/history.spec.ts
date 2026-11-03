import { test, expect } from '@playwright/test'
import type { Page } from '@playwright/test'

async function training(page: Page) {
  await page.clock.install()
  await page.addInitScript(() => {
    if (localStorage.getItem('typeflow.library')) return
    const now = new Date().toISOString()
    localStorage.setItem('typeflow.library', JSON.stringify({ version: 1, data: [{ id: 'custom-history', name: '会话主题', description: '', language: 'en', difficulty: 'beginner', isDefault: false, createdAt: now, updatedAt: now, articles: [{ id: 'history-a', title: '会话文章', content: 'ABCDEF', difficulty: 'beginner', createdAt: now, updatedAt: now }] }] }))
  })
  await page.goto('/#/practice?themeId=custom-history&articleId=history-a')
  await page.clock.pauseAt(new Date(await page.evaluate(() => Date.now()) + 1000))
}
async function complete(page: Page) {
  await page.getByRole('button', { name: '开始训练', exact: true }).click()
  const input = page.getByRole('textbox', { name: '训练输入' })
  await input.pressSequentially('A')
  await page.clock.fastForward(1000)
  await input.pressSequentially('BCDEF')
}
async function count(page: Page) { return page.evaluate(() => JSON.parse(localStorage.getItem('typeflow.history') ?? '{"data":[]}').data.length as number) }

test('completed session saves once, refreshes, updates dashboard and survives deleting library snapshots', async ({ page }) => {
  await training(page)
  await complete(page)
  await expect(page.getByText('成绩已保存到训练记录', { exact: true })).toBeVisible()
  expect(await count(page)).toBe(1)
  await page.clock.fastForward(10000)
  expect(await count(page)).toBe(1)
  await page.getByRole('navigation').getByRole('link', { name: '首页', exact: true }).click()
  await expect(page.locator('.stat-card').filter({ hasText: '累计训练次数' })).toContainText('1次')
  await expect(page.locator('.recent-record')).toHaveCount(1)
  await page.getByRole('navigation').getByRole('link', { name: '训练记录', exact: true }).click()
  await expect(page.locator('.history-record')).toHaveCount(1)
  await page.reload()
  await expect(page.locator('.history-record')).toHaveCount(1)
  await page.getByRole('navigation').getByRole('link', { name: '词库管理', exact: true }).click()
  await page.getByRole('button', { name: 'English', exact: true }).click()
  await page.getByRole('button', { name: '删除会话主题', exact: true }).click()
  await page.getByRole('button', { name: '确认删除', exact: true }).click()
  await page.getByRole('navigation').getByRole('link', { name: '训练记录', exact: true }).click()
  await page.getByRole('button', { name: '查看会话文章详情', exact: true }).click()
  await expect(page.getByRole('dialog')).toContainText('会话主题')
  await expect(page.getByRole('dialog')).toContainText('会话文章')
  await page.getByRole('button', { name: '关闭', exact: true }).click()
  await page.getByRole('button', { name: '删除会话文章记录', exact: true }).click()
  await page.getByRole('button', { name: '取消', exact: true }).click()
  expect(await count(page)).toBe(1)
  await page.getByRole('button', { name: '删除会话文章记录', exact: true }).click()
  await page.getByRole('button', { name: '确认删除', exact: true }).click()
  await expect(page.getByRole('heading', { name: '暂无匹配记录' })).toBeVisible()
  await page.getByRole('navigation').getByRole('link', { name: '首页', exact: true }).click()
  await expect(page.locator('.stat-card').filter({ hasText: '累计训练次数' })).toContainText('0次')
  await expect(page.getByText('还没有训练记录', { exact: true })).toBeVisible()
})

test('timed expiration saves once while pause, restart, refresh and abandoning never save', async ({ page }) => {
  await training(page)
  await page.getByRole('button', { name: '开始训练', exact: true }).click()
  await page.getByRole('textbox', { name: '训练输入' }).pressSequentially('A')
  page.once('dialog', (dialog) => dialog.accept())
  await page.reload()
  expect(await count(page)).toBe(0)
  await expect(page.locator('[data-training-status]')).toHaveAttribute('data-training-status', 'idle')
  await page.getByRole('button', { name: '开始训练', exact: true }).click()
  await page.getByRole('textbox', { name: '训练输入' }).pressSequentially('A')
  await page.getByRole('button', { name: '暂停', exact: true }).click()
  expect(await count(page)).toBe(0)
  await page.getByRole('button', { name: '重新开始', exact: true }).click()
  expect(await count(page)).toBe(0)
  await page.getByRole('button', { name: '开始训练', exact: true }).click()
  await page.getByRole('textbox', { name: '训练输入' }).pressSequentially('A')
  page.once('dialog', (dialog) => dialog.accept())
  await page.getByRole('navigation').getByRole('link', { name: '首页', exact: true }).click()
  expect(await count(page)).toBe(0)
  await page.reload()
  expect(await count(page)).toBe(0)
  await page.goto('/#/practice?themeId=custom-history&articleId=history-a')
  await page.getByRole('combobox', { name: '训练模式', exact: true }).selectOption('timed')
  await page.getByRole('button', { name: '开始训练', exact: true }).click()
  await page.getByRole('textbox', { name: '训练输入' }).pressSequentially('A')
  await page.clock.fastForward(60000)
  await expect(page.getByText('成绩已保存到训练记录', { exact: true })).toBeVisible()
  expect(await count(page)).toBe(1)
  const saved = await page.evaluate(() => JSON.parse(localStorage.getItem('typeflow.history')!).data[0])
  expect(saved.finishReason).toBe('time-expired')
  expect(saved.metrics.elapsedMs).toBe(60000)
  expect(saved.value).toBeUndefined()
})

test('filters, sorted trends with separated units, details and clear confirmation', async ({ page }) => {
  await page.addInitScript(() => {
    const make = (id: string, language: string, mode: string, completedAt: string, accuracy: number, speed: number) => ({
      id, themeId: 'snapshot', themeName: '快照主题', articleId: id, articleTitle: `文章${id}`, language, mode, timedMinutes: 1,
      startedAt: '2026-11-03T00:00:00.000Z', completedAt, finishReason: mode === 'timed' ? 'time-expired' : 'article-completed',
      metrics: { cpm: speed, wpm: speed / 5, accuracy, cumulativeAccuracy: accuracy, elapsedMs: 60000, correctCharacters: accuracy, incorrectCharacters: 100 - accuracy, submittedCharacters: 100, totalInputCharacters: 100, totalCorrectInputCharacters: accuracy, progress: 1 },
    })
    localStorage.setItem('typeflow.history', JSON.stringify({ version: 1, data: [
      make('middle', 'en', 'timed', '2026-11-03T00:02:00.000Z', 80, 200),
      make('new', 'zh', 'free', '2026-11-03T00:03:00.000Z', 100, 120),
      make('old', 'en', 'free', '2026-11-03T00:01:00.000Z', 60, 150),
    ] }))
  })
  await page.goto('/#/history')
  await expect(page.locator('.history-summary')).toContainText('80.0%')
  await expect(page.locator('.history-record').first()).toContainText('文章new')
  await page.getByRole('combobox', { name: '日期排序' }).selectOption('oldest')
  await expect(page.locator('.history-record').first()).toContainText('文章old')
  await page.getByRole('button', { name: 'English WPM', exact: true }).click()
  await expect(page.locator('[data-trend-unit]')).toHaveAttribute('data-trend-unit', 'WPM')
  await expect(page.locator('[data-record-ids]')).toHaveAttribute('data-record-ids', 'old,middle')
  await page.locator('.recharts-dot').first().hover()
  await expect(page.locator('.recharts-tooltip-wrapper')).toContainText('WPM')
  await page.setViewportSize({ width: 390, height: 844 })
  await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(390)
  await page.getByRole('combobox', { name: '语言', exact: true }).selectOption('en')
  await page.getByRole('combobox', { name: '训练模式', exact: true }).selectOption('timed')
  await expect(page.locator('.history-record')).toHaveCount(1)
  await expect(page.locator('.history-record')).toContainText('文章middle')
  await expect(page.locator('[data-record-ids]')).toHaveAttribute('data-record-ids', 'middle')
  await page.getByRole('button', { name: '清空记录', exact: true }).click()
  await page.getByRole('button', { name: '取消', exact: true }).click()
  await expect(page.locator('.history-record')).toHaveCount(1)
  await page.getByRole('button', { name: '清空记录', exact: true }).click()
  await page.getByRole('button', { name: '确认删除', exact: true }).click()
  await expect(page.locator('.history-summary')).toContainText('0次')
  await expect(page.locator('.history-chart-empty')).toContainText('暂无英文')
})

test('failed save is explicit, leaves no fake success, and retries the same session once', async ({ page }) => {
  await page.addInitScript(() => {
    const write = Storage.prototype.setItem
    Storage.prototype.setItem = function(key, value) {
      if (key === 'typeflow.history' && !localStorage.getItem('history-test-enable')) throw new DOMException('full', 'QuotaExceededError')
      return write.call(this, key, value)
    }
  })
  await training(page)
  await complete(page)
  await expect(page.getByRole('alert')).toContainText('成绩未保存')
  expect(await count(page)).toBe(0)
  await expect(page.getByText('成绩已保存到训练记录', { exact: true })).toHaveCount(0)
  await page.evaluate(() => localStorage.setItem('history-test-enable', '1'))
  await page.getByRole('button', { name: '重试保存', exact: true }).click()
  await expect(page.getByText('成绩已保存到训练记录', { exact: true })).toBeVisible()
  expect(await count(page)).toBe(1)
})

test('corrupted history is preserved and mobile history can explicitly reset it', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.addInitScript(() => { if (!localStorage.getItem('typeflow.history')) localStorage.setItem('typeflow.history', '{broken') })
  await page.goto('/#/history')
  await expect(page.getByRole('alert')).toContainText('原始数据已保留')
  expect(await page.evaluate(() => localStorage.getItem('typeflow.history'))).toBe('{broken')
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
  await page.getByRole('button', { name: '清空记录', exact: true }).click()
  await page.getByRole('button', { name: '确认删除', exact: true }).click()
  await expect(page.getByRole('alert')).toHaveCount(0)
  await expect(page.getByRole('heading', { name: '暂无匹配记录' })).toBeVisible()
})
