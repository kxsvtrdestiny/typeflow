import { useEffect, useState } from 'react'
import { useSettingsStore } from '../../stores/useSettingsStore'
export default function DailyGoalSetting() {
  const goal = useSettingsStore(state => state.settings.dailyGoalMinutes)
  const blocked = useSettingsStore(state => state.blocked)
  const update = useSettingsStore(state => state.update)
  const [draft, setDraft] = useState(String(goal))
  const [saved, setSaved] = useState(false)
  useEffect(() => { setDraft(String(goal)) }, [goal])
  return <section className="card settings-group" id="daily-goal"><h2>每日目标</h2>
    <form className="daily-goal-form" onSubmit={event => { event.preventDefault(); if (update({ dailyGoalMinutes: Number(draft) })) setSaved(true) }}>
      <label>每日训练目标（分钟）<input type="number" min={1} max={1440} step={1} required disabled={blocked} value={draft} onChange={event => { setDraft(event.target.value); setSaved(false) }} /></label>
      <div><button className="button secondary" disabled={blocked}>保存目标</button>{saved && <span role="status" className="muted small">已保存</span>}</div>
    </form>
  </section>
}
