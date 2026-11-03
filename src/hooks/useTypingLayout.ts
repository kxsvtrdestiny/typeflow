import { useLayoutEffect, useMemo, useState } from 'react'
import type { RefObject } from 'react'
import type { Language } from '../types'
import { layoutRows } from '../utils/typingCharacters'
import type { CharacterSlot } from '../utils/typingCharacters'
import { actualWidths, layoutNaturalRows, naturalWidths } from '../utils/naturalTextLayout'

export function useTypingLayout(language: Language, slots: CharacterSlot[], container: RefObject<HTMLDivElement | null>) {
  const [measurement, setMeasurement] = useState({ available: 640, font: '', revision: 0 })
  useLayoutEffect(() => {
    const element = container.current
    if (!element) return
    let disposed = false
    const measure = () => {
      if (disposed) return
      const style = getComputedStyle(element)
      const available = Math.max(1, element.clientWidth - parseFloat(style.paddingLeft || '0') - parseFloat(style.paddingRight || '0'))
      const font = `${style.fontStyle} ${style.fontWeight} ${style.fontSize} ${style.fontFamily}`
      setMeasurement((previous) => ({ available, font, revision: previous.revision + 1 }))
    }
    measure()
    const observer = new ResizeObserver(measure)
    observer.observe(element)
    window.addEventListener('resize', measure)
    document.fonts?.addEventListener('loadingdone', measure)
    void document.fonts?.ready.then(measure)
    return () => { disposed = true; observer.disconnect(); window.removeEventListener('resize', measure); document.fonts?.removeEventListener('loadingdone', measure) }
  }, [container, language])

  return useMemo(() => {
    if (language === 'zh') return { rows: layoutRows(slots, Math.max(1, Math.floor(measurement.available / 32))), widths: slots.map(() => 32), inputWidths: slots.map(() => 32), inkInsets: new Map<string, number>() }
    const canvas = document.createElement('canvas')
    const context = canvas.getContext('2d')
    if (context) { context.font = measurement.font; context.fontKerning = 'none' }
    // Range fallback also measures the real font; there is no fixed-width English fallback.
    const probe = context ? null : document.createElement('span')
    if (probe) { probe.style.cssText = `position:absolute;visibility:hidden;white-space:pre;font:${measurement.font};font-kerning:none;font-variant-ligatures:none;letter-spacing:normal`; document.body.append(probe) }
    const cache = new Map<string, number>()
    const inkInsets = new Map<string, number>()
    const measureGlyph = (text: string) => {
      const cached = cache.get(text)
      if (cached !== undefined) return cached
      if (probe) probe.textContent = text
      const metrics = context?.measureText(text)
      // Advance width alone may omit ink overhang (e.g. j). Reserve it and offset ink.
      const left = Math.max(0, metrics?.actualBoundingBoxLeft ?? 0)
      const measured = metrics ? left + Math.max(metrics.width, metrics.actualBoundingBoxRight ?? 0) : probe!.getBoundingClientRect().width
      // Round UP to CSS layout precision, never floor away part of the glyph.
      const width = Math.ceil(measured * 64) / 64
      inkInsets.set(text, left)
      cache.set(text, width)
      return width
    }
    const widths = naturalWidths(slots, measureGlyph)
    const inputWidths = actualWidths(slots, measureGlyph)
    // Freeze line membership from the answer. Extra submitted graphemes join its last line.
    const answerSlots = slots.filter((slot) => slot.expected !== undefined)
    const rows = layoutNaturalRows(answerSlots, widths, measurement.available)
    if (!rows.length) rows.push([])
    rows[rows.length - 1].push(...slots.slice(answerSlots.length))
    probe?.remove()
    return { widths, inputWidths, inkInsets, rows }
  }, [language, slots, measurement])
}
