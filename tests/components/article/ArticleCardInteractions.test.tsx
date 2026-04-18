import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import ArticleCard from '../../../src/components/article/ArticleCard'
import { makeArticle, makeArticleDetail, makeTag, makeUser } from '../../utils/fixtures'

const navigateMock = vi.fn()
const toastMock = vi.fn()
const shareMutateAsyncMock = vi.fn()
const apiGetMock = vi.fn()
const exportArticleMock = vi.fn()
let authState: { user: ReturnType<typeof makeUser> | null } = { user: null }

vi.mock('../../../src/hooks/useAuth', () => ({
  useAuth: () => authState,
}))

vi.mock('../../../src/hooks/useSocial', () => ({
  useShare: () => ({ isPending: false, mutateAsync: shareMutateAsyncMock }),
}))

vi.mock('../../../src/hooks/useFeatureFlags', () => ({
  useFeatureFlag: () => ({ enabled: false }),
}))

vi.mock('../../../src/hooks/useReadingLists', () => ({
  useReadingLists: () => ({ data: { reading_lists: [] } }),
  useCreateReadingList: () => ({ mutateAsync: vi.fn() }),
  useAddToReadingList: () => ({ mutateAsync: vi.fn() }),
}))

vi.mock('../../../src/stores/uiStore', () => ({
  useUiStore: (selector: (state: { toast: typeof toastMock }) => unknown) => selector({ toast: toastMock }),
}))

vi.mock('../../../src/lib/api', () => ({
  default: {
    get: (...args: unknown[]) => apiGetMock(...args),
  },
}))

vi.mock('../../../src/lib/articleExport', () => ({
  exportArticle: (...args: unknown[]) => exportArticleMock(...args),
}))

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom')
  return {
    ...actual,
    useNavigate: () => navigateMock,
  }
})

function renderCard(article = makeArticle()) {
  return render(
    <MemoryRouter>
      <ArticleCard article={article} showStatus featured compact />
    </MemoryRouter>,
  )
}

