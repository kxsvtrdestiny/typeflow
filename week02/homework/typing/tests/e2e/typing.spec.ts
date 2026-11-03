import { test, expect } from '@playwright/test'
import type { Page } from '@playwright/test'

async function fixture(page: Page, text: string, language: 'zh' | 'en' = 'en') {
  await page.addInitScript(({ content, lang }) => {
    const now = new Date().toISOString()
    localStorage.setItem('typeflow.library', JSON.stringify({ version: 1, data: [{
      id: 'custom-fixed', name: '输入测试', description: '', language: lang, difficulty: 'beginner', isDefault: false,
      createdAt: now, updatedAt: now, articles: [
        { id: 'fixed-a', title: '固定文本', content, difficulty: 'beginner', createdAt: now, updatedAt: now },
        { id: 'fixed-b', title: '第二篇', content: '第二篇不同的文章。', difficulty: 'beginner', createdAt: now, updatedAt: now },
      ],
    }] }))
  }, { content: text, lang: language })
  await page.goto('/#/practice?themeId=custom-fixed&articleId=fixed-a')
  await page.getByRole('button', { name: '开始训练', exact: true }).click()
}
async function aligned(page: Page) {
  const pairs = await page.locator('[data-answer-index]').evaluateAll((nodes) => nodes.map((node) => {
    const index = node.getAttribute('data-answer-index')
    const answer = node.getBoundingClientRect()
    const input = document.querySelector(`[data-input-index="${index}"]`)!.getBoundingClientRect()
    return { dx: Math.abs(answer.x - input.x), dy: input.y - answer.y, dw: Math.abs(answer.width - input.width) }
  }))
  const chinese = await page.locator('.typing-viewport').getAttribute('data-language') === 'zh'
  for (const pair of pairs) {
    if (chinese) { expect(pair.dx).toBeLessThan(1); expect(pair.dw).toBeLessThan(1) }
    expect(pair.dy).toBe(38)
  }
  const sameLines = await page.locator('[data-answer-index]').evaluateAll((nodes) => nodes.every((node) => node.parentElement!.parentElement === document.querySelector(`[data-input-index="${node.getAttribute('data-answer-index')}"]`)!.parentElement!.parentElement))
  expect(sameLines).toBe(true)
}

test('English physical keys, strict case, spaces, punctuation, correction, newline and completion', async ({ page }) => {
  await fixture(page, 'Hello world!\nOK')
  const input = page.getByRole('textbox', { name: '训练输入' })
  await input.pressSequentially('hello X', { delay: 10 })
  await expect(page.locator('[data-answer-index="0"]')).toHaveClass(/incorrect/)
  await expect(page.locator('[data-input-index="6"]')).toHaveClass(/incorrect/)
  await input.press('Backspace')
  await expect(page.locator('[data-input-index="6"]')).toHaveClass(/pending/)
  await input.press('ControlOrMeta+Home')
  await input.press('Delete')
  await input.pressSequentially('H')
  await input.press('ControlOrMeta+End')
  await input.pressSequentially('world!')
  await input.press('Enter')
  await input.pressSequentially('OK')
  await expect(page.locator('[data-training-status]')).toHaveAttribute('data-training-status', 'completed')
  await expect(input).toBeDisabled()
  await expect(page.getByTestId('training-counts')).toContainText('正确 15 · 错误 0')
  await aligned(page)
})

test('Chinese input, backspace, rapid input, pause, resume, restart and article switch', async ({ page }) => {
  await fixture(page, '你好，世界。继续练习。', 'zh')
  const input = page.getByRole('textbox', { name: '训练输入' })
  await input.pressSequentially('你错')
  await expect(page.getByTestId('training-counts')).toContainText('错误 1')
  await input.press('Backspace')
  await input.pressSequentially('好，')
  await expect(page.getByTestId('training-counts')).toContainText('正确 3 · 错误 0')
  await page.getByRole('button', { name: '暂停', exact: true }).click()
  await expect(input).toBeDisabled()
  await page.getByRole('button', { name: '继续', exact: true }).click()
  await expect(input).toBeFocused()
  await input.pressSequentially('世界。')
  await page.getByRole('button', { name: '重新开始', exact: true }).click()
  await expect(input).toHaveValue('')
  await expect(page.getByTestId('training-counts')).toContainText('已输入 0')
  await page.getByRole('button', { name: '开始训练', exact: true }).click()
  await input.pressSequentially('你')
  page.once('dialog', (dialog) => dialog.accept())
  await page.getByRole('combobox', { name: '训练文章' }).selectOption('fixed-b')
  await expect(page.getByTestId('training-counts')).toContainText('已输入 0')
  await expect(input).toHaveValue('')
  await expect(page.locator('[data-training-status]')).toHaveAttribute('data-training-status', 'idle')
})

