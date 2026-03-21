import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import TermsPage from '../../src/pages/TermsPage'
import api from '../../src/lib/api'
import { createQueryClientWrapper } from '../utils/queryClient'

const navigateMock = vi.fn()
const useAuthMock = vi.fn()

vi.mock('../../src/hooks/useAuth', () => ({
  useAuth: () => useAuthMock(),
}))

vi.mock('../../src/lib/api', () => ({
  default: {
    put: vi.fn(),
  },
}))

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom')
  return {
    ...actual,
    useNavigate: () => navigateMock,
  }
})

describe('TermsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    useAuthMock.mockReturnValue({
      user: {
        id: 'user-1',
        name: 'Alex Writer',
        email: 'alex@zenos.work',
      },
      refreshUser: vi.fn().mockResolvedValue(undefined),
    })
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('renders the agreement and signer information', () => {
    const { Wrapper } = createQueryClientWrapper()

    render(<TermsPage />, { wrapper: Wrapper })

    expect(screen.getByText('Writer Content Agreement')).toBeInTheDocument()
    expect(screen.getByText(/signing as: alex writer/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /i agree — start writing/i })).toBeDisabled()
  })

  it('enables acceptance when the content fits on screen and submits successfully', async () => {
    vi.mocked(api.put).mockResolvedValue({ data: {} })

    const refreshUser = vi.fn().mockResolvedValue(undefined)
    useAuthMock.mockReturnValue({
      user: {
        id: 'user-1',
        name: 'Alex Writer',
        email: 'alex@zenos.work',
      },
      refreshUser,
    })

    const { Wrapper } = createQueryClientWrapper()
    const { container } = render(<TermsPage />, { wrapper: Wrapper })

    const submitButton = screen.getByRole('button', { name: /i agree — start writing/i })
    const agreementLabel = screen.getByText(/i have read the writer content agreement/i).closest('label')
    const scrollContainer = container.querySelector('.overflow-y-auto')

    expect(agreementLabel).not.toBeNull()
    expect(scrollContainer).not.toBeNull()

    fireEvent.scroll(scrollContainer!)
    fireEvent.click(agreementLabel!)

    expect(submitButton).toBeEnabled()

    fireEvent.click(submitButton)

    await waitFor(() => {
      expect(api.put).toHaveBeenCalledWith('/api/users/me/accept-terms')
    })
    await waitFor(() => {
      expect(refreshUser).toHaveBeenCalledTimes(1)
    })
    await waitFor(() => {
      expect(navigateMock).toHaveBeenCalledWith('/', { replace: true })
    })
  })

  it('shows an error message when acceptance submission fails', async () => {
    vi.mocked(api.put).mockRejectedValue(new Error('request failed'))

    const { Wrapper } = createQueryClientWrapper()
    const { container } = render(<TermsPage />, { wrapper: Wrapper })

    const agreementLabel = screen.getByText(/i have read the writer content agreement/i).closest('label')
    const scrollContainer = container.querySelector('.overflow-y-auto')

    expect(agreementLabel).not.toBeNull()
    expect(scrollContainer).not.toBeNull()

    fireEvent.scroll(scrollContainer!)
    fireEvent.click(agreementLabel!)
    fireEvent.click(screen.getByRole('button', { name: /i agree — start writing/i }))

    await waitFor(() => {
      expect(screen.getByText(/something went wrong\. please try again\./i)).toBeInTheDocument()
    })
  })
})
