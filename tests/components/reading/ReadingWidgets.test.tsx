import { fireEvent, render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ConsolidatedReactions } from '../../../src/components/reading/ConsolidatedReactions'
import { EnhancedTableOfContents } from '../../../src/components/reading/EnhancedTableOfContents'
import { MultiReactionBar } from '../../../src/components/reading/MultiReactionBar'
import { ReadingPreferencesPanel } from '../../../src/components/reading/ReadingPreferencesPanel'
import { ReadingProgressBar } from '../../../src/components/reading/ReadingProgressBar'

const toggleReactionMock = vi.fn()
const updatePreferenceMock = vi.fn()
const resetPreferencesMock = vi.fn()
let readingPreferences = {
  fontSize: 'base',
  fontFamily: 'sans',
  lineHeight: 'relaxed',
  contentWidth: 'wide',
  textColor: 'dark',
  backgroundColor: 'white',
} as const

vi.mock('../../../src/hooks/useReactions', () => ({
  useToggleReaction: () => ({ mutate: toggleReactionMock }),
}))

vi.mock('../../../src/hooks/useReadingPreferences', () => ({
  useReadingPreferences: () => ({
    preferences: readingPreferences,
    updatePreference: updatePreferenceMock,
    resetPreferences: resetPreferencesMock,
  }),
}))

describe('reading widgets', () => {
  beforeEach(() => {
    toggleReactionMock.mockReset()
    updatePreferenceMock.mockReset()
    resetPreferencesMock.mockReset()
    readingPreferences = {
      fontSize: 'base',
      fontFamily: 'sans',
      lineHeight: 'relaxed',
      contentWidth: 'wide',
      textColor: 'dark',
      backgroundColor: 'white',
    }
  })

  it('renders MultiReactionBar loading state and toggles reactions with hover labels', () => {
    const { rerender } = render(
      <MultiReactionBar articleId='article-1' isLoading reactions={undefined} />,
    )

    expect(document.querySelectorAll('.animate-pulse')).toHaveLength(4)

    rerender(
      <MultiReactionBar
        articleId='article-1'
        reactions={{
          fire: { count: 3, userReacted: true },
          lightbulb: { count: 0, userReacted: false },
          heart: { count: 1, userReacted: false },
          brain: { count: 0, userReacted: false },
        }}
      />,
    )

    const fireButton = screen.getByTitle('Fire')
    fireEvent.mouseEnter(fireButton)
    expect(screen.getByText('Fire')).toBeInTheDocument()
    fireEvent.click(fireButton)
    expect(toggleReactionMock).toHaveBeenCalledWith({ reactionType: 'fire' })
  })

  it('renders ConsolidatedReactions loading and active states', () => {
    const { rerender } = render(
      <ConsolidatedReactions articleId='article-2' isLoading />,
    )

    expect(document.querySelectorAll('.animate-pulse')).toHaveLength(4)

    rerender(
      <ConsolidatedReactions
        articleId='article-2'
        reactions={{
          fire: { count: 2, userReacted: true },
          lightbulb: { count: 1, userReacted: false },
          heart: { count: 0, userReacted: false },
          brain: { count: 0, userReacted: false },
        }}
      />,
    )

    fireEvent.click(screen.getByRole('button', { name: 'Insightful' }))
    expect(toggleReactionMock).toHaveBeenCalledWith({ reactionType: 'lightbulb' })
    expect(screen.getByTestId('reactions')).toBeInTheDocument()
  })

  it('updates reading progress based on scroll position', () => {
    Object.defineProperty(window, 'innerHeight', { configurable: true, value: 1000 })
    Object.defineProperty(document.documentElement, 'scrollHeight', {
      configurable: true,
      value: 3000,
    })
    Object.defineProperty(window, 'scrollY', { configurable: true, value: 500 })

    render(<ReadingProgressBar />)
    fireEvent.scroll(window)

    expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '25')
  })

  it('renders EnhancedTableOfContents only when visible and updates progress', () => {
    const content = Array.from({ length: 400 }, () => 'word').join(' ')
    Object.defineProperty(window, 'innerHeight', { configurable: true, value: 1000 })
    Object.defineProperty(document.documentElement, 'scrollHeight', {
      configurable: true,
      value: 3000,
    })
    Object.defineProperty(window, 'scrollY', { configurable: true, value: 1000 })

    const { rerender } = render(
      <EnhancedTableOfContents toc={[]} content={content} isVisible={false} />,
    )
    expect(screen.queryByTestId('toc')).not.toBeInTheDocument()

    rerender(
      <EnhancedTableOfContents
        toc={[
          { id: 'intro', text: 'Introduction', level: 1 },
          { id: 'detail', text: 'Details', level: 2 },
        ]}
        content={content}
        isVisible
      />,
    )

    fireEvent.scroll(window)

    expect(screen.getByTestId('toc')).toBeInTheDocument()
    expect(screen.getByText('2 min read')).toBeInTheDocument()
    expect(screen.getByText('50%')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Introduction' })).toHaveAttribute('href', '#intro')
  })

  it('renders and operates the reading preferences panel', () => {
    const onClose = vi.fn()
    const { rerender } = render(
      <ReadingPreferencesPanel isOpen={false} onClose={onClose} />,
    )
    expect(screen.queryByTestId('reading-settings-panel')).not.toBeInTheDocument()

    rerender(<ReadingPreferencesPanel isOpen onClose={onClose} />)
    expect(screen.getByTestId('reading-settings-panel')).toBeInTheDocument()

    fireEvent.click(screen.getByTestId('font-size-up'))
    fireEvent.click(screen.getByTestId('font-size-down'))
    fireEvent.click(screen.getByRole('button', { name: /set serif font/i }))
    fireEvent.click(screen.getByRole('button', { name: 'Wide' }))
    fireEvent.click(screen.getByRole('button', { name: /set extra-loose line spacing/i }))
    fireEvent.click(screen.getByRole('button', { name: /set dark background/i }))
    fireEvent.click(screen.getByRole('button', { name: 'Close' }))
    fireEvent.click(screen.getByText('Reset'))

    expect(updatePreferenceMock).toHaveBeenCalledWith('fontSize', 'lg')
    expect(updatePreferenceMock).toHaveBeenCalledWith('fontSize', 'sm')
    expect(updatePreferenceMock).toHaveBeenCalledWith('fontFamily', 'serif')
    expect(updatePreferenceMock).toHaveBeenCalledWith('contentWidth', 'wide')
    expect(updatePreferenceMock).toHaveBeenCalledWith('lineHeight', 'extra-loose')
    expect(updatePreferenceMock).toHaveBeenCalledWith('backgroundColor', 'dark')
    expect(onClose).toHaveBeenCalled()
    expect(resetPreferencesMock).toHaveBeenCalled()
  })

  it('disables font controls at the size boundaries', () => {
    readingPreferences = {
      ...readingPreferences,
      fontSize: 'sm',
    }

    const { rerender } = render(<ReadingPreferencesPanel isOpen onClose={() => {}} />)
    expect(screen.getByTestId('font-size-down')).toBeDisabled()

    readingPreferences = {
      ...readingPreferences,
      fontSize: 'xl',
    }

    rerender(<ReadingPreferencesPanel isOpen onClose={() => {}} />)
    expect(screen.getByTestId('font-size-up')).toBeDisabled()
  })
})
