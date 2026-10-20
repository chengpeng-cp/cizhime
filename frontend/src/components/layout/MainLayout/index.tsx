import { Outlet, useLocation, useNavigate } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { ArrowRight, Moon, Sun, Sparkles } from 'lucide-react'
import { setTheme } from '@/store/modules/app'
import type { RootState } from '@/store'

export default function MainLayout() {
  const navigate = useNavigate()
  const location = useLocation()
  const dispatch = useDispatch()
  const { theme } = useSelector((state: RootState) => state.app)
  const isHome = location.pathname === '/'

  const handleToggleTheme = () => {
    dispatch(setTheme(theme === 'dark' ? 'light' : 'dark'))
  }

  return (
    <div className="app-shell">
      <header className="site-header">
        <div className="site-header-inner">
          <button className="brand-lockup" onClick={() => navigate('/')} aria-label="辞职么，返回首页">
            <span className="brand-mark"><Sparkles size={17} strokeWidth={2.2} /></span>
            <span className="brand-name">辞职么<span className="brand-period">.</span></span>
          </button>

          <div className="header-actions">
            {!isHome && <span className="header-caption">给职业选择，多一点清醒</span>}
            <button
              className="theme-toggle"
              onClick={handleToggleTheme}
              aria-label={theme === 'dark' ? '切换到浅色主题' : '切换到深色主题'}
              title={theme === 'dark' ? '切换到浅色主题' : '切换到深色主题'}
            >
              {theme === 'dark' ? <Sun size={17} /> : <Moon size={17} />}
            </button>
            {!isHome && (
              <button className="header-cta" onClick={() => navigate('/survey')}>
                开始测评 <ArrowRight size={15} />
              </button>
            )}
          </div>
        </div>
      </header>

      <main className="site-main">
        <Outlet />
      </main>

      <footer className="site-footer">
        <span>辞职么 · 把职业选择想清楚一点</span>
        <span>你的工作值得被认真对待</span>
      </footer>
    </div>
  )
}
