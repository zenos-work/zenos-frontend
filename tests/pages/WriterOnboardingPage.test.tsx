import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import WriterOnboardingPage from '../../src/pages/WriterOnboardingPage'
import { makeTag, makeUser } from '../utils/fixtures'

const navigateMock = vi.fn()
const savePrefsMock = vi.fn()
let authState: { user: ReturnType<typeof makeUser> | null } = { user: makeUser() }
const useTagsMock = vi.fn()
const useUserPrefsMock = vi.fn()

vi.mock('../../src/hooks/useAuth', () => ({
  useAuth: () => authState,
}))

vi.mock('../../src/hooks/useTags', () => ({
  useTags: (...args: unknown[]) => useTagsMock(...args),
}))

vi.mock('../../src/hooks/useUserPrefs', () => ({
  useUpdateUserPrefs: () => ({ mutateAsync: savePrefsMock, isPending: false }),
  useUserPrefs: () => useUserPrefsMock(),
}))

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom')
  return {
    ...actual,
    useNavigate: () => navigateMock,
  }
})

function renderPage() {
  return render(
    <MemoryRouter>
      <WriterOnboardingPage />
    </MemoryRouter>,
  )
}

describe('WriterOnboardingPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    authState = { user: makeUser({ name: 'Alex Writer' }) }
    useTagsMock.mockReturnValue({
      data: [
        makeTag({ id: 'cat-1', name: 'Business', slug: 'business', is_onboarding_category: true }),
        makeTag({ id: 'tag-1', name: 'AI', slug: 'ai', category_slug: 'business', article_count: 9 }),
        makeTag({ id: 'tag-2', name: 'Markets', slug: 'markets', category_slug: 'business', article_count: 7 }),
        makeTag({ id: 'tag-3', name: 'Payments', slug: 'payments', category_slug: 'business', article_count: 5 }),
      ],
      isLoading: false,
    })
    useUserPrefsMock.mockReturnValue({ data: { topics: [], email_notifs: 1, theme: 'dark' } })
    savePrefsMock.mockResolvedValue(undefined)
  })

  it('redirects unauthenticated users to login', () => {
    authState = { user: null }

    renderPage()

    expect(navigateMock).toHaveBeenCalledWith('/login', { replace: true })
  })

  it('shows loading topics state on the interests step', () => {
    useTagsMock.mockReturnValue({ data: [], isLoading: true })

    renderPage()
    fireEvent.click(screen.getByRole('button', { name: /get started/i }))
    fireEvent.click(screen.getByRole('button', { name: /continue/i }))

    expect(screen.getByText('Loading topics...')).toBeInTheDocument()
  })

  it('completes the onboarding flow and saves selected topics', async () => {
    renderPage()

    fireEvent.click(screen.getByRole('button', { name: /get started/i }))
    fireEvent.change(screen.getByPlaceholderText('Your name'), { target: { value: 'Taylor Writer' } })
    fireEvent.change(screen.getByPlaceholderText('your-handle'), { target: { value: 'taylorwriter' } })
    fireEvent.change(screen.getByPlaceholderText(/tell readers what you write about/i), {
      target: { value: 'I write about systems and markets.' },
    })
    fireEvent.click(screen.getByRole('button', { name: /continue/i }))

    expect(screen.getByText('3 topics selected')).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Payments' }))
    expect(screen.getByText('2 topics selected')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /continue/i })).toBeDisabled()

    fireEvent.click(screen.getByRole('button', { name: 'Payments' }))
    fireEvent.click(screen.getByRole('button', { name: /continue/i }))
    fireEvent.click(screen.getByRole('button', { name: /continue/i }))

    expect(screen.getByText(/you are ready to publish/i)).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: /start writing/i }))

    await waitFor(() => {
      expect(savePrefsMock).toHaveBeenCalledWith({
        topics: ['ai', 'markets', 'payments'],
        email_notifs: 1,
        theme: 'dark',
      })
    })
    expect(navigateMock).toHaveBeenCalledWith('/write', { replace: true })
  })
})
