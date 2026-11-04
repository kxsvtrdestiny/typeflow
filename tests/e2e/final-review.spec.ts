import { test, expect } from '@playwright/test'
import type { Page } from '@playwright/test'
async function seed(page: Page, theme: 'light' | 'dark') {
  await page.addInitScript(theme => {
    const date = new Date().toISOString()
    if (!localStorage.getItem('typeflow.settings')) localStorage.setItem('typeflow.settings', JSON.stringify({ version: 2, data: { theme, defaultLanguage: 'en', defaultMode: 'free', defaultTimedMinutes: 1, correctSound: false, incorrectSound: false, autoSave: true, dailyGoalMinutes: 20 } }))
    if (!localStorage.getItem('typeflow.library')) localStorage.setItem('typeflow.library', JSON.stringify({ version: 1, data: [{ id: 'custom-final', name: 'L'.repeat(80), language: 'en', description: 'Final responsive review', difficulty: 'beginner', isDefault: false, createdAt: date, updatedAt: date, articles: [{ id: 'final-a', title: 'W'.repeat(120), content: 'ABCD', difficulty: 'beginner', createdAt: date, updatedAt: date }] }] }))
  }, theme)
}
async function noOverflow(page: Page) {
  const overflow = await page.evaluate(() => ({ url: location.hash, width: innerWidth, scrollWidth: document.documentElement.scrollWidth,
    elements: [...document.querySelectorAll('main *')].filter(node => node.getBoundingClientRect().right > innerWidth + 1).slice(0, 5).map(node => ({ tag: node.tagName, className: node.className, right: node.getBoundingClientRect().right })) }))
  expect(overflow.scrollWidth, JSON.stringify(overflow)).toBeLessThanOrEqual(overflow.width)
}
for (const width of [1440, 768, 390]) for (const theme of ['light', 'dark'] as const) {
  test(`final responsive review: ${width}px ${theme}, long titles, article editor and result`, async ({ page }) => {
    await page.setViewportSize({ width, height: 1000 })
    await seed(page, theme)
    const errors: string[] = []
    page.on('pageerror', error => errors.push(error.message))
    page.on('console', message => { if (message.type() === 'error') errors.push(message.text()) })
    for (const route of ['/', '/library', '/history', '/settings', '/practice', '/library/custom-final']) {
      await page.goto('/#' + route)
      await page.getByRole('heading', { level: 1 }).waitFor()
      await noOverflow(page)
      await expect(page.locator('html')).toHaveAttribute('data-theme', theme)
    }
    await page.getByRole('button', { name: /^编辑W/ }).click()
    const dialog = page.getByRole('dialog')
    await expect(dialog).toBeVisible()
    await noOverflow(page)
    const bounds = await dialog.boundingBox()
    expect(Math.abs(bounds!.x + bounds!.width / 2 - width / 2)).toBeLessThanOrEqual(2)
    await page.getByRole('button', { name: '取消', exact: true }).click()
    await page.getByRole('link', { name: '开始练习', exact: true }).click()
    await page.getByRole('button', { name: '开始训练', exact: true }).click()
    await page.getByRole('textbox', { name: '训练输入' }).pressSequentially('ABCD', { delay: 30 })
    await page.getByRole('heading', { name: '训练结果', exact: true }).waitFor()
    await noOverflow(page)
    expect(errors).toEqual([])
  })
}
