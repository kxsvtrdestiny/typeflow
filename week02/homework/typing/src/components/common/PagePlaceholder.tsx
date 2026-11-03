import { Layers3 } from 'lucide-react'
import PageHeading from './PageHeading'
interface PagePlaceholderProps { title: string; description?: string }
export default function PagePlaceholder({ title, description = '此页面将在后续阶段逐步完善。' }: PagePlaceholderProps) {
  return <><PageHeading title={title} description={description} /><section className="card empty-state"><span className="empty-icon"><Layers3 size={26} /></span><h2>功能准备中</h2><p>页面框架已就绪，具体功能将在对应开发阶段开放。</p></section></>
}
