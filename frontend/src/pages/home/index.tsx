import { useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import gsap from 'gsap'
import { ArrowRight, Sparkles, Users } from 'lucide-react'

export default function HomePage() {
  const navigate = useNavigate()
  const root = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const ctx = gsap.context(() => {
      const tl = gsap.timeline({ defaults: { ease: 'back.out(1.7)' } })
      tl.fromTo('.hero-badge', { y: 30, opacity: 0 }, { y: 0, opacity: 1, duration: 0.6 })
        .fromTo('.hero-title', { y: 90, opacity: 0 }, { y: 0, opacity: 1, duration: 1 })
        .fromTo('.hero-subtitle', { y: 40, opacity: 0 }, { y: 0, opacity: 1, duration: 0.8 }, '-=0.5')
        .fromTo('.hero-cta', { y: 30, opacity: 0 }, { y: 0, opacity: 1, duration: 0.6 }, '-=0.4')
        .fromTo('.hero-footer', { opacity: 0 }, { opacity: 1, duration: 0.8 }, '-=0.2')
    }, root)
    return () => ctx.revert()
  }, [])

  return (
    <div
      ref={root}
      className="relative flex min-h-[calc(100vh-7rem)] flex-col items-center justify-center overflow-hidden rounded-3xl"
    >
      {/* 背景渐变光晕 */}
      <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_top,_rgba(251,191,36,0.18),_transparent_55%)]" />
      <div className="pointer-events-none absolute inset-0 -z-10 bg-gradient-to-b from-slate-900/0 via-slate-900/0 to-slate-950/40" />

      <div className="hero-badge mb-6 inline-flex items-center gap-2 rounded-full border border-amber-400/30 bg-amber-400/10 px-4 py-1.5 text-sm text-amber-300">
        <Sparkles size={16} />
        <span>AI 辅助辞职决策工具</span>
      </div>

      <h1 className="hero-title text-center text-7xl font-black tracking-tight text-amber-400 sm:text-8xl">
        辞职么
      </h1>

      <p className="hero-subtitle mt-6 text-center text-lg text-slate-300 sm:text-2xl">
        AI 帮你分析该不该辞职
      </p>

      <button
        onClick={() => navigate('/survey')}
        className="hero-cta group mt-10 inline-flex items-center gap-2 rounded-full bg-amber-400 px-8 py-4 text-lg font-bold text-slate-900 shadow-lg shadow-amber-400/30 transition-all hover:scale-105 hover:bg-amber-300 active:scale-95"
      >
        开始分析
        <ArrowRight size={20} className="transition-transform group-hover:translate-x-1" />
      </button>

      <div className="hero-footer mt-16 flex items-center gap-2 text-sm text-slate-500">
        <Users size={16} />
        <span>已有 13,666 人完成测试</span>
      </div>
    </div>
  )
}