test('simulated Chinese candidate events never judge pinyin or double-submit candidates', async ({ page }) => {
  await fixture(page, '你好，世界。', 'zh')
  const input = page.getByRole('textbox', { name: '训练输入' })
  await input.evaluate((node: HTMLTextAreaElement) => {
    node.dispatchEvent(new CompositionEvent('compositionstart', { bubbles: true }))
    node.value = 'nihao'
    node.dispatchEvent(new CompositionEvent('compositionupdate', { data: 'nihao', bubbles: true }))
    node.dispatchEvent(new InputEvent('input', { data: 'nihao', inputType: 'insertCompositionText', isComposing: true, bubbles: true }))
  })
  await expect(page.getByTestId('training-counts')).toContainText('已输入 0')
  await expect(page.locator('.composition-preview')).toContainText('nihao')
  await expect(page.locator('.typing-cell.incorrect')).toHaveCount(0)
  await input.evaluate((node: HTMLTextAreaElement) => {
    node.value = '你好'
    node.dispatchEvent(new CompositionEvent('compositionend', { data: '你好', bubbles: true }))
    node.dispatchEvent(new InputEvent('input', { data: '你好', inputType: 'insertText', bubbles: true }))
  })
  await expect(page.getByTestId('training-counts')).toContainText('已输入 2 · 正确 2 · 错误 0')
  await input.evaluate((node: HTMLTextAreaElement) => {
    node.dispatchEvent(new CompositionEvent('compositionstart', { bubbles: true }))
    node.value = '你好shijie'
    node.dispatchEvent(new CompositionEvent('compositionupdate', { data: 'shijie', bubbles: true }))
  })
  await page.getByRole('button', { name: '暂停', exact: true }).click()
  await expect(input).toHaveValue('你好')
  await expect(page.locator('.composition-preview')).toHaveCount(0)
  await page.getByRole('button', { name: '继续', exact: true }).click()
  await input.pressSequentially('，世界。')
  await expect(page.getByTestId('training-counts')).toContainText('正确 6 · 错误 0')
})

test('shared wrapping, Unicode slots, scrolling and resizing remain aligned', async ({ page }) => {
  const text = ('Hello 世界，e\u0301 👩‍💻!\nNext line. ').repeat(20)
  await fixture(page, text)
  const input = page.getByRole('textbox', { name: '训练输入' })
  await input.pressSequentially(text.slice(0, 210))
  await aligned(page)
  expect(await page.locator('.typing-viewport').evaluate((node) => node.scrollTop)).toBeGreaterThan(0)
  const cursor = await page.locator('.typing-cell.current').boundingBox()
  const viewport = await page.locator('.typing-viewport').boundingBox()
  expect(cursor!.y).toBeGreaterThanOrEqual(viewport!.y)
  expect(cursor!.y + cursor!.height).toBeLessThanOrEqual(viewport!.y + viewport!.height)
  await page.setViewportSize({ width: 390, height: 844 })
  await aligned(page)
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
  await input.press('Backspace')
  await aligned(page)
})

