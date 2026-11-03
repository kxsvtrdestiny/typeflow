import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { createImeInput } from '../../utils/imeInput'
import { offsetToIndex, visibleCharacter } from '../../utils/typingCharacters'
import type { CharacterSlot } from '../../utils/typingCharacters'
import { measurementText } from '../../utils/naturalTextLayout'
import { useTypingLayout } from '../../hooks/useTypingLayout'
import type { Language, TrainingStatus } from '../../types'

interface Props { language: Language; slots: CharacterSlot[]; value: string; status: TrainingStatus; onCommit: (value: string) => void }
export default function TypingArea({ language, slots, value, status, onCommit }: Props) {
  const container = useRef<HTMLDivElement>(null)
  const input = useRef<HTMLTextAreaElement>(null)
  const cursor = useRef<HTMLSpanElement>(null)
  const [caret, setCaret] = useState(0)
  const [preview, setPreview] = useState('')
  const [anchor, setAnchor] = useState({ left: 0, top: 0 })
  const commitRef = useRef(onCommit)
  commitRef.current = onCommit
  const ime = useMemo(() => createImeInput((text) => commitRef.current(text), setPreview), [])
  const { rows, widths, inputWidths, inkInsets } = useTypingLayout(language, slots, container)
  const enabled = status === 'running'

  useLayoutEffect(() => {
    if (!input.current || (enabled && ime.isComposing())) return
    if (input.current.value !== value) input.current.value = value
    if (!enabled) {
      ime.reset(value)
      setCaret(offsetToIndex(value, input.current.selectionStart))
    }
  }, [enabled, ime, value])
  useEffect(() => {
    if (enabled) input.current?.focus({ preventScroll: true })
  }, [enabled])
  useLayoutEffect(() => {
    const cell = cursor.current, box = container.current
    if (!cell || !box) return
    const row = cell.parentElement?.parentElement
    if (row && enabled) {
      // Row offsets are relative to typing-lines; include its viewport padding.
      const padding = parseFloat(getComputedStyle(box).paddingTop) || 0
      const top = row.offsetTop + (row.parentElement?.offsetTop ?? 0)
      if (top < box.scrollTop + padding) box.scrollTop = Math.max(0, top - padding)
      else if (top + row.offsetHeight > box.scrollTop + box.clientHeight - padding) box.scrollTop = top + row.offsetHeight - box.clientHeight + padding
    }
    const line = cell.parentElement!
    if (language === 'en') {
      if (cell.offsetLeft < line.scrollLeft) line.scrollLeft = cell.offsetLeft
      else if (cell.offsetLeft + cell.offsetWidth > line.scrollLeft + line.clientWidth) line.scrollLeft = cell.offsetLeft + cell.offsetWidth - line.clientWidth
    }
    positionAnchor()
  }, [caret, rows, enabled, preview])
  useEffect(() => () => ime.reset(''), [ime])

  function positionAnchor() {
    const cell = cursor.current
    if (!cell) return
    const line = cell.parentElement!
    setAnchor({ left: cell.offsetLeft - line.scrollLeft, top: line.offsetTop + line.parentElement!.offsetTop })
  }
  function selection() {
    if (!ime.isComposing() && input.current) setCaret(offsetToIndex(input.current.value, input.current.selectionStart))
  }
  function restore() {
    if (input.current) { input.current.value = value; ime.reset(value) }
  }
  return <>
    <div className="typing-legend"><span>标准答案 / 实际输入</span><span><i className="legend-correct" />正确 <i className="legend-error" />错误 <i className="legend-current" />当前位置</span></div>
    <div className="typing-viewport" data-language={language} ref={container} onClick={() => { if (enabled) input.current?.focus({ preventScroll: true }) }}>
      <div className="typing-lines" aria-hidden="true">
        {rows.map((row) => <div className="typing-pair" data-row-start={row[0].index} key={row[0].index}>
          <div className="typing-row answer-row">{row.map((slot) => <span key={slot.index} style={{ width: widths[slot.index], flexBasis: widths[slot.index] }} data-answer-index={slot.index} className={`typing-cell ${slot.status}`}><span style={{ marginLeft: inkInsets.get(measurementText(slot.expected)) ?? 0 }} className={slot.expected === ' ' ? 'space-marker' : undefined}>{language === 'en' && slot.expected === ' ' ? ' ' : visibleCharacter(slot.expected)}</span></span>)}</div>
          <div className="typing-row input-row" onScroll={positionAnchor}>{row.map((slot) => <span ref={slot.index === caret ? cursor : undefined} key={slot.index} style={{ width: inputWidths[slot.index] || (slot.index === caret ? 2 : 0), flexBasis: inputWidths[slot.index] || (slot.index === caret ? 2 : 0) }} data-input-index={slot.index} className={`typing-cell ${slot.status} ${slot.index === caret ? 'current' : ''}`}><span style={{ marginLeft: inkInsets.get(measurementText(slot.actual)) ?? 0 }} className={slot.actual === ' ' ? 'space-marker' : undefined}>{language === 'en' && slot.actual === ' ' ? ' ' : visibleCharacter(slot.actual)}</span></span>)}</div>
        </div>)}
      </div>
      <textarea
        ref={input} aria-label="训练输入" aria-describedby="typing-help" className="native-typing-input"
        style={{ left: anchor.left, top: anchor.top, width: inputWidths[caret] || 2 }} disabled={!enabled} defaultValue={value}
        wrap="off" spellCheck={false} autoComplete="off" autoCorrect="off" autoCapitalize="off"
        onCompositionStart={() => { if (enabled) ime.start() }}
        onCompositionUpdate={(event) => { if (enabled) ime.update(event.data) }}
        onCompositionEnd={(event) => { if (enabled) { ime.end(event.currentTarget.value); setCaret(offsetToIndex(event.currentTarget.value, event.currentTarget.selectionStart)) } else restore() }}
        onInput={(event) => {
          if (!enabled) { restore(); return }
          ime.input(event.currentTarget.value, (event.nativeEvent as InputEvent).isComposing)
          selection()
        }}
        onChange={(event) => {
          if (!enabled) { restore(); return }
          ime.input(event.currentTarget.value, (event.nativeEvent as InputEvent).isComposing)
          selection()
        }}
        onSelect={selection}
        onBeforeInput={(event) => {
          const kind = (event.nativeEvent as InputEvent).inputType
          if (!enabled || kind === 'insertFromPaste' || kind === 'insertFromDrop') event.preventDefault()
        }}
        onPaste={(event) => event.preventDefault()} onDrop={(event) => event.preventDefault()}
      />
    </div>
    <div className="typing-help" id="typing-help">{preview ? <span className="composition-preview">正在组字：{preview}（未提交）</span> : `${language === 'zh' ? '空格显示为 ·，' : ''}换行显示为 ↵。${language === 'en' ? '上下按字符索引对应；宽错字行可横向滚动。' : ''}严格逐位置匹配，可使用退格、方向键和选区编辑。练习区不支持粘贴。`}</div>
  </>
}
