const AUTH_STORAGE_PREFIX = 'auth_'

const storage = {
  get: (key: string): string | null => {
    try {
      return sessionStorage.getItem(AUTH_STORAGE_PREFIX + key)
    } catch {
      return null
    }
  },
  set: (key: string, value: string): void => {
    try {
      sessionStorage.setItem(AUTH_STORAGE_PREFIX + key, value)
    } catch {
      // 存储空间不足时静默失败
    }
  },
  remove: (key: string): void => {
    try {
      sessionStorage.removeItem(AUTH_STORAGE_PREFIX + key)
    } catch {
      // 静默失败
    }
  },
}

export const authStorage = {
  getToken: () => storage.get('token'),
  setToken: (token: string) => storage.set('token', token),
  removeToken: () => storage.remove('token'),
  getRefreshToken: () => storage.get('refreshToken'),
  setRefreshToken: (token: string) => storage.set('refreshToken', token),
  removeRefreshToken: () => storage.remove('refreshToken'),
  clearAll: () => {
    storage.remove('token')
    storage.remove('refreshToken')
  },
}

export const AUTH_EVENT_NAME = 'auth:expired'

export function notifyAuthExpired() {
  window.dispatchEvent(new CustomEvent(AUTH_EVENT_NAME))
}
