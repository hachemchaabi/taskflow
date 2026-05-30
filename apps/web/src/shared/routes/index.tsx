import { Suspense, Fragment } from 'react'
import { Routes, Route, RouteProps } from 'react-router-dom'
import pages from './routes'
import LazyLoad from '../components/LazyLoad'

type WithChildren = { children: React.ReactNode }

export type RouteConfig = {
  exact: boolean | null
  path: string
  component: React.ComponentType
  guard?: React.ComponentType<WithChildren> | typeof Fragment
  layout?: React.ComponentType<WithChildren> | typeof Fragment
} & RouteProps

export const renderRoutes = (routes: RouteConfig[] = []) => (
  <Routes>
    {routes.map((route, index) => {
      const Component = route.component
      const Guard = route?.guard || Fragment
      const Layout = route?.layout || Fragment

      return (
        <Route
          key={index}
          path={route.path}
          element={
            <Guard>
              <Layout>
                <Suspense fallback={<LazyLoad />}>
                  <Component />
                </Suspense>
              </Layout>
            </Guard>
          }
        />
      )
    })}
  </Routes>
)

const routes: RouteConfig[] = [...pages]

export default routes
