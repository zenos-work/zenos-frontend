import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import ReadingListsPage from '../../src/pages/ReadingListsPage'

const useFeatureFlagMock = vi.fn()
const useReadingListsMock = vi.fn()
const useReadingListMock = vi.fn()
const useCreateReadingListMock = vi.fn()
const useDeleteReadingListMock = vi.fn()
const toastMock = vi.fn()

vi.mock('../../src/hooks/useFeatureFlags', () => ({
  useFeatureFlag: (...args: unknown[]) => useFeatureFlagMock(...args),
}))

vi.mock('../../src/hooks/useReadingLists', () => ({
  useReadingLists: (...args: unknown[]) => useReadingListsMock(...args),
  useReadingList: (...args: unknown[]) => useReadingListMock(...args),
  useCreateReadingList: () => useCreateReadingListMock(),
  useDeleteReadingList: () => useDeleteReadingListMock(),
}))

vi.mock('../../src/stores/uiStore', () => ({
  useUiStore: (selector: (state: { toast: typeof toastMock }) => unknown) => selector({ toast: toastMock }),
}))

vi.mock('../../src/components/ui/Spinner', () => ({
  default: () => <div>Loading...</div>,
}))

describe('ReadingListsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    useFeatureFlagMock.mockReturnValue({ enabled: true, isLoading: false })
    useReadingListsMock.mockReturnValue({
      data: {
        reading_lists: [{ id: 'rl-1', name: 'Weekend Reads', user_id: 'u1', is_public: false, is_default: false, article_count: 2, created_at: '2026-01-01', updated_at: '2026-01-02' }],
      },
      isLoading: false,
    })
    useReadingListMock.mockReturnValue({
      data: {
        id: 'rl-1',
        name: 'Weekend Reads',
        user_id: 'u1',
        is_public: false,
        is_default: false,
        article_count: 2,
        created_at: '2026-01-01',
        updated_at: '2026-01-02',
        items: [{ id: 'item-1', list_id: 'rl-1', article_id: 'article-1', sort_order: 1, added_at: '2026-01-02' }],
      },
      isLoading: false,
    })
    useCreateReadingListMock.mockReturnValue({ mutateAsync: vi.fn().mockResolvedValue({ id: 'rl-2' }), isPending: false })
    useDeleteReadingListMock.mockReturnValue({ mutateAsync: vi.fn().mockResolvedValue({ status: 'deleted' }) })
    vi.stubGlobal('confirm', vi.fn(() => true))
  })

  it('renders feature fallback when the flag is disabled', () => {
    useFeatureFlagMock.mockReturnValue({ enabled: false, isLoading: false })

    render(
      <MemoryRouter>
        <ReadingListsPage />
      </MemoryRouter>,
    )

    expect(screen.getByText(/reading lists is coming soon/i)).toBeInTheDocument()
  })

  it('renders reading lists and allows creating a new one', async () => {
    const mutateAsync = vi.fn().mockResolvedValue({ id: 'rl-2' })
    useCreateReadingListMock.mockReturnValue({ mutateAsync, isPending: false })

    render(
      <MemoryRouter>
        <ReadingListsPage />
      </MemoryRouter>,
    )

    expect(screen.getByText('Weekend Reads')).toBeInTheDocument()
    fireEvent.change(screen.getByPlaceholderText('Create a new reading list'), {
      target: { value: 'Research Stack' },
    })
    fireEvent.click(screen.getByRole('button', { name: /create list/i }))

    await waitFor(() => {
      expect(mutateAsync).toHaveBeenCalledWith({ name: 'Research Stack' })
    })
    expect(toastMock).toHaveBeenCalledWith('Reading list created', 'success')
  })
})