test('English uses measured proportional widths and normal spaces', async ({ page }) => {
  const text = 'iii WWW Hello, world. Next line!'
  await fixture(page, text, 'en')
  const sizes = await page.locator('[data-answer-index]').evaluateAll((nodes) => nodes.map((node) => node.getBoundingClientRect().width))
  expect(sizes[0]).toBeLessThan(sizes[4] / 2)
  expect(sizes[3]).toBeLessThan(sizes[4])
  const reference = await page.locator('.typing-viewport').evaluate((node, text) => {
    const style = getComputedStyle(node)
    const span = document.createElement('span')
    span.style.cssText = `position:absolute;white-space:pre;font:${style.font};font-kerning:none;font-variant-ligatures:none;letter-spacing:normal`
    span.textContent = text
    node.append(span)
    const width = span.getBoundingClientRect().width
    span.remove()
    const canvas = document.createElement('canvas').getContext('2d')!
    canvas.font = `${style.fontStyle} ${style.fontWeight} ${style.fontSize} ${style.fontFamily}`
    canvas.fontKerning = 'none'
    const overhang = Array.from(new Intl.Segmenter(undefined, { granularity: 'grapheme' }).segment(text), ({ segment }) => {
      const metric = canvas.measureText(segment)
      return Math.max(0, metric.actualBoundingBoxLeft) + Math.max(0, metric.actualBoundingBoxRight - metric.width)
    }).reduce((a, b) => a + b, 0)
    return { width, overhang }
  }, text)
  // Natural advances plus the measured ink safety budget; no arbitrary letter spacing.
  expect(Math.abs(sizes.slice(0, -1).reduce((a, b) => a + b, 0) - reference.width - reference.overhang)).toBeLessThan(1)
  await expect(page.locator('[data-answer-index="3"]')).toHaveText(' ')
  await page.getByRole('textbox', { name: '训练输入' }).pressSequentially('WWW ')
  await expect(page.locator('[data-input-index="0"]')).toHaveClass(/incorrect/)
  expect(await page.locator('[data-input-index="0"]').evaluate((node) => node.getBoundingClientRect().width)).toBeGreaterThan(sizes[0])
  await aligned(page)
  await page.setViewportSize({ width: 390, height: 844 })
  await aligned(page)
})

test('cancelled article switch preserves paused input and repeated controls do not duplicate edits', async ({ page }) => {
  await fixture(page, '你好，世界。继续练习。', 'zh')
  const input = page.getByRole('textbox', { name: '训练输入' })
  await expect(page.locator('[data-answer-index="0"]')).toHaveCSS('width', '32px')
  await input.pressSequentially('你好')
  for (let i = 0; i < 3; i++) {
    await page.getByRole('button', { name: '暂停', exact: true }).click()
    await expect(input).toBeDisabled()
    await page.getByRole('button', { name: '继续', exact: true }).click()
    await expect(input).toHaveValue('你好')
  }
  await page.getByRole('button', { name: '暂停', exact: true }).click()
  page.once('dialog', (dialog) => dialog.dismiss())
  await page.getByRole('combobox', { name: '训练文章' }).selectOption('fixed-b')
  await expect(input).toHaveValue('你好')
  await expect(page.getByRole('combobox', { name: '训练文章' })).toHaveValue('fixed-a')
  await page.getByRole('button', { name: '继续', exact: true }).click()
  await input.pressSequentially('，')
  await expect(page.getByTestId('training-counts')).toContainText('已输入 3 · 正确 3 · 错误 0')
  await aligned(page)
})


