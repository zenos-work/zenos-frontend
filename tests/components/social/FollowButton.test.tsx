import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import FollowButton from '../../../src/components/social/FollowButton'

const useAuthMock = vi.fn()
const useFollowMock = vi.fn()
const useFollowStatusMock = vi.fn()

vi.mock('../../../src/hooks/useAuth', () => ({
  useAuth: () => useAuthMock(),
}))

vi.mock('../../../src/hooks/useSocial', () => ({
  useFollow: (authorId: string) => useFollowMock(authorId),
  useFollowStatus: (authorId: string) => useFollowStatusMock(authorId),
}))

describe('FollowButton', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders nothing for guests and own profile', () => {
    useAuthMock.mockReturnValue({ user: null })
    useFollowStatusMock.mockReturnValue({ data: false, isLoading: false })
    useFollowMock.mockReturnValue({ mutateAsync: vi.fn(), isPending: false })
    const guest = render(<FollowButton authorId='author-1' />)
    expect(guest.container.firstChild).toBeNull()

    useAuthMock.mockReturnValue({ user: { id: 'author-1' } })
    const own = render(<FollowButton authorId='author-1' />)
    expect(own.container.firstChild).toBeNull()
  })

  it('toggles follow state for other authors', async () => {
    const mutateAsync = vi.fn().mockResolvedValue(undefined)
    useAuthMock.mockReturnValue({ user: { id: 'user-1' } })
    useFollowStatusMock.mockReturnValue({ data: false, isLoading: false })
    useFollowMock.mockReturnValue({ mutateAsync, isPending: false })

    render(<FollowButton authorId='author-2' />)

    fireEvent.click(screen.getByRole('button', { name: /follow/i }))
    await waitFor(() => {
      expect(mutateAsync).toHaveBeenCalledWith(true)
    })
    expect(screen.getByRole('button', { name: /following/i })).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: /following/i }))
    await waitFor(() => {
      expect(mutateAsync).toHaveBeenLastCalledWith(false)
    })
  })
})
