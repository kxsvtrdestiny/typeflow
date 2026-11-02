import { useEffect, useRef } from 'react'
import type { ReactNode } from 'react'
import { X } from 'lucide-react'
interface Props { title: string; onClose: () => void; children: ReactNode }
export default function Modal({ title, onClose, children }: Props) {
  const ref = useRef<HTMLDialogElement>(null)
  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null
    ref.current?.showModal()
    const overflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = overflow; previous?.focus() }
  }, [])
  return <dialog ref={ref} className="modal" aria-label={title} onCancel={onClose}>
    <div className="modal-heading"><h2>{title}</h2><button type="button" className="icon-button" aria-label="关闭弹窗" onClick={onClose}><X size={20} /></button></div>
    {children}
  </dialog>
}
