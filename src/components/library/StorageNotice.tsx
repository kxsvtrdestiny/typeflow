import { useLibraryStore } from '../../stores/useLibraryStore'
export default function StorageNotice() {
  const error = useLibraryStore((s) => s.error)
  const retryRead = useLibraryStore((s) => s.retryRead)
  return error ? <div role="alert" className="storage-notice"><p>{error}</p><button className="button secondary" onClick={retryRead}>重试读取</button></div> : null
}
