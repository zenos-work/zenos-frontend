import { render, screen, fireEvent } from '@testing-library/react'
import { describe, expect, it, vi, beforeEach } from 'vitest'
import SocialSharePanel from '../../src/components/social/SocialSharePanel'

const useShareMock = vi.fn()

vi.mock('../../src/hooks/useSocial', () => ({
  useShare: (...args: unknown[]) => useShareMock(...args),
}))

// Suppress window.open noise in test environment
const openSpy = vi.spyOn(window, 'open').mockImplementation(() => null)

describe('SocialSharePanel', () => {
  const defaultProps = {
    articleId: 'art-1',
    articleUrl: 'https://zenos.work/a/test',
    articleTitle: 'My Great Article',
  }

  beforeEach(() => {
    vi.clearAllMocks()
    useShareMock.mockReturnValue({ mutate: vi.fn(), isPending: false })
  })

  it('renders share heading', () => {
    render(<SocialSharePanel {...defaultProps} />)
    expect(screen.getByText(/share this article/i)).toBeInTheDocument()
  })

  it('renders share buttons for X, LinkedIn, and Facebook', () => {
    render(<SocialSharePanel {...defaultProps} />)
    expect(screen.getByRole('button', { name: /share on x/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /share on linkedin/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /share on facebook/i })).toBeInTheDocument()
  })

  it('renders copy link button', () => {
    render(<SocialSharePanel {...defaultProps} />)
    expect(screen.getByRole('button', { name: /copy article link/i })).toBeInTheDocument()
  })

  it('opens share window on X button click', () => {
    const mutateFn = vi.fn()
    useShareMock.mockReturnValue({ mutate: mutateFn })

    render(<SocialSharePanel {...defaultProps} />)
    fireEvent.click(screen.getByRole('button', { name: /share on x/i }))
    expect(openSpy).toHaveBeenCalled()
    const url = openSpy.mock.calls[0][0] as string
    expect(url).toContain('twitter.com')
    expect(url).toContain('zenos.work')
  })

  it('opens LinkedIn share window on linkedin button click', () => {
    render(<SocialSharePanel {...defaultProps} />)
    fireEvent.click(screen.getByRole('button', { name: /share on linkedin/i }))
    const url = openSpy.mock.calls[0][0] as string
    expect(url).toContain('linkedin.com')
  })

  it('opens Facebook share window on facebook button click', () => {
    render(<SocialSharePanel {...defaultProps} />)
    fireEvent.click(screen.getByRole('button', { name: /share on facebook/i }))
    const url = openSpy.mock.calls[0][0] as string
    expect(url).toContain('facebook.com')
  })

  it('shows Copied! after copy link clicked', async () => {
    Object.assign(navigator, {
      clipboard: { writeText: vi.fn().mockResolvedValue(undefined) },
    })

    render(<SocialSharePanel {...defaultProps} />)
    fireEvent.click(screen.getByRole('button', { name: /copy article link/i }))

    await screen.findByText('Copied!')
  })
})
