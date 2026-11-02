import { useEffect, useState } from 'react'
import { Play, Pause, RotateCcw } from 'lucide-react'
import type { Language, TrainingArticle } from '../../types'
import { useTyping } from '../../hooks/useTyping'
import TypingArea from './TypingArea'
interface Props { article: TrainingArticle; language: Language }
export default function TrainingSession({ article, language }: Props) {
  const [snapshot] = useState(article.content)
  const typing = useTyping(snapshot)
  const [revision, setRevision] = useState(0)
  const { session } = typing
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
    <div className="training-toolbar"><span role="status">{labels[session.status]}</span><div className="training-controls">
      {session.status === 'idle' && <button className="button primary" onClick={typing.start}><Play size={16} />开始训练</button>}
      {session.status === 'running' && <button className="button secondary" onPointerDown={(event) => event.preventDefault()} onClick={typing.pause}><Pause size={16} />暂停</button>}
      {session.status === 'paused' && <button className="button primary" onClick={typing.resume}><Play size={16} />继续</button>}
      <button className="button secondary" onPointerDown={(event) => event.preventDefault()} onClick={() => { typing.restart(); setRevision((v) => v + 1) }}><RotateCcw size={16} />重新开始</button>
    </div></div>
    <TypingArea language={language} key={revision} slots={typing.slots} value={session.value} status={session.status} onCommit={typing.commit} />
    <div className="training-progress" data-testid="training-counts"><label htmlFor="training-progress">训练进度 {Math.round(typing.progress * 100)}%</label><span>已输入 {typing.submittedCharacters} · 正确 {typing.correctCharacters} · 错误 {typing.incorrectCharacters}</span></div>
    <progress id="training-progress" max={1} value={typing.progress} />
    {session.status === 'completed' && <p className="training-complete" role="status">本篇练习已完成。可重新开始，或更换文章继续练习。</p>}
  </section>
}
