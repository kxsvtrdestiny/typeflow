import { useState } from 'react'
import Modal from './Modal'
import { resetTypeflowData } from '../../utils/resetData'
export default function ResetDataDialog({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
  const [report, setReport] = useState<ReturnType<typeof resetTypeflowData> | null>(null)
  return <Modal title="重置 TypeFlow 数据" onClose={onClose}><p className="delete-message">将删除自定义主题及文章、训练历史和设置，无法撤销。内置词库和其他应用数据保留。</p>{report && <p role="alert" className="form-error">仅重置了：{report.cleared.join('、') || '无'}。未能删除：{report.failed.join('、')}。部分数据仍保留，请重试。</p>}<div className="form-actions"><button className="button secondary" onClick={onClose}>取消</button><button className="button danger" onClick={() => { const result = resetTypeflowData(); if (result.failed.length) setReport(result); else onSuccess() }}>确认重置</button></div></Modal>
}
