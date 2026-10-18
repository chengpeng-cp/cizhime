import { Outlet, useNavigate } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { Home, Moon, Sun } from 'lucide-react'
import { setTheme } from '@/store/modules/app'
import type { RootState } from '@/store'

export default function MainLayout() {
  const navigate = useNavigate()
  const dispatch = useDispatch()
  const { theme } = useSelector((state: RootState) => state.app)

  const handleToggleTheme = () => {
    dispatch(setTheme(theme === 'dark' ? 'light' : 'dark'))
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-900 text-gray-900 dark:text-gray-100">
      {/* 顶部导航栏 */}
      <header className="sticky top-0 z-50 bg-white dark:bg-slate-800 border-b border-gray-200 dark:border-slate-700 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/')}
              className="flex items-center gap-2 text-lg font-semibold text-amber-600 dark:text-amber-400 hover:opacity-80"
            >
              <Home size={20} />
              <span>辞职么</span>
            </button>
          </div>

          <div className="flex items-center gap-4">
            <button
              onClick={handleToggleTheme}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors"
            >
              {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
            </button>
          </div>
        </div>
      </header>

      {/* 主内容区 */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <Outlet />
      </main>
    </div>
  )
}
