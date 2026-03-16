import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'

/**
 * TermsRoute — sits inside ProtectedRoute.
 *
 * If the user is authenticated but has NOT accepted the Writer Content
 * Agreement, redirect them to /terms regardless of where they're trying
 * to navigate. Once accepted, pass through normally.
 *
 * Placement in App.tsx:
 *   <Route element={<ProtectedRoute />}>      ← must be logged in
 *     <Route element={<TermsRoute />}>         ← must have accepted terms
 *       <Route path='/write' ... />
 *       <Route path='/library' ... />
 *       ...all write-access routes...
 *     </Route>
 *   </Route>
 *
 * Public read routes (/, /article/:slug, /search) do NOT require terms
 * acceptance — readers who never write don't need to sign.
 */
export default function TermsRoute() {
  const { user, loading } = useAuth()
  if (loading) return null

  // If terms not yet accepted, redirect to the agreement page
  if (user && !user.terms_accepted_at) {
    return <Navigate to='/terms' replace />
  }

  return <Outlet />
}
