import { useState } from 'react'
import Modal from './Modal'
interface Props { title: string; message: string; onConfirm: () => boolean; onClose: () => void }
export default function ConfirmDialog({ title, message, onConfirm, onClose }: Props) {
  const [error, setError] = useState(false)
  return <Modal title={title} onClose={onClose}><p className="delete-message">{message}</p>{error && <p role="alert" className="form-error">未能保存删除操作，请检查浏览器存储后重试。</p>}<div className="form-actions"><button className="button secondary" onClick={onClose}>取消</button><button className="button danger" onClick={() => { if (onConfirm()) onClose(); else setError(true) }}>确认删除</button></div></Modal>
}
