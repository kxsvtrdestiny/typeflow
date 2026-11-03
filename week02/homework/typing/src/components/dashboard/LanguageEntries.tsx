import { ArrowUpRight, Languages, Type } from 'lucide-react'
import { Link } from 'react-router-dom'
export default function LanguageEntries() {
  return <section aria-labelledby="language-heading"><div className="section-heading"><h2 id="language-heading">选择你的练习语言</h2></div><div className="language-grid">{[
    { language: 'zh', title: '中文打字', description: '开始中文练习', icon: Languages },
    { language: 'en', title: '英文打字', description: '开始英文练习', icon: Type },
  ].map(({ language, title, description, icon: Icon }) => <Link className="card language-card" to={`/practice?language=${language}`} key={language}><span className="language-icon"><Icon size={27} /></span><div><h3>{title}</h3><p>{description}</p></div><ArrowUpRight className="language-arrow" size={22} /></Link>)}</div></section>
}