describe('ArticleCard interactions', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    authState = { user: null }
    Object.defineProperty(window, 'open', {
      configurable: true,
      value: vi.fn(() => ({ focus: vi.fn() })),
    })
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: { writeText: vi.fn().mockResolvedValue(undefined) },
    })
    document.execCommand = vi.fn(() => true)
  })

  it('renders featured article treatment with reading level and secondary tags', () => {
    render(
      <MemoryRouter>
        <ArticleCard
          article={makeArticle({
            title: 'Featured Story',
            cover_image_url: '/featured.png',
            reading_level: 'Intermediate',
            tags: [
              makeTag({ id: 'tag-1', name: 'AI' }),
              makeTag({ id: 'tag-2', name: 'Cloud' }),
              makeTag({ id: 'tag-3', name: 'Payments' }),
            ],
          })}
          showStatus
          featured
        />
      </MemoryRouter>,
    )

    expect(screen.getByRole('link', { name: 'Featured Story' })).toHaveAttribute('href', '/article/alpha-article')
    expect(screen.getByText('Intermediate')).toBeInTheDocument()
    expect(screen.getByText('AI')).toBeInTheDocument()
  })

  it('redirects unauthenticated users to login when they try to share', async () => {
    renderCard(makeArticle({ title: 'Unauthenticated Story' }))

    fireEvent.click(screen.getByRole('button', { name: /share unauthenticated story/i }))
    fireEvent.click(screen.getByRole('button', { name: /share to linkedin/i }))

    await waitFor(() => {
      expect(navigateMock).toHaveBeenCalledWith('/login')
    })
    expect(shareMutateAsyncMock).not.toHaveBeenCalled()
  })

  it('copies links, shares socially, and exports successfully for signed-in users', async () => {
    authState = { user: makeUser() }
    const article = makeArticle({ id: 'article-7', title: 'Connected Story', slug: 'connected-story' })
    apiGetMock.mockResolvedValue({ data: { article: makeArticleDetail({ id: 'article-7', title: 'Connected Story' }) } })
    shareMutateAsyncMock.mockResolvedValue(undefined)
    exportArticleMock.mockResolvedValue(undefined)

    renderCard(article)

    fireEvent.click(screen.getByRole('button', { name: /share connected story/i }))
    fireEvent.click(screen.getByRole('button', { name: /copy link/i }))

    await waitFor(() => {
      expect(navigator.clipboard.writeText).toHaveBeenCalledWith('http://localhost:3000/article/connected-story')
    })
    expect(toastMock).toHaveBeenCalledWith('Link copied', 'success')

    fireEvent.click(screen.getByRole('button', { name: /share connected story/i }))
    fireEvent.click(screen.getByRole('button', { name: /share to x/i }))

    await waitFor(() => {
      expect(shareMutateAsyncMock).toHaveBeenCalledWith('x')
    })
    expect(window.open).toHaveBeenCalled()
    expect(toastMock).toHaveBeenCalledWith('Shared to X', 'success')

    fireEvent.click(screen.getByRole('button', { name: /export connected story/i }))
    fireEvent.click(screen.getByRole('button', { name: /export as pdf/i }))

    await waitFor(() => {
      expect(apiGetMock).toHaveBeenCalledWith('/api/articles/article-7')
    })
    expect(exportArticleMock).toHaveBeenCalledWith('pdf', expect.objectContaining({ id: 'article-7' }))
    expect(toastMock).toHaveBeenCalledWith('Exported as PDF', 'success')
  })

  it('shows popup-blocked and export-failure toasts', async () => {
    authState = { user: makeUser() }
    Object.defineProperty(window, 'open', {
      configurable: true,
      value: vi.fn(() => null),
    })
    apiGetMock.mockRejectedValue(new Error('export failed'))

    renderCard(makeArticle({ id: 'article-8', title: 'Failure Story' }))

    fireEvent.click(screen.getByRole('button', { name: /share failure story/i }))
    fireEvent.click(screen.getByRole('button', { name: /share to facebook/i }))

    expect(toastMock).toHaveBeenCalledWith(
      'Popup blocked. Please allow popups for Facebook sharing.',
      'error',
    )

    fireEvent.click(screen.getByRole('button', { name: /export failure story/i }))
    fireEvent.click(screen.getByRole('button', { name: /export as markdown/i }))

    await waitFor(() => {
      expect(toastMock).toHaveBeenCalledWith('Could not export article', 'error')
    })
  })

  it('uses clipboard fallback, shares to LinkedIn, and exports as Word', async () => {
    authState = { user: makeUser() }
    const article = makeArticle({ id: 'article-9', title: 'Fallback Story', slug: 'fallback-story' })
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: { writeText: vi.fn().mockRejectedValue(new Error('clipboard denied')) },
    })
    apiGetMock.mockResolvedValue({ data: { article: makeArticleDetail({ id: 'article-9', title: 'Fallback Story' }) } })
    shareMutateAsyncMock.mockResolvedValue(undefined)
    exportArticleMock.mockResolvedValue(undefined)

    renderCard(article)

    fireEvent.click(screen.getByRole('button', { name: /share fallback story/i }))
    fireEvent.click(screen.getByRole('button', { name: /copy link/i }))

    await waitFor(() => {
      expect(document.execCommand).toHaveBeenCalledWith('copy')
    })
    expect(toastMock).toHaveBeenCalledWith('Link copied', 'success')

    fireEvent.click(screen.getByRole('button', { name: /share fallback story/i }))
    fireEvent.click(screen.getByRole('button', { name: /share to linkedin/i }))

    await waitFor(() => {
      expect(shareMutateAsyncMock).toHaveBeenCalledWith('linkedin')
    })
    expect(toastMock).toHaveBeenCalledWith('Shared to LinkedIn', 'success')

    fireEvent.click(screen.getByRole('button', { name: /export fallback story/i }))
    fireEvent.click(screen.getByRole('button', { name: /export as word/i }))

    await waitFor(() => {
      expect(exportArticleMock).toHaveBeenCalledWith('word', expect.objectContaining({ id: 'article-9' }))
    })
    expect(toastMock).toHaveBeenCalledWith('Exported as WORD', 'success')
  })
})
