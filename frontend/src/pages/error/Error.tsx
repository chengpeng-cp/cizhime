import { Link } from 'react-router-dom'
import { AlertCircle, ArrowLeft } from 'lucide-react'

export default function ErrorPage() {
  return (
    <div className="state-page">
      <div className="state-card">
        <span className="state-icon"><AlertCircle size={23} /></span>
        <h1>页面暂时出了点问题</h1>
        <p>可以回到首页重新开始，或稍后再试一次。</p>
        <Link className="primary-button" to="/"><ArrowLeft size={16} /> 返回首页</Link>
      </div>
    </div>
  )
}
