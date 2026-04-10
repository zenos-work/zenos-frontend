import { NavLink } from 'react-router-dom'
import {
  BarChart2,
  Bell,
  BookOpen,
  Bookmark,
  ChevronLeft,
  ChevronRight,
  FileText,
  Home,
  History,
  PenSquare,
  Search,
  Settings,
  Shield,
  Sparkles,
} from 'lucide-react'
import { useAuth } from '../../hooks/useAuth'
import { useFeatureFlag } from '../../hooks/useFeatureFlags'
import { useUiStore } from '../../stores/uiStore'
import Avatar from '../ui/Avatar'

function LogoMark({ open }: { open: boolean }) {
  return open ? (
    <div style={{ display: 'flex', alignItems: 'baseline', gap: 0, userSelect: 'none' }}>
      <span
        style={{
          fontFamily: 'var(--font-display)',
          fontWeight: 700,
          fontSize: 30,
          letterSpacing: '-0.05em',
          color: 'var(--text-primary)',
          lineHeight: 1,
        }}
      >
        Zenos
      </span>
      <span
        style={{
          fontFamily: 'var(--font-display)',
          fontWeight: 600,
          fontSize: 20,
          letterSpacing: '-0.03em',
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
        fontFamily: 'var(--font-display)',
        fontWeight: 700,
        fontSize: 24,
        letterSpacing: '-0.04em',
        color: 'var(--text-primary)',
        userSelect: 'none',
      }}
    >
      Z
    </span>
  )
}

const AUTH_NAV = [
  { to: '/notifications', icon: Bell, label: 'Notifications' },
  { to: '/history', icon: History, label: 'Reading History' },
  { to: '/bookmarks', icon: Bookmark, label: 'Bookmarks' },
  { to: '/library', icon: BookOpen, label: 'Library' },
  { to: '/onboarding/writer', icon: Sparkles, label: 'Writer Onboarding' },
  { to: '/workflow', icon: FileText, label: 'Workflow' },
  { to: '/stats', icon: BarChart2, label: 'Stats' },
  { to: '/settings', icon: Settings, label: 'Settings' },
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
  padding: open ? '10px 14px' : '10px',
  borderRadius: 999,
  marginBottom: 6,
  fontSize: 13,
  fontFamily: 'var(--font-ui)',
  fontWeight: active ? 500 : 400,
  color: active ? 'var(--text-primary)' : 'var(--text-secondary)',
  backgroundColor: active ? 'var(--surface-2)' : 'transparent',
  textDecoration: 'none',
  transition: 'background-color 0.15s, color 0.15s, transform 0.15s',
})

export default function Sidebar() {
  const { user } = useAuth()
  const { enabled: readingListsEnabled } = useFeatureFlag('reading_lists', !!user)
  const { enabled: earningsEnabled } = useFeatureFlag('earnings_dashboard', !!user)
  const { enabled: newslettersEnabled } = useFeatureFlag('newsletters', !!user)
  const { sidebarOpen, toggleSidebar } = useUiStore()
  const open = sidebarOpen
  const canWrite = user && ['AUTHOR', 'APPROVER', 'SUPERADMIN'].includes(user.role)
  const isAdmin = user && ['SUPERADMIN', 'APPROVER'].includes(user.role)
  const navItems = user
    ? [
        ...AUTH_NAV.slice(0, 4),
        ...(readingListsEnabled ? [{ to: '/reading-lists', icon: BookOpen, label: 'Reading Lists' }] : []),
        ...AUTH_NAV.slice(4, 6),
        ...(canWrite && newslettersEnabled ? [{ to: '/newsletters', icon: FileText, label: 'Newsletters' }] : []),
        ...AUTH_NAV.slice(6),
      ]
    : GUEST_NAV

  const navItemsWithEarnings = user && earningsEnabled
    ? [
        ...navItems.slice(0, 7),
        { to: '/earnings', icon: BarChart2, label: 'Earnings' },
        ...navItems.slice(7),
      ]
    : navItems

  return (
    <nav style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden', background: 'var(--surface-5)' }}>
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
        <div style={{ padding: open ? '16px 12px 10px' : '16px 8px 10px', flexShrink: 0 }}>
          <NavLink
            to='/write'
            style={({ isActive }) => ({
              display: 'flex',
              alignItems: 'center',
              gap: open ? 8 : 0,
              justifyContent: open ? 'flex-start' : 'center',
              padding: open ? '10px 16px' : '10px',
              borderRadius: 999,
              backgroundColor: isActive ? 'var(--surface-ink)' : 'var(--surface-warm)',
              color: isActive ? 'var(--surface-ink-foreground)' : 'var(--text-primary)',
              border: '1px solid transparent',
              fontSize: 13,
              fontWeight: 600,
              fontFamily: 'var(--font-ui)',
              textDecoration: 'none',
              transition: 'all 0.15s',
            })}
          >
            <PenSquare size={15} style={{ flexShrink: 0 }} />
            {open && <span>Write</span>}
          </NavLink>
        </div>
      )}

      <div style={{ flex: 1, overflowY: 'auto', padding: open ? '8px 10px' : '8px 6px' }}>
        {open && (
          <p style={{ padding: '0 10px 10px', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.12em', color: 'var(--text-muted)', fontWeight: 700 }}>
            Workspace
          </p>
        )}
        {navItemsWithEarnings.map(({ to, icon: Icon, label }) => (
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
        <div style={{ borderTop: '1px solid var(--border)', padding: open ? '12px' : '8px', flexShrink: 0 }}>
          <NavLink
            to='/settings'
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              padding: '10px 12px',
              borderRadius: 18,
              textDecoration: 'none',
              background: 'var(--surface-1)',
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
                    fontFamily: 'var(--font-ui)',
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
                    fontFamily: 'var(--font-ui)',
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
          background: 'var(--surface-5)',
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
