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
import { Link, Outlet } from 'react-router-dom'
import { useLocation } from 'react-router-dom'
import { useEffect, useState, type CSSProperties } from 'react'
import Sidebar   from './Sidebar'
import Topbar    from './Topbar'
import MobileNav from './MobileNav'
import ToastContainer from '../ui/Toast'
import FeatureAnnouncementBanner from '../ui/FeatureAnnouncementBanner'
import { useUiStore } from '../../stores/uiStore'
import { useAuth } from '../../hooks/useAuth'
import { useFeatureFlags, type FeatureFlagEvaluation } from '../../hooks/useFeatureFlags'
import { useMyOrgs } from '../../hooks/useOrg'
import { trackEvent } from '../../lib/observability'

type AnnouncementState = {
  key: string
  title: string
  summary?: string
  actionRequired?: string
  version: string
}

const readSeenMap = () => {
  if (typeof window === 'undefined') return {}
  try {
    const value = window.localStorage.getItem('zenos_feature_announcements_seen')
    if (!value) return {}
    const parsed = JSON.parse(value)
    if (!parsed || typeof parsed !== 'object') return {}
    return parsed as Record<string, string>
  } catch {
    return {}
  }
}

const saveSeenMap = (value: Record<string, string>) => {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.setItem('zenos_feature_announcements_seen', JSON.stringify(value))
  } catch {
    // Ignore localStorage errors in constrained environments.
  }
}

const channelsFor = (flag: FeatureFlagEvaluation): string[] => {
  const announcementChannels = flag.metadata?.announcement?.channels
  if (Array.isArray(announcementChannels) && announcementChannels.length > 0) return announcementChannels
  const deliveryChannels = flag.metadata?.delivery?.channels
  if (Array.isArray(deliveryChannels) && deliveryChannels.length > 0) return deliveryChannels
  return ['in_app']
}

const buildAnnouncement = (
  flag: FeatureFlagEvaluation,
  action: 'enabled' | 'disabled',
): AnnouncementState => {
  const announcement = flag.metadata?.announcement
  const defaultTitle = action === 'enabled' ? `Feature enabled: ${flag.key}` : `Feature disabled: ${flag.key}`
  const defaultSummary = action === 'enabled'
    ? 'A new capability is now available in your workspace.'
    : 'This capability has been turned off for your workspace.'

  const title = action === 'enabled'
    ? announcement?.enabled_title || announcement?.title || defaultTitle
    : announcement?.disabled_title || announcement?.title || defaultTitle

  const summary = action === 'enabled'
    ? announcement?.enabled_summary || announcement?.summary || defaultSummary
    : announcement?.disabled_summary || announcement?.summary || defaultSummary

  return {
    key: flag.key,
    title,
    summary,
    actionRequired: announcement?.action_required,
    version: announcement?.effective_at || 'v1',
  }
}

