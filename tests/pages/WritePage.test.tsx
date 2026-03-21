import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import WritePage from '../../src/pages/WritePage'

type Tag = { id: string; name: string; slug: string; article_count: number }

const navigateMock = vi.fn()
let mockParams: { id?: string } = {}

const toastMock = vi.fn()

const createMutateAsyncMock = vi.fn()
const updateMutateAsyncMock = vi.fn()
const submitMutateAsyncMock = vi.fn()
const uploadMutateAsyncMock = vi.fn()

const hydrateMock = vi.fn()
const resetMock = vi.fn()
const setArticleIdMock = vi.fn()
const markSavedMock = vi.fn()
const setIsSavingMock = vi.fn()
const setCoverImageMock = vi.fn()
const setTitleMock = vi.fn()
const setSubtitleMock = vi.fn()
const setContentMock = vi.fn()
const toggleTagMock = vi.fn()
const togglePreviewMock = vi.fn()

let mockStore: {
  articleId?: string
  title: string
  subtitle: string
  content: string
  coverImageUrl: string
  selectedTags: Tag[]
  isDirty: boolean
  isSaving: boolean
  previewMode: boolean
  hydrate: typeof hydrateMock
  reset: typeof resetMock
  setArticleId: typeof setArticleIdMock
  markSaved: typeof markSavedMock
  setIsSaving: typeof setIsSavingMock
  setCoverImage: typeof setCoverImageMock
  setTitle: typeof setTitleMock
  setSubtitle: typeof setSubtitleMock
  setContent: typeof setContentMock
  toggleTag: typeof toggleTagMock
  togglePreview: typeof togglePreviewMock
}

const useArticleMock = vi.fn()
const useCreateArticleMock = vi.fn()
const useUpdateArticleMock = vi.fn()
const useSubmitArticleMock = vi.fn()
const useTagsMock = vi.fn()

const useEditorStoreMock = vi.fn((selector?: (state: typeof mockStore) => unknown) =>
  selector ? selector(mockStore) : mockStore,
)

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom')
  return {
    ...actual,
    useNavigate: () => navigateMock,
    useParams: () => mockParams,
  }
})

vi.mock('@tanstack/react-query', () => ({
  useMutation: () => ({
    mutateAsync: uploadMutateAsyncMock,
  }),
}))

vi.mock('../../src/stores/editorStore', () => ({
  useEditorStore: (...args: unknown[]) => useEditorStoreMock(...args),
}))

vi.mock('../../src/stores/uiStore', () => ({
  useUiStore: (selector: (state: { toast: (...args: unknown[]) => void }) => unknown) =>
    selector({ toast: toastMock }),
}))

vi.mock('../../src/hooks/useArticles', () => ({
  useArticle: (...args: unknown[]) => useArticleMock(...args),
  useCreateArticle: () => useCreateArticleMock(),
  useUpdateArticle: (...args: unknown[]) => useUpdateArticleMock(...args),
  useSubmitArticle: (...args: unknown[]) => useSubmitArticleMock(...args),
}))

vi.mock('../../src/hooks/useTags', () => ({
  useTags: () => useTagsMock(),
}))

vi.mock('../../src/components/editor/EditorToolbar', () => ({
  default: ({ onSave, onSubmit, onTogglePreview }: { onSave: () => void; onSubmit: () => void; onTogglePreview: () => void }) => (
    <div>
      <button onClick={onSave}>Save draft</button>
      <button onClick={onSubmit}>Submit for review</button>
      <button onClick={onTogglePreview}>Preview toggle</button>
    </div>
  ),
}))

vi.mock('../../src/components/editor/Editor', () => ({
  default: ({ onInlineImageUpload }: { onInlineImageUpload: (file: File) => Promise<string> }) => (
    <div>
      <button
        onClick={() => {
          void onInlineImageUpload(new File(['img'], 'inline.png', { type: 'image/png' }))
        }}
      >
        Inline upload
      </button>
    </div>
  ),
}))

vi.mock('../../src/components/editor/PreviewPane', () => ({
  default: ({ title }: { title: string }) => <div>Preview: {title}</div>,
}))

