import { render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import ProfilePage from '../../src/pages/ProfilePage'
import { createQueryClientWrapper } from '../utils/queryClient'

const useAuthMock = vi.fn()
const useParamsMock = vi.fn()

vi.mock('../../src/hooks/useAuth', () => ({
  useAuth: () => useAuthMock(),
}))

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom')
  return {
    ...actual,
    useParams: () => useParamsMock(),
  }
})

vi.mock('../../src/components/social/FollowButton', () => ({
  default: ({ authorId }: { authorId: string }) => <div data-testid='follow-button'>{authorId}</div>,
}))

describe('ProfilePage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('shows own profile when no route id is provided', async () => {
    useParamsMock.mockReturnValue({})
    useAuthMock.mockReturnValue({
      user: { id: 'me-1', name: 'Self User' },
    })

    const { Wrapper, client } = createQueryClientWrapper()
    client.setQueryData(['user', 'me-1'], {
      id: 'me-1',
      name: 'Self User',
      role: 'AUTHOR',
      created_at: '2026-03-20T00:00:00Z',
      email: 'self@zenos.work',
    })

    render(
      <MemoryRouter>
        <ProfilePage />
      </MemoryRouter>,
      { wrapper: Wrapper },
    )

    expect(screen.getByText('Self User')).toBeInTheDocument()
    expect(screen.queryByTestId('follow-button')).not.toBeInTheDocument()
  })

  it('shows follow action on another user profile', async () => {
    useParamsMock.mockReturnValue({ id: 'other-1' })
    useAuthMock.mockReturnValue({
      user: { id: 'me-1', name: 'Self User' },
    })

    const { Wrapper, client } = createQueryClientWrapper()
    client.setQueryData(['user', 'other-1'], {
      id: 'other-1',
      name: 'Other User',
      role: 'READER',
      created_at: '2026-03-20T00:00:00Z',
      email: 'other@zenos.work',
    })

    render(
      <MemoryRouter>
        <ProfilePage />
      </MemoryRouter>,
      { wrapper: Wrapper },
    )

    await waitFor(() => {
      expect(screen.getByText('Other User')).toBeInTheDocument()
    })
    expect(screen.getByTestId('follow-button')).toHaveTextContent('other-1')
  })
})
