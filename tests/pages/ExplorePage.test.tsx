import { fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import ExplorePage from '../../src/pages/ExplorePage'
import { makeArticle, makePaginatedResponse, makeTag } from '../utils/fixtures'

const useArticlesMock = vi.fn()
const useTagsMock = vi.fn()

vi.mock('../../src/hooks/useArticles', () => ({
  useArticles: (...args: unknown[]) => useArticlesMock(...args),
}))

vi.mock('../../src/hooks/useTags', () => ({
  useTags: () => useTagsMock(),
}))

vi.mock('../../src/components/article/ArticleCard', () => ({
  default: ({ article }: { article: { title: string } }) => <div data-testid='article-card'>{article.title}</div>,
}))

vi.mock('../../src/components/ui/Spinner', () => ({
  default: () => <div>Loading…</div>,
}))

function LocationDisplay() {
  const location = useLocation()
  return <div data-testid='location'>{location.search}</div>
}

function renderPage(initialEntry = '/explore') {
  return render(
    <MemoryRouter initialEntries={[initialEntry]}>
      <Routes>
        <Route
          path='/explore'
          element={
            <>
              <ExplorePage />
              <LocationDisplay />
            </>
          }
        />
      </Routes>
    </MemoryRouter>,
  )
}

describe('ExplorePage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    useArticlesMock.mockReturnValue({
      data: makePaginatedResponse([
        makeArticle({ id: 'article-1', title: 'Explore Alpha' }),
        makeArticle({ id: 'article-2', title: 'Explore Beta' }),
      ]),
      isLoading: false,
    })
    useTagsMock.mockReturnValue({
      data: [makeTag({ name: 'Fintech', slug: 'fintech' }), makeTag({ name: 'AI', slug: 'ai' })],
      isLoading: false,
    })
  })

  it('renders article cards and updates search params from filters', () => {
    renderPage('/explore?sort=newest')

    expect(screen.getByText('Explore')).toBeInTheDocument()
    expect(screen.getAllByTestId('article-card')).toHaveLength(2)

    fireEvent.click(screen.getAllByRole('button', { name: 'Fintech' })[0])
    expect(screen.getByTestId('location')).toHaveTextContent('tag=fintech')

    fireEvent.click(screen.getByRole('button', { name: 'HowTo' }))
    expect(screen.getByTestId('location')).toHaveTextContent('type=HowTo')

    fireEvent.click(screen.getByRole('button', { name: 'Trending' }))
    expect(screen.getByTestId('location')).toHaveTextContent('sort=trending')
  })

  it('clears all filters when selecting the same tag twice', () => {
    renderPage('/explore?tag=fintech&type=HowTo')

    fireEvent.click(screen.getAllByRole('button', { name: 'Fintech' })[0])
    expect(screen.getByTestId('location').textContent).not.toContain('tag=fintech')
    expect(screen.getByTestId('location').textContent).not.toContain('type=HowTo')
  })

  it('clears the selected content type while preserving the tag', () => {
    renderPage('/explore?tag=fintech&type=HowTo')

    fireEvent.click(screen.getByRole('button', { name: 'HowTo' }))
    expect(screen.getByTestId('location').textContent).not.toContain('type=HowTo')
    expect(screen.getByTestId('location')).toHaveTextContent('tag=fintech')
  })

  it('renders the loading state', () => {
    useArticlesMock.mockReturnValueOnce({ data: undefined, isLoading: true })
    renderPage('/explore')

    expect(screen.getByText('Loading…')).toBeInTheDocument()
  })

  it('renders mobile filters and tag selection', () => {
    renderPage('/explore')
    fireEvent.click(screen.getByRole('button', { name: /filters/i }))
    fireEvent.click(screen.getAllByRole('button', { name: 'AI' })[0])
    expect(screen.getAllByText('AI').length).toBeGreaterThan(0)
  })

  it('renders empty state and topic loading state', () => {
    useArticlesMock.mockReturnValue({ data: makePaginatedResponse([]), isLoading: false })
    useTagsMock.mockReturnValue({ data: undefined, isLoading: true })

    renderPage('/explore')

    expect(screen.getByText('No articles found')).toBeInTheDocument()
    expect(screen.getByText('Loading…')).toBeInTheDocument()
  })
})
