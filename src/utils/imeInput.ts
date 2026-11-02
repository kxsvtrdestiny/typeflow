/** Input values, never key names, are the source of truth. */
export function createImeInput(commit: (value: string) => void, preview: (text: string) => void) {
  let composing = false
  let lastValue = ''
  function submit(value: string) {
    if (value === lastValue) return
    lastValue = value
    commit(value)
  }
  return {
    start() { composing = true; preview('') },
    update(text: string) { if (composing) preview(text) },
    input(value: string, isComposing: boolean) {
      if (composing || isComposing) return
      submit(value)
    },
    end(value: string) {
      if (!composing) return
      composing = false
      preview('')
      // Read the browser-owned value at compositionend; trailing input is deduplicated.
      submit(value)
    },
    reset(value: string) { composing = false; lastValue = value; preview('') },
    isComposing: () => composing,
  }
}
