import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import BookmarkButton from '../../../src/components/social/BookmarkButton'

const useAuthMock = vi.fn()
const useBookmarkMock = vi.fn()
const navigateMock = vi.fn()

vi.mock('../../../src/hooks/useAuth', () => ({
  useAuth: () => useAuthMock(),
}))

vi.mock('../../../src/hooks/useSocial', () => ({
  useBookmark: (articleId: string) => useBookmarkMock(articleId),
}))

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom')
  return {
    ...actual,
    useNavigate: () => navigateMock,
  }
})

describe('BookmarkButton', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('redirects unauthenticated users to login', async () => {
    const mutateAsync = vi.fn()
    useAuthMock.mockReturnValue({ user: null })
    useBookmarkMock.mockReturnValue({ mutateAsync })

    render(<BookmarkButton articleId='article-1' />)
    fireEvent.click(screen.getByRole('button', { name: /save/i }))

    await waitFor(() => {
      expect(navigateMock).toHaveBeenCalledWith('/login')
    })
    expect(mutateAsync).not.toHaveBeenCalled()
  })

  it('toggles saved state for authenticated users', async () => {
    const mutateAsync = vi.fn().mockResolvedValue(undefined)
    useAuthMock.mockReturnValue({ user: { id: 'user-1' } })
    useBookmarkMock.mockReturnValue({ mutateAsync })

    render(<BookmarkButton articleId='article-1' />)

    fireEvent.click(screen.getByRole('button', { name: /save/i }))

    await waitFor(() => {
      expect(mutateAsync).toHaveBeenCalledWith(true)
    })
    expect(screen.getByRole('button', { name: /saved/i })).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: /saved/i }))

    await waitFor(() => {
      expect(mutateAsync).toHaveBeenLastCalledWith(false)
    })
  })
})
