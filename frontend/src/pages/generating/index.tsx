import { useCallback, useEffect, useRef, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import gsap from 'gsap'
import { AlertCircle, ArrowLeft, RotateCcw } from 'lucide-react'
import { analyzeReport } from '@/services/report'
import { addHistory } from '@/utils/reportHistory'
import type { AnalyzeRequest } from '@/types/report'

const MESSAGES = [
  '正在整理你的工作状态',
  '正在对照不同的职业因素',
  '正在生成分析与建议',
  '马上就好',
]

export default function GeneratingPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const root = useRef<HTMLDivElement>(null)
  const [messageIndex, setMessageIndex] = useState(0)
  const [elapsed, setElapsed] = useState(0)
  const [error, setError] = useState('')
  const payload = (location.state as { payload?: AnalyzeRequest } | null)?.payload

  const startedRef = useRef(false)
  const cancelledRef = useRef(false)

  const runAnalyze = useCallback(async () => {
    if (!payload) return
    setError('')
    try {
      const response = await analyzeReport(payload)
      if (cancelledRef.current) return
      addHistory({ shareCode: response.shareCode, verdict: response.verdict, score: response.score, createdAt: Date.now() })
      navigate('/report/' + response.shareCode, { replace: true })
    } catch (reason) {
      if (cancelledRef.current) return
      const message = (reason as { response?: { data?: { message?: string } } })?.response?.data?.message
      setError(message || '生成报告失败，请稍后重试。')
    }
  }, [payload, navigate])

  useEffect(() => {
    if (!payload) navigate('/', { replace: true })
  }, [payload, navigate])

  useEffect(() => {
    cancelledRef.current = false
    if (payload && !startedRef.current) {
      startedRef.current = true
      void runAnalyze()
    }
    return () => {
      cancelledRef.current = true
    }
  }, [payload, runAnalyze])

  useEffect(() => {
    if (!root.current || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const context = gsap.context(() => {
      gsap.from('.generation-card', { y: 16, opacity: 0, duration: 0.45, ease: 'power2.out' })
    }, root)
    return () => context.revert()
  }, [])

  useEffect(() => {
    if (error) return
    const timer = window.setInterval(() => setMessageIndex((index) => (index + 1) % MESSAGES.length), 2600)
    return () => window.clearInterval(timer)
  }, [error])

  useEffect(() => {
    if (error) return
    const timer = window.setInterval(() => setElapsed((seconds) => seconds + 1), 1000)
    return () => window.clearInterval(timer)
  }, [error])

  const handleRetry = () => {
    setElapsed(0)
    setMessageIndex(0)
    void runAnalyze()
  }

  if (!payload) return null

  return (
    <div ref={root} className="generation-page">
      <section className="generation-card">
        {error ? (
          <>
            <span className="state-icon"><AlertCircle size={23} /></span>
            <h1>这次分析没有完成</h1>
            <p>{error}</p>
            <div className="generation-actions">
              <button className="primary-button" onClick={handleRetry}>
                <RotateCcw size={15} /> 再试一次
              </button>
              <button
                className="secondary-button"
                onClick={() => navigate('/survey', {
                  state: { answers: payload.questionnaire, agentStyle: payload.agentStyle },
                })}
              >
                <ArrowLeft size={15} /> 返回问卷
              </button>
            </div>
          </>
        ) : (
          <>
            <div className="generation-spinner" aria-hidden="true" />
            <div className="survey-kicker">YOUR REPORT IS ON ITS WAY</div>
            <h1 style={{ marginTop: 12 }}>{MESSAGES[messageIndex]}</h1>
            <p>我们正在把你的回答整理成一份更清晰的职业状态分析。</p>
            <div className="generation-time">已用时 {elapsed} 秒 · 通常需要 10–30 秒</div>
            <div className="generation-progress" aria-label="正在生成报告">
              <span /><span /><span />
            </div>
          </>
        )}
      </section>
    </div>
  )
}
