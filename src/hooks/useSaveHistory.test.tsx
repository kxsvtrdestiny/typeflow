import { StrictMode } from 'react'
import { act, renderHook } from '@testing-library/react'
import { beforeEach, expect, it } from 'vitest'
import { useSaveHistory } from './useSaveHistory'
import { useHistoryStore } from '../stores/useHistoryStore'
import { historyFixture } from '../test/historyFixtures'

beforeEach(() => { localStorage.clear(); useHistoryStore.setState({ records: [], error: null, blocked: false }) })
it('saves once under StrictMode and repeated result renders, and never saves unfinished state', () => {
  const outcome = historyFixture()
  const { rerender } = renderHook(({ result }) => useSaveHistory('one-attempt', result), { initialProps: { result: null as ReturnType<typeof historyFixture> | null }, wrapper: StrictMode })
  expect(useHistoryStore.getState().records).toHaveLength(0)
  rerender({ result: outcome })
  rerender({ result: { ...outcome } })
  expect(useHistoryStore.getState().records).toHaveLength(1)
  rerender({ result: null })
  expect(useHistoryStore.getState().records).toHaveLength(1)
})
it('does not resurrect a deleted record on an unchanged completed screen', () => {
  const outcome = historyFixture()
  const { rerender } = renderHook(({ result }) => useSaveHistory('one-attempt', result), { initialProps: { result: outcome } })
  act(() => { useHistoryStore.getState().clear() })
  rerender({ result: outcome })
  expect(useHistoryStore.getState().records).toHaveLength(0)
})

it('never backfills an outcome completed with auto-save disabled', () => {
  const outcome = historyFixture()
  const { result, rerender } = renderHook(({ enabled }) => useSaveHistory('disabled-attempt', outcome, enabled), { initialProps: { enabled: false } })
  expect(result.current.status).toBe('disabled')
  expect(useHistoryStore.getState().records).toHaveLength(0)
  rerender({ enabled: true })
  expect(result.current.status).toBe('disabled')
  expect(useHistoryStore.getState().records).toHaveLength(0)
})
