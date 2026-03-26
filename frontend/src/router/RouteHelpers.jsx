import { Navigate, useParams } from 'react-router-dom'

export function RouteFallback() {
  return (
    <div className="min-h-screen bg-ink p-6 text-paper">
      <div className="mx-auto max-w-7xl space-y-3">
        <div className="skeleton h-8 w-60 rounded" />
        <div className="skeleton h-40 w-full rounded" />
        <div className="grid gap-3 md:grid-cols-2">
          <div className="skeleton h-28 w-full rounded" />
          <div className="skeleton h-28 w-full rounded" />
        </div>
      </div>
    </div>
  )
}

export function MatchAliasRedirect() {
  const { id } = useParams()
  return <Navigate to={`/student/match/${id}`} replace />
}
