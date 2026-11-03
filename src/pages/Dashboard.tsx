import { ArrowRight, Keyboard } from 'lucide-react'
import { Link } from 'react-router-dom'
import PageHeading from '../components/common/PageHeading'
import HistoryStorageNotice from '../components/history/HistoryStorageNotice'
import DailyGoal from '../components/dashboard/DailyGoal'
import StatsOverview from '../components/dashboard/StatsOverview'
import LanguageEntries from '../components/dashboard/LanguageEntries'
import ThemeRecommendations from '../components/dashboard/ThemeRecommendations'
import RecentTraining from '../components/dashboard/RecentTraining'
export default function Dashboard() {
  return <div className="dashboard"><PageHeading title="首页" /><section className="welcome-card"><div><h2>你好，欢迎来到字律</h2><Link className="button primary" to="/practice">开始练习<ArrowRight size={17} /></Link></div><div className="welcome-symbol" aria-hidden="true"><Keyboard size={40} strokeWidth={1.3} /></div></section><HistoryStorageNotice /><StatsOverview /><DailyGoal /><LanguageEntries /><ThemeRecommendations /><RecentTraining /></div>
}
