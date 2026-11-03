import type { SubmittedEdit } from './typingMetrics'

/** Input values, never key names, are the source of truth. */
export function createImeInput(commit: (value: string, edit?: SubmittedEdit) => void, preview: (text: string) => void) {
  let composing = false
  let lastValue = ''
  let lastEditId: number | undefined
  function submit(value: string, edit?: SubmittedEdit) {
    if (value === lastValue && (edit?.id === undefined || edit.id === lastEditId)) return
    lastEditId = edit?.id
    lastValue = value
    commit(value, edit)
  }
  return {
    start() { composing = true; preview('') },
    update(text: string) { if (composing) preview(text) },
    input(value: string, isComposing: boolean, edit?: SubmittedEdit) {
      if (composing || isComposing) return
      submit(value, edit)
    },
    end(value: string, edit?: SubmittedEdit) {
      if (!composing) return
      composing = false
      preview('')
      // Read the browser-owned value at compositionend; trailing input is deduplicated.
      submit(value, edit)
    },
    reset(value: string) { composing = false; lastValue = value; preview('') },
    isComposing: () => composing,
  }
}
