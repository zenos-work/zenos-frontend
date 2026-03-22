import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import ProfilePage from '../../src/pages/ProfilePage'
import { createQueryClientWrapper } from '../utils/queryClient'
import api from '../../src/lib/api'

const useAuthMock = vi.fn()
const useParamsMock = vi.fn()
const toastMock = vi.fn()

vi.mock('../../src/hooks/useAuth', () => ({
  useAuth: () => useAuthMock(),
}))

vi.mock('../../src/stores/uiStore', () => ({
  useUiStore: (selector: (state: { toast: (...args: unknown[]) => void }) => unknown) =>
    selector({ toast: toastMock }),
}))

vi.mock('../../src/lib/api', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    delete: vi.fn(),
    put: vi.fn(),
  },
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
    vi.mocked(api.post).mockResolvedValue({ data: { avatar_url: 'https://cdn.test/new-avatar.jpg' } } as never)
    vi.mocked(api.delete).mockResolvedValue({ data: {} } as never)
    vi.mocked(api.put).mockResolvedValue({ data: {} } as never)
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

  it('allows own profile avatar upload and removal', async () => {
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
      avatar_url: 'https://cdn.test/original.jpg',
    })

    const { container } = render(
      <MemoryRouter>
        <ProfilePage />
      </MemoryRouter>,
      { wrapper: Wrapper },
    )

    const input = container.querySelector('input[accept="image/*"]') as HTMLInputElement
    const file = new File(['avatar'], 'avatar.png', { type: 'image/png' })
    fireEvent.change(input, { target: { files: [file] } })

    await waitFor(() => {
      expect(api.post).toHaveBeenCalledTimes(1)
    })
    const [, payload, config] = vi.mocked(api.post).mock.calls[0]
    expect(payload).toBeInstanceOf(Blob)
    expect(config).toEqual({
      headers: { 'Content-Type': 'image/png' },
    })
    expect(toastMock).toHaveBeenCalledWith('Profile picture updated', 'success')

    const removeButton = await screen.findByRole('button', { name: /remove photo/i })
    removeButton.click()

    await waitFor(() => {
      expect(api.delete).toHaveBeenCalledWith('/api/users/me/avatar')
    })
    expect(toastMock).toHaveBeenCalledWith('Profile picture removed', 'success')
  })

  it('allows selecting a preset avatar', async () => {
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
      avatar_url: 'https://cdn.test/original.jpg',
    })

    render(
      <MemoryRouter>
        <ProfilePage />
      </MemoryRouter>,
      { wrapper: Wrapper },
    )

    fireEvent.click(screen.getByRole('button', { name: /preset avatar 1/i }))

    await waitFor(() => {
      expect(api.put).toHaveBeenCalledTimes(1)
    })
    const [endpoint, body] = vi.mocked(api.put).mock.calls[0]
    expect(endpoint).toBe('/api/users/me')
    expect(typeof (body as { avatar_url: unknown }).avatar_url).toBe('string')
    expect(toastMock).toHaveBeenCalledWith('Preset avatar selected', 'success')
  })

  it('shows validation error for unsupported image extension', async () => {
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
      avatar_url: 'https://cdn.test/original.jpg',
    })

    const { container } = render(
      <MemoryRouter>
        <ProfilePage />
      </MemoryRouter>,
      { wrapper: Wrapper },
    )

    const input = container.querySelector('input[accept="image/*"]') as HTMLInputElement
    const file = new File(['avatar'], 'avatar.heic', { type: '' })
    fireEvent.change(input, { target: { files: [file] } })

    await waitFor(() => {
      expect(toastMock).toHaveBeenCalledWith('Please upload JPG, PNG, WEBP, or GIF images only', 'error')
    })
    expect(api.post).not.toHaveBeenCalled()
  })
})
