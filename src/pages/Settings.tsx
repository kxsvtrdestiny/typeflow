import { useState } from 'react'
import PageHeading from '../components/common/PageHeading'
import ResetDataDialog from '../components/common/ResetDataDialog'
import { useSettingsStore } from '../stores/useSettingsStore'
import type { UserSettings } from '../types'
export default function Settings() {
  const { settings, update, error, blocked, reload } = useSettingsStore()
  const [resetting, setResetting] = useState(false)
  const [message, setMessage] = useState('')
  const change = (patch: Partial<UserSettings>) => { setMessage(''); update(patch) }
  return <div className="settings-page"><PageHeading title="设置" />
    {error && <div role="alert" className="storage-notice"><p>{error}</p><button className="button secondary" onClick={reload}>重试读取设置</button></div>}
    <section className="card settings-group"><h2>外观</h2><label>显示模式<select disabled={blocked} value={settings.theme} onChange={(event) => change({ theme: event.target.value as UserSettings['theme'] })}><option value="light">浅色</option><option value="dark">深色</option></select></label></section>
    <section className="card settings-group"><h2>训练偏好</h2><p className="muted small">新一轮生效；入口中明确指定的选项优先。</p><label>默认训练语言<select disabled={blocked} value={settings.defaultLanguage} onChange={(event) => change({ defaultLanguage: event.target.value as UserSettings['defaultLanguage'] })}><option value="zh">中文</option><option value="en">English</option></select></label><label>默认训练模式<select disabled={blocked} value={settings.defaultMode} onChange={(event) => change({ defaultMode: event.target.value as UserSettings['defaultMode'] })}><option value="free">自由训练</option><option value="timed">限时训练</option></select></label><label>默认限时时长<select disabled={blocked} value={settings.defaultTimedMinutes} onChange={(event) => change({ defaultTimedMinutes: Number(event.target.value) as UserSettings['defaultTimedMinutes'] })}>{[1, 3, 5, 10].map((value) => <option key={value} value={value}>{value} 分钟</option>)}</select></label></section>
    <section className="card settings-group"><h2>音效与成绩</h2><label>正确输入音效<input type="checkbox" disabled={blocked} checked={settings.correctSound} onChange={(event) => change({ correctSound: event.target.checked })} /></label><label>错误输入音效<input type="checkbox" disabled={blocked} checked={settings.incorrectSound} onChange={(event) => change({ incorrectSound: event.target.checked })} /></label><label>自动保存成绩<input type="checkbox" disabled={blocked} checked={settings.autoSave} onChange={(event) => change({ autoSave: event.target.checked })} /></label><p className="muted small">关闭后，新的训练仍显示结果，但不写入历史，也不补存旧成绩。已有历史保留。</p></section>
    <section className="card settings-group"><h2>本地数据</h2><div><button className="button danger" onClick={() => { setMessage(''); setResetting(true) }}>重置本地数据</button></div>{message && <p role="status" className="muted small">{message}</p>}</section>
    {resetting && <ResetDataDialog onClose={() => setResetting(false)} onSuccess={() => { setResetting(false); setMessage('TypeFlow 数据已重置，默认词库已保留。') }} />}
  </div>
}
