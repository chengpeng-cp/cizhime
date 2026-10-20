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
    title: '学历这张牌，你手里是哪一张？',
    subtitle: '不拿学历给人生定价，只把它当作求职牌桌上的一项信息。',
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
    title: '你在哪个城市打工？',
    subtitle: '同一份工资，在不同城市的续命难度不太一样。',
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
    title: '公司给你的安全感，能续到下个月吗？',
    subtitle: '选最像目前状况的那个，老板画的饼暂不计入固定资产。',
    options: [
      { label: '铁饭碗，端稳了', value: '铁饭碗' },
      { label: '相对稳定，偶尔晃一下', value: '较稳定' },
      { label: '看业绩，也看心情', value: '一般般' },
      { label: '脆皮饭碗，随时刷新', value: '随时可能凉' },
    ],
  },
  {
    key: 'overtimeFrequency',
    type: 'single',
    title: '这一周，你把几个晚上寄存在公司？',
    subtitle: '按最近一个月估算；偶尔加班和工位常驻，区别还挺大。',
    options: [
      { label: '基本不加，准点下班派', value: '从不加班' },
      { label: '1–2 次，偶尔被召唤', value: '1-2次' },
      { label: '3–5 次，工位常驻民', value: '3-5次' },
      { label: '几乎每天，我和公司锁了', value: '加班是我的第二职业' },
    ],
  },
  {
    key: 'commuteMinutes',
    type: 'slider',
    title: '每天通勤，灵魂几分钟后才能到工位？',
    subtitle: '按往返总时间估算，堵车、等车和换乘都算上。',
    min: 0,
    max: 360,
    unit: '分钟',
    minLabel: '0 分钟',
    maxLabel: '6 小时以上',
  },
  {
    key: 'salaryRange',
    type: 'single',
    title: '税前月薪大约在哪个区间？',
    subtitle: '工资到账之后，钱去了哪里我们大概都懂。',
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
    title: '这份工资，配得上你每天的心情吗？',
    subtitle: '1 分：发薪日像路过；10 分：终于有被认真对待的感觉。',
    min: 1,
    max: 10,
    minLabel: '很不满意',
    maxLabel: '非常满意',
  },
  {
    key: 'workEnvironment',
    type: 'single',
    title: '工位这个“第二个家”，住得还舒服吗？',
    subtitle: '光线、设备、空间和氛围，都算在工作环境里。',
    options: [
      { label: '光线好，椅子也懂我', value: '神仙环境' },
      { label: '能用就行，主打一个稳定', value: '还行' },
      { label: '一坐下就开始想下班', value: '憋屈' },
      { label: '每天坐班像在渡劫', value: '工地现场' },
    ],
  },
  {
    key: 'colleagueRelation',
    type: 'single',
    title: '同事更像队友，还是办公室剧情人物？',
    subtitle: '选一个最接近的日常，不用替任何人写人物小传。',
    options: [
      { label: '互相补位的神仙队友', value: '神仙同事' },
      { label: '各自安好型', value: '普通同事' },
      { label: '办公室偶像剧型', value: '塑料同事' },
      { label: '每天都有新剧情', value: '宫斗现场' },
    ],
  },
  {
    key: 'bossToxicity',
    type: 'slider',
    title: '和直属领导合作，费几格血条？',
    subtitle: '1 分：沟通顺滑；10 分：每次会前都需要深呼吸。',
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
            <p className="survey-subtitle">选项装不下的职场剧情，可以在这里展开讲两句。</p>
            <label className="note-label-row" htmlFor="extra-note">
              <span>补充情况</span><span>{extraNote.length} / 500</span>
            </label>
            <textarea
              id="extra-note"
              value={extraNote}
              onChange={(event) => setExtraNote(event.target.value)}
              placeholder="比如：每天开会到很晚、绩效全靠玄学，或者已经拿到 offer 但还在纠结……"
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
