import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import LikeButton from '../../../src/components/social/LikeButton'

const useAuthMock = vi.fn()
const useLikeMock = vi.fn()
const useUiStoreMock = vi.fn()
const navigateMock = vi.fn()
const toastMock = vi.fn()

vi.mock('../../../src/hooks/useAuth', () => ({
  useAuth: () => useAuthMock(),
}))

vi.mock('../../../src/hooks/useSocial', () => ({
  useLike: (articleId: string) => useLikeMock(articleId),
}))

vi.mock('../../../src/stores/uiStore', () => ({
  useUiStore: (selector: (state: { toast: typeof toastMock }) => unknown) => selector({ toast: toastMock }),
}))

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom')
  return {
    ...actual,
    useNavigate: () => navigateMock,
  }
})

describe('LikeButton', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    useUiStoreMock.mockReturnValue({ toast: toastMock })
  })

  it('redirects unauthenticated users to login', async () => {
    const mutateAsync = vi.fn()
    useAuthMock.mockReturnValue({ user: null })
    useLikeMock.mockReturnValue({ mutateAsync })

    render(<LikeButton articleId='article-1' count={3} />)
    fireEvent.click(screen.getByRole('button'))

    await waitFor(() => {
      expect(navigateMock).toHaveBeenCalledWith('/login')
    })
    expect(mutateAsync).not.toHaveBeenCalled()
  })

  it('increments like count on successful mutation', async () => {
    const mutateAsync = vi.fn().mockResolvedValue(undefined)
    useAuthMock.mockReturnValue({ user: { id: 'user-1' } })
    useLikeMock.mockReturnValue({ mutateAsync })

    render(<LikeButton articleId='article-1' count={3} />)

    fireEvent.click(screen.getByRole('button'))

    await waitFor(() => {
      expect(mutateAsync).toHaveBeenCalledWith(true)
    })
    expect(screen.getByText('4')).toBeInTheDocument()
  })

  it('shows an error toast when mutation fails', async () => {
    const mutateAsync = vi.fn().mockRejectedValue(new Error('failed'))
    useAuthMock.mockReturnValue({ user: { id: 'user-1' } })
    useLikeMock.mockReturnValue({ mutateAsync })

    render(<LikeButton articleId='article-1' count={3} />)

    fireEvent.click(screen.getByRole('button'))

    await waitFor(() => {
      expect(toastMock).toHaveBeenCalledWith('Could not update like', 'error')
    })
  })
})
