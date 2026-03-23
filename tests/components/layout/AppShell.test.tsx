import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import AppShell from '../../../src/components/layout/AppShell'

const useUiStoreMock = vi.fn()
const useAuthMock = vi.fn()

vi.mock('../../../src/stores/uiStore', () => ({
  useUiStore: (selector: (state: { sidebarOpen: boolean }) => unknown) =>
    selector(useUiStoreMock()),
}))

vi.mock('../../../src/hooks/useAuth', () => ({
  useAuth: () => useAuthMock(),
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
    useAuthMock.mockReturnValue({ user: { id: 'u1', role: 'AUTHOR' } })
  })

  it('renders layout and outlet content when sidebar is open', () => {
    useUiStoreMock.mockReturnValue({ sidebarOpen: true })

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
    useUiStoreMock.mockReturnValue({ sidebarOpen: false })

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
    useUiStoreMock.mockReturnValue({ sidebarOpen: true })

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
    useUiStoreMock.mockReturnValue({ sidebarOpen: true })

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
})
