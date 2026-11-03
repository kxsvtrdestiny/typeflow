export type ToneKind = 'correct' | 'incorrect'
export function selectTypingTone(total: number, correct: number, correctEnabled: boolean, errorEnabled: boolean): ToneKind | null {
  if (total <= 0) return null
  if (total > correct && errorEnabled) return 'incorrect'
  return correct > 0 && correctEnabled ? 'correct' : null
}
export function createTonePlayer(factory: () => AudioContext = () => new AudioContext(), report: (error: string | null) => void = () => {}) {
  let context: AudioContext | null = null
  let resuming: Promise<void> | null = null
  let generation = 0
  const failure = () => report('音效未能播放，请检查浏览器声音权限或站点静音设置，然后重试音效。')
  async function unlock() {
    try {
      context ??= factory()
      const active = context
      if (active.state !== 'running') {
        if (!resuming) {
          // resume must be invoked inside the start/resume user gesture.
          const resumed = active.resume()
          resuming = new Promise<void>((resolve, reject) => {
            const timeout = setTimeout(() => reject(new Error('Audio resume timed out')), 2000)
            resumed.then(resolve, reject).finally(() => clearTimeout(timeout))
          }).finally(() => { resuming = null })
        }
        await resuming
      }
      if (context !== active) return
      if (active.state !== 'running') throw new Error('Audio is not running')
      report(null)
    } catch { failure() }
  }
  function render(kind: ToneKind) {
    if (!context || context.state !== 'running') return
    try {
      const oscillator = context.createOscillator(), gain = context.createGain(), now = context.currentTime
      oscillator.type = 'sine'; oscillator.frequency.value = kind === 'correct' ? 660 : 440
      gain.gain.setValueAtTime(0.0001, now); gain.gain.exponentialRampToValueAtTime(0.08, now + 0.008); gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.095)
      oscillator.connect(gain); gain.connect(context.destination)
      oscillator.onended = () => { oscillator.disconnect(); gain.disconnect() }
      oscillator.start(now); oscillator.stop(now + 0.1)
    } catch { failure() }
  }
  return {
    unlock,
    play(kind: ToneKind, stillValid = () => true) {
      if (!context) return
      if (context.state === 'running') { if (stillValid()) render(kind); return }
      const requestedGeneration = generation
      void unlock().then(() => {
        if (generation === requestedGeneration && stillValid()) render(kind)
      })
    },
    close() { generation++; try { void context?.close().catch(() => {}) } catch { /* Audio cleanup is non-fatal. */ } context = null },
  }
}
