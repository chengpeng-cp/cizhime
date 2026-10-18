import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import gsap from 'gsap'
import { ArrowLeft, ArrowRight, Loader2, AlertCircle } from 'lucide-react'
import { analyzeReport } from '@/services/report'
import { AGENT_STYLES, type Questionnaire } from '@/types/report'

interface SingleOption {
  label: string
  value: string
}

interface QuestionDef {
  key: keyof Questionnaire
  type: 'single' | 'slider'
  title: string
  subtitle: string
  options?: SingleOption[]
  min?: number
  max?: number
  minLabel?: string
  maxLabel?: string
  unit?: string
}

const QUESTIONS: QuestionDef[] = [
  {
    key: 'education',
    type: 'single',
    title: '你的学历是？',
    subtitle: '学历不代表能力，但代表起跑线',
    options: [
      { label: '高中及以下', value: '高中及以下' },
      { label: '大专', value: '大专' },
      { label: '本科', value: '本科' },
      { label: '硕士', value: '硕士' },
      { label: '博士', value: '博士' },
    ],
  },
  {
    key: 'region',
    type: 'single',
    title: '你所在的地区是？',
    subtitle: '地理位置决定了很多东西',
    options: [
      { label: '一线城市', value: '一线城市' },
      { label: '新一线城市', value: '新一线城市' },
      { label: '二线城市', value: '二线城市' },
      { label: '三线及以下', value: '三线及以下' },
      { label: '海外', value: '海外' },
    ],
  },
  {
    key: 'stability',
    type: 'single',
    title: '你的工作稳定程度？',
    subtitle: '铁饭碗还是纸饭碗？',
    options: [
      { label: '铁饭碗', value: '铁饭碗' },
      { label: '较稳定', value: '较稳定' },
      { label: '一般般', value: '一般般' },
      { label: '随时可能凉', value: '随时可能凉' },
    ],
  },
  {
    key: 'overtimeFrequency',
    type: 'single',
    title: '每周加班几次？',
    subtitle: '加班是福报，问就是福报',
    options: [
      { label: '从不加班', value: '从不加班' },
      { label: '1-2次', value: '1-2次' },
      { label: '3-5次', value: '3-5次' },
      { label: '加班是我的第二职业', value: '加班是我的第二职业' },
    ],
  },
  {
    key: 'commuteMinutes',
    type: 'slider',
    title: '每天通勤多久？',
    subtitle: '通勤是打工人的第二份工作',
    min: 0,
    max: 360,
    unit: '分钟',
    minLabel: '0 分钟',
    maxLabel: '360 分钟',
  },
  {
    key: 'salaryRange',
    type: 'single',
    title: '月薪范围？',
    subtitle: '谈钱不伤感情，不谈才伤',
    options: [
      { label: '5k以下', value: '5k以下' },
      { label: '5-10k', value: '5-10k' },
      { label: '10-20k', value: '10-20k' },
      { label: '20-50k', value: '20-50k' },
      { label: '50k+', value: '50k+' },
    ],
  },
  {
    key: 'salarySatisfaction',
    type: 'slider',
    title: '对当前薪资满意吗？',
    subtitle: '1=饿死，10=财务自由',
    min: 1,
    max: 10,
    minLabel: '1=饿死',
    maxLabel: '10=财务自由',
  },
  {
    key: 'workEnvironment',
    type: 'single',
    title: '办公环境如何？',
    subtitle: '工位就是你的第二个家',
    options: [
      { label: '神仙环境', value: '神仙环境' },
      { label: '还行', value: '还行' },
      { label: '憋屈', value: '憋屈' },
      { label: '工地现场', value: '工地现场' },
    ],
  },
  {
    key: 'colleagueRelation',
    type: 'single',
    title: '同事相处如何？',
    subtitle: '职场如戏，全靠演技',
    options: [
      { label: '神仙同事', value: '神仙同事' },
      { label: '普通同事', value: '普通同事' },
      { label: '塑料同事', value: '塑料同事' },
      { label: '宫斗现场', value: '宫斗现场' },
    ],
  },
  {
    key: 'bossToxicity',
    type: 'slider',
    title: '领导的二逼程度？',
    subtitle: '1=人间天使，10=建议报警',
    min: 1,
    max: 10,
    minLabel: '1=人间天使',
    maxLabel: '10=建议报警',
  },
]

const TOTAL = QUESTIONS.length

