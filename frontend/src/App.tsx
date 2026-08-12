import { Suspense, useEffect, Component, type ReactNode } from 'react'
import { BrowserRouter, useRoutes } from 'react-router-dom'
import { Provider, useSelector } from 'react-redux'
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
        <div style={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'var(--bg-primary, #0f172a)',
          color: 'var(--text-primary, #f8fafc)',
          padding: '32px',
          textAlign: 'center',
        }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>⚠️</div>
          <h2 style={{ fontSize: '20px', fontWeight: 600, marginBottom: '8px' }}>页面出了点问题</h2>
          <p style={{ fontSize: '14px', color: 'var(--text-secondary, #94a3b8)', marginBottom: '24px' }}>
            {this.state.error?.message || '发生了未知错误'}
          </p>
          <button
            onClick={this.handleReset}
            style={{
              padding: '10px 24px',
              background: 'var(--accent, #e94560)',
              color: '#fff',
              border: 'none',
              borderRadius: '8px',
              fontSize: '14px',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            重试
          </button>
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
