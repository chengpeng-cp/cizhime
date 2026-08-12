import { useEffect, useRef, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import gsap from 'gsap'
import { Copy, Share2, Check, AlertCircle, RotateCcw } from 'lucide-react'
import { getReport } from '@/services/report'
import { VERDICT_TYPES, type ReportResponse } from '@/types/report'

interface VerdictStyle {
  color: string
  ring: string
  bg: string
  border: string
  emoji: string
}

function getVerdictStyle(verdict: string): VerdictStyle {
  if (verdict === VERDICT_TYPES.RESIGN) {
    return { color: 'text-red-400', ring: 'stroke-red-400', bg: 'bg-red-500/10', border: 'border-red-500/30', emoji: '🏃' }
  }
  if (verdict === VERDICT_TYPES.STAY) {
    return { color: 'text-green-400', ring: 'stroke-green-400', bg: 'bg-green-500/10', border: 'border-green-500/30', emoji: '🛡️' }
  }
  return { color: 'text-amber-400', ring: 'stroke-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/30', emoji: '🤔' }
}

function getScoreColor(score: number) {
  if (score >= 70) return { text: 'text-red-400', ring: 'stroke-red-400' }
  if (score >= 40) return { text: 'text-amber-400', ring: 'stroke-amber-400' }
  return { text: 'text-green-400', ring: 'stroke-green-400' }
}

const RADIUS = 70
const CIRCUMFERENCE = 2 * Math.PI * RADIUS

export default function ReportPage() {
  const { shareCode } = useParams<{ shareCode: string }>()
  const navigate = useNavigate()
  const root = useRef<HTMLDivElement>(null)
  const scoreRef = useRef<HTMLSpanElement>(null)
  const circleRef = useRef<SVGCircleElement>(null)
  const [report, setReport] = useState<ReportResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [copied, setCopied] = useState(false)

  // 加载报告数据
  useEffect(() => {
    if (!shareCode) {
      setError('缺少分享码')
      setLoading(false)
      return
    }
    let cancelled = false
    getReport(shareCode)
      .then((res) => {
        if (!cancelled) setReport(res)
      })
      .catch(() => {
        if (!cancelled) setError('报告加载失败，请稍后重试')
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [shareCode])

  // 报告动画：score 仪表盘 + 卡片依次淡入
  useEffect(() => {
    if (!report) return
    const ctx = gsap.context(() => {
      // 数字滚动
      const obj = { val: 0 }
      gsap.to(obj, {
        val: report.score,
        duration: 1.5,
        ease: 'power2.out',
        onUpdate: () => {
          if (scoreRef.current) scoreRef.current.textContent = Math.round(obj.val).toString()
        },
      })
      // 仪表盘圆环
      if (circleRef.current) {
        gsap.fromTo(
          circleRef.current,
          { strokeDashoffset: CIRCUMFERENCE },
          {
            strokeDashoffset: CIRCUMFERENCE - (report.score / 100) * CIRCUMFERENCE,
            duration: 1.5,
            ease: 'power2.out',
          }
        )
      }
      // 卡片依次淡入
      gsap.from('.report-card', {
        y: 30,
        opacity: 0,
        duration: 0.5,
        stagger: 0.12,
        ease: 'power2.out',
      })
    }, root)
    return () => ctx.revert()
  }, [report])

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 2000)
    } catch {
      // 忽略剪贴板错误
    }
  }

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({ title: '我的辞职分析报告', url: window.location.href })
      } catch {
        // 用户取消分享
      }
    } else {
      handleCopy()
    }
  }

  // 加载中骨架屏
  if (loading) {
    return (
      <div className="mx-auto max-w-2xl py-8">
        <div className="mb-8 h-40 animate-pulse rounded-3xl bg-slate-800" />
        <div className="mb-4 h-6 w-2/3 animate-pulse rounded-full bg-slate-800" />
        <div className="mb-8 h-40 animate-pulse rounded-3xl bg-slate-800" />
        <div className="mb-4 h-6 w-1/2 animate-pulse rounded-full bg-slate-800" />
        <div className="mb-8 h-32 animate-pulse rounded-3xl bg-slate-800" />
      </div>
    )
  }

  // 错误或无数据
  if (error || !report) {
    return (
      <div className="mx-auto flex max-w-2xl flex-col items-center justify-center py-20 text-center">
        <AlertCircle size={48} className="mb-4 text-red-400" />
        <p className="text-lg text-slate-300">{error || '报告不存在'}</p>
      </div>
    )
  }

  const verdictStyle = getVerdictStyle(report.verdict)
  const scoreColor = getScoreColor(report.score)

  const analysisItems = [
    { label: '💰 收入', value: report.analysis.income },
    { label: '🔥 工作量', value: report.analysis.workload },
    { label: '🏢 环境', value: report.analysis.environment },
    { label: '🚀 成长', value: report.analysis.growth },
  ]

  return (
    <div ref={root} className="mx-auto max-w-2xl pb-8">
      {/* 顶部：判定结果 + 辞职指数仪表盘 */}
      <div
        className={`report-card mb-6 rounded-3xl border p-6 text-center shadow-xl sm:p-8 ${verdictStyle.border} ${verdictStyle.bg}`}
      >
        <div className="mb-4 text-5xl">{verdictStyle.emoji}</div>
        <p className="text-sm text-slate-400">AI 判定结果</p>
        <h1 className={`mt-1 text-3xl font-black sm:text-4xl ${verdictStyle.color}`}>{report.verdict}</h1>

        {/* 仪表盘 */}
        <div className="relative mx-auto mt-8 h-44 w-44">
          <svg width="176" height="176" viewBox="0 0 176 176" className="h-full w-full">
            <circle cx="88" cy="88" r={RADIUS} fill="none" strokeWidth="12" className="stroke-slate-700" />
            <circle
              ref={circleRef}
              cx="88"
              cy="88"
              r={RADIUS}
              fill="none"
              strokeWidth="12"
              strokeLinecap="round"
              className={scoreColor.ring}
              strokeDasharray={CIRCUMFERENCE}
              strokeDashoffset={CIRCUMFERENCE}
              transform="rotate(-90 88 88)"
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span ref={scoreRef} className={`text-5xl font-black ${scoreColor.text}`}>0</span>
            <span className="text-xs text-slate-400">辞职指数</span>
          </div>
        </div>

        <p className="mt-6 text-lg text-slate-200">{report.summary}</p>
      </div>

      {/* 亮点区域 */}
      {report.highlights.length > 0 && (
        <div className="report-card mb-6 rounded-3xl border border-green-500/30 bg-green-500/5 p-6 shadow-xl">
          <h2 className="mb-4 flex items-center gap-2 text-xl font-bold text-green-400">
            <span>✨</span> 亮点
          </h2>
          <ul className="space-y-2">
            {report.highlights.map((item, i) => (
              <li key={i} className="flex items-start gap-2 text-slate-200">
                <span className="mt-0.5 text-green-400">+</span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* 槽点区域 */}
      {report.warnings.length > 0 && (
        <div className="report-card mb-6 rounded-3xl border border-red-500/30 bg-red-500/5 p-6 shadow-xl">
          <h2 className="mb-4 flex items-center gap-2 text-xl font-bold text-red-400">
            <span>⚠️</span> 槽点
          </h2>
          <ul className="space-y-2">
            {report.warnings.map((item, i) => (
              <li key={i} className="flex items-start gap-2 text-slate-200">
                <span className="mt-0.5 text-red-400">-</span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* 多维度分析 */}
      <div className="report-card mb-6 rounded-3xl border border-slate-700 bg-slate-800/50 p-6 shadow-xl">
        <h2 className="mb-4 flex items-center gap-2 text-xl font-bold text-white">
          <span>📊</span> 多维度分析
        </h2>
        <div className="grid gap-3 sm:grid-cols-2">
          {analysisItems.map((item) => (
            <div key={item.label} className="rounded-2xl border border-slate-700 bg-slate-700/40 p-4">
              <div className="mb-1 text-sm font-semibold text-amber-400">{item.label}</div>
              <div className="text-sm text-slate-200">{item.value}</div>
            </div>
          ))}
        </div>
      </div>

      {/* 建议 */}
      {report.advice.length > 0 && (
        <div className="report-card mb-6 rounded-3xl border border-slate-700 bg-slate-800/50 p-6 shadow-xl">
          <h2 className="mb-4 flex items-center gap-2 text-xl font-bold text-white">
            <span>💡</span> 建议
          </h2>
          <ol className="space-y-3">
            {report.advice.map((item, i) => (
              <li key={i} className="flex items-start gap-3 text-slate-200">
                <span className="flex h-6 w-6 flex-none items-center justify-center rounded-full bg-amber-400 text-sm font-bold text-slate-900">
                  {i + 1}
                </span>
                <span className="pt-0.5">{item}</span>
              </li>
            ))}
          </ol>
        </div>
      )}

      {/* 毒舌总结 */}
      {report.roast && (
        <div className="report-card mb-6 rounded-3xl border-2 border-amber-400/50 bg-amber-400/5 p-6 shadow-xl">
          <h2 className="mb-3 flex items-center gap-2 text-xl font-bold text-amber-400">
            <span>🔥</span> 毒舌总结
          </h2>
          <p className="text-lg italic text-amber-100">&ldquo;{report.roast}&rdquo;</p>
        </div>
      )}

      {/* 底部分享栏 */}
      <div className="sticky bottom-4 z-20 mx-auto flex max-w-lg items-center justify-center gap-3 rounded-full border border-slate-700 bg-slate-800/90 p-2 shadow-xl backdrop-blur">
        <button
          onClick={() => navigate('/survey')}
          className="inline-flex items-center gap-2 rounded-full bg-slate-700 px-5 py-2.5 text-sm font-semibold text-slate-200 transition-colors hover:bg-slate-600"
        >
          <RotateCcw size={16} /> 再测一次
        </button>
        <button
          onClick={handleCopy}
          className="inline-flex items-center gap-2 rounded-full bg-slate-700 px-5 py-2.5 text-sm font-semibold text-slate-200 transition-colors hover:bg-slate-600"
        >
          {copied ? <Check size={16} className="text-green-400" /> : <Copy size={16} />}
          {copied ? '已复制' : '复制链接'}
        </button>
        <button
          onClick={handleShare}
          className="inline-flex items-center gap-2 rounded-full bg-amber-400 px-5 py-2.5 text-sm font-bold text-slate-900 transition-colors hover:bg-amber-300"
        >
          <Share2 size={16} /> 分享
        </button>
      </div>
    </div>
  )
}
