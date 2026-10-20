import { useEffect, useRef, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useSelector } from 'react-redux'
import gsap from 'gsap'
import {
  AlertCircle,
  ArrowRight,
  Building,
  Check,
  Copy,
  Download,
  Flame,
  Gauge,
  Home,
  RotateCcw,
  Share2,
  ShieldCheck,
  TrendingUp,
  Wallet,
  type LucideIcon,
} from 'lucide-react'
import { getReport } from '@/services/report'
import { VERDICT_TYPES, type ReportResponse } from '@/types/report'
import { type RootState } from '@/store'

interface AnalysisItem {
  label: string
  value: string
  icon: LucideIcon
}

function getVerdictVariant(verdict: string) {
  if (verdict === VERDICT_TYPES.RESIGN) return 'resign'
  if (verdict === VERDICT_TYPES.STAY) return 'stay'
  return 'wait'
}

const RADIUS = 50
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

  useEffect(() => {
    if (!shareCode) {
      setError('缺少分享码')
      setLoading(false)
      return
    }
    let cancelled = false
    getReport(shareCode)
      .then((response) => {
        if (!cancelled) {
          setReport({
            ...response,
            highlights: response.highlights ?? [],
            warnings: response.warnings ?? [],
            advice: response.advice ?? [],
            analysis: response.analysis ?? { income: '', workload: '', environment: '', growth: '' },
          })
        }
      })
      .catch((reason: unknown) => {
        if (!cancelled) {
          const message = (reason as { response?: { data?: { message?: string } } })?.response?.data?.message
          setError(message || '报告加载失败，请稍后重试')
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [shareCode])

  useEffect(() => {
    if (!report || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const context = gsap.context(() => {
      const score = { value: 0 }
      gsap.to(score, {
        value: report.score,
        duration: 1.25,
        ease: 'power2.out',
        onUpdate: () => {
          if (scoreRef.current) scoreRef.current.textContent = String(Math.round(score.value))
        },
      })
      if (circleRef.current) {
        gsap.fromTo(
          circleRef.current,
          { strokeDashoffset: CIRCUMFERENCE },
          {
            strokeDashoffset: CIRCUMFERENCE - (report.score / 100) * CIRCUMFERENCE,
            duration: 1.25,
            ease: 'power2.out',
          }
        )
      }
      gsap.from('.report-animate', { y: 16, opacity: 0, duration: 0.42, stagger: 0.075, ease: 'power2.out' })
    }, root)
    return () => context.revert()
  }, [report])

  const handleCopy = async () => {
    const url = window.location.href
    let ok = false
    if (navigator.clipboard && window.isSecureContext) {
      try {
        await navigator.clipboard.writeText(url)
        ok = true
      } catch {
        ok = false
      }
    }
    if (!ok) {
      const textarea = document.createElement('textarea')
      textarea.value = url
      textarea.setAttribute('readonly', '')
      textarea.style.position = 'fixed'
      textarea.style.top = '-9999px'
      document.body.appendChild(textarea)
      try {
        textarea.select()
        ok = document.execCommand('copy')
      } catch {
        ok = false
      } finally {
        document.body.removeChild(textarea)
      }
    }
    if (ok) {
      setCopied(true)
      window.setTimeout(() => setCopied(false), 2200)
    }
  }

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({ title: '我的辞职分析报告', url: window.location.href })
      } catch {
        // 用户取消系统分享。
      }
    } else {
      await handleCopy()
    }
  }

  const handleExport = async () => {
    if (exporting || !root.current || !shareCode) return
    setExporting(true)
    try {
      const { toPng } = await import('html-to-image')
      const clone = root.current.cloneNode(true) as HTMLElement
      clone.style.margin = '0'
      clone.style.padding = '20px'
      const host = document.createElement('div')
      host.style.cssText = 'position: fixed; left: -99999px; top: 0; width: ' + root.current.offsetWidth + 'px; pointer-events: none;'
      host.appendChild(clone)
      document.body.appendChild(host)
      try {
        const dataUrl = await toPng(clone, {
          backgroundColor: theme === 'dark' ? '#111915' : '#f5f4ef',
          pixelRatio: 2,
          filter: (node) => !(node instanceof HTMLElement && node.dataset.exportSkip === 'true'),
        })
        const link = document.createElement('a')
        link.download = 'cizhima-' + shareCode + '.png'
        link.href = dataUrl
        link.click()
      } finally {
        document.body.removeChild(host)
      }
    } catch {
      await handleCopy()
    } finally {
      setExporting(false)
    }
  }

  if (loading) {
    return (
      <div className="loading-stack" aria-label="正在加载报告">
        <div className="skeleton loading-hero" />
        <div className="skeleton loading-line" style={{ width: '52%' }} />
        <div className="skeleton loading-block" />
        <div className="skeleton loading-block" />
      </div>
    )
  }

  if (error || !report) {
    return (
      <div className="state-page">
        <div className="state-card">
          <span className="state-icon"><AlertCircle size={23} /></span>
          <h1>暂时无法打开这份报告</h1>
          <p>{error || '报告不存在，请检查分享链接是否完整。'}</p>
          <button className="primary-button" onClick={() => navigate('/')}>
            <Home size={16} /> 返回首页
          </button>
        </div>
      </div>
    )
  }

  const variant = getVerdictVariant(report.verdict)
  const arcColor = report.score >= 70 ? '#e7a17c' : report.score >= 40 ? '#e8cf9f' : '#c2dfc8'
  const analysisItems: AnalysisItem[] = [
    { label: '收入回报', value: report.analysis.income, icon: Wallet },
    { label: '工作强度', value: report.analysis.workload, icon: Gauge },
    { label: '工作环境', value: report.analysis.environment, icon: Building },
    { label: '成长空间', value: report.analysis.growth, icon: TrendingUp },
  ]

  return (
    <div ref={root} className="report-page">
      <section className="report-hero report-animate">
        <div className="report-hero-content">
          <div className="report-meta">
            <span>职业决策评估 / CAREER CHECK</span>
            <span className="report-code">报告 #{shareCode}</span>
          </div>
          <div className={'verdict-label ' + variant}>AI 分析结论</div>
          <h1 className="report-verdict">{report.verdict}</h1>
          <p className="report-summary">{report.summary}</p>
        </div>
        <div className="score-panel" aria-label={'辞职指数 ' + report.score + ' 分'}>
          <div className="score-caption">辞职指数</div>
          <div className="score-dial">
            <svg viewBox="0 0 128 128" role="img" aria-label={'得分 ' + report.score}>
              <circle className="score-dial-track" cx="64" cy="64" r={RADIUS} fill="none" strokeWidth="7" />
              <circle
                ref={circleRef}
                className="score-dial-arc"
                cx="64"
                cy="64"
                r={RADIUS}
                fill="none"
                stroke={arcColor}
                strokeWidth="7"
                strokeLinecap="round"
                strokeDasharray={CIRCUMFERENCE}
                strokeDashoffset={CIRCUMFERENCE}
                transform="rotate(-90 64 64)"
              />
            </svg>
            <div className="score-number">
              <strong ref={scoreRef}>0</strong>
              <span>满分 100</span>
            </div>
          </div>
          <p className="score-note">分数越高，越值得认真考虑变化</p>
        </div>
      </section>

      <div className="report-content">
        {(report.highlights.length > 0 || report.warnings.length > 0) && (
          <section className="report-section report-animate">
            <div className="report-section-heading">
              <div>
                <div className="report-kicker">KEY TAKEAWAYS / 01</div>
                <h2>先看这几件事</h2>
              </div>
              <p>把优势和顾虑放在一起看</p>
            </div>
            <div className="insight-grid">
              {report.highlights.length > 0 && (
                <article className="insight-card positive">
                  <h3 className="insight-title"><ShieldCheck size={17} /> 值得保留</h3>
                  <ul className="insight-list">
                    {report.highlights.map((item, index) => (
                      <li key={index}><span className="insight-bullet" />{item}</li>
                    ))}
                  </ul>
                </article>
              )}
              {report.warnings.length > 0 && (
                <article className="insight-card caution">
                  <h3 className="insight-title"><AlertCircle size={17} /> 需要留意</h3>
                  <ul className="insight-list">
                    {report.warnings.map((item, index) => (
                      <li key={index}><span className="insight-bullet" />{item}</li>
                    ))}
                  </ul>
                </article>
              )}
            </div>
          </section>
        )}

        <section className="report-section report-animate">
          <div className="report-section-heading">
            <div>
              <div className="report-kicker">A CLOSER LOOK / 02</div>
              <h2>工作状态拆解</h2>
            </div>
            <p>从四个角度看看目前的处境</p>
          </div>
          <div className="analysis-grid">
            {analysisItems.map((item) => {
              const Icon = item.icon
              return (
                <article className="analysis-card" key={item.label}>
                  <span className="analysis-icon"><Icon size={17} /></span>
                  <div>
                    <h3 className="analysis-label">{item.label}</h3>
                    <div className="analysis-value">{item.value}</div>
                  </div>
                </article>
              )
            })}
          </div>
        </section>

        {report.advice.length > 0 && (
          <section className="report-section report-animate">
            <div className="report-section-heading">
              <div>
                <div className="report-kicker">NEXT STEPS / 03</div>
                <h2>可以先做这些</h2>
              </div>
              <p>从小而具体的一步开始</p>
            </div>
            <ol className="advice-list">
              {report.advice.map((item, index) => (
                <li className="advice-item" key={index}>
                  <span className="advice-number">{String(index + 1).padStart(2, '0')}</span>
                  <span className="advice-text">{item}</span>
                </li>
              ))}
            </ol>
          </section>
        )}

        {report.roast && (
          <section className="report-section report-animate">
            <article className="roast-card">
              <h2 className="roast-title"><Flame size={15} /> 毒舌补充</h2>
              <p className="roast-text">{report.roast}</p>
            </article>
          </section>
        )}
      </div>

      <p className="report-signoff">辞职么 · 给职业选择，多一点清醒</p>

      <div className="report-actions report-animate" data-export-skip="true" aria-label="报告操作">
        <button className="report-action" onClick={() => navigate('/survey')}>
          <RotateCcw size={15} /> 再测一次
        </button>
        <button className="report-action" onClick={handleCopy} aria-live="polite">
          {copied ? <Check size={15} /> : <Copy size={15} />}
          {copied ? '已复制' : '复制链接'}
        </button>
        <button className="report-action" onClick={handleExport} disabled={exporting}>
          <Download size={15} /> {exporting ? '正在保存' : '保存图片'}
        </button>
        <button className="report-action primary" onClick={handleShare}>
          <Share2 size={15} /> 分享报告 <ArrowRight size={13} />
        </button>
      </div>
    </div>
  )
}
