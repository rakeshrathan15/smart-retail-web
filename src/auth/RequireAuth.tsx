import type { ReactNode } from 'react'
import { Navigate, useLocation } from 'react-router'
import { Spinner } from '../components/ui'
import { useAuth } from './useAuth'

/** Pages that need an account send the visitor to sign in, then back here. */
export function RequireAuth({ children }: { children: ReactNode }) {
  const { state } = useAuth()
  const location = useLocation()
  if (state.status === 'loading') {
    return (
      <div className="py-16 text-center">
        <Spinner />
      </div>
    )
  }
  if (state.status === 'signed-out') {
    const from = location.pathname + location.search
    return <Navigate to={`/login?from=${encodeURIComponent(from)}`} replace />
  }
  return children
}
