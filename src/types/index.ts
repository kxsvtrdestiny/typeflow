/** Shared domain contracts; business behavior is implemented in later stages. */
export type Language = 'zh' | 'en'
export type Difficulty = 'beginner' | 'intermediate' | 'advanced'
export type TrainingMode = 'free' | 'timed'
export type TimedMinutes = 1 | 3 | 5 | 10
export type TrainingStatus = 'idle' | 'running' | 'paused' | 'completed'
export type ThemeMode = 'light' | 'dark'
export type CharacterStatus = 'pending' | 'correct' | 'incorrect'

export interface TrainingArticle {
  difficulty: Difficulty
  id: string
  title: string
  content: string
  createdAt: string
  updatedAt: string
}

export interface LibraryTheme {
  id: string
  name: string
  language: Language
  description: string
  difficulty: Difficulty
  isDefault: boolean
  articles: TrainingArticle[]
  createdAt: string
  updatedAt: string
}

export interface TrainingConfig {
  themeId: string
  articleId: string
  language: Language
  mode: TrainingMode
  timedMinutes: TimedMinutes
}

export interface TypingMetrics {
  submittedCharacters: number
  correctCharacters: number
  incorrectCharacters: number
  correctHanCharacters: number
  elapsedMs: number
  accuracy: number | null
  progress: number
  cpm: number
  grossWpm: number
  netWpm: number
}

export interface CharacterError {
  expected: string | null
  actual: string
  count: number
}

export interface TrainingRecord {
  id: string
  config: TrainingConfig
  themeName: string
  articleTitle: string
  startedAt: string
  completedAt: string
  finishReason: 'article-completed' | 'time-expired'
  metrics: TypingMetrics
  errors: CharacterError[]
  /** Local calendar date (YYYY-MM-DD) to active milliseconds. */
  activeMsByDate: Record<string, number>
}

export interface UserSettings {
  theme: ThemeMode
  defaultLanguage: Language
  defaultTimedMinutes: TimedMinutes
  correctSound: boolean
  incorrectSound: boolean
  autoSave: boolean
  dailyGoalMinutes: number
}

export interface PersistedData<T> {
  version: number
  data: T
}
