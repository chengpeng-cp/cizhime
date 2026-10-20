import { useEffect, useRef, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
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

function getWorkerArchetype(score: number) {
  if (score < 20) return { title: '工位稳定器', caption: '状态尚可，别忘了给自己留电量。' }
  if (score < 40) return { title: '周一嫌班观察员', caption: '吐槽归吐槽，目前还能稳住阵脚。' }
  if (score < 60) return { title: '离职观察员', caption: '一边打卡，一边认真盘算下一步。' }
  if (score < 80) return { title: '逃离工位预备役', caption: '情绪已经到门口，计划也得跟上。' }
  return { title: '离职申请草稿编辑', caption: '念头很明确，下一步先写进计划。' }
}

const RADIUS = 50
const CIRCUMFERENCE = 2 * Math.PI * RADIUS

export default function ReportPage() {
  const { shareCode } = useParams<{ shareCode: string }>()
  const navigate = useNavigate()
  const root = useRef<HTMLDivElement>(null)
  const shareCard = useRef<HTMLElement>(null)
  const scoreRef = useRef<HTMLSpanElement>(null)
  const circleRef = useRef<SVGCircleElement>(null)
  const [report, setReport] = useState<ReportResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [copied, setCopied] = useState(false)
  const [shareCopied, setShareCopied] = useState(false)
  const [exporting, setExporting] = useState(false)

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

  const writeClipboard = async (content: string) => {
    let ok = false
    if (navigator.clipboard && window.isSecureContext) {
      try {
        await navigator.clipboard.writeText(content)
        ok = true
      } catch {
        ok = false
      }
    }
    if (!ok) {
      const textarea = document.createElement('textarea')
      textarea.value = content
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
    return ok
  }

  const handleCopy = async () => {
    const ok = await writeClipboard(window.location.href)
    if (ok) {
      setCopied(true)
      window.setTimeout(() => setCopied(false), 2200)
    }
  }

  const handleShare = async () => {
    const shareText = report
      ? `${getWorkerArchetype(report.score).title}｜${report.verdict}，辞职指数 ${report.score}/100。${report.roast || report.summary}`
      : '测测你的打工人命运签'
    if (navigator.share) {
      try {
        await navigator.share({ title: '我的打工人命运签', text: shareText, url: window.location.href })
      } catch {
        // 用户取消系统分享。
      }
    } else if (await writeClipboard(`${shareText}\n${window.location.href}`)) {
      setShareCopied(true)
      window.setTimeout(() => setShareCopied(false), 2400)
    }
  }

  const handleExport = async () => {
    if (exporting || !shareCard.current || !shareCode) return
    setExporting(true)
    try {
      const { toPng } = await import('html-to-image')
      const clone = shareCard.current.cloneNode(true) as HTMLElement
      clone.classList.add('report-hero-export')
      clone.style.width = '900px'
      clone.style.maxWidth = 'none'
      clone.style.minHeight = '560px'
      clone.style.margin = '0'
      clone.style.padding = '54px'
      clone.style.gridTemplateColumns = 'minmax(0, 1fr) 230px'
      clone.style.gap = '36px'
      clone.style.opacity = '1'
      clone.style.transform = 'none'
      const exportScore = clone.querySelector('.score-number strong')
      if (exportScore) exportScore.textContent = String(report?.score ?? 0)
      const exportArc = clone.querySelector<SVGCircleElement>('.score-dial-arc')
      if (exportArc && report) {
        exportArc.setAttribute('stroke-dashoffset', String(CIRCUMFERENCE - (report.score / 100) * CIRCUMFERENCE))
      }
      const host = document.createElement('div')
      host.style.cssText = 'position: fixed; left: -99999px; top: 0; width: 900px; pointer-events: none;'
      host.appendChild(clone)
      document.body.appendChild(host)
      try {
        const dataUrl = await toPng(clone, {
          backgroundColor: '#1d4033',
          pixelRatio: 2,
        })
        const link = document.createElement('a')
        link.download = 'cizhima-fate-' + shareCode + '.png'
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
  const archetype = getWorkerArchetype(report.score)
  const arcColor = report.score >= 70 ? '#e7a17c' : report.score >= 40 ? '#e8cf9f' : '#c2dfc8'
  const analysisItems: AnalysisItem[] = [
    { label: '收入回报', value: report.analysis.income, icon: Wallet },
    { label: '工作强度', value: report.analysis.workload, icon: Gauge },
    { label: '工作环境', value: report.analysis.environment, icon: Building },
    { label: '成长空间', value: report.analysis.growth, icon: TrendingUp },
  ]

  return (
    <div ref={root} className="report-page">
      <section ref={shareCard} className="report-hero report-animate">
        <div className="report-hero-content">
          <div className="report-meta">
            <span>辞职么 · 打工人命运签</span>
            <span className="report-code">报告 #{shareCode}</span>
          </div>
          <div className="worker-archetype">
            <span className="worker-archetype-label">你的工位人格</span>
            <strong>{archetype.title}</strong>
            <span className="worker-archetype-caption">{archetype.caption}</span>
          </div>
          <div className={'verdict-label ' + variant}>本次判定</div>
          <h1 className="report-verdict">{report.verdict}</h1>
          <p className="report-summary">{report.summary}</p>
          {report.roast && (
            <div className="report-share-roast">
              <span><Flame size={14} /> 本期职场锐评</span>
              <p>{report.roast}</p>
            </div>
          )}
          <div className="report-share-footer">来测你的打工人命运签 · {window.location.host}/report/{shareCode}</div>
        </div>
        <div className="score-panel" aria-label={'辞职指数 ' + report.score + ' 分'}>
          <div className="score-caption">辞职念头指数</div>
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
          <p className="score-note">状态参考，决定权在你</p>
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
          <Download size={15} /> {exporting ? '正在保存' : '保存命运签'}
        </button>
        <button className="report-action primary" onClick={handleShare}>
          <Share2 size={15} /> {shareCopied ? '文案已复制' : '分享命运签'} <ArrowRight size={13} />
        </button>
      </div>
    </div>
  )
}
