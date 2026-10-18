import { useEffect, useRef, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import gsap from 'gsap'
import { Loader2 } from 'lucide-react'

const MESSAGES = [
  '正在分析你的工作状况...',
  '结合就业市场环境...',
  'AI 正在生成报告...',
  '马上就好...',
]

export default function GeneratingPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const root = useRef<HTMLDivElement>(null)
  const [messageIndex, setMessageIndex] = useState(0)

  const shareCode = (location.state as { shareCode?: string } | null)?.shareCode

  useEffect(() => {
    if (!shareCode) {
      navigate('/', { replace: true })
      return
    }

    const ctx = gsap.context(() => {
      gsap.from('.gen-spinner', { scale: 0.5, opacity: 0, duration: 0.5, ease: 'back.out(1.7)' })
    }, root)

    const msgTimer = window.setInterval(() => {
      setMessageIndex((i) => (i + 1) % MESSAGES.length)
    }, 800)

    const navTimer = window.setTimeout(() => {
      navigate(`/report/${shareCode}`, { replace: true })
    }, 2500)

    return () => {
      window.clearInterval(msgTimer)
      window.clearTimeout(navTimer)
      ctx.revert()
    }
  }, [shareCode, navigate])

  // 文字渐显动画
  useEffect(() => {
    gsap.fromTo('.gen-text', { opacity: 0, y: 10 }, { opacity: 1, y: 0, duration: 0.4 })
  }, [messageIndex])

  if (!shareCode) return null

  return (
    <div
      ref={root}
      className="relative flex min-h-[calc(100vh-7rem)] flex-col items-center justify-center overflow-hidden rounded-3xl"
    >
      <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_center,_rgba(251,191,36,0.15),_transparent_60%)]" />

      <Loader2 className="gen-spinner mb-8 animate-spin text-amber-500 dark:text-amber-400" size={64} />

      <p className="gen-text text-xl text-slate-700 dark:text-slate-200">{MESSAGES[messageIndex]}</p>

      <p className="mt-4 text-sm text-slate-500">AI 正在深度思考，请稍候</p>
    </div>
  )
}
