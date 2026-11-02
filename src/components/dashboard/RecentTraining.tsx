import { History, ArrowRight } from 'lucide-react'
import { Link } from 'react-router-dom'
export default function RecentTraining() {
  return <section aria-labelledby="recent-heading"><div className="section-heading"><h2 id="recent-heading">最近训练</h2><Link to="/history" className="text-link">全部记录<ArrowRight size={15} /></Link></div><div className="card recent-empty"><span className="empty-icon"><History size={25} /></span><h3>还没有训练记录</h3><Link className="text-link" to="/practice">前往打字训练<ArrowRight size={15} /></Link></div></section>
}
