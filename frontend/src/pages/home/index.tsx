import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import gsap from 'gsap'
import dayjs from 'dayjs'
import { ArrowRight, ArrowUpRight, Compass, Sparkles, Trash2 } from 'lucide-react'
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
          <div className="eyebrow home-fade"><span className="eyebrow-mark" /> 打工人状态测试 · 仅供会心一笑</div>
          <h1 className="hero-title home-fade">你想辞职，<br />还是只想<em>下班？</em></h1>
          <p className="hero-description home-fade">
            10 题抽一张你的「打工人命运签」：工位稳定器、离职观察员，还是逃离工位预备役？答完还有一条量身定制的职场锐评。
          </p>
          <div className="hero-actions home-fade">
            <button className="primary-button" onClick={() => navigate('/survey')}>
              抽一张命运签 <ArrowRight size={17} />
            </button>
            <span className="hero-meta"><Sparkles size={14} style={{ verticalAlign: '-2px', marginRight: 5 }} />10 题 · 答完可分享</span>
          </div>
        </div>

        <div className="hero-visual home-fade" aria-label="职业状态分析示意">
          <div className="visual-topline">
            <span><i className="visual-dot" />职业状态快照</span>
            <span>CAREER CHECK / 01</span>
          </div>
          <p className="visual-title">先别急着提离职，<br />看看你在职场副本里<br /><span>还剩几格血条。</span></p>
          <div className="visual-orbit" aria-hidden="true">
            <div className="visual-orbit-ring">3<small>MINUTES</small></div>
          </div>
          <div className="visual-facts">
            <div className="visual-fact"><strong>10</strong><span>题快速测一测</span></div>
            <div className="visual-fact"><strong>4</strong><span>种嘴替可选</span></div>
            <div className="visual-fact"><strong>1</strong><span>张命运签可晒</span></div>
          </div>
        </div>
      </section>

      <section className="home-intro-row">
        <div>
          <div className="section-kicker"><Compass size={14} /> 怎么开始</div>
          <h2 className="section-heading">测完有梗，也有点用</h2>
        </div>
        <p className="section-note">可以转给同事互相认证，辞不辞职还是你说了算。</p>
      </section>

      <section className="process-grid" aria-label="测评流程">
        <article className="process-card">
            <span className="process-number">01 / 对号入座</span>
            <h3>讲讲工位里的日常</h3>
            <p>老板、加班、通勤和工资条，挑最像你的一项。</p>
        </article>
        <article className="process-card">
            <span className="process-number">02 / 选个嘴替</span>
            <h3>想听哪种声音？</h3>
            <p>毒舌损友、阴阳大师、专业顾问或知心大姐。</p>
        </article>
        <article className="process-card">
            <span className="process-number">03 / 领取命运签</span>
            <h3>拿走一条职场锐评</h3>
            <p>看看你的辞职指数，存图发给那个天天喊离职的人。</p>
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
