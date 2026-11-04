import { useHistoryStore } from '../../stores/useHistoryStore'
export default function HistoryStorageNotice() {
  const error = useHistoryStore((state) => state.error)
  const reload = useHistoryStore((state) => state.reload)
  return error ? <div className="storage-notice" role="alert"><p>{error}</p><button className="button secondary" onClick={reload}>重试读取历史</button></div> : null
}
