import axios, { type AxiosInstance, type AxiosRequestConfig, type AxiosResponse, type InternalAxiosRequestConfig } from 'axios'
import { authStorage, notifyAuthExpired } from '@/utils/authStorage'

const API_TIMEOUT = 15000

const request: AxiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '',
  timeout: API_TIMEOUT,
  headers: {
    'Content-Type': 'application/json',
  },
})

export function showToast(message: string, type: 'error' | 'warning' | 'info' | 'success' = 'error') {
  console.log(`[Toast] ${type}: ${message}`)
}

let isRefreshing = false
let pendingRequests: Array<(token: string) => void> = []

function onTokenRefreshed(newToken: string) {
  pendingRequests.forEach(cb => cb(newToken))
  pendingRequests = []
}

function addPendingRequest(cb: (token: string) => void) {
  pendingRequests.push(cb)
}

async function tryRefreshToken(): Promise<string | null> {
  const refreshToken = authStorage.getRefreshToken()
  if (!refreshToken) return null

  try {
    const response = await axios.post(
      (import.meta.env.VITE_API_BASE_URL || '') + '/api/v1/refresh-token',
      { refreshToken },
      { timeout: API_TIMEOUT, headers: { 'Content-Type': 'application/json' } }
    )
    const res = response.data
    if (res && typeof res === 'object' && 'code' in res) {
      if (res.code !== 0) return null
      const data = res.data ?? res
      const newAccessToken = data.accessToken || data.access_token
      const newRefreshToken = data.refreshToken || data.refresh_token
      if (!newAccessToken) return null

      authStorage.setToken(newAccessToken)
      if (newRefreshToken) {
        authStorage.setRefreshToken(newRefreshToken)
      }
      return newAccessToken
    }
    const data = res
    const newAccessToken = data.accessToken || data.access_token
    const newRefreshToken = data.refreshToken || data.refresh_token
    if (!newAccessToken) return null

    authStorage.setToken(newAccessToken)
    if (newRefreshToken) {
      authStorage.setRefreshToken(newRefreshToken)
    }
    return newAccessToken
  } catch {
    return null
  }
}

request.interceptors.request.use(
  (config) => {
    const token = authStorage.getToken()
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => Promise.reject(error)
)

request.interceptors.response.use(
  (response: AxiosResponse) => {
    const res = response.data
    if (res && typeof res === 'object' && 'code' in res) {
      if (res.code !== 0) {
        const error = Object.assign(new Error(res.message || '请求失败'), {
          response: { status: res.code, data: res },
        })
        return Promise.reject(error)
      }
      return res.data ?? res
    }
    return res
  },
  async (error) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean }

    if (error.response) {
      const { status, data } = error.response
      const message = data?.message || data?.error || '请求失败'
      switch (status) {
        case 401: {
          if (originalRequest._retry || originalRequest.url?.includes('/refresh-token')) {
            authStorage.clearAll()
            notifyAuthExpired()
            break
          }

          if (isRefreshing) {
            return new Promise((resolve) => {
              addPendingRequest((newToken: string) => {
                originalRequest.headers.Authorization = `Bearer ${newToken}`
                resolve(request(originalRequest))
              })
            })
          }

          originalRequest._retry = true
          isRefreshing = true

          const newToken = await tryRefreshToken()
          isRefreshing = false

          if (newToken) {
            onTokenRefreshed(newToken)
            originalRequest.headers.Authorization = `Bearer ${newToken}`
            return request(originalRequest)
          }

          authStorage.clearAll()
          notifyAuthExpired()
          break
        }
        case 403:
          showToast(`权限不足: ${message}`, 'warning')
          console.error('没有权限访问:', message)
          break
        case 500:
          showToast(`服务器错误: ${message}`, 'error')
          console.error('服务器错误:', message)
          break
        default:
          showToast(`请求失败: ${message}`, 'error')
          console.error(message)
      }
    } else if (error.request) {
      showToast('网络请求失败，请检查网络连接', 'error')
    }
    return Promise.reject(error)
  }
)

export function get<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
  return request.get(url, config)
}

export function post<T>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<T> {
  return request.post(url, data, config)
}

export function put<T>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<T> {
  return request.put(url, data, config)
}

export function del<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
  return request.delete(url, config)
}

export default request
