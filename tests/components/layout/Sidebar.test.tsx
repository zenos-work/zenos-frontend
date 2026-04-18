import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import Sidebar from '../../../src/components/layout/Sidebar'

const useAuthMock = vi.fn()
const useUiStoreMock = vi.fn()
const useFeatureFlagMock = vi.fn()

vi.mock('../../../src/hooks/useAuth', () => ({
  useAuth: () => useAuthMock(),
}))

vi.mock('../../../src/stores/uiStore', () => ({
  useUiStore: () => useUiStoreMock(),
}))

vi.mock('../../../src/hooks/useFeatureFlags', () => ({
  useFeatureFlag: (...args: unknown[]) => useFeatureFlagMock(...args),
}))

vi.mock('../../../src/components/ui/Avatar', () => ({
  default: ({ name }: { name: string }) => <div data-testid='avatar'>{name}</div>,
}))

describe('Sidebar', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    useFeatureFlagMock.mockImplementation((key: string) => ({
      enabled: key === 'reading_lists' || key === 'newsletters' || key === 'courses' || key === 'community' || key === 'marketplace',
    }))
  })

  it('renders open sidebar navigation for admin authors', () => {
    useAuthMock.mockReturnValue({
      user: {
        name: 'Admin User',
        role: 'SUPERADMIN',
        avatar_url: null,
      },
    })
    const toggleSidebar = vi.fn()
    useUiStoreMock.mockReturnValue({ sidebarOpen: true, toggleSidebar })

    render(
      <MemoryRouter>
        <Sidebar />
      </MemoryRouter>,
    )

    expect(screen.getByText('Bookmarks')).toBeInTheDocument()
    expect(screen.getByText('Library')).toBeInTheDocument()
    expect(screen.getByText('Reading Lists')).toBeInTheDocument()
    expect(screen.getByText('Newsletters')).toBeInTheDocument()
    expect(screen.getByText('Courses')).toBeInTheDocument()
    expect(screen.getByText('Community')).toBeInTheDocument()
    expect(screen.getByText('Marketplace')).toBeInTheDocument()
    expect(screen.getByText('Stats')).toBeInTheDocument()
    expect(screen.queryByText('Home')).not.toBeInTheDocument()
    expect(screen.queryByText('Search')).not.toBeInTheDocument()
    expect(screen.getByText('Write')).toBeInTheDocument()
    expect(screen.getByTestId('avatar')).toHaveTextContent('Admin User')
    expect(screen.getByText('SUPERADMIN')).toBeInTheDocument()
  })

  it('renders collapsed reader sidebar without write or admin links', () => {
    useFeatureFlagMock.mockImplementation(() => ({ enabled: false }))
    useAuthMock.mockReturnValue({
      user: {
        name: 'Reader User',
        role: 'READER',
        avatar_url: null,
      },
    })
    useUiStoreMock.mockReturnValue({ sidebarOpen: false, toggleSidebar: vi.fn() })

    render(
      <MemoryRouter>
        <Sidebar />
      </MemoryRouter>,
    )

    expect(screen.queryByText('Write')).not.toBeInTheDocument()
    expect(screen.queryByText('Admin')).not.toBeInTheDocument()
    expect(screen.getByText('Z')).toBeInTheDocument()
  })
})