test('font readiness and zoom recompute shared English layout', async ({ page }) => {
  await fixture(page, 'iii WWW Hello, natural words and punctuation! '.repeat(12), 'en')
  const before = await page.locator('[data-answer-index="0"]').evaluate((node) => node.getBoundingClientRect().width)
  // Install a locally available font as a delayed FontFace; same lifecycle as web fonts.
  const loaded = await page.evaluate(async () => {
    const face = new FontFace('TypeFlowLayoutTest', 'local("Liberation Serif"), local("DejaVu Serif"), local("Times New Roman")')
    await face.load()
    document.fonts.add(face)
    const style = document.createElement('style')
    style.textContent = '.typing-viewport[data-language="en"] { font-family: TypeFlowLayoutTest, serif; font-size: 23px; }'
    document.head.append(style)
    await document.fonts.ready
    document.fonts.dispatchEvent(new Event('loadingdone'))
    return face.status
  })
  expect(loaded).toBe('loaded')
  await expect.poll(async () => page.locator('[data-answer-index="0"]').evaluate((node) => node.getBoundingClientRect().width)).not.toBe(before)
  await aligned(page)
  await page.evaluate(() => { document.body.style.zoom = '1.25' })
  await expect.poll(async () => page.locator('.typing-cell').first().evaluate((node) => parseFloat(getComputedStyle(node).fontSize))).toBe(23)
  await page.setViewportSize({ width: 900, height: 850 })
  const offsets = await page.locator('[data-answer-index]').evaluateAll((nodes) => nodes.map((node) => {
    const actual = document.querySelector(`[data-input-index="${node.getAttribute('data-answer-index')}"]`)!
    const a = node.getBoundingClientRect(), b = actual.getBoundingClientRect()
    return { dx: Math.abs(a.x - b.x), dw: Math.abs(a.width - b.width), dy: b.y - a.y }
  }))
  for (const offset of offsets) { expect(offset.dy).toBeCloseTo(47.5, 1) }
})

async function sharedGlyphsFit(page: Page) {
  const measurements = await page.locator('[data-input-index]').evaluateAll((nodes) => nodes.map((node) => {
    const index = node.getAttribute('data-input-index')!
    const answer = document.querySelector(`[data-answer-index="${index}"]`)!
    const glyph = node.firstElementChild!
    const style = getComputedStyle(glyph)
    const context = document.createElement('canvas').getContext('2d')!
    context.font = `${style.fontStyle} ${style.fontWeight} ${style.fontSize} ${style.fontFamily}`
    context.fontKerning = 'none'
    const text = glyph.textContent ?? ''
    const metric = context.measureText(text)
    const required = Math.max(metric.width, metric.actualBoundingBoxRight || 0) + Math.max(0, metric.actualBoundingBoxLeft || 0)
    const cell = node.getBoundingClientRect(), top = answer.getBoundingClientRect()
    const next = node.nextElementSibling?.getBoundingClientRect()
    return { gap: next ? next.x - cell.right : 0, required: node.classList.contains('pending') ? 0 : required, width: cell.width, deltaX: Math.abs(cell.x - top.x), deltaW: Math.abs(cell.width - top.width), text }
  }))
  for (const item of measurements) {
    expect(item.width, `actual glyph ${JSON.stringify(item.text)} must fit its own natural slot`).toBeGreaterThanOrEqual(item.required - 0.02)
    expect(item.gap).toBeGreaterThanOrEqual(-0.1)

  }
}

for (const [answer, actual] of [
  ['iiiiiiii', 'oooooooo'],
  ['iiiiiiii', 'WWWWWWWW'],
  ['Hello World', 'MMMM WWWWW'],
  ['Progress often arrives quietly.', 'xxxxxxxxxxxxxxxxxxxxxxxxxxxx'],
  ['i W.!  iW, Aa?', 'W i?!  Wi. aA!'],
]) {
  test(`wide wrong glyphs remain complete: ${actual}`, async ({ page }, testInfo) => {
    await fixture(page, answer, 'en')
    await page.getByRole('textbox', { name: '训练输入' }).pressSequentially(actual)
    await page.screenshot({ path: testInfo.outputPath('glyph-width.png'), fullPage: true })
    await sharedGlyphsFit(page)
    await aligned(page)
  })
}

