import type { Difficulty, Language } from '../types'
export interface RecommendedTheme { name: string; language: Language; difficulty: Difficulty; description: string }
/** Theme recommendations only; training articles are added in stage 3. */
export const recommendedThemes: RecommendedTheme[] = [
  { name: '中国文学', language: 'zh', difficulty: 'intermediate', description: '在文字与意境之间，感受中文的表达之美。' },
  { name: '名言警句', language: 'zh', difficulty: 'beginner', description: '从简洁有力的句子开始，积累输入手感。' },
  { name: '日常生活', language: 'zh', difficulty: 'beginner', description: '熟悉生活中的表达，让日常输入更顺畅。' },
  { name: '科技知识', language: 'zh', difficulty: 'advanced', description: '练习科技相关词句，拓展输入的熟悉度。' },
  { name: '新闻时事', language: 'zh', difficulty: 'advanced', description: '通过资讯类表达，练习长句与标点输入。' },
  { name: '学习成长', language: 'zh', difficulty: 'intermediate', description: '用有关学习的文字，陪伴每一次进步。' },
  { name: 'Daily Life', language: 'en', difficulty: 'beginner', description: '从日常英语开始，建立稳定的英文输入节奏。' },
  { name: 'Famous Quotes', language: 'en', difficulty: 'beginner', description: '练习经典短句，熟悉大小写与英文标点。' },
  { name: 'English Stories', language: 'en', difficulty: 'intermediate', description: '跟随故事段落，逐步提升连续输入能力。' },
  { name: 'Technology', language: 'en', difficulty: 'advanced', description: '接触科技词汇，练习更丰富的英文表达。' },
  { name: 'Business English', language: 'en', difficulty: 'intermediate', description: '熟悉工作场景下的常见英语句式。' },
  { name: 'Academic English', language: 'en', difficulty: 'advanced', description: '通过学术表达，挑战长词与复杂句子。' },
]
