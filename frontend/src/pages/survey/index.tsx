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
  reaction: string
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
    title: '最高学历这张牌，你手里是哪一张？',
    subtitle: '只做工作状态参考，学历不负责替老板的决策背锅。',
    reaction: '收到，学历是你的经历，不是工位的使用说明书。',
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
    title: '你在哪座城市，和房租展开拉锯？',
    subtitle: '同一份工资，在不同城市的续命难度确实不一样。',
    reaction: '记下了，房租和通勤都要算进生活成本。',
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
    reaction: '收到，饼先不估值，咱们看实际资产。',
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
    title: '最近一个月，你把几个晚上寄存在公司？',
    subtitle: '偶尔加班和工位常驻，区别还挺大。',
    reaction: '已计入工时账本，今晚记得把自己领回家。',
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
    reaction: '收到，这段路也算你每天交的隐形班。',
    min: 0,
    max: 360,
    unit: '分钟',
    minLabel: '0 分钟',
    maxLabel: '6 小时以上',
  },
  {
    key: 'salaryRange',
    type: 'single',
    title: '工资条每月给你多少参与感？',
    subtitle: '按税前月薪估算；我们看回报，不给人贴价签。',
    reaction: '记下了，数字是一回事，值不值得是另一回事。',
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
    title: '发薪日那一刻，你觉得这份工资配得上自己吗？',
    subtitle: '1 分：到账像路过；10 分：觉得自己的付出被认真对待。',
    reaction: '收到，满意度比工资数字更能说明感受。',
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
    reaction: '环境也记下了，椅子不该成为你最亲密的同事。',
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
    title: '同事是并肩队友，还是办公室连续剧？',
    subtitle: '选一个最接近的日常，不用替任何人写人物小传。',
    reaction: '收到，办公室剧情暂时不需要续订第二季。',
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
    title: '直属领导的一条消息，能掉你几格血？',
    subtitle: '1 分：沟通顺滑；10 分：看到“在吗”先深呼吸。',
    reaction: '收到，领导沟通也纳入本次副本难度。',
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
  const [sliderTouchedStep, setSliderTouchedStep] = useState<number | null>(null)
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
    advanceTimer.current = window.setTimeout(goNext, 620)
  }

  const handleSliderChange = (key: keyof Questionnaire, value: number) => {
    setAnswers((previous) => ({ ...previous, [key]: value }))
    setSliderTouchedStep(step)
  }

  const handleSubmit = () => {
    navigate('/generating', {
      state: { payload: { agentStyle, questionnaire: { ...answers, extraNote } } },
    })
  }

  const stepText = isAgentStep
    ? '选择你的嘴替'
    : isExtraStep
      ? '补充说明'
      : '第 ' + (step + 1) + ' / ' + TOTAL + ' 题'

  return (
    <div ref={root} className="survey-page">
      <div className="survey-progress-head">
        <span className="survey-progress-label"><strong>{stepText}</strong> · 答完抽一张打工人命运签</span>
        <span className="survey-progress-value">{Math.round(progress)}%</span>
      </div>
      <div className="progress-track" role="progressbar" aria-valuenow={Math.round(progress)} aria-valuemin={0} aria-valuemax={100}>
        <div className="progress-fill" style={{ width: progress + '%' }} />
      </div>

      <div className="survey-nav">
        {step > 0 ? (
          <button className="survey-back" onClick={goBack}><ArrowLeft size={15} /> 上一步</button>
        ) : <span />}
        <span className="survey-step-count">
          {isAgentStep ? '最后一步' : isExtraStep ? '选填 · 可跳过' : `10 题中 · ${String(step + 1).padStart(2, '0')}`}
        </span>
      </div>

      <div className="survey-step">
        {!isAgentStep && !isExtraStep && current && (
          <section className="survey-card" aria-labelledby="survey-title">
            <div className="survey-kicker">打工人副本 · {String(step + 1).padStart(2, '0')}</div>
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

            {current.type === 'single' && Boolean(answers[current.key]) && (
              <p className="survey-reaction" aria-live="polite"><Sparkles size={14} />{current.reaction}</p>
            )}

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
                {sliderTouchedStep === step && (
                  <p className="survey-reaction" aria-live="polite"><Sparkles size={14} />{current.reaction}</p>
                )}
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
            <div className="survey-kicker">隐藏剧情 · 11</div>
            <h1 id="survey-title" className="survey-title">还有哪段职场剧情，问卷没装下？</h1>
            <p className="survey-subtitle">写越具体，最后那句锐评越精准。也可以直接跳过。</p>
            <label className="note-label-row" htmlFor="extra-note">
              <span>补充剧情（选填）</span><span>{extraNote.length} / 500</span>
            </label>
            <textarea
              id="extra-note"
              value={extraNote}
              onChange={(event) => setExtraNote(event.target.value)}
              placeholder="比如：每天开会到很晚、绩效全靠玄学，或者 offer 已经拿到但还没敢告诉老板……"
              rows={5}
              maxLength={500}
              className="survey-textarea"
            />
            <p className="note-hint">可以留空跳过。请别填写姓名、手机号等个人隐私。</p>
            <button className="primary-button survey-continue" onClick={goNext}>
              继续 <ArrowRight size={16} />
            </button>
          </section>
        )}

        {isAgentStep && (
          <section className="survey-card" aria-labelledby="survey-title">
            <div className="survey-kicker">最后一步 · 12</div>
            <h1 id="survey-title" className="survey-title">最后，挑个你想听的嘴替。</h1>
            <p className="survey-subtitle">准备好领取你的命运签和专属职场锐评了吗？</p>

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
