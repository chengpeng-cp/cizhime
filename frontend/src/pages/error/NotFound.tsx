import { Link } from 'react-router-dom'
import { ArrowLeft, Compass } from 'lucide-react'

export default function NotFoundPage() {
  return (
    <div className="state-page">
      <div className="state-card">
        <span className="state-icon"><Compass size={23} /></span>
        <h1>这条路暂时还没有答案</h1>
        <p>页面可能已经移动，或者链接不完整。</p>
        <Link className="primary-button" to="/"><ArrowLeft size={16} /> 返回首页</Link>
      </div>
    </div>
  )
}
