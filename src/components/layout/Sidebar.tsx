import { NavLink } from 'react-router-dom'
import {
  BarChart2,
  BookOpen,
  Bookmark,
  ChevronLeft,
  ChevronRight,
  Home,
  PenSquare,
  Search,
  Shield,
  User,
} from 'lucide-react'
import { useAuth } from '../../hooks/useAuth'
import { useUiStore } from '../../stores/uiStore'
import Avatar from '../ui/Avatar'

function LogoMark({ open }: { open: boolean }) {
  return open ? (
    <div style={{ display: 'flex', alignItems: 'baseline', gap: 2, userSelect: 'none' }}>
      <span
        style={{
          fontFamily: "'Syne', system-ui, sans-serif",
          fontWeight: 750,
          fontSize: 23,
          letterSpacing: '-0.06em',
          color: 'var(--text-primary)',
          lineHeight: 1,
        }}
      >
        Z
      </span>
      <span
        style={{
          fontFamily: "'Syne', system-ui, sans-serif",
          fontWeight: 700,
          fontSize: 20,
          letterSpacing: '-0.04em',
          color: 'var(--text-primary)',
          lineHeight: 1,
        }}
      >
        ENOS
      </span>
      <span
        style={{
          fontFamily: "'Syne', system-ui, sans-serif",
          fontWeight: 500,
          fontSize: 15,
          letterSpacing: '-0.02em',
          color: 'var(--accent)',
          lineHeight: 1,
        }}
      >
        .work
      </span>
    </div>
  ) : (
    <span
      style={{
        fontFamily: "'Syne', system-ui, sans-serif",
        fontWeight: 800,
        fontSize: 20,
        letterSpacing: '-0.06em',
        color: 'var(--text-primary)',
        userSelect: 'none',
      }}
    >
      Z
    </span>
  )
}

const AUTH_NAV = [
  { to: '/bookmarks', icon: Bookmark, label: 'Bookmarks' },
  { to: '/library', icon: BookOpen, label: 'Library' },
  { to: '/stats', icon: BarChart2, label: 'Stats' },
  { to: '/profile', icon: User, label: 'Profile' },
]

const GUEST_NAV = [
  { to: '/', icon: Home, label: 'Home' },
  { to: '/search', icon: Search, label: 'Search' },
]

const navStyle = (open: boolean, active: boolean): React.CSSProperties => ({
  display: 'flex',
  alignItems: 'center',
  gap: open ? 10 : 0,
  justifyContent: open ? 'flex-start' : 'center',
  padding: open ? '9px 12px' : '9px',
  borderRadius: 8,
  marginBottom: 2,
  fontSize: 14,
  fontFamily: "'DM Sans', system-ui, sans-serif",
  fontWeight: active ? 500 : 400,
  color: active ? 'var(--text-primary)' : 'var(--text-secondary)',
  backgroundColor: active ? 'var(--surface-3)' : 'transparent',
  textDecoration: 'none',
  transition: 'background-color 0.15s, color 0.15s',
})

export default function Sidebar() {
  const { user } = useAuth()
  const { sidebarOpen, toggleSidebar } = useUiStore()
  const open = sidebarOpen
  const canWrite = user && ['AUTHOR', 'APPROVER', 'SUPERADMIN'].includes(user.role)
  const isAdmin = user && ['SUPERADMIN', 'APPROVER'].includes(user.role)
  const navItems = user ? AUTH_NAV : GUEST_NAV

  return (
    <nav style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      <div
        style={{
          height: 56,
          display: 'flex',
          alignItems: 'center',
          flexShrink: 0,
          justifyContent: open ? 'flex-start' : 'center',
          padding: open ? '0 20px' : 0,
          borderBottom: '1px solid var(--border)',
        }}
      >
        <NavLink to='/' style={{ display: 'flex', alignItems: 'center', textDecoration: 'none' }}>
          <LogoMark open={open} />
        </NavLink>
      </div>

      {canWrite && (
        <div style={{ padding: open ? '14px 10px 6px' : '14px 8px 6px', flexShrink: 0 }}>
          <NavLink
            to='/write'
            style={({ isActive }) => ({
              display: 'flex',
              alignItems: 'center',
              gap: open ? 8 : 0,
              justifyContent: open ? 'flex-start' : 'center',
              padding: open ? '9px 14px' : '9px',
              borderRadius: 8,
              backgroundColor: isActive ? 'var(--accent)' : 'var(--accent-dim)',
              color: isActive ? '#fff' : 'var(--accent)',
              border: '1px solid',
              borderColor: isActive ? 'var(--accent)' : 'rgba(166,124,60,0.3)',
              fontSize: 13,
              fontWeight: 600,
              fontFamily: "'DM Sans', system-ui, sans-serif",
              textDecoration: 'none',
              transition: 'all 0.15s',
            })}
          >
            <PenSquare size={15} style={{ flexShrink: 0 }} />
            {open && <span>Write</span>}
          </NavLink>
        </div>
      )}

      <div style={{ flex: 1, overflowY: 'auto', padding: open ? '4px 8px' : '4px 6px' }}>
        {navItems.map(({ to, icon: Icon, label }) => (
          <NavLink key={to} to={to} style={({ isActive }) => navStyle(open, isActive)}>
            {({ isActive }) => (
              <>
                <Icon size={17} style={{ flexShrink: 0, color: isActive ? 'var(--accent)' : 'inherit' }} />
                {open && <span>{label}</span>}
              </>
            )}
          </NavLink>
        ))}

        {isAdmin && (
          <NavLink
            to='/admin'
            style={({ isActive }) => ({
              ...navStyle(open, isActive),
              marginTop: 8,
              paddingTop: 11,
              borderTop: '1px solid var(--border)',
              color: isActive ? 'var(--accent)' : 'var(--text-muted)',
            })}
          >
            {({ isActive }) => (
              <>
                <Shield size={17} style={{ flexShrink: 0, color: isActive ? 'var(--accent)' : 'inherit' }} />
                {open && <span>Admin</span>}
              </>
            )}
          </NavLink>
        )}
      </div>

      {user && (
        <div style={{ borderTop: '1px solid var(--border)', padding: open ? '10px' : '8px', flexShrink: 0 }}>
          <NavLink
            to='/profile'
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              padding: '6px 8px',
              borderRadius: 8,
              textDecoration: 'none',
            }}
          >
            <Avatar name={user.name} src={user.avatar_url} size='sm' />
            {open && (
              <div style={{ minWidth: 0, flex: 1 }}>
                <p
                  style={{
                    fontSize: 12,
                    fontWeight: 500,
                    color: 'var(--text-primary)',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                    fontFamily: "'DM Sans', system-ui, sans-serif",
                  }}
                >
                  {user.name}
                </p>
                <p
                  style={{
                    fontSize: 11,
                    color: 'var(--text-muted)',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                    fontFamily: "'DM Sans', system-ui, sans-serif",
                  }}
                >
                  {user.role}
                </p>
              </div>
            )}
          </NavLink>
        </div>
      )}

      <button
        onClick={toggleSidebar}
        style={{
          height: 40,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          borderTop: '1px solid var(--border)',
          color: 'var(--text-muted)',
          background: 'none',
          cursor: 'pointer',
          flexShrink: 0,
          transition: 'color 0.15s',
        }}
        onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--text-primary)')}
        onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-muted)')}
      >
        {open ? <ChevronLeft size={15} /> : <ChevronRight size={15} />}
      </button>
    </nav>
  )
}
