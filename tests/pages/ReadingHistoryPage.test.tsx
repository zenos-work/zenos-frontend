import { fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import ReadingHistoryPage from '../../src/pages/ReadingHistoryPage'
import { makeArticle } from '../utils/fixtures'

const useReadingHistoryMock = vi.fn()
const useRemoveReadingHistoryItemMock = vi.fn()
const useClearReadingHistoryMock = vi.fn()
const useBookmarksMock = vi.fn()
const removeMutateMock = vi.fn()
const clearMutateMock = vi.fn()

vi.mock('../../src/hooks/useReadingHistory', () => ({
  useReadingHistory: (...args: unknown[]) => useReadingHistoryMock(...args),
  useRemoveReadingHistoryItem: () => useRemoveReadingHistoryItemMock(),
  useClearReadingHistory: () => useClearReadingHistoryMock(),
}))

vi.mock('../../src/hooks/useSocial', () => ({
  useBookmarks: (...args: unknown[]) => useBookmarksMock(...args),
}))

vi.mock('../../src/lib/assets', () => ({
  resolveAssetUrl: (value?: string) => value || '',
}))

function renderPage() {
  return render(
    <MemoryRouter>
      <ReadingHistoryPage />
    </MemoryRouter>,
  )
}

describe('ReadingHistoryPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    useRemoveReadingHistoryItemMock.mockReturnValue({ mutate: removeMutateMock })
    useClearReadingHistoryMock.mockReturnValue({ mutate: clearMutateMock })
  })

  it('renders empty states when there is no history or bookmark recommendation', () => {
    useReadingHistoryMock.mockReturnValue({ data: { items: [] } })
    useBookmarksMock.mockReturnValue({ data: { items: [] } })

    renderPage()

    expect(screen.queryByRole('button', { name: /clear history/i })).not.toBeInTheDocument()
    expect(screen.getByText('No in-progress stories yet.')).toBeInTheDocument()
    expect(screen.getByText(/read an article and it will show up here automatically/i)).toBeInTheDocument()
    expect(screen.getByText(/save a few stories to get personalized recommendations/i)).toBeInTheDocument()
    expect(screen.getByText('0%')).toBeInTheDocument()
  })

  it('renders stats, recommendations, and history actions for populated data', () => {
    useReadingHistoryMock.mockReturnValue({
      data: {
        items: [
          {
            id: 'article-1',
            slug: 'alpha',
            title: 'Alpha Story',
            author_name: 'Alex Writer',
            cover_image_url: '/cover.png',
            read_time_minutes: 10,
            progress: 40,
            last_read_at: '2026-04-01T10:30:00Z',
          },
          {
            id: 'article-2',
            slug: 'beta',
            title: 'Beta Story',
            author_name: 'Jamie Writer',
            read_time_minutes: 5,
            progress: 100,
            last_read_at: '2026-04-01T11:00:00Z',
          },
        ],
      },
    })
    useBookmarksMock.mockReturnValue({
      data: {
        items: [
          makeArticle({ id: 'article-1', slug: 'alpha', title: 'Existing bookmark' }),
          makeArticle({ id: 'article-3', slug: 'gamma', title: 'Fresh Recommendation', author_name: 'Morgan Writer' }),
        ],
      },
    })

    renderPage()

    expect(screen.getAllByText('1')).toHaveLength(2)
    expect(screen.getByText('Articles read')).toBeInTheDocument()
    expect(screen.getByText('In progress')).toBeInTheDocument()
    expect(screen.getByText('9')).toBeInTheDocument()
    expect(screen.getByText('50%')).toBeInTheDocument()
    expect(screen.getAllByRole('link', { name: 'Alpha Story' })[0]).toHaveAttribute('href', '/article/alpha')
    expect(screen.getByText('Fresh Recommendation').closest('a')).toHaveAttribute('href', '/article/gamma')
    expect(screen.queryByText('Existing bookmark')).not.toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: /clear history/i }))
    fireEvent.click(screen.getAllByRole('button', { name: /remove from history/i })[0])

    expect(clearMutateMock).toHaveBeenCalledTimes(1)
    expect(removeMutateMock).toHaveBeenCalledWith('article-1')
  })
})
