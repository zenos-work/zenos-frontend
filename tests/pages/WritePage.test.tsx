import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import WritePage from '../../src/pages/WritePage'
import api from '../../src/lib/api'

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
const setContentTypeMock = vi.fn()
const setContentMock = vi.fn()
const setLastVerifiedAtMock = vi.fn()
const setExpiresAtMock = vi.fn()
const setSeoTitleMock = vi.fn()
const setSeoDescriptionMock = vi.fn()
const setCanonicalUrlMock = vi.fn()
const setOgImageUrlMock = vi.fn()
const setSeoSchemaTypeMock = vi.fn()
const toggleTagMock = vi.fn()
const togglePreviewMock = vi.fn()
const setSidebarMock = vi.fn()

let mockStore: {
  articleId?: string
  title: string
  subtitle: string
  contentType: 'article' | 'how-to' | 'case-study' | 'research'
  content: string
  coverImageUrl: string
  lastVerifiedAt: string
  expiresAt: string
  seoTitle: string
  seoDescription: string
  canonicalUrl: string
  ogImageUrl: string
  seoSchemaType: 'Article' | 'TechArticle' | 'HowTo'
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
  setContentType: typeof setContentTypeMock
  setContent: typeof setContentMock
  setLastVerifiedAt: typeof setLastVerifiedAtMock
  setExpiresAt: typeof setExpiresAtMock
  setSeoTitle: typeof setSeoTitleMock
  setSeoDescription: typeof setSeoDescriptionMock
  setCanonicalUrl: typeof setCanonicalUrlMock
  setOgImageUrl: typeof setOgImageUrlMock
  setSeoSchemaType: typeof setSeoSchemaTypeMock
  toggleTag: typeof toggleTagMock
  togglePreview: typeof togglePreviewMock
}

const useArticleMock = vi.fn()
const useCreateArticleMock = vi.fn()
const useUpdateArticleMock = vi.fn()
const useSubmitArticleMock = vi.fn()
const useTagsMock = vi.fn()
const useAuthMock = vi.fn()

const useEditorStoreMock = vi.fn(
  (selector?: (state: typeof mockStore) => unknown) =>
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
  useQuery: () => ({
    data: [],
    isLoading: false,
  }),
  useMutation: () => ({
    mutateAsync: uploadMutateAsyncMock,
    isPending: false,
  }),
}))

vi.mock('../../src/stores/editorStore', () => ({
  useEditorStore: (selector?: (state: typeof mockStore) => unknown) =>
    useEditorStoreMock(selector),
}))

