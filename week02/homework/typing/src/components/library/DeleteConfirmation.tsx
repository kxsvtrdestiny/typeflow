import { useState } from 'react'
import Modal from '../common/Modal'
interface Props { name: string; onConfirm: () => boolean; onClose: () => void }
export default function DeleteConfirmation({ name, onConfirm, onClose }: Props) {
  const [error, setError] = useState(false)
  return <Modal title="确认删除" onClose={onClose}><p className="delete-message">确定删除「{name}」？此操作无法撤销，删除主题也会删除其中的文章。</p>{error && <p className="form-error" role="alert">删除失败，请检查本地存储状态。</p>}<div className="form-actions"><button className="button secondary" onClick={onClose}>取消</button><button className="button danger" onClick={() => { if (onConfirm()) onClose(); else setError(true) }}>确认删除</button></div></Modal>
}
