import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it } from 'vitest'
import App from './App'

describe('route skeleton', () => {
  it.each([
    ['/', '首页'], ['/practice', '打字训练'], ['/library', '词库管理'],
    ['/library/example', '词库详情'], ['/history', '训练记录'],
    ['/settings', '设置'], ['/unknown', '页面未找到'],
  ])('renders %s', (path, title) => {
    render(<MemoryRouter initialEntries={[path]}><App /></MemoryRouter>)
    expect(screen.getByRole('heading', { name: title, level: 1 })).toBeInTheDocument()
  })

  it('navigates through the app without a full reload', async () => {
    const user = userEvent.setup()
    render(<MemoryRouter><App /></MemoryRouter>)
    await user.click(screen.getByRole('link', { name: '设置' }))
    expect(screen.getByRole('heading', { name: '设置' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: '设置' })).toHaveAttribute('aria-current', 'page')
  })
})