test('deleting wide errors restores natural widths, colors, caret and shared wraps', async ({ page }) => {
  await fixture(page, ('iiii WWWW, Hello!  ').repeat(15), 'en')
  await page.setViewportSize({ width: 390, height: 844 })
  const input = page.getByRole('textbox', { name: '训练输入' })
  const before = await page.locator('[data-answer-index="0"]').evaluate((node) => node.getBoundingClientRect().width)
  await input.pressSequentially('MMMM WWWWWWWWWWWWWW')
  await sharedGlyphsFit(page)
  await aligned(page)
  for (let i = 0; i < 'MMMM WWWWWWWWWWWWWW'.length; i++) await input.press('Backspace')
  await expect(input).toHaveValue('')
  await expect(page.locator('.typing-cell.incorrect')).toHaveCount(0)
  expect(await page.locator('[data-answer-index="0"]').evaluate((node) => node.getBoundingClientRect().width)).toBeCloseTo(before, 2)
  await input.pressSequentially('iiii WWWW, Hello!  ')
  await expect(page.getByTestId('training-counts')).toContainText('错误 0')
  await sharedGlyphsFit(page)
  await aligned(page)
  await page.evaluate(() => { document.body.style.zoom = '1.25' })
  await page.setViewportSize({ width: 700, height: 900 })
  const samePairs = await page.locator('[data-answer-index]').evaluateAll((nodes) => nodes.every((node) => node.parentElement!.parentElement === document.querySelector(`[data-input-index="${node.getAttribute('data-answer-index')}"]`)!.parentElement!.parentElement))
  expect(samePairs).toBe(true)
  await sharedGlyphsFit(page)
})

test('long runs of expanded wrong glyphs share wrapping and scrolling through zoom and resize', async ({ page }) => {
  await fixture(page, 'i'.repeat(600) + ' End.', 'en')
  await page.setViewportSize({ width: 390, height: 844 })
  const input = page.getByRole('textbox', { name: '训练输入' })
  await input.fill('W'.repeat(300))
  await sharedGlyphsFit(page)
  await aligned(page)
  expect(await page.locator('.typing-viewport').evaluate((node) => node.scrollTop)).toBeGreaterThan(0)
  const viewport = await page.locator('.typing-viewport').boundingBox()
  const caret = await page.locator('.typing-cell.current').boundingBox()
  expect(caret!.y).toBeGreaterThanOrEqual(viewport!.y)
  expect(caret!.y + caret!.height).toBeLessThanOrEqual(viewport!.y + viewport!.height)
  await page.evaluate(() => { document.body.style.zoom = '1.25' })
  await page.setViewportSize({ width: 700, height: 900 })
  await sharedGlyphsFit(page)
  await page.evaluate(() => { document.body.style.zoom = '1' })
  await input.press('Backspace')
  await aligned(page)
  await sharedGlyphsFit(page)
})

async function answerCoordinates(page: Page) {
  return page.locator('[data-answer-index]').evaluateAll((nodes) => {
    const box = document.querySelector('.typing-viewport')! as HTMLElement
    const bounds = box.getBoundingClientRect()
    return nodes.map((node) => {
      const rect = node.getBoundingClientRect()
      return { index: node.getAttribute('data-answer-index'), x: rect.x - bounds.x, row: node.parentElement!.parentElement!.getAttribute('data-row-start'), width: rect.width, y: rect.y - bounds.y + box.scrollTop }
    })
  })
}

for (const width of [390, 768, 1280]) {
  test(`answer coordinates and row boundaries never depend on wrong input at ${width}px`, async ({ page }, testInfo) => {
    await page.setViewportSize({ width, height: 900 })
    await fixture(page, 'Maya found a blue notebook on a park bench.', 'en')
    const initial = await answerCoordinates(page)
    await page.screenshot({ path: testInfo.outputPath('answer-before-input.png'), fullPage: true })
    const input = page.getByRole('textbox', { name: '训练输入' })
    for (const glyph of ['y', 'W', 'i', 'o']) {
      await input.fill(glyph.repeat(16))
      await page.screenshot({ path: testInfo.outputPath(`answer-after-${glyph}.png`), fullPage: true })
      expect(await answerCoordinates(page)).toEqual(initial)
      await sharedGlyphsFit(page)
      await expect(page.getByTestId('training-counts')).toContainText(`错误 ${Array.from('Maya found a blue notebook on a park bench.').slice(0, 16).filter((char) => char !== glyph).length}`)
      for (let i = 0; i < 16; i++) await input.press('Backspace')
      expect(await answerCoordinates(page)).toEqual(initial)
    }
    await input.pressSequentially('Maya found a')
    expect(await answerCoordinates(page)).toEqual(initial)
    await expect(page.getByTestId('training-counts')).toContainText('错误 0')
  })
}