vi.mock('../../src/stores/uiStore', () => ({
  useUiStore: Object.assign(
    (selector: (state: { toast: (...args: unknown[]) => void; setSidebar: (open: boolean) => void }) => unknown) =>
      selector({ toast: toastMock, setSidebar: setSidebarMock }),
    {
      getState: () => ({ sidebarOpen: true }),
    },
  ),
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

vi.mock('../../src/hooks/useAuth', () => ({
  useAuth: () => useAuthMock(),
}))

vi.mock('../../src/lib/api', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
  },
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
      contentType: 'article',
      content: 'This is sufficiently long content for saving the draft without validation errors.',
      coverImageUrl: '',
      lastVerifiedAt: '',
      expiresAt: '',
      seoTitle: '',
      seoDescription: '',
      canonicalUrl: '',
      ogImageUrl: '',
      seoSchemaType: 'Article',
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
      setContentType: setContentTypeMock,
      setContent: setContentMock,
      setLastVerifiedAt: setLastVerifiedAtMock,
      setExpiresAt: setExpiresAtMock,
      setSeoTitle: setSeoTitleMock,
      setSeoDescription: setSeoDescriptionMock,
      setCanonicalUrl: setCanonicalUrlMock,
      setOgImageUrl: setOgImageUrlMock,
      setSeoSchemaType: setSeoSchemaTypeMock,
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
    useAuthMock.mockReturnValue({
      user: { id: 'u-author', role: 'AUTHOR', name: 'Alex', email: 'alex@zenos.work' },
    })

    vi.mocked(api.get).mockResolvedValue({ data: { approvers: [] } } as never)
    vi.mocked(api.post).mockResolvedValue({ data: {} } as never)

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

    expect(hydrateMock).toHaveBeenCalledWith(
      expect.objectContaining({
        articleId: 'a1',
        title: 'Existing',
        subtitle: 'Existing sub',
        contentType: 'article',
        content: '{"type":"doc"}',
        coverImageUrl: '/cover.png',
        selectedTags: [{ id: 't9', name: 'Tag9', slug: 'tag9', article_count: 1 }],
      }),
    )

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
      expect(createMutateAsyncMock).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'Draft title',
          subtitle: 'Draft subtitle',
          content: 'This is sufficiently long content for saving the draft without validation errors.',
          tag_ids: ['t1'],
        }),
      )
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

    expect(screen.getByText('Submitted for review!')).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: /view in my library/i }))
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
      expect(toastMock).toHaveBeenCalledWith('submit-failed', 'error')
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

    expect(screen.getByText('Preview: Preview Title')).toBeTruthy()
  })

  it('allows author to add a new tag and send approval message to selected approver', async () => {
    mockParams = { id: 'existing-id' }
    useArticleMock.mockReturnValue({
      data: {
        id: 'existing-id',
        title: 'Pending Draft',
        subtitle: 'Needs review',
        content: '{"type":"doc"}',
        status: 'SUBMITTED',
        tags: [],
      },
    })

    vi.mocked(api.get).mockResolvedValueOnce({
      data: {
        content_types: [
          { slug: 'article', name: 'Article' },
          { slug: 'how-to', name: 'How-to' },
        ],
      },
    } as never)
    vi.mocked(api.get).mockResolvedValueOnce({
      data: {
        approvers: [
          { id: 'ap-1', name: 'Priya Approver', role: 'APPROVER' },
        ],
      },
    } as never)
    vi.mocked(api.post)
      .mockResolvedValueOnce({
        data: { tag: { id: 't9', name: 'FinOps', slug: 'finops', article_count: 0 } },
      } as never)
      .mockResolvedValueOnce({ data: { status: 'sent', recipients: 1 } } as never)

    render(
      <MemoryRouter>
        <WritePage />
      </MemoryRouter>,
    )

    fireEvent.change(screen.getByPlaceholderText('Create a new tag (e.g. fintech or #fintech)'), {
      target: { value: '#FinOps' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Add Tag' }))

    await waitFor(() => {
      expect(api.post).toHaveBeenCalledWith('/api/tags', { name: 'FinOps', tag_type: 'topic' })
    })
    expect(toggleTagMock).toHaveBeenCalledWith({
      id: 't9',
      name: 'FinOps',
      slug: 'finops',
      article_count: 0,
    })

    fireEvent.click(screen.getByLabelText('Individual'))
    fireEvent.click(await screen.findByLabelText(/Priya Approver/i))
    fireEvent.change(screen.getByPlaceholderText('Write a message to approvers...'), {
      target: { value: 'Can you prioritize this review?' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Send message' }))

    await waitFor(() => {
      expect(api.post).toHaveBeenCalledWith('/api/users/approvers/message', {
        article_id: 'existing-id',
        mode: 'individual',
        recipient_ids: ['ap-1'],
        message: 'Can you prioritize this review?',
      })
    })
    expect(toastMock).toHaveBeenCalledWith('Message sent to approvers', 'success')
  })

  it('validates individual approver selection and message content before sending', async () => {
    mockParams = { id: 'existing-id' }
    useArticleMock.mockReturnValue({
      data: {
        id: 'existing-id',
        title: 'Pending Draft',
        subtitle: 'Needs review',
        content: '{"type":"doc"}',
        status: 'SUBMITTED',
        tags: [],
      },
    })

    vi.mocked(api.get).mockResolvedValueOnce({
      data: {
        content_types: [
          { slug: 'article', name: 'Article' },
        ],
      },
    } as never)
    vi.mocked(api.get).mockResolvedValueOnce({
      data: { approvers: [{ id: 'ap-1', name: 'Priya Approver', role: 'APPROVER' }] },
    } as never)

    render(
      <MemoryRouter>
        <WritePage />
      </MemoryRouter>,
    )

    fireEvent.click(screen.getByLabelText('Individual'))
    fireEvent.change(screen.getByPlaceholderText('Write a message to approvers...'), {
      target: { value: 'Please review asap' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Send message' }))

    await waitFor(() => {
      expect(toastMock).toHaveBeenCalledWith('Select at least one approver', 'warning')
    })

    fireEvent.click(await screen.findByLabelText(/Priya Approver/i))
    fireEvent.change(screen.getByPlaceholderText('Write a message to approvers...'), {
      target: { value: '' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Send message' }))

    await waitFor(() => {
      expect(toastMock).toHaveBeenCalledWith('Write a message before sending', 'warning')
    })
  })
})
