import { Link } from 'react-router-dom'

export default function NotFoundPage() {
  return (
    <div className="mx-auto max-w-md text-center">
      <p className="text-6xl font-bold text-primary">404</p>
      <h1 className="mt-4 text-xl font-semibold">Page not found</h1>
      <p className="mt-2 text-slate-500">The page you’re looking for doesn’t exist.</p>
      <Link to="/" className="mt-6 inline-block font-medium text-primary hover:underline">
        Back home
      </Link>
    </div>
  )
}
