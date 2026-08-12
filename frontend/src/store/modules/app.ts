import { createSlice, type PayloadAction } from '@reduxjs/toolkit'

export interface AppSetting {
  theme: 'light' | 'dark'
  language: 'zh-CN' | 'en-US'
  collapsed: boolean
}

const initialState: AppSetting = {
  theme: (localStorage.getItem('theme') as 'light' | 'dark') || 'dark',
  language: 'zh-CN',
  collapsed: false,
}

const appSlice = createSlice({
  name: 'app',
  initialState,
  reducers: {
    setTheme: (state, action: PayloadAction<'light' | 'dark'>) => {
      state.theme = action.payload
      localStorage.setItem('theme', action.payload)
    },
    setLanguage: (state, action: PayloadAction<'zh-CN' | 'en-US'>) => {
      state.language = action.payload
    },
    toggleCollapsed: (state) => {
      state.collapsed = !state.collapsed
    },
    setCollapsed: (state, action: PayloadAction<boolean>) => {
      state.collapsed = action.payload
    },
  },
})

export const { setTheme, setLanguage, toggleCollapsed, setCollapsed } = appSlice.actions
export default appSlice.reducer
