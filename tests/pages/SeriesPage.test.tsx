import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { QueryClientProvider } from '@tanstack/react-query'
import SeriesPage from '../../src/pages/SeriesPage'
import api from '../../src/lib/api'
import { createTestQueryClient } from '../utils/queryClient'
import { makeArticle } from '../utils/fixtures'
import type { Series } from '../../src/hooks/useSeries'

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom')
  return {
    ...actual,
    useParams: () => ({ id: 'series-1' }),
  }
})

vi.mock('../../src/lib/api', () => ({
  default: {
    get: vi.fn(),
  },
}))

vi.mock('../../src/components/article/ArticleCard', () => ({
  default: ({ article }: { article: { title: string } }) => <div data-testid="article-card">{article.title}</div>,
}))

vi.mock('../../src/components/ui/Spinner', () => ({
  default: () => <div>Loading...</div>,
}))

vi.mock('../../src/lib/assets', () => ({
  resolveAssetUrl: (url: string) => url,
}))

const makeSeries = (overrides: Partial<Series> = {}): Series => ({
  id: 'series-1',
  author_id: 'user-1',
  name: 'Finance 101',
  description: 'An intro series',
  created_at: '2026-03-20T00:00:00Z',
  updated_at: '2026-03-20T00:00:00Z',
  ...overrides,
})

function renderPage() {
  const client = createTestQueryClient()
  render(
    <MemoryRouter>
      <QueryClientProvider client={client}>
        <SeriesPage />
      </QueryClientProvider>
    </MemoryRouter>,
  )
}

describe('SeriesPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('shows loading spinner initially', () => {
    vi.mocked(api.get).mockReturnValue(new Promise(() => {}))

    renderPage()

    expect(screen.getByText('Loading...')).toBeInTheDocument()
  })

  it('shows error state when series not found', async () => {
    vi.mocked(api.get).mockResolvedValue({ data: null })

    renderPage()

    await screen.findByText(/series not found/i)
    expect(screen.getByRole('link', { name: /explore articles/i })).toBeInTheDocument()
  })

  it('renders series name and description', async () => {
    const series = makeSeries({ name: 'Finance 101', description: 'An intro series' })
    vi.mocked(api.get).mockResolvedValue({
      data: { series, articles: [] },
    })

    renderPage()

    await screen.findByText('Finance 101')
    expect(screen.getByText('An intro series')).toBeInTheDocument()
  })

  it('renders article list with part badges', async () => {
    const series = makeSeries()
    const articles = [
      makeArticle({ id: 'a1', title: 'Part One Article' }),
      makeArticle({ id: 'a2', title: 'Part Two Article' }),
    ]
    vi.mocked(api.get).mockResolvedValue({ data: { series, articles } })

    renderPage()

    await screen.findByText('Part One Article')
    expect(screen.getByText('Part Two Article')).toBeInTheDocument()
    expect(screen.getAllByTestId('article-card')).toHaveLength(2)
    // Part number badges
    expect(screen.getByText('1')).toBeInTheDocument()
    expect(screen.getByText('2')).toBeInTheDocument()
  })

  it('shows empty state when series has no articles', async () => {
    vi.mocked(api.get).mockResolvedValue({
      data: { series: makeSeries(), articles: [] },
    })

    renderPage()

    await screen.findByText(/no articles in this series/i)
  })

  it('shows Start Reading link when articles exist', async () => {
    const series = makeSeries()
    const articles = [makeArticle({ id: 'a1', slug: 'first-article' })]
    vi.mocked(api.get).mockResolvedValue({ data: { series, articles } })

    renderPage()

    await screen.findByRole('link', { name: /start reading/i })
    expect(screen.getByRole('link', { name: /start reading/i })).toHaveAttribute('href', '/article/first-article')
  })

  it('shows series part count in header', async () => {
    const series = makeSeries()
    const articles = [makeArticle(), makeArticle({ id: 'a2' })]
    vi.mocked(api.get).mockResolvedValue({ data: { series, articles } })

    renderPage()

    await screen.findByText(/series · 2 parts/i)
  })

  it('renders cover image when provided', async () => {
    const series = makeSeries({ cover_image_url: 'https://example.com/cover.jpg' })
    vi.mocked(api.get).mockResolvedValue({ data: { series, articles: [] } })

    renderPage()

    await screen.findByRole('img', { name: 'Finance 101' })
    expect(screen.getByRole('img', { name: 'Finance 101' })).toHaveAttribute('src', 'https://example.com/cover.jpg')
  })
})
