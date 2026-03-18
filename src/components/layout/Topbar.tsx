import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, Bell, LogIn, Sun, Moon } from 'lucide-react'
import { useAuth }    from '../../hooks/useAuth'
import { useUiStore } from '../../stores/uiStore'
import Avatar         from '../ui/Avatar'

export default function Topbar() {
  const { user, logout }        = useAuth()
  const { toggleTheme, theme }  = useUiStore()
  const navigate                = useNavigate()
  const [query, setQuery]       = useState('')
  const [menu, setMenu]         = useState(false)
  const isAdmin                 = !!user && ['SUPERADMIN', 'APPROVER'].includes(user.role)

  const search = (e: React.FormEvent) => {
    e.preventDefault()
    const q = query.trim()
    if (q) navigate(`/search?q=${encodeURIComponent(q)}`)
  }

  return (
    <>
      <style>{`
        .zenos-topbar {
          position: sticky; top: 0; z-index: 20;
          height: 56px; display: flex; align-items: center;
          gap: 12px; padding: 0 24px;
          /* Uses CSS var — adapts to light/dark theme */
          background-color: var(--topbar-bg);
          backdrop-filter: blur(16px);
          -webkit-backdrop-filter: blur(16px);
          border-bottom: 1px solid var(--border);
          flex-shrink: 0;
          box-shadow: var(--shadow);
        }
        .zenos-topbar-brand {
          display: none;
          align-items: center;
          flex-shrink: 0;
          border: none;
          background: none;
          padding: 0;
          cursor: pointer;
          user-select: none;
        }
        .zenos-topbar-brand-wordmark {
          display: inline-flex;
          align-items: baseline;
          gap: 1px;
          line-height: 1;
        }
        .zenos-topbar-brand-z {
          font-family: 'Syne', system-ui, sans-serif;
          font-weight: 800;
          font-size: 22px;
          letter-spacing: -0.06em;
          color: var(--text-primary);
        }
        .zenos-topbar-brand-enos {
          font-family: 'Syne', system-ui, sans-serif;
          font-weight: 700;
          font-size: 15px;
          letter-spacing: -0.04em;
          color: var(--text-primary);
        }
        .zenos-topbar-brand-work {
          font-family: 'Syne', system-ui, sans-serif;
          font-weight: 500;
          font-size: 13px;
          letter-spacing: -0.02em;
          color: var(--accent);
        }
        .zenos-search-wrap { flex: 1; min-width: 0; max-width: 380px; position: relative; }
        .zenos-search-icon {
          position: absolute; left: 10px; top: 50%;
          transform: translateY(-50%);
          color: var(--text-muted); pointer-events: none;
        }
        .zenos-search-input {
          width: 100%; padding: 7px 14px 7px 34px;
          border-radius: 8px; font-size: 13px;
          font-family: 'DM Sans', system-ui, sans-serif;
          background: var(--surface-2);
          border: 1px solid var(--border);
          color: var(--text-primary); outline: none;
          transition: border-color 0.15s, background-color 0.15s;
        }
        .zenos-search-input::placeholder { color: var(--text-muted); }
        .zenos-search-input:focus {
          border-color: var(--accent);
          background: var(--surface-1);
        }
        .zenos-topbar-right { display: flex; align-items: center; gap: 6px; margin-left: auto; }
        .zenos-icon-btn {
          width: 34px; height: 34px; display: flex; align-items: center; justify-content: center;
          border-radius: 8px; cursor: pointer;
          color: var(--text-secondary); background: none; border: none;
          transition: background-color 0.15s, color 0.15s;
        }
        .zenos-icon-btn:hover { background-color: var(--surface-3); color: var(--text-primary); }
        .zenos-dropdown {
          position: absolute; right: 0; top: 46px; z-index: 50;
          width: 200px; border-radius: 12px; overflow: hidden;
          background: var(--surface-1);
          border: 1px solid var(--border-strong);
          box-shadow: var(--shadow);
          font-family: 'DM Sans', system-ui, sans-serif;
        }
        .zenos-dropdown-item {
          display: block; width: 100%; text-align: left;
          padding: 9px 16px; font-size: 13px;
          color: var(--text-secondary); background: none; border: none; cursor: pointer;
          transition: background-color 0.1s;
        }
        .zenos-dropdown-item:hover { background-color: var(--surface-2); }
        .zenos-signin-btn {
          display: flex; align-items: center; gap: 6px;
          padding: 7px 14px; border-radius: 8px;
          font-size: 13px; font-weight: 500; cursor: pointer;
          font-family: 'DM Sans', system-ui, sans-serif;
          background: var(--accent-dim); color: var(--accent);
          border: 1px solid rgba(166,124,60,0.25);
          transition: background-color 0.15s;
        }
        .zenos-signin-btn:hover { background: rgba(166,124,60,0.18); }
        @media (max-width: 767px) {
          .zenos-topbar { padding: 0 16px; }
          .zenos-topbar-brand { display: inline-flex; }
        }
      `}</style>

      <header className='zenos-topbar'>
        <button className='zenos-topbar-brand' onClick={() => navigate('/')} title='Go to home'>
          <span className='zenos-topbar-brand-wordmark'>
            <span className='zenos-topbar-brand-z'>Z</span>
            <span className='zenos-topbar-brand-enos'>enos</span>
            <span className='zenos-topbar-brand-work'>.work</span>
          </span>
        </button>

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
          {/* Theme toggle */}
          <button className='zenos-icon-btn' onClick={toggleTheme} title={`Switch to ${theme === 'light' ? 'dark' : 'light'} theme`}>
            {theme === 'light' ? <Moon size={16} /> : <Sun size={16} />}
          </button>

          {user ? (
            <>
              <button className='zenos-icon-btn' onClick={() => navigate('/profile')}>
                <Bell size={16} />
              </button>

              <div style={{ position: 'relative' }}>
                <button
                  style={{
                    background: 'none', border: 'none', cursor: 'pointer', padding: 0,
                    borderRadius: '50%',
                    outline: menu ? '2px solid var(--accent)' : 'none',
                    outlineOffset: 2, display: 'flex',
                  }}
                  onClick={() => setMenu(v => !v)}
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
                        ['Profile', '/profile'],
                        ['Library', '/library'],
                        ['Stats', '/stats'],
                        ...(isAdmin ? [['Admin', '/admin']] : []),
                      ].map(([label, path]) => (
                        <button key={label} className='zenos-dropdown-item' onClick={() => { navigate(path); setMenu(false) }}>
                          {label}
                        </button>
                      ))}
                      <div style={{ borderTop: '1px solid var(--border)', marginTop: 4 }}>
                        <button className='zenos-dropdown-item' style={{ color: '#dc2626' }}
                          onClick={() => { logout(); setMenu(false) }}>
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
