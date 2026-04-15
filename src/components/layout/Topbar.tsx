import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Search, Bell, LogIn, Sun, Moon, PenSquare, Bookmark, BarChart3, Settings, History } from 'lucide-react'
import { useAuth }    from '../../hooks/useAuth'
import { useUiStore } from '../../stores/uiStore'
import { useNotifications } from '../../hooks/useAdmin'
import Avatar         from '../ui/Avatar'

export default function Topbar() {
  const { user, logout }        = useAuth()
  const { setTheme, resolvedTheme }  = useUiStore()
  const navigate                = useNavigate()
  const { data: notificationsData } = useNotifications(!!user)
  const [query, setQuery]       = useState('')
  const [menu, setMenu]         = useState(false)
  const isAdmin                 = !!user && ['SUPERADMIN', 'APPROVER'].includes(user.role)
  const unreadCount = (notificationsData?.notifications ?? []).filter((item) => !item.is_read).length

  const search = (e: React.FormEvent) => {
    e.preventDefault()
    const q = query.trim()
    if (q) navigate(`/search?q=${encodeURIComponent(q)}`)
  }

  return (
    <>
      <style>{`
        .zenos-topbar {
          position: sticky;
          top: 0;
          z-index: 20;
          height: 56px;
          display: flex;
          align-items: center;
          gap: 16px;
          padding: 0 24px;
          background-color: var(--topbar-bg);
          backdrop-filter: blur(16px);
          -webkit-backdrop-filter: blur(16px);
          border-bottom: 1px solid var(--border);
          flex-shrink: 0;
          box-shadow: 0 1px 0 var(--border);
        }
        .zenos-topbar-brand {
          display: inline-flex;
          align-items: center;
          flex-shrink: 0;
          font-family: var(--font-display);
          font-size: 1.8rem;
          font-weight: 700;
          letter-spacing: -0.05em;
          color: var(--text-primary);
        }
        .zenos-topbar-brand-wordmark {
          display: inline-flex;
          align-items: baseline;
          gap: 0;
          line-height: 1;
        }
        .zenos-topbar-brand-work {
          color: var(--accent);
        }
        .zenos-search-wrap {
          flex: 1;
          min-width: 0;
          max-width: 420px;
          position: relative;
        }
        .zenos-search-icon {
          position: absolute; left: 14px; top: 50%;
          transform: translateY(-50%);
          color: var(--text-muted);
          pointer-events: none;
        }
        .zenos-search-input {
          width: 100%;
          padding: 8px 16px 8px 38px;
          border-radius: 999px;
          font-size: 13px;
          font-family: var(--font-ui);
          background: var(--surface-1);
          border: 1px solid var(--border);
          color: var(--text-primary);
          outline: none;
          transition: border-color 0.15s, background-color 0.15s;
        }
        .zenos-search-input::placeholder { color: var(--text-muted); }
        .zenos-search-input:focus {
          border-color: var(--accent);
          background: var(--surface-5);
        }
        .zenos-topbar-right {
          display: flex;
          align-items: center;
          gap: 4px;
          margin-left: auto;
        }
        .zenos-topbar-link {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          border-radius: 999px;
          padding: 7px 12px;
          color: var(--text-muted);
          transition: background-color 0.15s, color 0.15s;
        }
        .zenos-topbar-link:hover {
          background: var(--surface-1);
          color: var(--text-primary);
        }
        .zenos-icon-btn {
          width: 36px;
          height: 36px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 999px;
          cursor: pointer;
          color: var(--text-muted);
          background: none;
          border: none;
          transition: background-color 0.15s, color 0.15s;
        }
        .zenos-icon-btn:hover {
          background-color: var(--surface-1);
          color: var(--text-primary);
        }
        .zenos-dropdown {
          position: absolute;
          right: 0;
          top: 46px;
          z-index: 50;
          width: 220px;
          border-radius: 14px;
          overflow: hidden;
          background: var(--surface-5);
          border: 1px solid var(--border-strong);
          box-shadow: var(--shadow);
          font-family: var(--font-ui);
        }
        .zenos-dropdown-item {
          display: block;
          width: 100%;
          text-align: left;
          padding: 10px 16px;
          font-size: 13px;
          color: var(--text-secondary);
          background: none;
          border: none;
          cursor: pointer;
          transition: background-color 0.1s;
        }
        .zenos-dropdown-item:hover { background-color: var(--surface-1); }
        .zenos-dropdown-item-active {
          color: var(--text-primary);
          background: var(--surface-1);
          font-weight: 600;
        }
        .zenos-signin-btn {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 8px 16px;
          border-radius: 999px;
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
          font-family: var(--font-ui);
          background: var(--surface-ink);
          color: var(--surface-ink-foreground);
          border: 1px solid transparent;
          transition: opacity 0.15s;
        }
        .zenos-signin-btn:hover { opacity: 0.92; }
        @media (max-width: 767px) {
          .zenos-topbar { padding: 0 16px; }
          .zenos-search-wrap { max-width: none; }
          .zenos-topbar-link span { display: none; }
        }
      `}</style>

      <header className='zenos-topbar'>
        {!user && (
          <Link to="/" className='zenos-topbar-brand' style={{ textDecoration: 'none' }}>
            <span className='zenos-topbar-brand-wordmark'>
              Zenos<span className='zenos-topbar-brand-work'>.work</span>
            </span>
          </Link>
        )}

        <form onSubmit={search} className='zenos-search-wrap'>
          <Search size={13} className='zenos-search-icon' />
          <input
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder='Search articles…'
            className='zenos-search-input'
          />
        </form>

        <div className='zenos-topbar-right'>
          {user && (
            <>
              <button className='zenos-topbar-link' onClick={() => navigate('/write')} title='Write'>
                <PenSquare size={15} />
                <span>Write</span>
              </button>
              <button className='zenos-icon-btn' onClick={() => navigate('/bookmarks')} title='Bookmarks'>
                <Bookmark size={16} />
              </button>
              <button className='zenos-icon-btn' onClick={() => navigate('/stats')} title='Stats'>
                <BarChart3 size={16} />
              </button>
              <button className='zenos-icon-btn' onClick={() => navigate('/history')} title='Reading history'>
                <History size={16} />
              </button>
              <button className='zenos-icon-btn' onClick={() => navigate('/settings')} title='Settings'>
                <Settings size={16} />
              </button>
            </>
          )}

          <button
            className='zenos-icon-btn'
            onClick={() => setTheme(resolvedTheme === 'light' ? 'dark' : 'light')}
            aria-label='Toggle theme'
            title='Toggle theme'
          >
            {resolvedTheme === 'light' ? <Moon size={16} /> : <Sun size={16} />}
          </button>

          {user ? (
            <>
              <button className='zenos-icon-btn' onClick={() => navigate('/notifications')} title='Notifications' style={{ position: 'relative' }}>
                <Bell size={16} />
                {unreadCount > 0 && (
                  <span
                    style={{
                      position: 'absolute',
                      top: 2,
                      right: 3,
                      minWidth: 14,
                      height: 14,
                      borderRadius: 999,
                      background: 'var(--accent)',
                      color: '#fff',
                      fontSize: 9,
                      fontWeight: 700,
                      display: 'grid',
                      placeItems: 'center',
                      padding: '0 3px',
                    }}
                  >
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </button>

              <div style={{ position: 'relative' }}>
                <button
                  style={{
                    background: 'none', border: 'none', cursor: 'pointer', padding: 0,
                    borderRadius: '50%',
                    outline: menu ? '2px solid var(--accent)' : 'none',
                    outlineOffset: 2, display: 'flex',
                  }}
                  onClick={() => setMenu((v: boolean) => !v)}
                >
                  <Avatar name={user.name} src={user.avatar_url} size='sm' />
                </button>

                {menu && (
                  <>
                    <div style={{ position: 'fixed', inset: 0, zIndex: 40 }} onClick={() => setMenu(false)} />
                    <div className='zenos-dropdown'>
                      <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)' }}>
                        <p style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {user.name}
                        </p>
                        <p style={{ fontSize: 11, color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {user.email}
                        </p>
                      </div>
                      {[
                        ['Settings', '/settings'],
                        ['Writer onboarding', '/onboarding/writer'],
                        ['Library', '/library'],
                        ['Reading history', '/history'],
                        ['Workflow', '/workflow'],
                        ['Stats', '/stats'],
                        ...(isAdmin ? [['Admin', '/admin']] : []),
                      ].map(([label, path]) => (
                        <button key={label} className='zenos-dropdown-item' onClick={() => { navigate(path); setMenu(false) }}>
                          {label}
                        </button>
                      ))}
                      <div style={{ borderTop: '1px solid var(--border)', marginTop: 4 }}>
                        <button className='zenos-dropdown-item' style={{ color: '#dc2626' }}
                          onClick={async () => {
                            await logout()
                            setMenu(false)
                            navigate('/', { replace: true })
                          }}>
                          Sign out
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </>
          ) : (
            <button className='zenos-signin-btn' onClick={() => navigate('/login')}>
              <LogIn size={13} /> Sign in
            </button>
          )}
        </div>
      </header>
    </>
  )
}