describe('WritePage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockParams = {}

    mockStore = {
      articleId: undefined,
      title: 'Draft title',
      subtitle: 'Draft subtitle',
      content: 'This is sufficiently long content for saving the draft without validation errors.',
      coverImageUrl: '',
      selectedTags: [{ id: 't1', name: 'AI', slug: 'ai', article_count: 1 }],
      isDirty: true,
      isSaving: false,
      previewMode: false,
      hydrate: hydrateMock,
      reset: resetMock,
      setArticleId: setArticleIdMock,
      markSaved: markSavedMock,
      setIsSaving: setIsSavingMock,
      setCoverImage: setCoverImageMock,
      setTitle: setTitleMock,
      setSubtitle: setSubtitleMock,
      setContent: setContentMock,
      toggleTag: toggleTagMock,
      togglePreview: togglePreviewMock,
    }

    useArticleMock.mockReturnValue({ data: undefined })
    useCreateArticleMock.mockReturnValue({ mutateAsync: createMutateAsyncMock })
    useUpdateArticleMock.mockReturnValue({ mutateAsync: updateMutateAsyncMock })
    useSubmitArticleMock.mockReturnValue({ mutateAsync: submitMutateAsyncMock })
    useTagsMock.mockReturnValue({
      data: [
        { id: 't1', name: 'AI', slug: 'ai', article_count: 1 },
        { id: 't2', name: 'Cloud', slug: 'cloud', article_count: 2 },
      ],
    })

    createMutateAsyncMock.mockResolvedValue({ id: 'new-article-id' })
    updateMutateAsyncMock.mockResolvedValue({ id: 'existing-id' })
    submitMutateAsyncMock.mockResolvedValue({ status: 'submitted' })
    uploadMutateAsyncMock.mockResolvedValue({ url: 'https://cdn.example.com/img.png', key: 'media/key' })
  })

  it('hydrates editor from existing article and resets on unmount', () => {
    useArticleMock.mockReturnValue({
      data: {
        id: 'a1',
        title: 'Existing',
        subtitle: 'Existing sub',
        content: '{"type":"doc"}',
        cover_image_url: '/cover.png',
        tags: [{ id: 't9', name: 'Tag9', slug: 'tag9', article_count: 1 }],
      },
    })

    const { unmount } = render(
      <MemoryRouter>
        <WritePage />
      </MemoryRouter>,
    )

    expect(hydrateMock).toHaveBeenCalledWith({
      articleId: 'a1',
      title: 'Existing',
      subtitle: 'Existing sub',
      content: '{"type":"doc"}',
      coverImageUrl: '/cover.png',
      selectedTags: [{ id: 't9', name: 'Tag9', slug: 'tag9', article_count: 1 }],
    })

    unmount()
    expect(resetMock).toHaveBeenCalled()
  })

  it('validates required title and content on save', async () => {
    mockStore.title = ''

    render(
      <MemoryRouter>
        <WritePage />
      </MemoryRouter>,
    )

    fireEvent.click(screen.getByRole('button', { name: 'Save draft' }))

    await waitFor(() => {
      expect(toastMock).toHaveBeenCalledWith('Title is required', 'error')
    })
  })

  it('validates missing content and too-short content on save', async () => {
    mockStore.title = 'Valid title'
    mockStore.content = ''

    const { rerender } = render(
      <MemoryRouter>
        <WritePage />
      </MemoryRouter>,
    )

    fireEvent.click(screen.getByRole('button', { name: 'Save draft' }))
    await waitFor(() => {
      expect(toastMock).toHaveBeenCalledWith('Content is required', 'error')
    })

    mockStore.content = 'too short'
    rerender(
      <MemoryRouter>
        <WritePage />
      </MemoryRouter>,
    )

    fireEvent.click(screen.getByRole('button', { name: 'Save draft' }))
    await waitFor(() => {
      expect(toastMock).toHaveBeenCalledWith(
        'Content must be at least 50 characters long',
        'error',
      )
    })
  })

  it('creates draft and navigates to edit URL', async () => {
    render(
      <MemoryRouter>
        <WritePage />
      </MemoryRouter>,
    )

    fireEvent.click(screen.getByRole('button', { name: 'Save draft' }))

    await waitFor(() => {
      expect(createMutateAsyncMock).toHaveBeenCalledWith({
        title: 'Draft title',
        subtitle: 'Draft subtitle',
        content: 'This is sufficiently long content for saving the draft without validation errors.',
        cover_image_url: undefined,
        tag_ids: ['t1'],
      })
    })

    expect(setArticleIdMock).toHaveBeenCalledWith('new-article-id')
    expect(markSavedMock).toHaveBeenCalled()
    expect(navigateMock).toHaveBeenCalledWith('/write/new-article-id', { replace: true })
    expect(toastMock).toHaveBeenCalledWith('Draft saved', 'success')
  })

  it('submits existing article and redirects to library', async () => {
    mockParams = { id: 'existing-id' }
    mockStore.content = `${'word '.repeat(85)}`

    render(
      <MemoryRouter>
        <WritePage />
      </MemoryRouter>,
    )

    fireEvent.click(screen.getByRole('button', { name: 'Submit for review' }))

    await waitFor(() => {
      expect(updateMutateAsyncMock).toHaveBeenCalled()
    })
    await waitFor(() => {
      expect(submitMutateAsyncMock).toHaveBeenCalled()
    })

    expect(toastMock).toHaveBeenCalledWith('Submitted for review!', 'success')
    expect(navigateMock).toHaveBeenCalledWith('/library')
  })

  it('shows warning when submitting with too few words', async () => {
    mockStore.content = 'too short content words only'

    render(
      <MemoryRouter>
        <WritePage />
      </MemoryRouter>,
    )

    fireEvent.click(screen.getByRole('button', { name: 'Submit for review' }))

    await waitFor(() => {
      expect(toastMock).toHaveBeenCalledWith(
        'Add more content before submitting (minimum ~80 words)',
        'warning',
      )
    })
    expect(submitMutateAsyncMock).not.toHaveBeenCalled()
  })

  it('uploads cover image and supports inline image upload', async () => {
    render(
      <MemoryRouter>
        <WritePage />
      </MemoryRouter>,
    )

    const fileInput = document.querySelector('input[accept="image/*"]') as HTMLInputElement
    const file = new File(['cover'], 'cover.png', { type: 'image/png' })

    fireEvent.change(fileInput, { target: { files: [file] } })

    await waitFor(() => {
      expect(uploadMutateAsyncMock).toHaveBeenCalled()
    })
    expect(setCoverImageMock).toHaveBeenCalledWith('https://cdn.example.com/img.png')
    expect(toastMock).toHaveBeenCalledWith('Cover image uploaded', 'success')

    fireEvent.click(screen.getByRole('button', { name: 'Inline upload' }))

    await waitFor(() => {
      expect(toastMock).toHaveBeenCalledWith('Image inserted', 'success')
    })
  })

  it('rejects non-image cover uploads', async () => {
    render(
      <MemoryRouter>
        <WritePage />
      </MemoryRouter>,
    )

    const fileInput = document.querySelector('input[accept="image/*"]') as HTMLInputElement
    const badFile = new File(['not-image'], 'notes.txt', { type: 'text/plain' })

    fireEvent.change(fileInput, { target: { files: [badFile] } })

    await waitFor(() => {
      expect(toastMock).toHaveBeenCalledWith('Please choose an image file', 'error')
    })
    expect(uploadMutateAsyncMock).not.toHaveBeenCalled()
  })

  it('shows explicit upload and submit failure messages', async () => {
    mockParams = { id: 'existing-id' }
    mockStore.content = `${'word '.repeat(85)}`

    uploadMutateAsyncMock.mockRejectedValueOnce({
      response: { data: { error: { message: 'Upload failed from API' } } },
    })
    submitMutateAsyncMock.mockRejectedValueOnce(new Error('submit-failed'))

    render(
      <MemoryRouter>
        <WritePage />
      </MemoryRouter>,
    )

    const fileInput = document.querySelector('input[accept="image/*"]') as HTMLInputElement
    const file = new File(['cover'], 'cover.png', { type: 'image/png' })
    fireEvent.change(fileInput, { target: { files: [file] } })

    await waitFor(() => {
      expect(toastMock).toHaveBeenCalledWith('Upload failed from API', 'error')
    })

    fireEvent.click(screen.getByRole('button', { name: 'Submit for review' }))

    await waitFor(() => {
      expect(toastMock).toHaveBeenCalledWith('Submit failed', 'error')
    })
  })

  it('shows preview pane when preview mode is enabled', () => {
    mockStore.previewMode = true
    mockStore.title = 'Preview Title'

    render(
      <MemoryRouter>
        <WritePage />
      </MemoryRouter>,
    )

    expect(screen.getByText('Preview: Preview Title')).toBeInTheDocument()
  })
})
