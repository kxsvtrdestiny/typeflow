import { act, renderHook } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { useTyping } from './useTyping'

describe('fixed-text session state', () => {
  it('starts explicitly, corrects Chinese mistakes by deletion and preserves positional matching', () => {
    const { result } = renderHook(() => useTyping('你好，世界。'))
    act(() => result.current.commit('你'))
    expect(result.current.session.value).toBe('')
    act(() => result.current.start())
    act(() => result.current.commit('你错，'))
    expect(result.current.correctCharacters).toBe(2)
    expect(result.current.incorrectCharacters).toBe(1)
    act(() => result.current.commit('你'))
    expect(result.current.incorrectCharacters).toBe(0)
    act(() => result.current.commit('你好，'))
    expect(result.current.correctCharacters).toBe(3)
    expect(result.current.submittedCharacters).toBe(3)
  })
  it('pauses, resumes, completes once, rejects post-completion input and resets all data', () => {
    let time = 100
    const clock = vi.spyOn(performance, 'now').mockImplementation(() => time)
    const { result } = renderHook(() => useTyping('Hello world!\nOK'))
    act(() => result.current.start())
    act(() => result.current.commit('Hello '))
    time = 350
    act(() => result.current.pause())
    expect(result.current.elapsedMs()).toBe(250)
    act(() => result.current.commit('BAD'))
    expect(result.current.session.value).toBe('Hello ')
    time = 900
    act(() => result.current.resume())
    time = 1000
    act(() => result.current.commit('Hello world!\nOK'))
    expect(result.current.session.status).toBe('completed')
    expect(result.current.elapsedMs()).toBe(350)
    act(() => result.current.commit('X'))
    expect(result.current.session.value).toBe('Hello world!\nOK')
    act(() => result.current.restart())
    expect(result.current.session).toMatchObject({ status: 'idle', value: '', startedAt: null, accumulatedMs: 0 })
    expect(result.current.progress).toBe(0)
    clock.mockRestore()
  })
  it('accepts fast sequential snapshots and counts all extra submitted characters', () => {
    const { result } = renderHook(() => useTyping('ABC'))
    act(() => { result.current.start(); result.current.commit('A'); result.current.commit('AB'); result.current.commit('ABC多') })
    expect(result.current.correctCharacters).toBe(3)
    expect(result.current.incorrectCharacters).toBe(1)
    expect(result.current.session.status).toBe('completed')
  })
})

describe('stage-five event totals and deadlines', () => {
  it('keeps cumulative errors after correction and resets every counter on restart', () => {
    const { result } = renderHook(() => useTyping('ABCDEF'))
    act(() => { result.current.start(); result.current.commit('AX'); result.current.commit('A'); result.current.commit('AB') })
    expect(result.current.correctCharacters).toBe(2)
    expect(result.current.session).toMatchObject({ totalInputCharacters: 3, totalCorrectInputCharacters: 2 })
    act(() => result.current.restart())
    expect(result.current.session).toMatchObject({ totalInputCharacters: 0, totalCorrectInputCharacters: 0, accumulatedMs: 0, startedAt: null })
  })
  it('checks deadline before admitting input and freezes the final elapsed time', () => {
    let now = 0
    const clock = vi.spyOn(performance, 'now').mockImplementation(() => now)
    const { result } = renderHook(() => useTyping('ABCDEF', 60000))
    act(() => { result.current.start(); result.current.commit('A') })
    now = 60001
    act(() => result.current.commit('ABCDEF'))
    expect(result.current.session).toMatchObject({ status: 'completed', finishReason: 'time-expired', value: 'A', totalInputCharacters: 1 })
    expect(result.current.elapsedMs()).toBe(60000)
    now = 900000
    act(() => { result.current.tick(); result.current.commit('X') })
    expect(result.current.elapsedMs()).toBe(60000)
    expect(result.current.session.totalInputCharacters).toBe(1)
    clock.mockRestore()
  })
  it('does not start the clock until formal text and excludes all paused time', () => {
    let now = 0
    const clock = vi.spyOn(performance, 'now').mockImplementation(() => now)
    const { result } = renderHook(() => useTyping('ABCDEF', 60000))
    act(() => result.current.start())
    now = 90000
    act(() => result.current.tick())
    expect(result.current.elapsedMs()).toBe(0)
    act(() => result.current.commit('A'))
    now = 100000
    act(() => result.current.pause())
    now = 900000
    act(() => { result.current.tick(); result.current.commit('X') })
    expect(result.current.elapsedMs()).toBe(10000)
    act(() => result.current.resume())
    now = 950000
    act(() => result.current.tick())
    expect(result.current.session.finishReason).toBe('time-expired')
    expect(result.current.elapsedMs()).toBe(60000)
    clock.mockRestore()
  })
  it('pauses on window blur and does not resume automatically', () => {
    const { result } = renderHook(() => useTyping('ABCDEF'))
    act(() => { result.current.start(); result.current.commit('A'); window.dispatchEvent(new Event('blur')) })
    expect(result.current.session.status).toBe('paused')
    act(() => window.dispatchEvent(new Event('focus')))
    expect(result.current.session.status).toBe('paused')
  })
})

describe('supported timed durations', () => {
  it.each([60000, 180000, 300000, 600000])('ends exactly at active limit %s', (duration) => {
    let now = 0
    const clock = vi.spyOn(performance, 'now').mockImplementation(() => now)
    const { result } = renderHook(() => useTyping('ABCDEF', duration))
    act(() => { result.current.start(); result.current.commit('A') })
    now = duration - 1
    act(() => result.current.tick())
    expect(result.current.session.status).toBe('running')
    now = duration
    act(() => result.current.tick())
    expect(result.current.session).toMatchObject({ status: 'completed', finishReason: 'time-expired', accumulatedMs: duration })
    clock.mockRestore()
  })
})
