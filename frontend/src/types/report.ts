// 报告相关类型定义

// 问卷数据
export interface Questionnaire {
  education: string
  region: string
  stability: string
  overtimeFrequency: string
  commuteMinutes: number
  salaryRange: string
  salarySatisfaction: number
  workEnvironment: string
  colleagueRelation: string
  bossToxicity: number
  extraNote?: string
}

// 分析请求
export interface AnalyzeRequest {
  agentStyle: string
  questionnaire: Questionnaire
}

// 多维度分析
export interface Analysis {
  income: string
  workload: string
  environment: string
  growth: string
}

// 报告响应
export interface ReportResponse {
  shareCode: string
  verdict: string
  score: number
  summary: string
  highlights: string[]
  warnings: string[]
  analysis: Analysis
  advice: string[]
  roast: string
}

// Agent 风格
export interface AgentStyle {
  id: string
  name: string
  description: string
  emoji: string
}

// 支持的 Agent 风格列表
export const AGENT_STYLES: AgentStyle[] = [
  {
    id: 'poison',
    name: '毒舌损友',
    description: '笑点冲着职场去，建议照样给到位',
    emoji: '😏',
  },
  {
    id: 'professional',
    name: '专业顾问',
    description: '把利弊摊开说，顺手帮你列行动清单',
    emoji: '🤓',
  },
  {
    id: 'yinyang',
    name: '阴阳大师',
    description: '话说得客气，重点一句也不放过',
    emoji: '🙃',
  },
  {
    id: 'sister',
    name: '知心大姐',
    description: '先接住你的情绪，再一起找出口',
    emoji: '🥰',
  },
]

// 判定结果类型
export const VERDICT_TYPES = {
  RESIGN: '建议辞职',
  STAY: '建议苟住',
  WAIT: '建议观望',
} as const
