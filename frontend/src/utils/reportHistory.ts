// 本地历史报告（localStorage），仅保存在用户浏览器中
export interface ReportHistoryItem {
  shareCode: string
  verdict: string
  score: number
  createdAt: number
}

const STORAGE_KEY = 'cizhima_report_history'
const MAX_ITEMS = 20

function isValid(item: unknown): item is ReportHistoryItem {
  if (!item || typeof item !== 'object') return false
  const it = item as ReportHistoryItem
  return typeof it.shareCode === 'string' && typeof it.verdict === 'string' && typeof it.score === 'number'
}

export function getHistory(): ReportHistoryItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const list: unknown = JSON.parse(raw)
    return Array.isArray(list) ? list.filter(isValid) : []
  } catch {
    return []
  }
}

export function addHistory(item: ReportHistoryItem): void {
  try {
    const list = getHistory().filter((it) => it.shareCode !== item.shareCode)
    list.unshift(item)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list.slice(0, MAX_ITEMS)))
  } catch {
    // 隐私模式等存储不可用场景，静默失败
  }
}

export function clearHistory(): void {
  try {
    localStorage.removeItem(STORAGE_KEY)
  } catch {
    // ignore
  }
}
