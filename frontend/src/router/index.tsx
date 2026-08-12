import { lazy } from 'react'
import { type RouteObject } from 'react-router-dom'
import MainLayout from '@/components/layout/MainLayout'

const lazyLoad = (importFn: () => Promise<{ default: React.ComponentType<any> }>) => {
  return lazy(importFn)
}

const NotFoundPage = lazyLoad(() => import('@/pages/error/NotFound'))
const ErrorPage = lazyLoad(() => import('@/pages/error/Error'))
const HomePage = lazyLoad(() => import('@/pages/home'))
const SurveyPage = lazyLoad(() => import('@/pages/survey'))
const GeneratingPage = lazyLoad(() => import('@/pages/generating'))
const ReportPage = lazyLoad(() => import('@/pages/report'))

export const routes: RouteObject[] = [
  {
    path: '/',
    element: <MainLayout />,
    children: [
      {
        index: true,
        element: <HomePage />,
      },
      {
        path: 'survey',
        element: <SurveyPage />,
      },
      {
        path: 'generating',
        element: <GeneratingPage />,
      },
      {
        path: 'report/:shareCode',
        element: <ReportPage />,
      },
    ],
  },
  {
    path: '/error',
    element: <ErrorPage />,
  },
  {
    path: '*',
    element: <NotFoundPage />,
  },
]
