import { describe, expect, it, vi } from 'vitest'
import { createTonePlayer } from './typingAudio'

describe('audio context lifecycle', () => {
  it('retains an error tone while user-gesture resume is pending', async () => {
    let finish!: () => void
    const start = vi.fn()
    const context = {
      state: 'suspended', currentTime: 0, destination: {},
      resume: vi.fn(() => new Promise<void>(resolve => { finish = () => { context.state = 'running'; resolve() } })),
      createGain: () => ({ gain: { setValueAtTime() {}, exponentialRampToValueAtTime() {} }, connect() {}, disconnect() {} }),
      createOscillator: () => ({ frequency: { value: 0 }, connect() {}, disconnect() {}, start, stop() {} }),
    }
    const player = createTonePlayer(() => context as unknown as AudioContext)
    const unlocking = player.unlock()
    player.play('incorrect')
    expect(start).not.toHaveBeenCalled()
    finish(); await unlocking
    await vi.waitFor(() => expect(start).toHaveBeenCalledOnce())
  })
})

it('reports resume failure instead of silently dropping sound and allows retry', async () => {
  const report = vi.fn()
  const context = { state: 'suspended', resume: vi.fn().mockRejectedValueOnce(new Error('blocked')).mockImplementationOnce(async () => { context.state = 'running' }) }
  const player = createTonePlayer(() => context as unknown as AudioContext, report)
  await player.unlock()
  expect(report).toHaveBeenLastCalledWith(expect.stringContaining('音效未能播放'))
  await player.unlock()
  expect(report).toHaveBeenLastCalledWith(null)
})

it('does not play a delayed tone after pause or disposal', async () => {
  let finish!: () => void
  let running = true
  const start = vi.fn()
  const context = {
    state: 'suspended', currentTime: 0, destination: {}, close: vi.fn(async () => {}),
    resume: vi.fn(() => new Promise<void>(resolve => { finish = () => { context.state = 'running'; resolve() } })),
    createGain: () => ({ gain: { setValueAtTime() {}, exponentialRampToValueAtTime() {} }, connect() {}, disconnect() {} }),
    createOscillator: () => ({ frequency: { value: 0 }, connect() {}, disconnect() {}, start, stop() {} }),
  }
  const player = createTonePlayer(() => context as unknown as AudioContext)
  const unlocking = player.unlock()
  player.play('incorrect', () => running)
  running = false
  finish(); await unlocking; await Promise.resolve()
  expect(start).not.toHaveBeenCalled()
  context.state = 'suspended'
  const second = player.unlock()
  player.play('incorrect')
  player.close(); finish(); await second; await Promise.resolve()
  expect(start).not.toHaveBeenCalled()
})
