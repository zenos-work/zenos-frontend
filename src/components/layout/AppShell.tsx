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
import { useEffect, type CSSProperties } from 'react'
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
  const showSidebar = !isGuest
  const showTopbar = !isWriteRoute && (!isGuest || !isHomeRoute)
  const showMobileNav = !isGuest && !isWriteRoute

  useEffect(() => {
    if (location.pathname.startsWith('/article/')) return

    const defaults = {
      title: 'Zenos.work | Write, Review, Publish',
      description: 'Zenos is an editorial platform for writing, approvals, and governed publishing workflows.',
      image: `${window.location.origin}/favicon.svg`,
      canonical: `${window.location.origin}${location.pathname}${location.search}`,
    }

    const routeMeta: Record<string, { title: string; description: string }> = {
      '/': {
        title: 'Zenos.work | Stories Worth Opening First',
        description: 'Discover curated stories and publish with modern editorial governance on Zenos.',
      },
      '/search': {
        title: 'Search | Zenos.work',
        description: 'Search stories, tags, and authors across the Zenos platform.',
      },
      '/library': {
        title: 'Library | Zenos.work',
        description: 'Manage your drafts, submitted stories, and published work in one place.',
      },
      '/write': {
        title: 'Write | Zenos.work',
        description: 'Write and edit stories with built-in SEO, moderation workflow, and publishing controls.',
      },
      '/bookmarks': {
        title: 'Bookmarks | Zenos.work',
        description: 'Revisit stories you saved for later reading.',
      },
      '/membership': {
        title: 'Membership | Zenos.work',
        description: 'Explore Zenos membership plans for writers and editorial teams.',
      },
      '/notifications': {
        title: 'Notifications | Zenos.work',
        description: 'Track approvals, moderation updates, and publishing events.',
      },
      '/stats': {
        title: 'Stats | Zenos.work',
        description: 'Monitor article performance, engagement, and growth analytics.',
      },
      '/admin': {
        title: 'Admin | Zenos.work',
        description: 'Admin tools for governance, moderation, and platform operations.',
      },
    }

    const matched = Object.entries(routeMeta)
      .sort((a, b) => b[0].length - a[0].length)
      .find(([path]) => location.pathname === path || location.pathname.startsWith(`${path}/`))

    const meta = matched?.[1] ?? defaults
    document.title = meta.title

    const ensureMeta = (key: string, value: string, attr: 'name' | 'property' = 'name') => {
      let tag = document.head.querySelector(`meta[${attr}="${key}"]`) as HTMLMetaElement | null
      if (!tag) {
        tag = document.createElement('meta')
        tag.setAttribute(attr, key)
        document.head.appendChild(tag)
      }
      tag.setAttribute('content', value)
    }

    const ensureCanonical = (href: string) => {
      let tag = document.head.querySelector('link[rel="canonical"]') as HTMLLinkElement | null
      if (!tag) {
        tag = document.createElement('link')
        tag.setAttribute('rel', 'canonical')
        document.head.appendChild(tag)
      }
      tag.setAttribute('href', href)
    }

    ensureMeta('description', meta.description)
    ensureMeta('og:title', meta.title, 'property')
    ensureMeta('og:description', meta.description, 'property')
    ensureMeta('og:type', 'website', 'property')
    ensureMeta('og:url', defaults.canonical, 'property')
    ensureMeta('og:image', defaults.image, 'property')
    ensureMeta('twitter:card', 'summary_large_image')
    ensureMeta('twitter:title', meta.title)
    ensureMeta('twitter:description', meta.description)
    ensureMeta('twitter:image', defaults.image)
    ensureCanonical(defaults.canonical)
  }, [location.pathname, location.search])

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
