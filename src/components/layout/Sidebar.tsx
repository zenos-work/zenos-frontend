import { NavLink } from 'react-router-dom'
import { Bookmark, User, BookOpen, BarChart2, PenSquare, Shield, ChevronLeft, ChevronRight } from 'lucide-react'
import { useAuth }    from '../../hooks/useAuth'
import { useUiStore } from '../../stores/uiStore'
import Avatar         from '../ui/Avatar'

// ── Logo ─────────────────────────────────────────────────────────────────────
// TO ADD LOGOS: copy logo_light.png (for light theme) and logo_dark.png (for dark)
// into src/assets/, then uncomment the imports below and swap LogoMark for LogoImage.
//
// import logoLight from '../../assets/logo_light.png'
// import logoDark  from '../../assets/logo_dark.png'

/** Text fallback — replace with <LogoImage /> once assets are in place */
function LogoMark({ open, theme }: { open: boolean; theme: 'light' | 'dark' }) {
  return open ? (
    <div style={{ display: 'flex', alignItems: 'baseline', gap: 2, userSelect: 'none' }}>
      <span style={{
        fontFamily: "'Syne', system-ui, sans-serif",
        fontWeight: 800, fontSize: 22, letterSpacing: '-0.06em',
        color: 'var(--text-primary)',
      }}>ZENOS</span>
      <span style={{
        fontFamily: "'Syne', system-ui, sans-serif",
        fontWeight: 400, fontSize: 16, letterSpacing: '-0.02em',
        color: 'var(--accent)',
      }}>.work</span>
    </div>
  ) : (
    <span style={{
      fontFamily: "'Syne', system-ui, sans-serif",
      fontWeight: 800, fontSize: 20, letterSpacing: '-0.06em',
      color: 'var(--text-primary)', userSelect: 'none',
    }}>ZZ</span>
  )
}

const NAV = [
  { to: '/bookmarks', icon: Bookmark,  label: 'Bookmarks' },
  { to: '/library',   icon: BookOpen,  label: 'Library'   },
  { to: '/stats',     icon: BarChart2, label: 'Stats'     },
  { to: '/profile',   icon: User,      label: 'Profile'   },
]

const navStyle = (open: boolean, active: boolean): React.CSSProperties => ({
  display: 'flex', alignItems: 'center',
  gap: open ? 10 : 0,
  justifyContent: open ? 'flex-start' : 'center',
  padding: open ? '9px 12px' : '9px',
  borderRadius: 8, marginBottom: 2,
  fontSize: 14,
  fontFamily: "'DM Sans', system-ui, sans-serif",
  fontWeight: active ? 500 : 400,
  color: active ? 'var(--text-primary)' : 'var(--text-secondary)',
  backgroundColor: active ? 'var(--surface-3)' : 'transparent',
  textDecoration: 'none',
  transition: 'background-color 0.15s, color 0.15s',
})

export default function Sidebar() {
  const { user }                       = useAuth()
  const { sidebarOpen, toggleSidebar, theme } = useUiStore()
  const open     = sidebarOpen
  const canWrite = user && ['AUTHOR','APPROVER','SUPERADMIN'].includes(user.role)
  const isAdmin  = user && ['SUPERADMIN','APPROVER'].includes(user.role)

  return (
    <nav style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>

      {/* Logo */}
      <div style={{
        height: 56, display: 'flex', alignItems: 'center', flexShrink: 0,
        justifyContent: open ? 'flex-start' : 'center',
        padding: open ? '0 20px' : 0,
        borderBottom: '1px solid var(--border)',
      }}>
        <LogoMark open={open} theme={theme} />
      </div>

      {/* Write button */}
      {canWrite && (
        <div style={{ padding: open ? '14px 10px 6px' : '14px 8px 6px', flexShrink: 0 }}>
          <NavLink to='/write' style={({ isActive }) => ({
            display: 'flex', alignItems: 'center',
            gap: open ? 8 : 0,
            justifyContent: open ? 'flex-start' : 'center',
            padding: open ? '9px 14px' : '9px',
            borderRadius: 8,
            backgroundColor: isActive ? 'var(--accent)' : 'var(--accent-dim)',
            color: isActive ? '#fff' : 'var(--accent)',
            border: '1px solid',
            borderColor: isActive ? 'var(--accent)' : 'rgba(166,124,60,0.3)',
            fontSize: 13, fontWeight: 600,
            fontFamily: "'DM Sans', system-ui, sans-serif",
            textDecoration: 'none', transition: 'all 0.15s',
          })}>
            <PenSquare size={15} style={{ flexShrink: 0 }} />
            {open && <span>Write</span>}
          </NavLink>
        </div>
      )}

      {/* Nav links */}
      <div style={{ flex: 1, overflowY: 'auto', padding: open ? '4px 8px' : '4px 6px' }}>
        {NAV.map(({ to, icon: Icon, label }) => (
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
          <NavLink to='/admin' style={({ isActive }) => ({
            ...navStyle(open, isActive),
            marginTop: 8, paddingTop: 11,
            borderTop: '1px solid var(--border)',
            color: isActive ? 'var(--accent)' : 'var(--text-muted)',
          })}>
            {({ isActive }) => (
              <>
                <Shield size={17} style={{ flexShrink: 0, color: isActive ? 'var(--accent)' : 'inherit' }} />
                {open && <span>Admin</span>}
              </>
            )}
          </NavLink>
        )}
      </div>

      {/* User footer */}
      {user && (
        <div style={{ borderTop: '1px solid var(--border)', padding: open ? '10px' : '8px', flexShrink: 0 }}>
          <NavLink to='/profile' style={{
            display: 'flex', alignItems: 'center', gap: 10,
            padding: '6px 8px', borderRadius: 8, textDecoration: 'none',
          }}>
            <Avatar name={user.name} src={user.avatar_url} size='sm' />
            {open && (
              <div style={{ minWidth: 0, flex: 1 }}>
                <p style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontFamily: "'DM Sans', system-ui, sans-serif" }}>
                  {user.name}
                </p>
                <p style={{ fontSize: 11, color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontFamily: "'DM Sans', system-ui, sans-serif" }}>
                  {user.role}
                </p>
              </div>
            )}
          </NavLink>
        </div>
      )}

      {/* Collapse toggle */}
      <button
        onClick={toggleSidebar}
        style={{
          height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center',
          borderTop: '1px solid var(--border)', color: 'var(--text-muted)',
          background: 'none', cursor: 'pointer', flexShrink: 0, transition: 'color 0.15s',
        }}
        onMouseEnter={e => (e.currentTarget.style.color = 'var(--text-primary)')}
        onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-muted)')}
      >
        {open ? <ChevronLeft size={15} /> : <ChevronRight size={15} />}
      </button>
    </nav>
  )
}
