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
