import { NavLink } from 'react-router-dom'
import { Home, Search, Bookmark, User, PenSquare, Shield } from 'lucide-react'
import { useAuth } from '../../hooks/useAuth'

export default function MobileNav() {
  const { user } = useAuth()
  const canWrite = user && ['AUTHOR','APPROVER','SUPERADMIN'].includes(user.role)
  const isAdmin = user && ['SUPERADMIN','APPROVER'].includes(user.role)

  const items = user
    ? [
        { to: '/', icon: Home, label: 'Home', end: true },
        { to: '/search', icon: Search, label: 'Search', end: false },
        ...(canWrite ? [{ to: '/write', icon: PenSquare, label: 'Write', end: false }] : []),
        ...(isAdmin ? [{ to: '/admin', icon: Shield, label: 'Admin', end: false }] : []),
        { to: '/bookmarks', icon: Bookmark, label: 'Saved', end: false },
        { to: '/profile', icon: User, label: 'Profile', end: false },
      ]
    : [
        { to: '/', icon: Home, label: 'Home', end: true },
        { to: '/search', icon: Search, label: 'Search', end: false },
        { to: '/login', icon: User, label: 'Login', end: false },
      ]

  return (
    <>
      <style>{`
        .zenos-mobile-nav {
          display: none;
          position: fixed;
          bottom: 0; left: 0; right: 0;
          z-index: 30;
          background: color-mix(in srgb, var(--surface-5) 92%, transparent);
          backdrop-filter: blur(14px);
          border-top: 1px solid var(--border);
          padding-bottom: env(safe-area-inset-bottom, 0);
        }
        @media (max-width: 767px) {
          .zenos-mobile-nav { display: flex; }
        }
        .zenos-mobile-nav a {
          flex: 1;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 10px 4px;
          gap: 2px;
          font-size: 10px;
          font-weight: 600;
          color: var(--text-muted);
          text-decoration: none;
          font-family: var(--font-ui);
          transition: color 0.15s;
        }
        .zenos-mobile-nav a.active,
        .zenos-mobile-nav a[aria-current="page"] {
          color: var(--accent);
        }
      `}</style>
      <nav className='zenos-mobile-nav'>
        {items.map(({ to, icon: Icon, label, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            style={({ isActive }) => ({
              color: isActive ? 'var(--accent)' : 'var(--text-muted)',
            })}
          >
            {({ isActive }) => (
              <>
                <Icon size={20} strokeWidth={isActive ? 2 : 1.5} />
                <span>{label}</span>
              </>
            )}
          </NavLink>
        ))}
      </nav>
    </>
  )
}
