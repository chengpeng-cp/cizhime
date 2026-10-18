import { get, post } from '@/utils/request'
import type { AnalyzeRequest, ReportResponse } from '@/types/report'

// 提交问卷分析
export function analyzeReport(data: AnalyzeRequest): Promise<ReportResponse> {
  // AI 生成耗时较长（10~60s 甚至更久），单独放宽超时，避免默认 15s 超时误报失败
  return post<ReportResponse>('/api/v1/analyze', data, { timeout: 180000 })
}

// 根据分享码获取报告
export function getReport(shareCode: string): Promise<ReportResponse> {
  return get<ReportResponse>(`/api/v1/report/${shareCode}`)
}
