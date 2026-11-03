import { Check, Target } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useHistoryStore } from '../../stores/useHistoryStore'
import { useSettingsStore } from '../../stores/useSettingsStore'
import { useLocalDate } from '../../hooks/useLocalDate'
import { dailyGoal } from '../../utils/trainingInsights'
export default function DailyGoal() {
  const records = useHistoryStore(state => state.records)
  const minutes = useSettingsStore(state => state.settings.dailyGoalMinutes)
  const goal = dailyGoal(records, minutes, useLocalDate())
  return <section className="card daily-goal" aria-label="每日训练目标" data-goal-complete={goal.completed}>
    <div className="goal-label">{goal.completed ? <Check size={18} /> : <Target size={18} />}<strong>{goal.completed ? '今日目标已达成' : '今日目标'}</strong><span className="muted small" data-testid="daily-goal-time">{(goal.elapsedMs / 60000).toFixed(1)} / {minutes} 分钟</span></div>
    <div className="goal-progress"><progress aria-label="每日目标完成进度" max={100} value={goal.percent} /><span>{Math.floor(goal.percent)}%</span></div><Link to="/settings" className="text-link small">修改目标</Link>
  </section>
}