export default function AppShell() {
  const { user } = useAuth()
  const location = useLocation()
  const sidebarOpen = useUiStore(s => s.sidebarOpen)
  const toast = useUiStore(s => s.toast)
  const { list: featureFlags } = useFeatureFlags(!!user)
  const organizationsEnabled = featureFlags.some((flag) => flag.key === 'organizations' && flag.enabled)
  const orgsQuery = useMyOrgs(!!user && organizationsEnabled)
  const primaryOrg = orgsQuery.data?.organizations?.[0]
  const [announcement, setAnnouncement] = useState<AnnouncementState | null>(null)
  const sw = sidebarOpen ? 240 : 64   // sidebar width in px
  const isWriteRoute = location.pathname === '/write' || location.pathname.startsWith('/write/')
  const isHomeRoute = location.pathname === '/'
  const isGuest = !user
  const isGuestHomeRoute = isGuest && isHomeRoute
  const showSidebar = !isGuest
  const showTopbar = !isWriteRoute && (!isGuest || !isHomeRoute)
  const showMobileNav = !isGuest && !isWriteRoute

  useEffect(() => {
    void trackEvent('page_view', {
      path: location.pathname,
      search: location.search,
      is_authenticated: !!user,
      role: user?.role ?? 'guest',
    })
  }, [location.pathname, location.search, user])

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
      '/workflow': {
        title: 'Workflow | Zenos.work',
        description: 'Track editorial workflow progression, review state, and publishing hand-offs.',
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
      '/history': {
        title: 'Reading History | Zenos.work',
        description: 'Return to stories you read and continue where you left off.',
      },
      '/onboarding/writer': {
        title: 'Writer Onboarding | Zenos.work',
        description: 'Set up your writer profile, interests, and publishing preferences.',
      },
      '/stats': {
        title: 'Stats | Zenos.work',
        description: 'Monitor article performance, engagement, and growth analytics.',
      },
      '/settings': {
        title: 'Settings | Zenos.work',
        description: 'Manage your profile, notifications, reading preferences, and billing settings.',
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

  useEffect(() => {
    if (!featureFlags.length) return

    const previousState: Record<string, boolean> = {}
    if (typeof window !== 'undefined') {
      try {
        const value = window.localStorage.getItem('zenos_feature_flags_last_state')
        if (value) {
          const parsed = JSON.parse(value)
          if (parsed && typeof parsed === 'object') {
            Object.assign(previousState, parsed)
          }
        }
      } catch {
        // Ignore localStorage parse errors.
      }
    }

    const nextState: Record<string, boolean> = {}
    for (const flag of featureFlags) {
      nextState[flag.key] = flag.enabled
    }

    if (typeof window !== 'undefined') {
      try {
        window.localStorage.setItem('zenos_feature_flags_last_state', JSON.stringify(nextState))
      } catch {
        // Ignore localStorage write errors.
      }
    }

    const seenMap = readSeenMap()
    for (const flag of featureFlags) {
      const channels = channelsFor(flag)
      if (!channels.includes('in_app')) continue

      const previous = previousState[flag.key]
      if (previous === undefined || previous === flag.enabled) continue

      const action: 'enabled' | 'disabled' = flag.enabled ? 'enabled' : 'disabled'
      const item = buildAnnouncement(flag, action)
      const seenKey = `${item.key}:${item.version}`
      if (seenMap[seenKey]) continue

      void Promise.resolve().then(() => {
        setAnnouncement(item)
      })
      toast(item.title, flag.enabled ? 'success' : 'info')
      break
    }
  }, [featureFlags, toast])

  const handleDismissAnnouncement = () => {
    if (!announcement) return
    const seenMap = readSeenMap()
    const seenKey = `${announcement.key}:${announcement.version}`
    seenMap[seenKey] = 'dismissed'
    saveSeenMap(seenMap)
    setAnnouncement(null)
  }

  const contentStyle: CSSProperties = {
    maxWidth: isWriteRoute ? '1560px' : isGuestHomeRoute ? '100%' : isGuest ? '1240px' : '1280px',
    padding: isWriteRoute ? '24px 28px 40px' : isGuestHomeRoute ? '20px 12px 88px' : '28px 24px 88px',
  }

  return (
    <>
      {/* ── Global layout styles injected once ─────────────────── */}
      <style>{`
        .zenos-shell {
          display: flex;
          min-height: 100vh;
          background-color: transparent;
          color: var(--text-primary);
        }
        .zenos-sidebar {
          position: fixed;
          top: 0; left: 0; bottom: 0;
          z-index: 30;
          display: flex;
          flex-direction: column;
          background-color: var(--surface-5);
          border-right: 1px solid var(--border);
          transition: width 0.25s cubic-bezier(0.4, 0, 0.2, 1);
          overflow: hidden;
          box-shadow: 1px 0 0 var(--border);
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
            {primaryOrg && (
              <div
                style={{
                  marginBottom: 12,
                  border: '1px solid var(--border)',
                  borderRadius: 12,
                  padding: '10px 12px',
                  backgroundColor: 'var(--surface-1)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: 12,
                }}
              >
                <div>
                  <p style={{ margin: 0, fontSize: 12, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                    Organization
                  </p>
                  <p style={{ margin: '2px 0 0', fontSize: 14, color: 'var(--text-primary)', fontWeight: 600 }}>
                    {primaryOrg.name}
                  </p>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Link
                    to={`/org/${primaryOrg.id}`}
                    style={{
                      border: '1px solid var(--border)',
                      borderRadius: 10,
                      textDecoration: 'none',
                      color: 'var(--text-primary)',
                      fontSize: 12,
                      fontWeight: 600,
                      padding: '7px 10px',
                    }}
                  >
                    Open Dashboard
                  </Link>
                  <Link
                    to={`/org/${primaryOrg.id}/settings`}
                    style={{
                      border: '1px solid var(--accent)',
                      borderRadius: 10,
                      textDecoration: 'none',
                      color: 'white',
                      backgroundColor: 'var(--accent)',
                      fontSize: 12,
                      fontWeight: 600,
                      padding: '7px 10px',
                    }}
                  >
                    Org Settings
                  </Link>
                </div>
              </div>
            )}
            {announcement && (
              <FeatureAnnouncementBanner
                title={announcement.title}
                summary={announcement.summary}
                actionRequired={announcement.actionRequired}
                onDismiss={handleDismissAnnouncement}
              />
            )}
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
