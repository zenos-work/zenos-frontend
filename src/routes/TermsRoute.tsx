import { Outlet } from 'react-router-dom'

/**
 * TermsRoute remains in the tree as a pass-through wrapper.
 *
 * Terms acceptance is now recorded automatically during sign-in, so routes no
 * longer need a post-login redirect gate before writers can continue.
 */
export default function TermsRoute() {
  return <Outlet />
}
