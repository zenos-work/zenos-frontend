import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import LibraryPage from '../../src/pages/LibraryPage'
import { makeArticle } from '../utils/fixtures'

const useMyArticlesMock = vi.fn()
const useDeleteArticleMock = vi.fn()
const toastMock = vi.fn()

vi.mock('../../src/hooks/useArticles', () => ({
  useMyArticles: () => useMyArticlesMock(),
  useDeleteArticle: () => useDeleteArticleMock(),
}))

vi.mock('../../src/stores/uiStore', () => ({
  useUiStore: (selector: (state: { toast: typeof toastMock }) => unknown) => selector({ toast: toastMock }),
}))

vi.mock('../../src/components/article/ArticleCard', () => ({
  default: ({ article }: { article: { title: string; status: string } }) => (
    <div data-testid='article-card'>{article.title} [{article.status}]</div>
  ),
}))

vi.mock('../../src/components/ui/Spinner', () => ({
  default: () => <div>Loading...</div>,
}))

vi.mock('../../src/components/ui/Button', () => ({
  default: ({ children, variant, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: string }) => (
    <button data-variant={variant ?? 'primary'} {...props}>{children}</button>
  ),
}))

describe('LibraryPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.stubGlobal('confirm', vi.fn(() => true))
  })

  it('renders stats and filters the library by status and search', () => {
    useMyArticlesMock.mockReturnValue({
      data: {
        items: [
          makeArticle({ id: 'a1', title: 'Draft Story', status: 'DRAFT' }),
          makeArticle({ id: 'a2', title: 'Published Story', status: 'PUBLISHED' }),
          makeArticle({ id: 'a3', title: 'Rejected Story', status: 'REJECTED' }),
        ],
      },
      isLoading: false,
    })
    useDeleteArticleMock.mockReturnValue({ mutateAsync: vi.fn() })

    render(
      <MemoryRouter>
        <LibraryPage />
      </MemoryRouter>,
    )

    expect(screen.getByText('Total').nextElementSibling).toHaveTextContent('3')
    fireEvent.click(screen.getByRole('button', { name: /published/i }))
    expect(screen.getByText('Published Story [PUBLISHED]')).toBeInTheDocument()
    expect(screen.queryByText('Draft Story [DRAFT]')).not.toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: /all/i }))
    fireEvent.change(screen.getByPlaceholderText('Search by title or subtitle'), {
      target: { value: 'rejected' },
    })
    expect(screen.getByText('Rejected Story [REJECTED]')).toBeInTheDocument()
    expect(screen.queryByText('Draft Story [DRAFT]')).not.toBeInTheDocument()
  })

  it('deletes an article and shows a success toast', async () => {
    const mutateAsync = vi.fn().mockResolvedValue(undefined)
    useMyArticlesMock.mockReturnValue({
      data: { items: [makeArticle({ id: 'a1', title: 'Delete Me', status: 'DRAFT' })] },
      isLoading: false,
    })
    useDeleteArticleMock.mockReturnValue({ mutateAsync })

    const { container } = render(
      <MemoryRouter>
        <LibraryPage />
      </MemoryRouter>,
    )

    const deleteButton = container.querySelector('button[data-variant="danger"]') as HTMLButtonElement | null
    expect(deleteButton).not.toBeNull()

    fireEvent.click(deleteButton!)

    await waitFor(() => {
      expect(mutateAsync).toHaveBeenCalledWith('a1')
    })
    expect(toastMock).toHaveBeenCalledWith('Article deleted', 'success')
  })
})
