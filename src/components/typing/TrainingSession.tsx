import { useEffect, useMemo, useState } from 'react'
import { Play, Pause, RotateCcw } from 'lucide-react'
import type { Language, TimedMinutes, TrainingArticle, TrainingMode, TrainingOutcome } from '../../types'
import { useTyping } from '../../hooks/useTyping'
import TypingArea from './TypingArea'
import { useTimer } from '../../hooks/useTimer'
import { calculateMetrics } from '../../utils/typingMetrics'
import { useTypingSounds } from '../../hooks/useTypingSounds'
import { useSettingsStore } from '../../stores/useSettingsStore'
import { useSaveHistory } from '../../hooks/useSaveHistory'
import TrainingStats from './TrainingStats'
import TrainingResult from './TrainingResult'
interface Props { initialMode?: TrainingMode; initialMinutes?: TimedMinutes; article: TrainingArticle; language: Language; themeId: string; themeName: string }
export default function TrainingSession({ article, language, themeId, themeName, initialMode, initialMinutes }: Props) {
  const [snapshot] = useState(article.content)
  const [preferences, setPreferences] = useState(() => ({ ...useSettingsStore.getState().settings }))
  const [mode, setMode] = useState<TrainingMode>(initialMode ?? preferences.defaultMode)
  const [minutes, setMinutes] = useState<TimedMinutes>(initialMinutes ?? preferences.defaultTimedMinutes)
  const limitMs = mode === 'timed' ? minutes * 60000 : undefined
  const typing = useTyping(snapshot, limitMs)
  const [attemptId, setAttemptId] = useState(() => crypto.randomUUID())
  const [revision, setRevision] = useState(0)
  const { session } = typing
  const elapsed = useTimer(session.status, typing.elapsedMs, typing.tick)
  const metrics = calculateMetrics(typing.correctCharacters, typing.submittedCharacters, session.totalInputCharacters, session.totalCorrectInputCharacters, elapsed, typing.expected.length)
  const result = useMemo<TrainingOutcome | null>(() => session.status === 'completed' ? {
    articleId: article.id, articleTitle: article.title, themeId, themeName, language, mode, timedMinutes: minutes,
    startedAt: session.startedAt, completedAt: session.completedAt!, finishReason: session.finishReason!,
    metrics: calculateMetrics(typing.correctCharacters, typing.submittedCharacters, session.totalInputCharacters, session.totalCorrectInputCharacters, session.accumulatedMs, typing.expected.length),
  } : null, [session, article.id, article.title, themeId, themeName, language, mode, minutes, typing.correctCharacters, typing.submittedCharacters, typing.expected.length])
  const sounds = useTypingSounds(attemptId, session, preferences)
  function startTraining() {
    const next = { ...useSettingsStore.getState().settings }
    setPreferences(next); sounds.unlock(next.correctSound || next.incorrectSound); typing.start()
  }
  const saved = useSaveHistory(attemptId, result, preferences.autoSave)
  function restart() { setPreferences({ ...useSettingsStore.getState().settings }); setAttemptId(crypto.randomUUID()); typing.restart(); setRevision((value) => value + 1) }
  function changeMode(next: TrainingMode, duration = minutes) {
    if ((session.status === 'running' || session.status === 'paused') && !window.confirm('更改训练模式将放弃当前训练，确定继续吗？')) return
    restart(); setMode(next); setMinutes(duration)
  }
  useEffect(() => {
    if (session.status !== 'running' && session.status !== 'paused') return
    const guard = (event: MouseEvent) => {
      const link = (event.target as HTMLElement).closest('a')
      if (!link || link.getAttribute('href')?.startsWith('#main-content')) return
      if (!window.confirm('当前练习尚未完成，确定离开并丢弃输入吗？')) { event.preventDefault(); event.stopPropagation() }
    }
    const unload = (event: BeforeUnloadEvent) => { event.preventDefault() }
    document.addEventListener('click', guard, true)
    window.addEventListener('beforeunload', unload)
    return () => { document.removeEventListener('click', guard, true); window.removeEventListener('beforeunload', unload) }
  }, [session.status])
  const labels = { idle: '准备开始', running: '练习中', paused: '已暂停', completed: '已完成' }
  return <section data-training-status={session.status} className="card training-session" aria-label="打字练习区域">
    <div className="training-mode-controls"><label>训练模式<select value={mode} onChange={(event) => changeMode(event.target.value as TrainingMode)}><option value="free">自由训练</option><option value="timed">限时训练</option></select></label>{mode === 'timed' && <label>限时时长<select value={minutes} onChange={(event) => changeMode(mode, Number(event.target.value) as TimedMinutes)}>{[1, 3, 5, 10].map((value) => <option key={value} value={value}>{value} 分钟</option>)}</select></label>}</div>
    <TrainingStats language={language} metrics={metrics} remainingMs={limitMs === undefined ? undefined : Math.max(0, limitMs - elapsed)} />
    <div className="training-toolbar"><span role="status">{labels[session.status]}</span><div className="training-controls">
      {session.status === 'idle' && <button className="button primary" onClick={startTraining}><Play size={16} />开始训练</button>}
      {session.status === 'running' && <button className="button secondary" onPointerDown={(event) => event.preventDefault()} onClick={typing.pause}><Pause size={16} />暂停</button>}
      {session.status === 'paused' && <button className="button primary" onClick={() => { sounds.unlock(); typing.resume() }}><Play size={16} />继续</button>}
      <button className="button secondary" onPointerDown={(event) => event.preventDefault()} onClick={restart}><RotateCcw size={16} />重新开始</button>
    </div></div>
    {sounds.error && <div role="alert" className="history-save-status"><span>{sounds.error}</span><button className="button secondary" onClick={() => sounds.unlock()}>重试音效</button></div>}
    <TypingArea language={language} key={revision} slots={typing.slots} value={session.value} status={session.status} onCommit={typing.commit} />
    <div className="training-progress" data-testid="training-counts"><label htmlFor="training-progress">训练进度 {Math.round(typing.progress * 100)}%</label><span>已输入 {typing.submittedCharacters} · 正确 {typing.correctCharacters} · 错误 {typing.incorrectCharacters}</span></div>
    <progress id="training-progress" max={1} value={typing.progress} />
    {result && <div className="history-save-status" role={saved.status === 'failed' ? 'alert' : 'status'}>
      {(saved.status === 'saved' || saved.status === 'duplicate') && <span>成绩已保存到训练记录</span>}
      {saved.status === 'disabled' && <span>本轮自动保存已关闭，成绩未写入训练记录。</span>}
      {saved.status === 'invalid' && <span>有效时间或输入不足，本次不保存训练记录。</span>}
      {saved.status === 'failed' && <><span>成绩未保存。{saved.error ?? '请检查本地存储。'}离开页面会丢失本次待保存成绩。</span><button className="button secondary" onClick={saved.retry}>重试保存</button></>}
    </div>}
    {result && <TrainingResult result={result} onRetry={restart} />}
  </section>
}
