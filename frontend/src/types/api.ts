// todo: 根据业务需求添加 API 类型定义

export interface ListPageRequest {
  page?: number
  page_size?: number
  keyword?: string
}

export interface ListResponse<T> {
  items: T[]
  total: number
  page: number
  page_size: number
  total_pages: number
}
