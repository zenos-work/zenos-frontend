import { render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import AppShell from '../../../src/components/layout/AppShell'

const useUiStoreMock = vi.fn()
const useAuthMock = vi.fn()
const useFeatureFlagsMock = vi.fn()
const useMyOrgsMock = vi.fn()

let storage: Record<string, string>

vi.mock('../../../src/stores/uiStore', () => ({
  useUiStore: (selector: (state: { sidebarOpen: boolean }) => unknown) =>
    selector(useUiStoreMock()),
}))

vi.mock('../../../src/hooks/useAuth', () => ({
  useAuth: () => useAuthMock(),
}))

vi.mock('../../../src/hooks/useFeatureFlags', () => ({
  useFeatureFlags: () => useFeatureFlagsMock(),
}))

vi.mock('../../../src/hooks/useOrg', () => ({
  useMyOrgs: (...args: unknown[]) => useMyOrgsMock(...args),
}))

vi.mock('../../../src/components/layout/Sidebar', () => ({
  default: () => <div>Sidebar</div>,
}))

vi.mock('../../../src/components/layout/Topbar', () => ({
  default: () => <div>Topbar</div>,
}))

vi.mock('../../../src/components/layout/MobileNav', () => ({
  default: () => <div>MobileNav</div>,
}))

vi.mock('../../../src/components/ui/Toast', () => ({
  default: () => <div>ToastContainer</div>,
}))

describe('AppShell', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    storage = {}
    Object.defineProperty(window, 'localStorage', {
      configurable: true,
      value: {
        getItem: (key: string) => storage[key] ?? null,
        setItem: (key: string, value: string) => {
          storage[key] = String(value)
        },
        removeItem: (key: string) => {
          delete storage[key]
        },
      },
    })
    useAuthMock.mockReturnValue({ user: { id: 'u1', role: 'AUTHOR' } })
    useFeatureFlagsMock.mockReturnValue({ list: [] })
    useMyOrgsMock.mockReturnValue({ data: { organizations: [] } })
    useUiStoreMock.mockImplementation(() => ({
      sidebarOpen: true,
      toast: vi.fn(),
    }))
  })

  it('renders layout and outlet content when sidebar is open', () => {
    useUiStoreMock.mockImplementation(() => ({
      sidebarOpen: true,
      toast: vi.fn(),
    }))

    const { container } = render(
      <MemoryRouter initialEntries={['/']}>
        <Routes>
          <Route element={<AppShell />}>
            <Route index element={<div>OutletContent</div>} />
          </Route>
        </Routes>
      </MemoryRouter>,
    )

    expect(screen.getByText('Sidebar')).toBeInTheDocument()
    expect(screen.getByText('Topbar')).toBeInTheDocument()
    expect(screen.getByText('MobileNav')).toBeInTheDocument()
    expect(screen.getByText('ToastContainer')).toBeInTheDocument()
    expect(screen.getByText('OutletContent')).toBeInTheDocument()
    expect(container.querySelector('.zenos-main')).toHaveStyle({ marginLeft: '240px' })
  })

  it('uses collapsed sidebar width when sidebar is closed', () => {
    useUiStoreMock.mockImplementation(() => ({
      sidebarOpen: false,
      toast: vi.fn(),
    }))

    const { container } = render(
      <MemoryRouter initialEntries={['/']}>
        <Routes>
          <Route element={<AppShell />}>
            <Route index element={<div>OutletContent</div>} />
          </Route>
        </Routes>
      </MemoryRouter>,
    )

    expect(container.querySelector('.zenos-main')).toHaveStyle({ marginLeft: '64px' })
  })

  it('hides topbar on guest home route', () => {
    useAuthMock.mockReturnValue({ user: null })
    useUiStoreMock.mockImplementation(() => ({
      sidebarOpen: true,
      toast: vi.fn(),
    }))

    render(
      <MemoryRouter initialEntries={['/']}>
        <Routes>
          <Route element={<AppShell />}>
            <Route index element={<div>GuestHome</div>} />
          </Route>
        </Routes>
      </MemoryRouter>,
    )

    expect(screen.queryByText('Topbar')).not.toBeInTheDocument()
  })

  it('shows topbar on guest public non-home route', () => {
    useAuthMock.mockReturnValue({ user: null })
    useUiStoreMock.mockImplementation(() => ({
      sidebarOpen: true,
      toast: vi.fn(),
    }))

    render(
      <MemoryRouter initialEntries={['/article/demo']}>
        <Routes>
          <Route element={<AppShell />}>
            <Route path='/article/:slug' element={<div>GuestArticle</div>} />
          </Route>
        </Routes>
      </MemoryRouter>,
    )

    expect(screen.getByText('Topbar')).toBeInTheDocument()
    expect(screen.getByText('GuestArticle')).toBeInTheDocument()
  })

  it('shows feature announcement banner when a flag state changes', async () => {
    const toastSpy = vi.fn()
    useUiStoreMock.mockImplementation(() => ({
      sidebarOpen: true,
      toast: toastSpy,
    }))

    window.localStorage.setItem('zenos_feature_flags_last_state', JSON.stringify({ reading_lists: false }))
    useFeatureFlagsMock.mockReturnValue({
      list: [
        {
          key: 'reading_lists',
          enabled: true,
          metadata: {
            announcement: {
              enabled_title: 'Reading Lists enabled',
              enabled_summary: 'Save stories into custom lists.',
              channels: ['in_app'],
              effective_at: '2026-04-10T00:00:00Z',
            },
          },
        },
      ],
    })

    render(
      <MemoryRouter initialEntries={['/library']}>
        <Routes>
          <Route element={<AppShell />}>
            <Route path='/library' element={<div>Library</div>} />
          </Route>
        </Routes>
      </MemoryRouter>,
    )

    await waitFor(() => {
      expect(screen.getByText('Reading Lists enabled')).toBeInTheDocument()
    })
    expect(toastSpy).toHaveBeenCalledWith('Reading Lists enabled', 'success')
  })
})
