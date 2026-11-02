import { useState } from 'react'
import { ArrowRight } from 'lucide-react'
import { Link } from 'react-router-dom'
import { recommendedThemes } from '../../data/recommendedThemes'
import type { Language } from '../../types'

const difficultyLabels = { beginner: '入门', intermediate: '进阶', advanced: '挑战' }

export default function ThemeRecommendations() {
  const [language, setLanguage] = useState<Language>('zh')
  const themes = recommendedThemes.filter((theme) => theme.language === language).slice(0, 3)

  return (
    <section aria-labelledby="themes-heading">
      <div className="section-heading">
        <h2 id="themes-heading">主题推荐</h2>
        <Link className="text-link" to="/library">查看全部<ArrowRight size={15} /></Link>
      </div>
      <div className="theme-language-switch" role="group" aria-label="推荐主题语言">
        <button type="button" aria-pressed={language === 'zh'} onClick={() => setLanguage('zh')}>中文</button>
        <button type="button" aria-pressed={language === 'en'} onClick={() => setLanguage('en')}>English</button>
      </div>
      <div className="theme-grid">
        {themes.map((theme) => (
          <Link
            className="card theme-card"
            key={`${theme.language}-${theme.name}`}
            to={`/practice?${new URLSearchParams({ language: theme.language, theme: theme.name })}`}
          >
            <h3>{theme.name}</h3>
            <div className="badge-row">
              <span className="badge">{theme.language === 'zh' ? '中文' : 'English'}</span>
              <span className="badge subtle">{difficultyLabels[theme.difficulty]}</span>
            </div>
          </Link>
        ))}
      </div>
    </section>
  )
}
