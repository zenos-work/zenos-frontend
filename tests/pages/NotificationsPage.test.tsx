import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import NotificationsPage from '../../src/pages/NotificationsPage'

const useNotificationsMock = vi.fn()

vi.mock('../../src/hooks/useAdmin', () => ({
  useNotifications: () => useNotificationsMock(),
  useAdmin: vi.fn(),
}))

describe('NotificationsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('shows spinner while loading', () => {
    useNotificationsMock.mockReturnValue({ data: undefined, isLoading: true, isError: false })
    const { container } = render(
      <MemoryRouter>
        <NotificationsPage />
      </MemoryRouter>,
    )
    expect(container.querySelector('.flex')).toBeInTheDocument()
  })

  it('shows error state when request fails', () => {
    useNotificationsMock.mockReturnValue({ data: undefined, isLoading: false, isError: true })
    render(
      <MemoryRouter>
        <NotificationsPage />
      </MemoryRouter>,
    )
    expect(screen.getByText(/failed to load notifications/i)).toBeInTheDocument()
  })

  it('shows empty state when there are no notifications', () => {
    useNotificationsMock.mockReturnValue({
      data: { notifications: [] },
      isLoading: false,
      isError: false,
    })
    render(
      <MemoryRouter>
        <NotificationsPage />
      </MemoryRouter>,
    )
    expect(screen.getByText(/no notifications yet/i)).toBeInTheDocument()
    expect(screen.getByText(/you will see approvals/i)).toBeInTheDocument()
  })

  it('renders notification items with type and message', () => {
    useNotificationsMock.mockReturnValue({
      data: {
        notifications: [
          {
            id: 'n1',
            type: 'APPROVED',
            message: 'Your article was approved',
            is_read: false,
            created_at: '2026-01-15T10:00:00Z',
            article_id: 'a1',
          },
        ],
      },
      isLoading: false,
      isError: false,
    })
    render(
      <MemoryRouter>
        <NotificationsPage />
      </MemoryRouter>,
    )
    expect(screen.getByText('APPROVED')).toBeInTheDocument()
    expect(screen.getByText('Your article was approved')).toBeInTheDocument()
    expect(screen.getByText('New')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /open related article/i })).toHaveAttribute(
      'href',
      '/article/a1',
    )
  })

  it('shows Read badge for read notifications', () => {
    useNotificationsMock.mockReturnValue({
      data: {
        notifications: [
          {
            id: 'n2',
            type: 'LIKE',
            message: 'Someone liked your post',
            is_read: true,
            created_at: '2026-01-10T08:00:00Z',
            article_id: null,
          },
        ],
      },
      isLoading: false,
      isError: false,
    })
    render(
      <MemoryRouter>
        <NotificationsPage />
      </MemoryRouter>,
    )
    expect(screen.getByText('Read')).toBeInTheDocument()
    expect(screen.queryByRole('link', { name: /open related article/i })).not.toBeInTheDocument()
  })

  it('shows page heading', () => {
    useNotificationsMock.mockReturnValue({
      data: { notifications: [] },
      isLoading: false,
      isError: false,
    })
    render(
      <MemoryRouter>
        <NotificationsPage />
      </MemoryRouter>,
    )
    expect(screen.getByRole('heading', { name: /notifications/i })).toBeInTheDocument()
    expect(screen.getByText(/recent workflow/i)).toBeInTheDocument()
  })

  it('falls back to raw timestamp for invalid dates', () => {
    useNotificationsMock.mockReturnValue({
      data: {
        notifications: [
          {
            id: 'n3',
            type: 'SYSTEM',
            message: 'System update',
            is_read: true,
            created_at: 'not-a-date',
            article_id: null,
          },
        ],
      },
      isLoading: false,
      isError: false,
    })

    render(
      <MemoryRouter>
        <NotificationsPage />
      </MemoryRouter>,
    )

    expect(screen.getByText('not-a-date')).toBeInTheDocument()
  })
})
