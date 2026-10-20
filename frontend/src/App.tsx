import { Suspense, useEffect, Component, type ReactNode } from 'react'
import { BrowserRouter, useRoutes } from 'react-router-dom'
import { Provider, useSelector } from 'react-redux'
import { AlertCircle, RotateCcw } from 'lucide-react'
import { store, type RootState } from './store'
import { routes } from './router'

interface ErrorBoundaryState {
  hasError: boolean
  error: Error | null
}

class ErrorBoundary extends Component<{ children: ReactNode }, ErrorBoundaryState> {
  state: ErrorBoundaryState = { hasError: false, error: null }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error }
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null })
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="error-boundary">
          <div className="error-boundary-inner">
            <span className="state-icon"><AlertCircle size={23} /></span>
            <h2>页面出了点问题</h2>
            <p>
            {this.state.error?.message || '发生了未知错误'}
            </p>
            <button className="primary-button" onClick={this.handleReset}>
              <RotateCcw size={15} /> 重试
            </button>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}

function AppRoutes() {
  return useRoutes(routes)
}

function UnhandledRejectionCatcher() {
  useEffect(() => {
    const handler = (event: PromiseRejectionEvent) => {
      console.error('[unhandledrejection]', event.reason)
      event.preventDefault()
    }
    window.addEventListener('unhandledrejection', handler)
    return () => window.removeEventListener('unhandledrejection', handler)
  }, [])

  return null
}

function ThemeProvider({ children }: { children: React.ReactNode }) {
  const theme = useSelector((state: RootState) => state.app.theme)

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
    const themeColor = document.querySelector('meta[name="theme-color"]')
    themeColor?.setAttribute('content', theme === 'dark' ? '#111915' : '#f5f4ef')
  }, [theme])

  return <>{children}</>
}

function App() {
  return (
    <ErrorBoundary>
      <Provider store={store}>
        <BrowserRouter>
          <UnhandledRejectionCatcher />
          <Suspense fallback={<div className="min-h-screen flex items-center justify-center">加载中...</div>}>
            <ThemeProvider>
              <AppRoutes />
            </ThemeProvider>
          </Suspense>
        </BrowserRouter>
      </Provider>
    </ErrorBoundary>
  )
}

export default App
