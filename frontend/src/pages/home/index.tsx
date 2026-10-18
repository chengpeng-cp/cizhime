import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import gsap from 'gsap'
import dayjs from 'dayjs'
import { ArrowRight, Sparkles } from 'lucide-react'
import { VERDICT_TYPES } from '@/types/report'
import { clearHistory, getHistory, type ReportHistoryItem } from '@/utils/reportHistory'

function verdictEmoji(verdict: string) {
  if (verdict === VERDICT_TYPES.RESIGN) return '🏃'
  if (verdict === VERDICT_TYPES.STAY) return '🛡️'
  return '🤔'
}

export default function HomePage() {
  const navigate = useNavigate()
  const root = useRef<HTMLDivElement>(null)
  const [history, setHistory] = useState<ReportHistoryItem[]>(() => getHistory())

  useEffect(() => {
    const ctx = gsap.context(() => {
      const tl = gsap.timeline({ defaults: { ease: 'back.out(1.7)' } })
      tl.fromTo('.hero-badge', { y: 30, opacity: 0 }, { y: 0, opacity: 1, duration: 0.6 })
        .fromTo('.hero-title', { y: 90, opacity: 0 }, { y: 0, opacity: 1, duration: 1 })
        .fromTo('.hero-subtitle', { y: 40, opacity: 0 }, { y: 0, opacity: 1, duration: 0.8 }, '-=0.5')
        .fromTo('.hero-cta', { y: 30, opacity: 0 }, { y: 0, opacity: 1, duration: 0.6 }, '-=0.4')
    }, root)
    return () => ctx.revert()
  }, [])

  // 本地历史报告淡入
  useEffect(() => {
    if (history.length === 0) return
    const ctx = gsap.context(() => {
      gsap.from('.hero-history', { y: 30, opacity: 0, duration: 0.6, delay: 0.3, ease: 'back.out(1.7)' })
    }, root)
    return () => ctx.revert()
  }, [history.length])

  return (
    <div
      ref={root}
      className="relative flex min-h-[calc(100vh-7rem)] flex-col items-center justify-center overflow-hidden rounded-3xl px-2"
    >
      {/* 背景渐变光晕 */}
      <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_top,_rgba(251,191,36,0.18),_transparent_55%)]" />
      <div className="pointer-events-none absolute inset-0 -z-10 dark:bg-gradient-to-b dark:from-slate-900/0 dark:via-slate-900/0 dark:to-slate-950/40" />

      <div className="hero-badge mb-6 inline-flex items-center gap-2 rounded-full border border-amber-400/30 bg-amber-400/10 px-4 py-1.5 text-sm text-amber-600 dark:text-amber-300">
        <Sparkles size={16} />
        <span>AI 辅助辞职决策工具</span>
      </div>

      <h1 className="hero-title text-center text-7xl font-black tracking-tight text-amber-500 dark:text-amber-400 sm:text-8xl">
        辞职么
      </h1>

      <p className="hero-subtitle mt-6 text-center text-lg text-slate-600 dark:text-slate-300 sm:text-2xl">
        AI 帮你分析该不该辞职
      </p>

      <button
        onClick={() => navigate('/survey')}
        className="hero-cta group mt-10 inline-flex items-center gap-2 rounded-full bg-amber-400 px-8 py-4 text-lg font-bold text-slate-900 shadow-lg shadow-amber-400/30 transition-all hover:scale-105 hover:bg-amber-300 active:scale-95"
      >
        开始分析
        <ArrowRight size={20} className="transition-transform group-hover:translate-x-1" />
      </button>

      {/* 本机历史报告（仅存于浏览器 localStorage） */}
      {history.length > 0 && (
        <div className="hero-history mt-12 w-full max-w-md">
          <div className="mb-3 flex items-center justify-between text-sm text-slate-500 dark:text-slate-400">
            <span>📋 最近生成（仅本机可见）</span>
            <button
              onClick={() => {
                clearHistory()
                setHistory([])
              }}
              className="text-xs transition-colors hover:text-amber-500 dark:hover:text-amber-400"
            >
              清除
            </button>
          </div>
          <div className="space-y-2">
            {history.slice(0, 5).map((item) => (
              <button
                key={item.shareCode}
                onClick={() => navigate(`/report/${item.shareCode}`)}
                className="flex w-full items-center justify-between gap-3 rounded-2xl border border-gray-200 bg-white px-4 py-3 text-left shadow-sm transition-all hover:border-amber-400/60 hover:shadow-md dark:border-slate-700 dark:bg-slate-800/60 dark:hover:border-amber-400/40"
              >
                <span className="flex min-w-0 items-center gap-2">
                  <span>{verdictEmoji(item.verdict)}</span>
                  <span className="truncate text-sm font-semibold text-slate-700 dark:text-slate-200">{item.verdict}</span>
                  <span className="text-xs text-slate-400 dark:text-slate-500">{item.shareCode}</span>
                </span>
                <span className="flex-none text-xs text-slate-500 dark:text-slate-400">
                  {item.score} 分 · {dayjs(item.createdAt).format('MM-DD HH:mm')}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
