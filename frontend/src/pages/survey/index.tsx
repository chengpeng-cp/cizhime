import { useEffect, useRef, useState, type CSSProperties } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import gsap from 'gsap'
import {
  ArrowLeft,
  ArrowRight,
  BriefcaseBusiness,
  Check,
  Heart,
  MessageCircle,
  Scale,
  Sparkles,
  type LucideIcon,
} from 'lucide-react'
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
    title: '你的最高学历是？',
    subtitle: '学历不是能力的全部，但会影响你面对的选项。',
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
    title: '你目前在哪个地区工作？',
    subtitle: '城市不同，机会、成本和生活节奏也不同。',
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
    title: '你觉得现在的工作稳定吗？',
    subtitle: '回想最近一年的变化，选择最接近的状态。',
    options: [
      { label: '非常稳定', value: '铁饭碗' },
      { label: '比较稳定', value: '较稳定' },
      { label: '时好时坏', value: '一般般' },
      { label: '变化很大', value: '随时可能凉' },
    ],
  },
  {
    key: 'overtimeFrequency',
    type: 'single',
    title: '你每周大约加班几次？',
    subtitle: '按最近一个月的平均情况来选。',
    options: [
      { label: '基本不加班', value: '从不加班' },
      { label: '每周 1–2 次', value: '1-2次' },
      { label: '每周 3–5 次', value: '3-5次' },
      { label: '几乎每天都加班', value: '加班是我的第二职业' },
    ],
  },
  {
    key: 'commuteMinutes',
    type: 'slider',
    title: '你每天通勤需要多久？',
    subtitle: '按往返总时间估算，包含等车和换乘。',
    min: 0,
    max: 360,
    unit: '分钟',
    minLabel: '0 分钟',
    maxLabel: '6 小时以上',
  },
  {
    key: 'salaryRange',
    type: 'single',
    title: '你的月薪大约在什么范围？',
    subtitle: '选择税前月薪区间，帮助我们理解你的现实成本。',
    options: [
      { label: '5k 以下', value: '5k以下' },
      { label: '5k–10k', value: '5-10k' },
      { label: '10k–20k', value: '10-20k' },
      { label: '20k–50k', value: '20-50k' },
      { label: '50k 以上', value: '50k+' },
    ],
  },
  {
    key: 'salarySatisfaction',
    type: 'slider',
    title: '你对目前的薪资满意吗？',
    subtitle: '1 分代表很不满意，10 分代表非常满意。',
    min: 1,
    max: 10,
    minLabel: '很不满意',
    maxLabel: '非常满意',
  },
  {
    key: 'workEnvironment',
    type: 'single',
    title: '你对办公环境感觉如何？',
    subtitle: '包括工作空间、设备和日常工作氛围。',
    options: [
      { label: '舒适自在', value: '神仙环境' },
      { label: '整体还不错', value: '还行' },
      { label: '有些压抑', value: '憋屈' },
      { label: '很难适应', value: '工地现场' },
    ],
  },
  {
    key: 'colleagueRelation',
    type: 'single',
    title: '你和同事相处得怎么样？',
    subtitle: '团队关系往往会影响每天的工作体验。',
    options: [
      { label: '互相支持', value: '神仙同事' },
      { label: '普通合作', value: '普通同事' },
      { label: '有些别扭', value: '塑料同事' },
      { label: '关系紧张', value: '宫斗现场' },
    ],
  },
  {
    key: 'bossToxicity',
    type: 'slider',
    title: '你和直属领导的合作体验如何？',
    subtitle: '1 分代表非常顺畅，10 分代表非常困难。',
    min: 1,
    max: 10,
    minLabel: '非常顺畅',
    maxLabel: '非常困难',
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

const STYLE_ICONS: Record<string, LucideIcon> = {
  poison: MessageCircle,
  professional: BriefcaseBusiness,
  yinyang: Scale,
  sister: Heart,
}

export default function SurveyPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const root = useRef<HTMLDivElement>(null)
  const advanceTimer = useRef<number | null>(null)

  // 从生成失败页返回时恢复已填写的答案，直接回到风格选择步骤。
  const restore = location.state as { answers?: Questionnaire; agentStyle?: string } | null
  const [step, setStep] = useState(() => (restore?.answers ? TOTAL + 1 : 0))
  const [direction, setDirection] = useState(1)
  const [agentStyle, setAgentStyle] = useState(restore?.agentStyle ?? 'poison')
  const [answers, setAnswers] = useState<Questionnaire>(() =>
    restore?.answers ? { ...INITIAL_ANSWERS, ...restore.answers } : INITIAL_ANSWERS
  )
  const [extraNote, setExtraNote] = useState(restore?.answers?.extraNote ?? '')

  const isExtraStep = step === TOTAL
  const isAgentStep = step === TOTAL + 1
  const current = QUESTIONS[step]
  const totalSteps = TOTAL + 2
  const progress = Math.min(100, ((step + 1) / totalSteps) * 100)

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const ctx = gsap.context(() => {
      const x = direction > 0 ? 28 : -28
      gsap.fromTo('.survey-step', { x, opacity: 0 }, { x: 0, opacity: 1, duration: 0.3, ease: 'power2.out' })
    }, root)
    return () => ctx.revert()
  }, [step, direction])

  useEffect(() => () => {
    if (advanceTimer.current !== null) window.clearTimeout(advanceTimer.current)
  }, [])

  const goNext = () => {
    if (step < TOTAL + 1) {
      setDirection(1)
      setStep((value) => value + 1)
    }
  }

  const goBack = () => {
    if (step > 0) {
      if (advanceTimer.current !== null) window.clearTimeout(advanceTimer.current)
      setDirection(-1)
      setStep((value) => value - 1)
    }
  }

  const handleSingleSelect = (key: keyof Questionnaire, value: string) => {
    setAnswers((previous) => ({ ...previous, [key]: value }))
    if (advanceTimer.current !== null) window.clearTimeout(advanceTimer.current)
    advanceTimer.current = window.setTimeout(goNext, 360)
  }

  const handleSliderChange = (key: keyof Questionnaire, value: number) => {
    setAnswers((previous) => ({ ...previous, [key]: value }))
  }

  const handleSubmit = () => {
    navigate('/generating', {
      state: { payload: { agentStyle, questionnaire: { ...answers, extraNote } } },
    })
  }

  const stepText = isAgentStep
    ? '选择分析风格'
    : isExtraStep
      ? '补充说明'
      : '第 ' + (step + 1) + ' / ' + TOTAL + ' 题'

  return (
    <div ref={root} className="survey-page">
      <div className="survey-progress-head">
        <span className="survey-progress-label"><strong>{stepText}</strong> · 让建议更贴近你的情况</span>
        <span className="survey-progress-value">{Math.round(progress)}%</span>
      </div>
      <div className="progress-track" role="progressbar" aria-valuenow={Math.round(progress)} aria-valuemin={0} aria-valuemax={100}>
        <div className="progress-fill" style={{ width: progress + '%' }} />
      </div>

      <div className="survey-nav">
        {step > 0 ? (
          <button className="survey-back" onClick={goBack}><ArrowLeft size={15} /> 上一步</button>
        ) : <span />}
        <span className="survey-step-count">{String(step + 1).padStart(2, '0')} / {String(totalSteps).padStart(2, '0')}</span>
      </div>

      <div className="survey-step">
        {!isAgentStep && !isExtraStep && current && (
          <section className="survey-card" aria-labelledby="survey-title">
            <div className="survey-kicker">WORK &amp; LIFE / {String(step + 1).padStart(2, '0')}</div>
            <h1 id="survey-title" className="survey-title">{current.title}</h1>
            <p className="survey-subtitle">{current.subtitle}</p>

            <div className="option-grid">
              {current.type === 'single' && current.options?.map((option) => {
                const selected = answers[current.key] === option.value
                return (
                  <button
                    key={option.value}
                    type="button"
                    aria-pressed={selected}
                    onClick={() => handleSingleSelect(current.key, option.value)}
                    className={'option-button' + (selected ? ' is-selected' : '')}
                  >
                    <span>{option.label}</span>
                    <span className="option-check"><Check size={12} strokeWidth={3} /></span>
                  </button>
                )
              })}
            </div>

            {current.type === 'slider' && (
              <div className="slider-question">
                <div className="slider-value">
                  <strong>{answers[current.key] as number}</strong>
                  {current.unit && <span>{current.unit}</span>}
                </div>
                <div className="range-wrap">
                  <input
                    aria-label={current.title}
                    type="range"
                    min={current.min}
                    max={current.max}
                    value={answers[current.key] as number}
                    onChange={(event) => handleSliderChange(current.key, Number(event.target.value))}
                    className="survey-range"
                    style={{
                      '--range-progress':
                        (((Number(answers[current.key]) - (current.min ?? 0)) /
                          ((current.max ?? 100) - (current.min ?? 0))) * 100) + '%',
                    } as CSSProperties}
                  />
                  <div className="range-labels">
                    <span>{current.minLabel}</span>
                    <span>{current.maxLabel}</span>
                  </div>
                </div>
                <button className="primary-button survey-continue" onClick={goNext}>
                  下一题 <ArrowRight size={16} />
                </button>
              </div>
            )}
          </section>
        )}

        {isExtraStep && (
          <section className="survey-card" aria-labelledby="survey-title">
            <div className="survey-kicker">A LITTLE MORE CONTEXT / 11</div>
            <h1 id="survey-title" className="survey-title">还有什么想补充的吗？</h1>
            <p className="survey-subtitle">那些没法放进选项里的事，也可以在这里说说。</p>
            <label className="note-label-row" htmlFor="extra-note">
              <span>补充情况</span><span>{extraNote.length} / 500</span>
            </label>
            <textarea
              id="extra-note"
              value={extraNote}
              onChange={(event) => setExtraNote(event.target.value)}
              placeholder="比如：正在考虑转行、近期有家庭计划，或者有一件事一直让你很纠结……"
              rows={5}
              maxLength={500}
              className="survey-textarea"
            />
            <p className="note-hint">可以留空跳过。补充的信息会和问卷答案一起用于生成分析。</p>
            <button className="primary-button survey-continue" onClick={goNext}>
              继续 <ArrowRight size={16} />
            </button>
          </section>
        )}

        {isAgentStep && (
          <section className="survey-card" aria-labelledby="survey-title">
            <div className="survey-kicker">CHOOSE YOUR PERSPECTIVE / 12</div>
            <h1 id="survey-title" className="survey-title">你想听谁来分析？</h1>
            <p className="survey-subtitle">选择一种表达风格，分析内容仍会根据你的回答生成。</p>

            <div className="agent-grid">
              {AGENT_STYLES.map((style) => {
                const selected = agentStyle === style.id
                const Icon = STYLE_ICONS[style.id] ?? Sparkles
                return (
                  <button
                    key={style.id}
                    type="button"
                    aria-pressed={selected}
                    onClick={() => setAgentStyle(style.id)}
                    className={'agent-card' + (selected ? ' is-selected' : '')}
                  >
                    {selected && <Check className="agent-selected-mark" size={16} />}
                    <span className="agent-card-content">
                      <span className="agent-icon"><Icon size={17} /></span>
                      <span className="agent-name">{style.name}</span>
                      <span className="agent-description">{style.description}</span>
                    </span>
                  </button>
                )
              })}
            </div>

            <button className="primary-button agent-submit" onClick={handleSubmit}>
              生成我的分析 <ArrowRight size={16} />
            </button>
          </section>
        )}
      </div>
    </div>
  )
}
