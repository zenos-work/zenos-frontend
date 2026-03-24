import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import OnboardingPreferencesPage from '../../src/pages/OnboardingPreferencesPage'

const navigateMock = vi.fn()
const useAuthMock = vi.fn()
const useTagsMock = vi.fn()
const useUserPrefsMock = vi.fn()
const useUpdateUserPrefsMock = vi.fn()

vi.mock('../../src/hooks/useAuth', () => ({
  useAuth: () => useAuthMock(),
}))

vi.mock('../../src/hooks/useTags', () => ({
  useTags: (...args: unknown[]) => useTagsMock(...args),
}))

vi.mock('../../src/hooks/useUserPrefs', () => ({
  useUserPrefs: () => useUserPrefsMock(),
  useUpdateUserPrefs: () => useUpdateUserPrefsMock(),
}))

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom')
  return {
    ...actual,
    useNavigate: () => navigateMock,
  }
})

describe('OnboardingPreferencesPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    sessionStorage.clear()

    useAuthMock.mockReturnValue({ user: { id: 'u1' } })
    useTagsMock.mockReturnValue({
      data: [
        { id: 'c1', name: 'Technology', slug: 'technology', is_onboarding_category: 1, article_count: 0 },
        { id: 't1', name: 'AI', slug: 'ai', category_slug: 'technology', article_count: 12 },
        { id: 't2', name: 'AWS', slug: 'aws', category_slug: 'technology', article_count: 9 },
        { id: 't3', name: 'Kubernetes', slug: 'kubernetes', category_slug: 'technology', article_count: 7 },
      ],
      isLoading: false,
    })
    useUserPrefsMock.mockReturnValue({
      data: { topics: [], email_notifs: 1, theme: 'dark' },
      isLoading: false,
    })
    useUpdateUserPrefsMock.mockReturnValue({
      mutateAsync: vi.fn().mockResolvedValue({}),
      isPending: false,
    })
  })

  it('renders onboarding heading and categories', () => {
    render(<OnboardingPreferencesPage />)

    expect(screen.getByText('What would you like to read?')).toBeTruthy()
    expect(screen.getByText('Technology')).toBeTruthy()
    expect(screen.getByRole('button', { name: 'AI' })).toBeTruthy()
  })

  it('saves preferences and redirects to stored post-login path', async () => {
    const mutateAsync = vi.fn().mockResolvedValue({})
    useUpdateUserPrefsMock.mockReturnValue({ mutateAsync, isPending: false })
    sessionStorage.setItem('post_onboarding_redirect', '/write')

    render(<OnboardingPreferencesPage />)

    fireEvent.click(screen.getByRole('button', { name: 'Continue' }))

    await waitFor(() => {
      expect(mutateAsync).toHaveBeenCalledTimes(1)
    })

    expect(navigateMock).toHaveBeenCalledWith('/write', { replace: true })
    expect(sessionStorage.getItem('post_onboarding_redirect')).toBeNull()
  })
})
