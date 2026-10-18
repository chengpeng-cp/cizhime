import { useCallback, useEffect, useRef, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import gsap from 'gsap'
import { AlertCircle, ArrowLeft, Loader2, RotateCcw } from 'lucide-react'
import { analyzeReport } from '@/services/report'
import { addHistory } from '@/utils/reportHistory'
import type { AnalyzeRequest } from '@/types/report'

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
  const [elapsed, setElapsed] = useState(0)
  const [error, setError] = useState('')

  const payload = (location.state as { payload?: AnalyzeRequest } | null)?.payload

  // 防止 React StrictMode 双挂载重复发起请求
  const startedRef = useRef(false)
  const cancelledRef = useRef(false)

  const runAnalyze = useCallback(async () => {
    if (!payload) return
    setError('')
    try {
      const res = await analyzeReport(payload)
      if (cancelledRef.current) return
      addHistory({ shareCode: res.shareCode, verdict: res.verdict, score: res.score, createdAt: Date.now() })
      navigate(`/report/${res.shareCode}`, { replace: true })
    } catch (err) {
      if (cancelledRef.current) return
      const message = (err as { response?: { data?: { message?: string } } })?.response?.data?.message
      setError(message || '生成报告失败，请稍后重试')
    }
  }, [payload, navigate])

  // 直接访问本页（无问卷数据）时回首页
  useEffect(() => {
    if (!payload) navigate('/', { replace: true })
  }, [payload, navigate])

  // 提交后跳转到本页再发起请求，避免在问卷页干等
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

  // 入场动画
  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.from('.gen-spinner', { scale: 0.5, opacity: 0, duration: 0.5, ease: 'back.out(1.7)' })
    }, root)
    return () => ctx.revert()
  }, [])

  // 提示文案轮换（出错后停止）
  useEffect(() => {
    if (error) return
    const timer = window.setInterval(() => setMessageIndex((i) => (i + 1) % MESSAGES.length), 2500)
    return () => window.clearInterval(timer)
  }, [error])

  // 耗时秒表（出错后停止）
  useEffect(() => {
    if (error) return
    const timer = window.setInterval(() => setElapsed((s) => s + 1), 1000)
    return () => window.clearInterval(timer)
  }, [error])

  const handleRetry = () => {
    setElapsed(0)
    setMessageIndex(0)
    void runAnalyze()
  }

  if (!payload) return null

  return (
    <div
      ref={root}
      className="relative flex min-h-[calc(100vh-7rem)] flex-col items-center justify-center overflow-hidden rounded-3xl px-4"
    >
      {/* 背景渐变光晕 */}
      <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_center,_rgba(251,191,36,0.15),_transparent_60%)]" />

      {error ? (
        <div className="flex w-full max-w-md flex-col items-center rounded-3xl border border-red-500/30 bg-red-500/5 p-8 text-center">
          <AlertCircle size={48} className="mb-4 text-red-500 dark:text-red-400" />
          <p className="text-lg font-bold text-slate-900 dark:text-white">生成失败</p>
          <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">{error}</p>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            <button
              onClick={handleRetry}
              className="inline-flex items-center gap-2 rounded-full bg-amber-400 px-6 py-3 font-bold text-slate-900 transition-colors hover:bg-amber-300"
            >
              <RotateCcw size={18} /> 重试
            </button>
            <button
              onClick={() =>
                navigate('/survey', {
                  state: { answers: payload.questionnaire, agentStyle: payload.agentStyle },
                })
              }
              className="inline-flex items-center gap-2 rounded-full border border-gray-300 px-6 py-3 font-bold text-slate-700 transition-colors hover:border-amber-400/60 dark:border-slate-600 dark:text-slate-200"
            >
              <ArrowLeft size={18} /> 返回问卷
            </button>
          </div>
        </div>
      ) : (
        <>
          <Loader2 className="gen-spinner mb-8 animate-spin text-amber-500 dark:text-amber-400" size={64} />
          <p className="text-xl font-bold text-slate-700 dark:text-slate-200">{MESSAGES[messageIndex]}</p>
          <p className="mt-4 text-sm text-slate-500 dark:text-slate-400">
            AI 正在深度思考，已用 {elapsed} 秒 · 通常需要 10~30 秒
          </p>
        </>
      )}
    </div>
  )
}
