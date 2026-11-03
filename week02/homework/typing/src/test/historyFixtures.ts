import type { TrainingOutcome } from '../types'
export function historyFixture(overrides: Partial<TrainingOutcome> = {}): TrainingOutcome {
  return {
    themeId: 'fixture-theme', themeName: '测试主题', articleId: 'fixture-article', articleTitle: '测试文章',
    language: 'zh', mode: 'free', timedMinutes: 1,
    startedAt: '2026-11-03T00:00:00.000Z', completedAt: '2026-11-03T00:01:00.000Z', finishReason: 'article-completed',
    metrics: { cpm: 120.5, wpm: 24.1, accuracy: 80, cumulativeAccuracy: 75, correctCharacters: 80, incorrectCharacters: 20, submittedCharacters: 100, totalInputCharacters: 120, totalCorrectInputCharacters: 90, elapsedMs: 60000, progress: 1 },
    ...overrides,
  }
}
