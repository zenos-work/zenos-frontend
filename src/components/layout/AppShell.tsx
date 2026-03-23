/**
 * AppShell — structural layout using CSS Grid, zero Tailwind dependency.
 *
 * Layout:
 *   [sidebar 240px fixed] [main area flex-1]
 *   On mobile: sidebar hidden, bottom nav shows
 *
 * Why CSS Grid instead of Tailwind flex?
 * Because Tailwind utility classes require the plugin to be generating CSS.
 * CSS Grid written inline always works, even if Tailwind isn't loading.
 */
import { Outlet } from 'react-router-dom'
import { useLocation } from 'react-router-dom'
import { type CSSProperties } from 'react'
import Sidebar   from './Sidebar'
import Topbar    from './Topbar'
import MobileNav from './MobileNav'
import ToastContainer from '../ui/Toast'
import { useUiStore } from '../../stores/uiStore'
import { useAuth } from '../../hooks/useAuth'

export default function AppShell() {
  const { user } = useAuth()
  const location = useLocation()
  const sidebarOpen = useUiStore(s => s.sidebarOpen)
  const sw = sidebarOpen ? 240 : 64   // sidebar width in px
  const isWriteRoute = location.pathname === '/write' || location.pathname.startsWith('/write/')
  const isHomeRoute = location.pathname === '/'
  const isGuest = !user
  const showSidebar = !isGuest && !isWriteRoute
  const showTopbar = !isWriteRoute && (!isGuest || !isHomeRoute)
  const showMobileNav = !isGuest && !isWriteRoute

  const contentStyle: CSSProperties = {
    maxWidth: isWriteRoute ? '1680px' : isGuest ? '1500px' : '1320px',
    padding: isWriteRoute ? '20px 28px 32px' : '24px 20px 80px',
  }

  return (
    <>
      {/* ── Global layout styles injected once ─────────────────── */}
      <style>{`
        .zenos-shell {
          display: flex;
          min-height: 100vh;
          background-color: var(--surface-0);
          color: var(--text-primary);
        }
        .zenos-sidebar {
          position: fixed;
          top: 0; left: 0; bottom: 0;
          z-index: 30;
          display: flex;
          flex-direction: column;
          background-color: var(--surface-1);
          border-right: 1px solid var(--border);
          transition: width 0.25s cubic-bezier(0.4, 0, 0.2, 1);
          overflow: hidden;
        }
        .zenos-main {
          flex: 1;
          display: flex;
          flex-direction: column;
          min-width: 0;
          transition: margin-left 0.25s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .zenos-content {
          flex: 1;
          width: 100%;
          margin: 0 auto;
        }
        /* Mobile: hide sidebar, show bottom nav */
        @media (max-width: 767px) {
          .zenos-sidebar { display: none; }
          .zenos-main    { margin-left: 0 !important; }
          .zenos-content { padding: 20px 16px 100px; }
        }
      `}</style>

      <div className='zenos-shell'>

        {/* ── Sidebar (desktop) ──────────────────────────────────── */}
        {showSidebar && (
          <aside className='zenos-sidebar' style={{ width: sw }}>
            <Sidebar />
          </aside>
        )}

        {/* ── Main area ──────────────────────────────────────────── */}
        <div className='zenos-main' style={{ marginLeft: showSidebar ? sw : 0 }}>
          {showTopbar && <Topbar />}
          <div className='zenos-content' style={contentStyle}>
            <Outlet />
          </div>
        </div>

        {/* ── Mobile bottom nav ─────────────────────────────────── */}
        {showMobileNav && <MobileNav />}

        {/* ── Toasts ───────────────────────────────────────────── */}
        <ToastContainer />
      </div>
    </>
  )
}