const INITIAL_ANSWERS: Questionnaire = {
  education: '',
  region: '',
  stability: '',
  overtimeFrequency: '',
  commuteMinutes: 30,
  salaryRange: '',
  salarySatisfaction: 5,
  workEnvironment: '',
  colleagueRelation: '',
  bossToxicity: 5,
}

export default function SurveyPage() {
  const navigate = useNavigate()
  const root = useRef<HTMLDivElement>(null)
  const [step, setStep] = useState(0)
  const [direction, setDirection] = useState(1)
  const [agentStyle, setAgentStyle] = useState('poison')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [answers, setAnswers] = useState<Questionnaire>(INITIAL_ANSWERS)
  const [extraNote, setExtraNote] = useState('')

  const isExtraStep = step === TOTAL
  const isAgentStep = step === TOTAL + 1
  const current = QUESTIONS[step]

  // 问题切换 slide 动画
  useEffect(() => {
    const ctx = gsap.context(() => {
      const x = direction > 0 ? 60 : -60
      gsap.fromTo(
        '.survey-step',
        { x, opacity: 0 },
        { x: 0, opacity: 1, duration: 0.4, ease: 'power2.out' }
      )
    }, root)
    return () => ctx.revert()
  }, [step, direction])

  const goNext = () => {
    if (step < TOTAL + 1) {
      setDirection(1)
      setStep((s) => s + 1)
    }
  }

  const goBack = () => {
    if (step > 0) {
      setDirection(-1)
      setStep((s) => s - 1)
    }
  }

  const handleSingleSelect = (key: keyof Questionnaire, value: string) => {
    setAnswers((prev) => ({ ...prev, [key]: value }))
    // 单选题选择后自动进入下一题
    window.setTimeout(() => goNext(), 200)
  }

  const handleSliderChange = (key: keyof Questionnaire, value: number) => {
    setAnswers((prev) => ({ ...prev, [key]: value }))
  }

  const handleSubmit = async () => {
    setLoading(true)
    setError('')
    try {
      const res = await analyzeReport({ agentStyle, questionnaire: { ...answers, extraNote } })
      navigate('/generating', { state: { shareCode: res.shareCode } })
    } catch {
      setError('生成报告失败，请稍后重试')
    } finally {
      setLoading(false)
    }
  }

  const TOTAL_STEPS = TOTAL + 1 // 10题 + 补充说明
  const progress = isAgentStep ? 100 : ((step + 1) / (TOTAL_STEPS + 1)) * 100

  return (
    <div ref={root} className="mx-auto max-w-2xl py-4">
      {/* 进度条 */}
      <div className="mb-8">
        <div className="mb-2 flex items-center justify-between text-sm text-slate-500 dark:text-slate-400">
          <span>{isAgentStep ? '选择分析风格' : isExtraStep ? '补充说明' : `第 ${step + 1} / ${TOTAL} 题`}</span>
          <span>{Math.round(progress)}%</span>
        </div>
        <div className="h-2 w-full overflow-hidden rounded-full bg-gray-200 dark:bg-slate-700">
          <div
            className="h-full rounded-full bg-amber-400 transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* 返回按钮 */}
      {step > 0 && !loading && (
        <button
          onClick={goBack}
          className="mb-4 inline-flex items-center gap-1 text-sm text-slate-500 dark:text-slate-400 transition-colors hover:text-amber-500 dark:hover:text-amber-400"
        >
          <ArrowLeft size={16} /> 上一题
        </button>
      )}

      {/* 步骤内容 */}
      <div className="survey-step">
        {!isAgentStep && !isExtraStep && current && (
          <div className="rounded-3xl border border-gray-200 bg-white p-6 shadow-xl sm:p-8 dark:border-slate-700 dark:bg-slate-800/50">
            <h2 className="text-2xl font-bold text-slate-900 sm:text-3xl dark:text-white">{current.title}</h2>
            <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">{current.subtitle}</p>

            <div className="mt-8">
              {current.type === 'single' && current.options && (
                <div className="grid gap-3">
                  {current.options.map((opt) => {
                    const selected = answers[current.key] === opt.value
                    return (
                      <button
                        key={opt.value}
                        onClick={() => handleSingleSelect(current.key, opt.value)}
                        className={`rounded-2xl border px-5 py-4 text-left text-lg transition-all ${
                          selected
                            ? 'border-amber-400 bg-amber-400/15 text-amber-600 dark:text-amber-300'
                            : 'border-gray-300 bg-gray-100 text-slate-700 hover:border-amber-400/50 hover:bg-gray-200 dark:border-slate-600 dark:bg-slate-700/40 dark:text-slate-200 dark:hover:bg-slate-700'
                        }`}
                      >
                        {opt.label}
                      </button>
                    )
                  })}
                </div>
              )}

              {current.type === 'slider' && (
                <div>
                  <div className="mb-6 text-center">
                    <span className="text-6xl font-black text-amber-500 dark:text-amber-400">
                      {answers[current.key] as number}
                    </span>
                    {current.unit && <span className="ml-2 text-xl text-slate-500 dark:text-slate-400">{current.unit}</span>}
                  </div>
                  <input
                    type="range"
                    min={current.min}
                    max={current.max}
                    value={answers[current.key] as number}
                    onChange={(e) => handleSliderChange(current.key, Number(e.target.value))}
                    className="w-full accent-amber-400"
                  />
                  <div className="mt-2 flex justify-between text-xs text-slate-500">
                    <span>{current.minLabel}</span>
                    <span>{current.maxLabel}</span>
                  </div>
                  <button
                    onClick={goNext}
                    className="mt-8 inline-flex w-full items-center justify-center gap-2 rounded-full bg-amber-400 py-3 font-bold text-slate-900 transition-colors hover:bg-amber-300"
                  >
                    下一题 <ArrowRight size={18} />
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {isExtraStep && (
          <div className="rounded-3xl border border-gray-200 bg-white p-6 shadow-xl sm:p-8 dark:border-slate-700 dark:bg-slate-800/50">
            <h2 className="text-2xl font-bold text-slate-900 sm:text-3xl dark:text-white">还有什么想说的？</h2>
            <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">吐槽、抱怨、补充，随便写，AI 会一起分析</p>

            <textarea
              value={extraNote}
              onChange={(e) => setExtraNote(e.target.value)}
              placeholder="比如：公司天天画大饼、领导PUA、同事甩锅、想转行但不知道做什么……"
              rows={6}
              maxLength={500}
              className="mt-6 w-full resize-none rounded-2xl border border-gray-300 bg-gray-100 p-4 text-slate-700 placeholder:text-slate-400 focus:border-amber-400 focus:outline-none focus:ring-1 focus:ring-amber-400 dark:border-slate-600 dark:bg-slate-700/40 dark:text-slate-200 dark:placeholder:text-slate-500"
            />
            <div className="mt-1 text-right text-xs text-slate-500">{extraNote.length}/500</div>

            <button
              onClick={goNext}
              className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-full bg-amber-400 py-3 font-bold text-slate-900 transition-colors hover:bg-amber-300"
            >
              {extraNote.trim() ? '下一步' : '跳过'} <ArrowRight size={18} />
            </button>
          </div>
        )}

        {isAgentStep && (
          <div className="rounded-3xl border border-gray-200 bg-white p-6 shadow-xl sm:p-8 dark:border-slate-700 dark:bg-slate-800/50">
            <h2 className="text-2xl font-bold text-slate-900 sm:text-3xl dark:text-white">选择你的&ldquo;人生导师&rdquo;</h2>
            <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">AI 会用这个风格来分析你</p>

            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              {AGENT_STYLES.map((style) => {
                const selected = agentStyle === style.id
                return (
                  <button
                    key={style.id}
                    onClick={() => setAgentStyle(style.id)}
                    className={`rounded-2xl border p-4 text-left transition-all ${
                      selected
                        ? 'border-amber-400 bg-amber-400/15'
                        : 'border-gray-300 bg-gray-100 hover:border-amber-400/50 dark:border-slate-600 dark:bg-slate-700/40'
                    }`}
                  >
                    <div className="text-3xl">{style.emoji}</div>
                    <div className={`mt-2 font-bold ${selected ? 'text-amber-600 dark:text-amber-300' : 'text-slate-900 dark:text-white'}`}>
                      {style.name}
                    </div>
                    <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">{style.description}</div>
                  </button>
                )
              })}
            </div>

            {error && (
              <div className="mt-4 flex items-center gap-2 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-600 dark:text-red-300">
                <AlertCircle size={16} /> {error}
              </div>
            )}

            <button
              onClick={handleSubmit}
              disabled={loading}
              className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-full bg-amber-400 py-4 text-lg font-bold text-slate-900 transition-all hover:bg-amber-300 disabled:opacity-60"
            >
              {loading ? (
                <>
                  <Loader2 size={20} className="animate-spin" /> AI 思考中...
                </>
              ) : (
                '生成报告'
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
