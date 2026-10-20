import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import gsap from 'gsap'
import dayjs from 'dayjs'
import { ArrowRight, ArrowUpRight, Clock3, Compass, Trash2 } from 'lucide-react'
import { VERDICT_TYPES } from '@/types/report'
import { clearHistory, getHistory, type ReportHistoryItem } from '@/utils/reportHistory'

function verdictClass(verdict: string) {
  if (verdict === VERDICT_TYPES.STAY) return 'stay'
  if (verdict === VERDICT_TYPES.WAIT) return 'wait'
  return ''
}

export default function HomePage() {
  const navigate = useNavigate()
  const root = useRef<HTMLDivElement>(null)
  const [history, setHistory] = useState<ReportHistoryItem[]>(() => getHistory())

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const ctx = gsap.context(() => {
      gsap.fromTo(
        '.home-fade',
        { y: 18, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.65, stagger: 0.1, ease: 'power2.out' }
      )
    }, root)
    return () => ctx.revert()
  }, [])

  const handleClearHistory = () => {
    clearHistory()
    setHistory([])
  }

  return (
    <div ref={root} className="home-page">
      <section className="hero-layout">
        <div className="hero-copy">
          <div className="eyebrow home-fade"><span className="eyebrow-mark" /> 职业选择 · 清醒一点</div>
          <h1 className="hero-title home-fade">辞职这件事，<br />先别急着<em>做决定。</em></h1>
          <p className="hero-description home-fade">
            把工作里的好与坏都摆上桌面。用一份轻松的测评，帮你理清处境、看见选择，再决定下一步。
          </p>
          <div className="hero-actions home-fade">
            <button className="primary-button" onClick={() => navigate('/survey')}>
              开始职业测评 <ArrowRight size={17} />
            </button>
            <span className="hero-meta"><Clock3 size={14} style={{ verticalAlign: '-2px', marginRight: 5 }} />约 3 分钟 · 10 个问题</span>
          </div>
        </div>

        <div className="hero-visual home-fade" aria-label="职业状态分析示意">
          <div className="visual-topline">
            <span><i className="visual-dot" />职业状态快照</span>
            <span>CAREER CHECK / 01</span>
          </div>
          <p className="visual-title">工作不该只剩下<br /><span>“要不要辞职”</span><br />这一道选择题。</p>
          <div className="visual-orbit" aria-hidden="true">
            <div className="visual-orbit-ring">3<small>MINUTES</small></div>
          </div>
          <div className="visual-facts">
            <div className="visual-fact"><strong>10</strong><span>个真实问题</span></div>
            <div className="visual-fact"><strong>4</strong><span>种分析视角</span></div>
            <div className="visual-fact"><strong>1</strong><span>份专属建议</span></div>
          </div>
        </div>
      </section>

      <section className="home-intro-row">
        <div>
          <div className="section-kicker"><Compass size={14} /> 怎么开始</div>
          <h2 className="section-heading">三步，理清你的下一步</h2>
        </div>
        <p className="section-note">不替你做决定，只把容易忽略的因素一起看清。</p>
      </section>

      <section className="process-grid" aria-label="测评流程">
        <article className="process-card">
          <span className="process-number">01 / 了解现状</span>
          <h3>说说现在的工作</h3>
          <p>从薪资、通勤到团队氛围，回答 10 个具体问题。</p>
        </article>
        <article className="process-card">
          <span className="process-number">02 / 选择视角</span>
          <h3>挑一种分析风格</h3>
          <p>理性顾问、知心大姐，或你更想听的那种声音。</p>
        </article>
        <article className="process-card">
          <span className="process-number">03 / 看见选项</span>
          <h3>获得一份行动参考</h3>
          <p>综合分析职业状态，并给出可以开始做的小建议。</p>
        </article>
      </section>

      {history.length > 0 && (
        <section className="history-section home-fade">
          <div className="section-heading-row">
            <div>
              <div className="section-kicker">YOUR REPORTS</div>
              <h2 className="section-heading">最近的分析</h2>
              <p className="history-caption">这些记录只保存在当前浏览器中</p>
            </div>
            <button className="text-button" onClick={handleClearHistory}>
              <Trash2 size={14} /> 清除记录
            </button>
          </div>
          <div className="history-list">
            {history.slice(0, 5).map((item) => (
              <button
                key={item.shareCode}
                onClick={() => navigate('/report/' + item.shareCode)}
                className="history-item"
              >
                <span className="history-main">
                  <i className={'verdict-dot ' + verdictClass(item.verdict)} />
                  <span className="history-verdict">{item.verdict}</span>
                  <span className="history-code">#{item.shareCode}</span>
                </span>
                <span className="history-meta">
                  <span>{item.score} 分</span>
                  <span>{dayjs(item.createdAt).format('MM-DD HH:mm')}</span>
                  <ArrowUpRight size={15} />
                </span>
              </button>
            ))}
          </div>
        </section>
      )}
    </div>
  )
}
