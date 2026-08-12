import { get, post } from '@/utils/request'
import type { AnalyzeRequest, ReportResponse } from '@/types/report'

// 提交问卷分析
export function analyzeReport(data: AnalyzeRequest): Promise<ReportResponse> {
  return post<ReportResponse>('/api/v1/analyze', data)
}

// 根据分享码获取报告
export function getReport(shareCode: string): Promise<ReportResponse> {
  return get<ReportResponse>(`/api/v1/report/${shareCode}`)
}
