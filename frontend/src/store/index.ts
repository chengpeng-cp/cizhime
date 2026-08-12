import { configureStore } from '@reduxjs/toolkit'
import appReducer, { type AppSetting } from './modules/app'

export interface RootState {
  app: AppSetting
}

export const store = configureStore({
  reducer: {
    app: appReducer,
  },
})

export type AppDispatch = typeof store.dispatch
