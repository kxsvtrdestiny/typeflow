export type ToneKind = 'correct' | 'incorrect'
export function selectTypingTone(total: number, correct: number, correctEnabled: boolean, errorEnabled: boolean): ToneKind | null {
  if (total <= 0) return null
  if (total > correct && errorEnabled) return 'incorrect'
  return correct > 0 && correctEnabled ? 'correct' : null
}
export function createTonePlayer(factory: () => AudioContext = () => new AudioContext()) {
  let context: AudioContext | null = null
  return {
    async unlock() { try { context ??= factory(); if (context.state === 'suspended') await context.resume() } catch { /* Audio never blocks training. */ } },
    play(kind: ToneKind) {
      if (!context || context.state !== 'running') return
      try {
        const oscillator = context.createOscillator(), gain = context.createGain(), now = context.currentTime
        oscillator.type = 'sine'; oscillator.frequency.value = kind === 'correct' ? 660 : 220
        gain.gain.setValueAtTime(0.0001, now); gain.gain.exponentialRampToValueAtTime(0.025, now + 0.005); gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.065)
        oscillator.connect(gain); gain.connect(context.destination)
        oscillator.onended = () => { oscillator.disconnect(); gain.disconnect() }
        oscillator.start(now); oscillator.stop(now + 0.07)
      } catch { /* Unsupported or interrupted audio is non-fatal. */ }
    },
    close() { try { void context?.close().catch(() => {}) } catch { /* No-op. */ } context = null },
  }
}
