import { useEffect, useRef, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useSelector } from 'react-redux'
import gsap from 'gsap'
import { Copy, Share2, Check, AlertCircle, RotateCcw, Home, Download } from 'lucide-react'
import { getReport } from '@/services/report'
import { VERDICT_TYPES, type ReportResponse } from '@/types/report'
import { type RootState } from '@/store'

interface VerdictStyle {
  color: string
  ring: string
  bg: string
  border: string
  emoji: string
}

function getVerdictStyle(verdict: string): VerdictStyle {
  if (verdict === VERDICT_TYPES.RESIGN) {
    return { color: 'text-red-600 dark:text-red-400', ring: 'stroke-red-500 dark:stroke-red-400', bg: 'bg-red-500/10', border: 'border-red-500/30', emoji: '🏃' }
  }
  if (verdict === VERDICT_TYPES.STAY) {
    return { color: 'text-green-600 dark:text-green-400', ring: 'stroke-green-500 dark:stroke-green-400', bg: 'bg-green-500/10', border: 'border-green-500/30', emoji: '🛡️' }
  }
  return { color: 'text-amber-600 dark:text-amber-400', ring: 'stroke-amber-500 dark:stroke-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/30', emoji: '🤔' }
}

function getScoreColor(score: number) {
  if (score >= 70) return { text: 'text-red-600 dark:text-red-400', ring: 'stroke-red-500 dark:stroke-red-400' }
  if (score >= 40) return { text: 'text-amber-500 dark:text-amber-400', ring: 'stroke-amber-500 dark:stroke-amber-400' }
  return { text: 'text-green-600 dark:text-green-400', ring: 'stroke-green-500 dark:stroke-green-400' }
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
  const [exporting, setExporting] = useState(false)
  const theme = useSelector((state: RootState) => state.app.theme)

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
        if (!cancelled) {
          // 防御：历史数据或异常情况下数组字段可能为 null
          setReport({
            ...res,
            highlights: res.highlights ?? [],
            warnings: res.warnings ?? [],
            advice: res.advice ?? [],
            analysis: res.analysis ?? { income: '', workload: '', environment: '', growth: '' },
          })
        }
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          // 业务错误（如报告不存在）展示后端返回的提示，网络错误用通用文案
          const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message
          setError(msg || '报告加载失败，请稍后重试')
        }
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
    const url = window.location.href
    let ok = false
    // 优先使用 Clipboard API（需要 HTTPS 或 localhost）
    if (navigator.clipboard && window.isSecureContext) {
      try {
        await navigator.clipboard.writeText(url)
        ok = true
      } catch {
        ok = false
      }
    }
    // 非安全上下文（如通过 IP + HTTP 部署）降级方案
    if (!ok) {
      try {
        const ta = document.createElement('textarea')
        ta.value = url
        ta.setAttribute('readonly', '')
        ta.style.position = 'fixed'
        ta.style.top = '-9999px'
        document.body.appendChild(ta)
        ta.select()
        ok = document.execCommand('copy')
        document.body.removeChild(ta)
      } catch {
        ok = false
      }
    }
    if (ok) {
      setCopied(true)
      window.setTimeout(() => setCopied(false), 2000)
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

  // 导出报告长图（动态加载 html-to-image，避免增大首屏体积）
  const handleExport = async () => {
    if (exporting || !root.current || !shareCode) return
    setExporting(true)
    try {
      const { toPng } = await import('html-to-image')
      const isDark = document.documentElement.getAttribute('data-theme') === 'dark'

      // 在离屏宿主中克隆一份内容再截图：
      // 1) html-to-image 会把 mx-auto 在实时布局中的计算值（如 margin: 0 84px）
      //    固化进克隆，导致导出图整体偏移、右侧被裁切——离屏克隆里 margin 归零可避免；
      // 2) 不干扰用户当前正在浏览的页面。
      const source = root.current
      const clone = source.cloneNode(true) as HTMLElement
      clone.style.margin = '0'
      clone.style.padding = '20px'
      const host = document.createElement('div')
      host.style.cssText = `position: fixed; left: -99999px; top: 0; width: ${source.offsetWidth}px; pointer-events: none;`
      host.appendChild(clone)
      document.body.appendChild(host)

      try {
        const dataUrl = await toPng(clone, {
          backgroundColor: isDark ? '#0f172a' : '#f9fafb',
          pixelRatio: 2,
          // 底部分享栏不进入导出图片
          filter: (n) => !(n instanceof HTMLElement && n.dataset.exportSkip === 'true'),
        })
        const link = document.createElement('a')
        link.download = `cizhima-${shareCode}.png`
        link.href = dataUrl
        link.click()
      } finally {
        document.body.removeChild(host)
      }
    } catch {
      // 导出失败时退化为复制链接，保证仍可分享
      await handleCopy()
    } finally {
      setExporting(false)
    }
  }

  // 加载中骨架屏
  if (loading) {
    return (
      <div className="mx-auto max-w-2xl py-8">
        <div className="mb-8 h-40 animate-pulse rounded-3xl bg-gray-200 dark:bg-slate-800" />
        <div className="mb-4 h-6 w-2/3 animate-pulse rounded-full bg-gray-200 dark:bg-slate-800" />
        <div className="mb-8 h-40 animate-pulse rounded-3xl bg-gray-200 dark:bg-slate-800" />
        <div className="mb-4 h-6 w-1/2 animate-pulse rounded-full bg-gray-200 dark:bg-slate-800" />
        <div className="mb-8 h-32 animate-pulse rounded-3xl bg-gray-200 dark:bg-slate-800" />
      </div>
    )
  }

  // 错误或无数据
  if (error || !report) {
    return (
      <div className="mx-auto flex max-w-2xl flex-col items-center justify-center py-20 text-center">
        <AlertCircle size={48} className="mb-4 text-red-400" />
        <p className="text-lg text-slate-600 dark:text-slate-300">{error || '报告不存在'}</p>
        <button
          onClick={() => navigate('/')}
          className="mt-8 inline-flex items-center gap-2 rounded-full bg-amber-400 px-8 py-3 font-bold text-slate-900 shadow-lg shadow-amber-400/30 transition-all hover:scale-105 hover:bg-amber-300 active:scale-95"
        >
          <Home size={18} />
          返回首页
        </button>
      </div>
    )
  }

  const verdictStyle = getVerdictStyle(report.verdict)
  const scoreColor = getScoreColor(report.score)

  // SVG 子元素的样式不会被 html-to-image 内联到导出克隆中，
  // 仪表盘圆环必须使用内联 stroke 颜色（对应 Tailwind 色板），否则导出图片里圆环不可见
  const isDark = theme === 'dark'
  const trackStroke = isDark ? '#334155' : '#d1d5db' // slate-700 / gray-300
  const arcStroke =
    report.score >= 70
      ? isDark
        ? '#f87171'
        : '#ef4444' // red-400 / red-500
      : report.score >= 40
        ? isDark
          ? '#fbbf24'
          : '#f59e0b' // amber-400 / amber-500
        : isDark
          ? '#4ade80'
          : '#22c55e' // green-400 / green-500

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
        <p className="text-sm text-slate-500 dark:text-slate-400">AI 判定结果</p>
        <h1 className={`mt-1 text-3xl font-black sm:text-4xl ${verdictStyle.color}`}>{report.verdict}</h1>

        {/* 仪表盘（用 flex 而不是 mx-auto 居中：html-to-image 导出克隆时 auto 边距会失效） */}
        <div className="mt-8 flex justify-center">
          <div className="relative h-44 w-44">
            <svg width="176" height="176" viewBox="0 0 176 176" className="h-full w-full">
              <circle cx="88" cy="88" r={RADIUS} fill="none" strokeWidth="12" style={{ stroke: trackStroke }} />
              <circle
                ref={circleRef}
                cx="88"
                cy="88"
                r={RADIUS}
                fill="none"
                strokeWidth="12"
                strokeLinecap="round"
                style={{ stroke: arcStroke }}
                strokeDasharray={CIRCUMFERENCE}
                strokeDashoffset={CIRCUMFERENCE}
                transform="rotate(-90 88 88)"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span ref={scoreRef} className={`text-5xl font-black ${scoreColor.text}`}>0</span>
              <span className="text-xs text-slate-500 dark:text-slate-400">辞职指数</span>
            </div>
          </div>
        </div>

        <p className="mt-6 text-lg text-slate-700 dark:text-slate-200">{report.summary}</p>
      </div>

      {/* 亮点区域 */}
      {report.highlights.length > 0 && (
        <div className="report-card mb-6 rounded-3xl border border-green-500/30 bg-green-500/5 p-6 shadow-xl">
          <h2 className="mb-4 flex items-center gap-2 text-xl font-bold text-green-600 dark:text-green-400">
            <span>✨</span> 亮点
          </h2>
          <ul className="space-y-2">
            {report.highlights.map((item, i) => (
              <li key={i} className="flex items-start gap-2 text-slate-700 dark:text-slate-200">
                <span className="mt-0.5 text-green-600 dark:text-green-400">+</span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* 槽点区域 */}
      {report.warnings.length > 0 && (
        <div className="report-card mb-6 rounded-3xl border border-red-500/30 bg-red-500/5 p-6 shadow-xl">
          <h2 className="mb-4 flex items-center gap-2 text-xl font-bold text-red-600 dark:text-red-400">
            <span>⚠️</span> 槽点
          </h2>
          <ul className="space-y-2">
            {report.warnings.map((item, i) => (
              <li key={i} className="flex items-start gap-2 text-slate-700 dark:text-slate-200">
                <span className="mt-0.5 text-red-600 dark:text-red-400">-</span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* 多维度分析 */}
      <div className="report-card mb-6 rounded-3xl border border-gray-200 bg-white dark:border-slate-700 dark:bg-slate-800/50 p-6 shadow-xl">
        <h2 className="mb-4 flex items-center gap-2 text-xl font-bold text-slate-900 dark:text-white">
          <span>📊</span> 多维度分析
        </h2>
        <div className="grid gap-3 sm:grid-cols-2">
          {analysisItems.map((item) => (
            <div key={item.label} className="rounded-2xl border border-gray-200 bg-gray-50 dark:border-slate-700 dark:bg-slate-700/40 p-4">
              <div className="mb-1 text-sm font-semibold text-amber-600 dark:text-amber-400">{item.label}</div>
              <div className="text-sm text-slate-700 dark:text-slate-200">{item.value}</div>
            </div>
          ))}
        </div>
      </div>

      {/* 建议 */}
      {report.advice.length > 0 && (
        <div className="report-card mb-6 rounded-3xl border border-gray-200 bg-white dark:border-slate-700 dark:bg-slate-800/50 p-6 shadow-xl">
          <h2 className="mb-4 flex items-center gap-2 text-xl font-bold text-slate-900 dark:text-white">
            <span>💡</span> 建议
          </h2>
          <ol className="space-y-3">
            {report.advice.map((item, i) => (
              <li key={i} className="flex items-start gap-3 text-slate-700 dark:text-slate-200">
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
          <h2 className="mb-3 flex items-center gap-2 text-xl font-bold text-amber-600 dark:text-amber-400">
            <span>🔥</span> 毒舌总结
          </h2>
          <p className="text-lg italic text-amber-900 dark:text-amber-100">&ldquo;{report.roast}&rdquo;</p>
        </div>
      )}

      {/* 品牌落款（也会出现在导出长图底部） */}
      <p className="mb-4 text-center text-xs text-slate-400 dark:text-slate-500">辞职么 · AI 辞职决策分析</p>

      {/* 底部分享栏 */}
      <div
        data-export-skip="true"
        className="sticky bottom-4 z-20 mx-auto flex max-w-xl flex-wrap items-center justify-center gap-2 rounded-3xl border border-gray-200 bg-white/90 p-2 shadow-xl backdrop-blur sm:gap-3 sm:rounded-full dark:border-slate-700 dark:bg-slate-800/90"
      >
        <button
          onClick={() => navigate('/survey')}
          className="inline-flex items-center gap-2 rounded-full bg-gray-200 px-4 py-2.5 text-sm font-semibold text-slate-700 transition-colors hover:bg-gray-300 sm:px-5 dark:bg-slate-700 dark:text-slate-200 dark:hover:bg-slate-600"
        >
          <RotateCcw size={16} /> 再测一次
        </button>
        <button
          onClick={handleCopy}
          className="inline-flex items-center gap-2 rounded-full bg-gray-200 px-4 py-2.5 text-sm font-semibold text-slate-700 transition-colors hover:bg-gray-300 sm:px-5 dark:bg-slate-700 dark:text-slate-200 dark:hover:bg-slate-600"
        >
          {copied ? <Check size={16} className="text-green-600 dark:text-green-400" /> : <Copy size={16} />}
          {copied ? '已复制' : '复制链接'}
        </button>
        <button
          onClick={handleExport}
          disabled={exporting}
          className="inline-flex items-center gap-2 rounded-full bg-gray-200 px-4 py-2.5 text-sm font-semibold text-slate-700 transition-colors hover:bg-gray-300 disabled:opacity-60 sm:px-5 dark:bg-slate-700 dark:text-slate-200 dark:hover:bg-slate-600"
        >
          <Download size={16} /> {exporting ? '生成中…' : '保存图片'}
        </button>
        <button
          onClick={handleShare}
          className="inline-flex items-center gap-2 rounded-full bg-amber-400 px-4 py-2.5 text-sm font-bold text-slate-900 transition-colors hover:bg-amber-300 sm:px-5"
        >
          <Share2 size={16} /> 分享
        </button>
      </div>
    </div>
  )
}
