import routes, { renderRoutes } from './shared/routes'

export default function App() {
  return <main className="app">{renderRoutes(routes)}</main>
}
