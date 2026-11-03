import { test, expect } from '@playwright/test'

test('hash routes survive navigation and refresh; Tailwind styles load', async ({ page }) => {
  await page.goto('/')
  await expect(page).toHaveTitle('字律 TypeRhythm')
  await expect(page.getByRole('heading', { name: '首页' })).toBeVisible()
  await expect(page.getByRole('heading', { name: '首页', level: 1 })).toHaveCSS('font-size', '30px')
  await page.getByRole('link', { name: '打字训练', exact: true }).click()
  await expect(page).toHaveURL(/#\/practice$/)
  await page.reload()
  await expect(page.getByRole('heading', { name: '打字训练' })).toBeVisible()
  await page.goto('/#/library/example')
  await expect(page.getByRole('heading', { name: '词库详情' })).toBeVisible()
  await expect(page.locator('textarea')).toHaveCount(0)
})
