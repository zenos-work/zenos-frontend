import { useEffect, useCallback, useMemo, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useMutation } from '@tanstack/react-query'
import { Upload, CheckCircle2, BookOpen, PenSquare as PenSquareIcon, Share2 as Share2Icon, Plus, X } from 'lucide-react'
import api from '../lib/api'
import Modal from '../components/ui/Modal'
import { useEditorStore }  from '../stores/editorStore'
import { useUiStore }      from '../stores/uiStore'
import { useArticle, useCreateArticle, useUpdateArticle, useSubmitArticle } from '../hooks/useArticles'
import { useTags }         from '../hooks/useTags'
import { useAuth }         from '../hooks/useAuth'
import { useAssignArticleToSeries } from '../hooks/useSeries'
import Editor        from '../components/editor/Editor'
import EditorToolbar from '../components/editor/EditorToolbar'
import PreviewPane   from '../components/editor/PreviewPane'
import SeriesSelector from '../components/editor/SeriesSelector'
import Spinner from '../components/ui/Spinner'
import { resolveAssetUrl } from '../lib/assets'
import type { ArticleContentType, ContentTypeOption } from '../types'
import type { Series } from '../hooks/useSeries'

const AUTO_SAVE_MS = 20000
const LIFELONG_EXPIRES_AT = '5000-12-31T23:59'
const ACTION_TIMEOUT_MS = 45000
const DEFAULT_CONTENT_TYPES: ContentTypeOption[] = [
  { slug: 'article', name: 'Article' },
  { slug: 'how-to', name: 'How-to' },
  { slug: 'case-study', name: 'Case study' },
  { slug: 'research', name: 'Research' },
]

function omitEmptyFields<T extends Record<string, unknown>>(payload: T): Partial<T> {
  return Object.fromEntries(
    Object.entries(payload).filter(([, value]) => value !== undefined && value !== ''),
  ) as Partial<T>
}

type ArticleDraftPayload = {
  title: string
  content: string
  subtitle?: string
  content_type?: ArticleContentType
  cover_image_url?: string
  last_verified_at?: string
  reading_level?: 'Beginner' | 'Intermediate' | 'Advanced'
  expires_at?: string
  seo_title?: string
  seo_description?: string
  canonical_url?: string
  og_image_url?: string
  citations?: string[]
  seo_schema_type?: 'Article' | 'TechArticle' | 'HowTo'
  tag_ids?: string[]
}

type Approver = {
  id: string
  name: string
  role: 'SUPERADMIN' | 'APPROVER' | 'AUTHOR' | 'READER'
  avatar_url?: string
}

type PendingActionKind = 'inline-image' | 'cover-image' | 'save-draft' | 'submit-review'

type PendingAction = {
  kind: PendingActionKind
  label: string
  timeoutMs: number
}

function getApiErrorMessage(err: unknown): string | null {
  if (!err || typeof err !== 'object') return null

  type ApiErrorShape = {
    response?: {
      data?: {
        error?: {
          message?: string
        }
      }
    }
    message?: string
  }

  const maybeError = err as ApiErrorShape
  return maybeError.response?.data?.error?.message ?? maybeError.message ?? null
}

function normalizeTagName(raw: string): string {
  return raw.trim().replace(/^#+\s*/, '')
}

async function withTimeout<T>(promise: Promise<T>, timeoutMs: number, message: string): Promise<T> {
  let timeoutId: ReturnType<typeof setTimeout> | undefined
  const timeoutPromise = new Promise<never>((_, reject) => {
    timeoutId = window.setTimeout(() => reject(new Error(message)), timeoutMs)
  })

  try {
    return await Promise.race([promise, timeoutPromise]) as T
  } finally {
    if (timeoutId !== undefined) {
      window.clearTimeout(timeoutId)
    }
  }
}

function getWordCount(content: string): number {
  if (!content) return 0
  try {
    const parsed = JSON.parse(content)
    const text = JSON.stringify(parsed)
      .replace(/"type":"[^"]+"/g, ' ')
      .replace(/"attrs":\{[^}]*\}/g, ' ')
      .replace(/"marks":\[[^\]]*\]/g, ' ')
      .replace(/[{}[\]",:]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
    return text ? text.split(' ').length : 0
  } catch {
    return content.trim().split(/\s+/).filter(Boolean).length
  }
}

function toDateTimeLocal(value?: string): string {
  if (!value) return ''
  const trimmed = value.trim()
  if (trimmed.includes('T')) return trimmed.slice(0, 16)
  return trimmed.replace(' ', 'T').slice(0, 16)
}

function toCurrentDateTimeLocal(): string {
  const now = new Date()
  const y = now.getFullYear()
  const m = `${now.getMonth() + 1}`.padStart(2, '0')
  const d = `${now.getDate()}`.padStart(2, '0')
  const hh = `${now.getHours()}`.padStart(2, '0')
  const mm = `${now.getMinutes()}`.padStart(2, '0')
  return `${y}-${m}-${d}T${hh}:${mm}`
}

function normalizeExpiresForDisplay(value?: string): string {
  const normalized = toDateTimeLocal(value)
  if (!normalized) return ''
  return normalized.startsWith('5000-12-31') ? '' : normalized
}

function extractPlainText(content: string): string {
  if (!content) return ''
  try {
    const parsed = JSON.parse(content)
    const text = JSON.stringify(parsed)
      .replace(/"type":"[^"]+"/g, ' ')
      .replace(/"attrs":\{[^}]*\}/g, ' ')
      .replace(/"marks":\[[^\]]*\]/g, ' ')
      .replace(/[{}[\]",:]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
    return text
  } catch {
    return content.replace(/\s+/g, ' ').trim()
  }
}

function buildSeoDescription(subtitle: string, content: string): string {
  const preferred = subtitle.trim() || extractPlainText(content)
  return preferred.slice(0, 300)
}

export default function WritePage() {
  const { id }    = useParams()
  const navigate  = useNavigate()
  const { user }  = useAuth()
  const store     = useEditorStore()
  const hydrateEditor = useEditorStore(s => s.hydrate)
  const resetEditor = useEditorStore(s => s.reset)
  const toast     = useUiStore(s => s.toast)
  const setSidebar = useUiStore(s => s.setSidebar)
  const [tagQuery, setTagQuery] = useState('')
  const [localTags, setLocalTags] = useState<Array<{ id: string; name: string; slug: string; tag_type?: 'topic' | 'outcome'; article_count: number }>>([])
  const [newTagName, setNewTagName] = useState('')
  const [newTagType, setNewTagType] = useState<'topic' | 'outcome'>('topic')
  const [creatingTag, setCreatingTag] = useState(false)
  const [approvers, setApprovers] = useState<Approver[]>([])
  const [approversLoading, setApproversLoading] = useState(false)
  const [approversError, setApproversError] = useState<string | null>(null)
  const [recipientMode, setRecipientMode] = useState<'group' | 'individual'>('group')
  const [selectedApproverIds, setSelectedApproverIds] = useState<string[]>([])
  const [approvalMessage, setApprovalMessage] = useState('')
  const [sendingApprovalMessage, setSendingApprovalMessage] = useState(false)
  const [uploadTarget, setUploadTarget] = useState<'inline-image' | 'cover-image' | null>(null)
  const [uploadProgressPct, setUploadProgressPct] = useState<number | null>(null)
  const [contentTypeOptions, setContentTypeOptions] = useState<ContentTypeOption[]>(DEFAULT_CONTENT_TYPES)
  const [newContentTypeName, setNewContentTypeName] = useState('')
  const [newContentTypeSlug, setNewContentTypeSlug] = useState('')
  const [creatingContentType, setCreatingContentType] = useState(false)
  const [showPublishSuccess, setShowPublishSuccess] = useState(false)
  const [publishedArticleSlug, setPublishedArticleSlug] = useState<string | undefined>(undefined)
  const [pendingAction, setPendingAction] = useState<PendingAction | null>(null)

  const {
    data: allTags,
    isLoading: tagsLoading,
    isError: tagsError,
  } = useTags()

  useEffect(() => {
    setLocalTags(allTags ?? [])
  }, [allTags])

  useEffect(() => {
    let cancelled = false
    const loadContentTypes = async () => {
      try {
        const res = await api.get<{ content_types: ContentTypeOption[] }>('/api/articles/content-types')
        if (cancelled) return
        const fetched = (res.data.content_types ?? []).filter((item) => item?.slug)
        if (!fetched.length) return
        setContentTypeOptions(fetched)
      } catch {
        // Keep editor functional with default content types if the endpoint is unavailable.
      }
    }
    void loadContentTypes()
    return () => {
      cancelled = true
    }
  }, [])

  // Load existing article when editing
  const { data: existing } = useArticle(id ?? '')
  useEffect(() => {
    if (!existing) return
    hydrateEditor({
      articleId: existing.id,
      title: existing.title,
      subtitle: existing.subtitle ?? '',
      contentType: existing.content_type ?? 'article',
      content: existing.content,
      coverImageUrl: existing.cover_image_url ?? '',
      lastVerifiedAt: toDateTimeLocal(existing.last_verified_at),
      expiresAt: normalizeExpiresForDisplay(existing.expires_at),
      seoTitle: existing.seo_title ?? '',
      seoDescription: existing.seo_description ?? '',
      canonicalUrl: existing.canonical_url ?? '',
      ogImageUrl: existing.og_image_url ?? '',
      citations: existing.citations ?? [],
        readingLevel: existing.reading_level as 'Beginner' | 'Intermediate' | 'Advanced' | undefined,
      seoSchemaType: existing.seo_schema_type ?? 'Article',
      selectedTags: existing.tags,
    })
  }, [existing, hydrateEditor])

  // Cleanup on unmount
  useEffect(() => () => resetEditor(), [resetEditor])

  // Writer mode always starts with a compact sidebar and restores previous state on exit.
  useEffect(() => {
    const previousSidebarState = useUiStore.getState().sidebarOpen
    setSidebar(false)
    return () => setSidebar(previousSidebarState)
  }, [setSidebar])

  useEffect(() => {
    if (!id && !existing && !store.lastVerifiedAt) {
      store.setLastVerifiedAt(toCurrentDateTimeLocal())
    }
  }, [id, existing, store])

  const createMutation = useCreateArticle()
  const updateMutation = useUpdateArticle(id ?? store.articleId ?? '')
  const submitMutation = useSubmitArticle()
  const assignSeriesMutation = useAssignArticleToSeries()
  const uploadMutation = useMutation({
    mutationFn: async ({ file, onProgress }: { file: File; onProgress?: (pct: number) => void }) => {
      const res = await api.post<{ url: string; key: string }>(
        '/api/media/upload',
        file,
        {
          headers: { 'Content-Type': file.type },
          onUploadProgress: (event) => {
            if (!event.total) return
            const pct = Math.min(100, Math.max(1, Math.round((event.loaded * 100) / event.total)))
            onProgress?.(pct)
          },
        },
      )
      return res.data
    },
  })

  const contentWordCount = useMemo(() => getWordCount(store.content), [store.content])
  const readTime = Math.max(1, Math.ceil(contentWordCount / 200))

  const availableTags = useMemo(() => {
    const selected = new Set(store.selectedTags.map(t => t.id))
    const q = tagQuery.trim().toLowerCase()
    return (localTags ?? [])
      .filter(t => !selected.has(t.id))
      .filter(t => !q || t.name.toLowerCase().includes(q) || t.slug.toLowerCase().includes(q))
      .slice(0, 20)
  }, [localTags, store.selectedTags, tagQuery])

  const canManageTags = user?.role === 'AUTHOR' || user?.role === 'APPROVER' || user?.role === 'SUPERADMIN'
  const canManageSeo = user?.role === 'APPROVER' || user?.role === 'SUPERADMIN'
  const showApprovalPanel = !!existing && (existing.status === 'SUBMITTED' || existing.status === 'APPROVED')

  useEffect(() => {
    if (!showApprovalPanel || !canManageTags) return
    let cancelled = false

    const loadApprovers = async () => {
      setApproversLoading(true)
      setApproversError(null)
      try {
        const res = await api.get<{ approvers: Approver[] }>('/api/users/approvers')
        setApprovers(res.data.approvers ?? [])
      } catch {
        if (cancelled) return
        setApproversError('Could not load approvers right now.')
      } finally {
        if (!cancelled) setApproversLoading(false)
      }
    }

    void loadApprovers()
    return () => {
      cancelled = true
    }
  }, [showApprovalPanel, canManageTags])

  const handleCreateTag = async () => {
    const name = normalizeTagName(newTagName)
    if (!name) {
      toast('Tag name is required', 'warning')
      return
    }
    setCreatingTag(true)
    try {
      const res = await api.post<{ tag: { id: string; name: string; slug: string; tag_type?: 'topic' | 'outcome'; article_count: number } }>(
        '/api/tags',
        { name, tag_type: newTagType },
      )
      const created = res.data.tag
      setLocalTags((prev) => {
        if (prev.some((t) => t.id === created.id || t.slug === created.slug)) return prev
        return [...prev, created]
      })
      store.toggleTag(created)
      setNewTagName('')
      setNewTagType('topic')
      toast(`Tag created: ${created.name}`, 'success')
    } catch (err) {
      toast(getApiErrorMessage(err) ?? 'Could not create tag', 'error')
    } finally {
      setCreatingTag(false)
    }
  }

  const handleCreateContentType = async () => {
    const name = newContentTypeName.trim()
    const slug = newContentTypeSlug.trim()
    if (!name) {
      toast('Content type name is required', 'warning')
      return
    }
    setCreatingContentType(true)
    try {
      const res = await api.post<{ content_type: { slug: string; name: string } }>(
        '/api/admin/content-types',
        { name, slug: slug || undefined },
      )
      const created = res.data.content_type
      if (created?.slug) {
        setContentTypeOptions((prev) => {
          if (prev.some((item) => item.slug === created.slug)) return prev
          return [...prev, { slug: created.slug, name: created.name || created.slug }]
        })
        store.setContentType(created.slug)
      }
      setNewContentTypeName('')
      setNewContentTypeSlug('')
      toast('Content type added', 'success')
    } catch (err) {
      toast(getApiErrorMessage(err) ?? 'Could not add content type', 'error')
    } finally {
      setCreatingContentType(false)
    }
  }

  const toggleApprover = (approverId: string) => {
    setSelectedApproverIds((prev) =>
      prev.includes(approverId) ? prev.filter((id) => id !== approverId) : [...prev, approverId],
    )
  }

  const sendApprovalMessage = async () => {
    const message = approvalMessage.trim()
    if (!message) {
      toast('Write a message before sending', 'warning')
      return
    }

    const articleId = existing?.id ?? id ?? store.articleId
    if (!articleId) {
      toast('Save the draft first before messaging approvers', 'warning')
      return
    }

    if (recipientMode === 'individual' && selectedApproverIds.length === 0) {
      toast('Select at least one approver', 'warning')
      return
    }

    setSendingApprovalMessage(true)
    try {
      await api.post('/api/users/approvers/message', {
        article_id: articleId,
        mode: recipientMode,
        recipient_ids: selectedApproverIds,
        message,
      })
      setApprovalMessage('')
      toast('Message sent to approvers', 'success')
    } catch (err) {
      toast(getApiErrorMessage(err) ?? 'Could not send message to approvers', 'error')
    } finally {
      setSendingApprovalMessage(false)
    }
  }

  const handleSave = useCallback(async (options?: { showOverlay?: boolean }): Promise<string | undefined> => {
    if (!store.title.trim()) {
      toast('Title is required', 'error')
      return undefined
    }

    const normalizedContent = store.content.trim()
    if (!normalizedContent) {
      toast('Content is required', 'error')
      return undefined
    }

    if (normalizedContent.length < 50) {
      toast('Content must be at least 50 characters long', 'error')
      return undefined
    }

    if (options?.showOverlay) {
      setPendingAction({ kind: 'save-draft', label: 'Saving draft...', timeoutMs: ACTION_TIMEOUT_MS })
    }
    store.setIsSaving(true)
    try {
      const fallbackSeoTitle = store.title.trim() || undefined
      const fallbackSeoDescription = buildSeoDescription(store.subtitle, store.content) || undefined
      const fallbackCanonicalUrl = existing?.slug
        ? `${window.location.origin}/article/${existing.slug}`
        : undefined
      const fallbackOgImageUrl = store.coverImageUrl || undefined

      const payload: ArticleDraftPayload = {
        title:           store.title,
        content:         store.content,
        tag_ids:         store.selectedTags.map(t => t.id),
        content_type:    store.contentType,
      }
      const optionalFields = omitEmptyFields({
        subtitle: store.subtitle || undefined,
        cover_image_url: store.coverImageUrl || undefined,
        reading_level: store.readingLevel || undefined,
        last_verified_at: store.lastVerifiedAt || undefined,
        expires_at: store.expiresAt || LIFELONG_EXPIRES_AT,
        seo_title: store.seoTitle || fallbackSeoTitle,
        seo_description: store.seoDescription || fallbackSeoDescription,
        canonical_url: store.canonicalUrl || fallbackCanonicalUrl,
        og_image_url: store.ogImageUrl || fallbackOgImageUrl,
        citations: (store.citations ?? []).map((item) => item.trim()).filter(Boolean),
        seo_schema_type: store.seoSchemaType || undefined,
      })
      Object.assign(payload, optionalFields)
      const targetArticleId = id ?? store.articleId

      if (targetArticleId) {
        await withTimeout(
          updateMutation.mutateAsync(payload),
          ACTION_TIMEOUT_MS,
          'Saving draft timed out. Please try again.',
        )
        store.markSaved()

        // Handle series assignment
        if (store.series) {
          try {
            await assignSeriesMutation.mutateAsync({
              articleId: targetArticleId,
              seriesId: store.series.id,
              partNumber: store.series.part ?? 1,
            })
          } catch {
            toast('Could not assign to series, but article was saved', 'warning')
          }
        }

        toast('Draft saved', 'success')
        return targetArticleId
      } else {
        const article = await withTimeout(
          createMutation.mutateAsync(payload),
          ACTION_TIMEOUT_MS,
          'Saving draft timed out. Please try again.',
        )
        store.setArticleId(article.id)
        navigate(`/write/${article.id}`, { replace: true })
        store.markSaved()

        // Handle series assignment for new article
        if (store.series) {
          try {
            await assignSeriesMutation.mutateAsync({
              articleId: article.id,
              seriesId: store.series.id,
              partNumber: store.series.part ?? 1,
            })
          } catch {
            toast('Could not assign to series, but article was saved', 'warning')
          }
        }

        toast('Draft saved', 'success')
        return article.id
      }
    } catch (err) {
      toast(getApiErrorMessage(err) ?? 'Save failed — please try again', 'error')
      return undefined
    } finally {
      store.setIsSaving(false)
      if (options?.showOverlay) {
        setPendingAction((prev) => (prev?.kind === 'save-draft' ? null : prev))
      }
    }
  }, [store, id, existing?.slug, toast, updateMutation, createMutation, assignSeriesMutation, navigate])

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') {
        e.preventDefault()
        void handleSave({ showOverlay: true })
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [handleSave])

  useEffect(() => {
    if (!store.isDirty || !store.title.trim()) return
    if (!id && !store.articleId) return
    const timer = window.setTimeout(() => {
      void handleSave()
    }, AUTO_SAVE_MS)
    return () => window.clearTimeout(timer)
  }, [store.isDirty, store.title, store.subtitle, store.contentType, store.content, store.coverImageUrl, store.lastVerifiedAt, store.expiresAt, store.seoTitle, store.seoDescription, store.canonicalUrl, store.ogImageUrl, store.citations, store.seoSchemaType, store.selectedTags, id, store.articleId, handleSave])

  const uploadImageFile = async (file: File, onProgress?: (pct: number) => void): Promise<string> => {
    if (!file.type.startsWith('image/')) {
      throw new Error('Please choose an image file')
    }
    const result = await withTimeout(
      uploadMutation.mutateAsync({ file, onProgress }),
      ACTION_TIMEOUT_MS,
      'Image upload timed out. Please try again.',
    )
    return result.url
  }

  const inlineUploadInProgress = uploadMutation.isPending && uploadTarget === 'inline-image'
  const coverUploadInProgress = uploadMutation.isPending && uploadTarget === 'cover-image'
  const inlineUploadStatusText = inlineUploadInProgress
    ? `Uploading image${uploadProgressPct ? `... ${uploadProgressPct}%` : '...'}`
    : undefined

  const handleInlineImageUpload = async (file: File) => {
    setPendingAction({ kind: 'inline-image', label: 'Uploading image...', timeoutMs: ACTION_TIMEOUT_MS })
    setUploadTarget('inline-image')
    setUploadProgressPct(0)
    try {
      const url = await uploadImageFile(file, (pct) => setUploadProgressPct(pct))
      toast('Image inserted', 'success')
      return url
    } catch (err) {
      toast(getApiErrorMessage(err) ?? 'Inline image upload failed', 'error')
      throw err
    } finally {
      setUploadTarget(null)
      setUploadProgressPct(null)
      setPendingAction((prev) => (prev?.kind === 'inline-image' ? null : prev))
    }
  }

  const handleCoverUpload = async (file: File | undefined) => {
    if (!file) return
    setPendingAction({ kind: 'cover-image', label: 'Uploading cover image...', timeoutMs: ACTION_TIMEOUT_MS })
    setUploadTarget('cover-image')
    setUploadProgressPct(0)
    try {
      const url = await uploadImageFile(file, (pct) => setUploadProgressPct(pct))
      store.setCoverImage(url)
      toast('Cover image uploaded', 'success')
    } catch (err) {
      toast(getApiErrorMessage(err) ?? 'Cover image upload failed', 'error')
    } finally {
      setUploadTarget(null)
      setUploadProgressPct(null)
      setPendingAction((prev) => (prev?.kind === 'cover-image' ? null : prev))
    }
  }

  const handleSubmit = async () => {
    if (contentWordCount < 80) {
      toast('Add more content before submitting (minimum ~80 words)', 'warning')
      return
    }
    setPendingAction({ kind: 'submit-review', label: 'Submitting for review...', timeoutMs: ACTION_TIMEOUT_MS })
    const articleId = await handleSave()
    if (!articleId) {
      setPendingAction((prev) => (prev?.kind === 'submit-review' ? null : prev))
      return
    }
    try {
      await withTimeout(
        submitMutation.mutateAsync(articleId),
        ACTION_TIMEOUT_MS,
        'Submit for review timed out. Please try again.',
      )
      // Capture the slug for the success dialog's "share" button before resetting state
      const slug = existing?.slug
      setPublishedArticleSlug(slug)
      setShowPublishSuccess(true)
    } catch (err) {
      toast(getApiErrorMessage(err) ?? 'Submit failed', 'error')
    } finally {
      setPendingAction((prev) => (prev?.kind === 'submit-review' ? null : prev))
    }
  }

  useEffect(() => {
    if (!pendingAction) return

    const timeoutId = window.setTimeout(() => {
      setPendingAction(null)
      store.setIsSaving(false)
      setUploadTarget(null)
      setUploadProgressPct(null)
      toast(`${pendingAction.label.replace(/\.\.\.$/, '')} timed out. Please try again.`, 'error')
    }, pendingAction.timeoutMs)

    return () => window.clearTimeout(timeoutId)
  }, [pendingAction, store, toast])

  const addCitationRow = () => {
    store.setCitations([...(store.citations ?? []), ''])
  }

  const updateCitationRow = (index: number, value: string) => {
    const next = [...(store.citations ?? [])]
    next[index] = value
    store.setCitations(next)
  }

  const removeCitationRow = (index: number) => {
    const next = (store.citations ?? []).filter((_, i) => i !== index)
    store.setCitations(next)
  }

  return (
    <div className='flex flex-col min-h-[calc(100vh-3.5rem)]'>
      {/* Post-publish success dialog */}
      <Modal
        open={showPublishSuccess}
        onClose={() => {
          setShowPublishSuccess(false)
          navigate('/library')
        }}
        title="Submitted for review!"
      >
        <div className="flex flex-col gap-5">
          <div className="flex flex-col items-center gap-2 py-2 text-center">
            <CheckCircle2 size={40} className="text-emerald-500" />
            <p className="text-sm text-[color:var(--text-secondary)]">
              Your article has been submitted and is pending review by an approver.
              We'll notify you once it's approved and published.
            </p>
          </div>
          <div className="flex flex-col gap-2">
            <button
              onClick={() => {
                setShowPublishSuccess(false)
                navigate('/write')
              }}
              className="flex items-center justify-center gap-2 rounded-lg bg-[color:var(--accent)] px-4 py-2.5 text-sm font-semibold text-[color:var(--surface-0)] hover:opacity-90 transition-opacity"
            >
              <PenSquareIcon size={15} />
              Write another article
            </button>
            <button
              onClick={() => {
                setShowPublishSuccess(false)
                navigate('/library')
              }}
              className="flex items-center justify-center gap-2 rounded-lg border border-[color:var(--border)] px-4 py-2.5 text-sm text-[color:var(--text-primary)] hover:bg-[color:var(--surface-2)] transition-colors"
            >
              <BookOpen size={15} />
              View in My Library
            </button>
            {publishedArticleSlug && (
              <button
                onClick={() => {
                  const url = `${window.location.origin}/article/${publishedArticleSlug}`
                  void navigator.clipboard.writeText(url).then(() => {
                    toast('Link copied!', 'success')
                  })
                }}
                className="flex items-center justify-center gap-2 rounded-lg border border-[color:var(--border)] px-4 py-2.5 text-sm text-[color:var(--text-secondary)] hover:bg-[color:var(--surface-2)] transition-colors"
              >
                <Share2Icon size={15} />
                Copy article link
              </button>
            )}
          </div>
        </div>
      </Modal>

      <EditorToolbar
        onSave={() => void handleSave({ showOverlay: true })}
        onSubmit={handleSubmit}
        onTogglePreview={store.togglePreview}
        isSaving={store.isSaving}
        isSubmitting={pendingAction?.kind === 'submit-review'}
        isDirty={store.isDirty}
        previewMode={store.previewMode}
      />

      {pendingAction && (
        <div className='fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-[1px]'>
          <div className='min-w-[280px] max-w-[420px] rounded-xl border border-[color:var(--border)] bg-[color:var(--surface-1)] px-5 py-4 shadow-[var(--shadow)]'>
            <div className='flex items-center gap-3'>
              <Spinner size='md' />
              <div>
                <p className='text-sm font-semibold text-[color:var(--text-primary)]'>{pendingAction.label}</p>
                <p className='text-xs text-[color:var(--text-muted)]'>
                  {uploadProgressPct && (pendingAction.kind === 'inline-image' || pendingAction.kind === 'cover-image')
                    ? `Progress: ${uploadProgressPct}%`
                    : 'Please wait...'}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className={[
        'flex flex-1 gap-6 pt-6',
        store.previewMode ? '' : 'flex-col',
      ].join(' ')}>

        {/* Editor side */}
        <div className={store.previewMode ? 'w-1/2' : 'w-full'}>
          {/* Cover image URL input */}
          <div className='mb-4 rounded-xl border border-[color:var(--border)] bg-[color:var(--surface-1)] p-3'>
            <div className='flex flex-wrap items-center justify-between gap-3'>
              <p className='text-xs uppercase tracking-wider text-[color:var(--text-muted)]'>Cover Image</p>
              <label className='inline-flex cursor-pointer items-center gap-2 rounded-lg border border-[color:var(--border-strong)] bg-[color:var(--surface-0)] px-3 py-1.5 text-xs text-[color:var(--text-primary)] hover:bg-[color:var(--surface-2)]'>
                <Upload size={13} />
                {coverUploadInProgress
                  ? `Uploading${uploadProgressPct ? ` ${uploadProgressPct}%` : '...'}`
                  : 'Upload image'}
                <input
                  type='file'
                  accept='image/*'
                  className='hidden'
                  onChange={e => void handleCoverUpload(e.target.files?.[0])}
                />
              </label>
            </div>
            {coverUploadInProgress && (
              <p className='mt-2 text-xs text-[color:var(--text-muted)]'>Cover upload in progress. Please wait...</p>
            )}
            <input
              value={store.coverImageUrl}
              onChange={e => store.setCoverImage(e.target.value)}
              placeholder='Or paste cover image URL (optional)'
              className='mt-3 w-full bg-transparent border-b border-[color:var(--border-strong)] pb-2 text-sm text-[color:var(--text-secondary)] placeholder-[color:var(--text-muted)] outline-none focus:border-[color:var(--accent)] transition-colors'
            />
          </div>

          {store.coverImageUrl && (
            <img
              src={resolveAssetUrl(store.coverImageUrl)}
              alt='Cover preview'
              className='mb-6 w-full h-64 object-cover rounded-xl border border-[color:var(--border-strong)]'
              loading='lazy'
            />
          )}

          {/* Title */}
          <input
            value={store.title}
            onChange={e => store.setTitle(e.target.value)}
            placeholder='Article title...'
            className='w-full mb-3 bg-transparent text-3xl font-bold text-[color:var(--text-primary)] placeholder-[color:var(--text-muted)] outline-none'
          />

          {/* Subtitle */}
          <input
            value={store.subtitle}
            onChange={e => store.setSubtitle(e.target.value)}
            placeholder='Add a subtitle (optional)'
            className='w-full mb-6 bg-transparent text-lg text-[color:var(--text-secondary)] placeholder-[color:var(--text-muted)] outline-none'
          />

          {/* Rich text editor */}
          <Editor
            content={store.content}
            onChange={store.setContent}
            onInlineImageUpload={handleInlineImageUpload}
            isInlineUploadInProgress={inlineUploadInProgress}
            inlineUploadStatusText={inlineUploadStatusText}
          />

          {/* Series assignment */}
          <div className='mt-6'>
            <SeriesSelector
              seriesId={store.series?.id}
              onSeriesSelect={(series: Series, partNumber: number) => {
                store.setSeries({ ...series, part: partNumber })
              }}
              onSeriesRemove={() => {
                store.setSeries(undefined)
              }}
              currentPartNumber={store.series?.part}
            />
          </div>

          {/* Citations (separate from validation/SEO) */}
          <div className='mt-6 rounded-xl border border-[color:var(--border-strong)] bg-[color:var(--surface-1)]/70 p-4'>
            <div className='mb-3 flex items-center justify-between gap-2'>
              <div>
                <p className='text-xs font-semibold uppercase tracking-wide text-[color:var(--text-muted)]'>
                  Citations (Optional)
                </p>
                <p className='mt-1 text-[11px] text-[color:var(--text-muted)]'>
                  Add source links used in your article, like research paper references. You can add multiple links.
                </p>
              </div>
              <button
                type='button'
                onClick={addCitationRow}
                className='inline-flex items-center gap-1 rounded-md border border-[color:var(--accent)] px-2 py-1 text-[11px] font-semibold text-[color:var(--text-primary)] hover:bg-[color:var(--accent-dim)]'
              >
                <Plus size={12} /> Add
              </button>
            </div>

            {(store.citations ?? []).length === 0 && (
              <p className='text-[11px] text-[color:var(--text-muted)]'>
                No citations added. Leave empty if not needed.
              </p>
            )}

            <div className='space-y-2'>
              {(store.citations ?? []).map((citation, index) => (
                <div key={`citation-${index}`} className='flex items-center gap-2'>
                  <input
                    value={citation}
                    onChange={e => updateCitationRow(index, e.target.value)}
                    className='h-10 flex-1 rounded-lg border border-[color:var(--border)] bg-[color:var(--surface-0)] px-3 text-sm text-[color:var(--text-primary)]'
                    placeholder={`Citation link ${index + 1} (https://...)`}
                  />
                  <button
                    type='button'
                    onClick={() => removeCitationRow(index)}
                    className='inline-flex h-10 w-10 items-center justify-center rounded-lg border border-[color:var(--border)] text-[color:var(--text-secondary)] hover:bg-[color:var(--surface-2)]'
                    aria-label={`Remove citation ${index + 1}`}
                    title='Remove citation'
                  >
                    <X size={14} />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Tags */}
          <div className='mt-6 rounded-xl border border-[color:var(--border-strong)] p-4 bg-[color:var(--surface-1)]/70'>
            <div className='flex items-center justify-between gap-3 mb-3'>
              <p className='text-xs uppercase tracking-wider text-[color:var(--text-muted)]'>Tags</p>
              <span className='text-xs text-[color:var(--text-muted)]'>{store.selectedTags.length} selected</span>
            </div>

            <input
              value={tagQuery}
              onChange={e => setTagQuery(e.target.value)}
              placeholder='Search tags...'
              className='w-full mb-3 rounded-lg bg-[color:var(--surface-0)] border border-[color:var(--border)] px-3 py-2 text-sm text-[color:var(--text-primary)] placeholder-[color:var(--text-muted)] outline-none focus:border-[color:var(--accent)]'
            />

            {canManageTags && (
              <div className='mb-3 flex flex-col gap-2 sm:flex-row sm:items-center'>
                <input
                  value={newTagName}
                  onChange={(e) => setNewTagName(e.target.value)}
                  placeholder='Create a new tag (e.g. fintech or #fintech)'
                  className='w-full rounded-lg bg-[color:var(--surface-0)] border border-[color:var(--border)] px-3 py-2 text-sm text-[color:var(--text-primary)] placeholder-[color:var(--text-muted)] outline-none focus:border-[color:var(--accent)]'
                />
                <select
                  value={newTagType}
                  onChange={(e) => setNewTagType(e.target.value as 'topic' | 'outcome')}
                  className='rounded-lg bg-[color:var(--surface-0)] border border-[color:var(--border)] px-3 py-2 text-xs text-[color:var(--text-secondary)]'
                >
                  <option value='topic'>Topic</option>
                  <option value='outcome'>Outcome</option>
                </select>
                <button
                  onClick={() => void handleCreateTag()}
                  disabled={creatingTag || !newTagName.trim()}
                  className='rounded-lg border border-[color:var(--accent)] px-3 py-2 text-xs font-semibold text-[color:var(--text-primary)] hover:bg-[color:var(--accent-dim)] disabled:cursor-not-allowed disabled:opacity-50'
                >
                  {creatingTag ? 'Creating...' : 'Add Tag'}
                </button>
              </div>
            )}

            {store.selectedTags.length > 0 && (
              <div className='flex flex-wrap gap-2 mb-3'>
                {store.selectedTags.map(t => (
                  <button
                    key={t.id}
                    onClick={() => store.toggleTag(t)}
                    className={[
                      'rounded-full px-3 py-1 text-xs border text-[color:var(--text-primary)] hover:opacity-90 transition-colors',
                      t.tag_type === 'outcome'
                        ? 'bg-emerald-500/15 border-emerald-500'
                        : 'bg-[color:var(--accent-dim)] border-[color:var(--accent)]',
                    ].join(' ')}
                    title='Click to remove'
                  >
                    {t.tag_type === 'outcome' ? 'Outcome' : 'Topic'}: #{t.name}
                  </button>
                ))}
              </div>
            )}

            <div className='flex flex-wrap gap-2'>
              {tagsLoading && (
                <p className='text-xs text-[color:var(--text-muted)]'>Loading tags...</p>
              )}
              {tagsError && (
                <p className='text-xs text-rose-700'>Could not load tags. Please refresh or check API connectivity.</p>
              )}
              {availableTags.map(t => (
                <button
                  key={t.id}
                  onClick={() => store.toggleTag(t)}
                  className='rounded-full px-3 py-1 text-xs bg-[color:var(--surface-2)] border border-[color:var(--border)] text-[color:var(--text-secondary)] hover:bg-[color:var(--surface-3)] transition-colors'
                >
                  + {t.name}
                </button>
              ))}
              {!availableTags.length && (
                <p className='text-xs text-[color:var(--text-muted)]'>
                  {(localTags?.length ?? 0) === 0 ? 'No tags available yet. Create one above.' : 'No matching tags found.'}
                </p>
              )}
            </div>
          </div>

          <div className='mt-6 rounded-xl border border-[color:var(--border)] bg-[color:var(--surface-1)] p-4'>
            <p className='mb-3 text-xs uppercase tracking-wider text-[color:var(--text-muted)]'>
              {canManageSeo ? 'Content validity + SEO' : 'Content validity'}
            </p>
            <div className='grid gap-3 md:grid-cols-2'>
              <label className='flex flex-col gap-1 text-xs text-[color:var(--text-muted)]'>
                Content type
                <select
                  name='content_type'
                  data-testid='content-type'
                  value={store.contentType}
                  onChange={e => store.setContentType(e.target.value as ArticleContentType)}
                  className='h-10 rounded-lg bg-[color:var(--surface-0)] border border-[color:var(--border)] px-3 text-sm text-[color:var(--text-primary)]'
                >
                  {contentTypeOptions.map((option) => (
                    <option key={option.slug} value={option.slug}>
                      {option.name}
                    </option>
                  ))}
                </select>
              </label>

              <label className='flex flex-col gap-1 text-xs text-[color:var(--text-muted)]'>
                Reading level
                <select
                  name='reading_level'
                  data-testid='reading-level'
                  value={store.readingLevel || ''}
                  onChange={e => store.setReadingLevel((e.target.value as 'Beginner' | 'Intermediate' | 'Advanced') || undefined)}
                  className='h-10 rounded-lg bg-[color:var(--surface-0)] border border-[color:var(--border)] px-3 text-sm text-[color:var(--text-primary)]'
                >
                  <option value=''>Not specified</option>
                  <option value='Beginner'>Beginner</option>
                  <option value='Intermediate'>Intermediate</option>
                  <option value='Advanced'>Advanced</option>
                </select>
              </label>
              {user?.role === 'SUPERADMIN' && (
                <div className='md:col-span-2 rounded-lg border border-[color:var(--border)] bg-[color:var(--surface-0)] p-3'>
                  <p className='mb-2 text-xs font-medium text-[color:var(--text-secondary)]'>Add content type (Superadmin)</p>
                  <div className='grid gap-2 md:grid-cols-[1fr_1fr_auto]'>
                    <input
                      value={newContentTypeName}
                      onChange={(e) => setNewContentTypeName(e.target.value)}
                      placeholder='Name (e.g. Deep Dive)'
                      className='h-10 rounded-lg border border-[color:var(--border)] bg-[color:var(--surface-1)] px-3 text-sm text-[color:var(--text-primary)]'
                    />
                    <input
                      value={newContentTypeSlug}
                      onChange={(e) => setNewContentTypeSlug(e.target.value.toLowerCase())}
                      placeholder='Slug (optional, e.g. deep-dive)'
                      className='h-10 rounded-lg border border-[color:var(--border)] bg-[color:var(--surface-1)] px-3 text-sm text-[color:var(--text-primary)]'
                    />
                    <button
                      onClick={() => void handleCreateContentType()}
                      disabled={creatingContentType || !newContentTypeName.trim()}
                      className='h-10 rounded-lg border border-[color:var(--accent)] px-3 text-xs font-semibold text-[color:var(--text-primary)] hover:bg-[color:var(--accent-dim)] disabled:cursor-not-allowed disabled:opacity-50'
                    >
                      {creatingContentType ? 'Adding...' : 'Add'}
                    </button>
                  </div>
                </div>
              )}

              <label className='flex flex-col gap-1 text-xs text-[color:var(--text-muted)]'>
                Start date
                <input
                  type='datetime-local'
                  value={store.lastVerifiedAt}
                  onChange={e => store.setLastVerifiedAt(e.target.value)}
                  className='h-10 rounded-lg bg-[color:var(--surface-0)] border border-[color:var(--border)] px-3 text-sm text-[color:var(--text-primary)]'
                />
              </label>

              <label className='flex flex-col gap-1 text-xs text-[color:var(--text-muted)]'>
                End date
                <input
                  type='datetime-local'
                  value={store.expiresAt}
                  onChange={e => store.setExpiresAt(e.target.value)}
                  className='h-10 rounded-lg bg-[color:var(--surface-0)] border border-[color:var(--border)] px-3 text-sm text-[color:var(--text-primary)]'
                />
                <span className='text-[11px] text-[color:var(--text-muted)]'>
                  {store.expiresAt ? 'Custom end date selected.' : 'Lifelong (no end date selected).'}
                </span>
              </label>

              {canManageSeo && (
                <>
                  <label className='flex flex-col gap-1 text-xs text-[color:var(--text-muted)]'>
                    SEO title
                    <input
                      value={store.seoTitle}
                      onChange={e => store.setSeoTitle(e.target.value)}
                      className='h-10 rounded-lg bg-[color:var(--surface-0)] border border-[color:var(--border)] px-3 text-sm text-[color:var(--text-primary)]'
                      placeholder='Auto: article title'
                    />
                  </label>

                  <label className='flex flex-col gap-1 text-xs text-[color:var(--text-muted)]'>
                    Schema type
                    <select
                      value={store.seoSchemaType}
                      onChange={e => store.setSeoSchemaType(e.target.value as 'Article' | 'TechArticle' | 'HowTo')}
                      className='h-10 rounded-lg bg-[color:var(--surface-0)] border border-[color:var(--border)] px-3 text-sm text-[color:var(--text-primary)]'
                    >
                      <option value='Article'>Article</option>
                      <option value='TechArticle'>TechArticle</option>
                      <option value='HowTo'>HowTo</option>
                    </select>
                  </label>

                  <label className='md:col-span-2 flex flex-col gap-1 text-xs text-[color:var(--text-muted)]'>
                    Canonical URL
                    <input
                      value={store.canonicalUrl}
                      onChange={e => store.setCanonicalUrl(e.target.value)}
                      className='h-10 rounded-lg bg-[color:var(--surface-0)] border border-[color:var(--border)] px-3 text-sm text-[color:var(--text-primary)]'
                      placeholder='Auto after save: canonical article URL'
                    />
                  </label>

                  <label className='md:col-span-2 flex flex-col gap-1 text-xs text-[color:var(--text-muted)]'>
                    Open Graph image URL
                    <input
                      value={store.ogImageUrl}
                      onChange={e => store.setOgImageUrl(e.target.value)}
                      className='h-10 rounded-lg bg-[color:var(--surface-0)] border border-[color:var(--border)] px-3 text-sm text-[color:var(--text-primary)]'
                      placeholder='Auto: cover image URL'
                    />
                  </label>

                  <label className='md:col-span-2 flex flex-col gap-1 text-xs text-[color:var(--text-muted)]'>
                    SEO description
                    <textarea
                      rows={1}
                      value={store.seoDescription}
                      onChange={e => store.setSeoDescription(e.target.value)}
                      className='h-10 rounded-lg bg-[color:var(--surface-0)] border border-[color:var(--border)] px-3 py-2 text-sm text-[color:var(--text-primary)]'
                      placeholder='Auto: subtitle/content summary'
                    />
                  </label>
                </>
              )}
            </div>
          </div>

          {showApprovalPanel && (
            <div className='mt-6 rounded-xl border border-[color:var(--border-strong)] p-4 bg-[color:var(--surface-1)]/70 space-y-4'>
              <div>
                <p className='text-xs uppercase tracking-wider text-[color:var(--text-muted)]'>Approval status</p>
                <p className='text-sm text-[color:var(--text-primary)] mt-1'>
                  {existing?.status === 'SUBMITTED'
                    ? 'Pending with Approver Group (APPROVER + SUPERADMIN)'
                    : 'Approved. Pending with Publishing Group (SUPERADMIN)'}
                </p>
              </div>

              <div>
                <p className='text-xs uppercase tracking-wider text-[color:var(--text-muted)] mb-2'>Approvers</p>
                {approversLoading && <p className='text-xs text-[color:var(--text-muted)]'>Loading approvers...</p>}
                {approversError && <p className='text-xs text-rose-700'>{approversError}</p>}
                {!approversLoading && !approversError && (
                  <div className='flex flex-wrap gap-2'>
                    {approvers.map((approver) => (
                      <label
                        key={approver.id}
                        className='inline-flex items-center gap-2 rounded-full border border-[color:var(--border)] bg-[color:var(--surface-0)] px-3 py-1 text-xs text-[color:var(--text-secondary)]'
                      >
                        <input
                          type='checkbox'
                          checked={selectedApproverIds.includes(approver.id)}
                          onChange={() => toggleApprover(approver.id)}
                          disabled={recipientMode !== 'individual'}
                        />
                        <span>{approver.name}</span>
                        <span className='text-[color:var(--text-muted)]'>({approver.role})</span>
                      </label>
                    ))}
                  </div>
                )}
              </div>

              <div className='space-y-2'>
                <p className='text-xs uppercase tracking-wider text-[color:var(--text-muted)]'>Chat with approvers</p>
                <div className='flex flex-wrap items-center gap-3 text-xs'>
                  <label className='inline-flex items-center gap-2 text-[color:var(--text-secondary)]'>
                    <input
                      type='radio'
                      name='recipientMode'
                      checked={recipientMode === 'group'}
                      onChange={() => setRecipientMode('group')}
                    />
                    Group
                  </label>
                  <label className='inline-flex items-center gap-2 text-[color:var(--text-secondary)]'>
                    <input
                      type='radio'
                      name='recipientMode'
                      checked={recipientMode === 'individual'}
                      onChange={() => setRecipientMode('individual')}
                    />
                    Individual
                  </label>
                </div>
                <textarea
                  value={approvalMessage}
                  onChange={(e) => setApprovalMessage(e.target.value)}
                  rows={3}
                  placeholder='Write a message to approvers...'
                  className='w-full rounded-lg bg-[color:var(--surface-0)] border border-[color:var(--border)] px-3 py-2 text-sm text-[color:var(--text-primary)] placeholder-[color:var(--text-muted)] outline-none focus:border-[color:var(--accent)]'
                />
                <button
                  onClick={() => void sendApprovalMessage()}
                  disabled={sendingApprovalMessage}
                  className='rounded-lg border border-[color:var(--accent)] px-3 py-2 text-xs font-semibold text-[color:var(--text-primary)] hover:bg-[color:var(--accent-dim)] disabled:cursor-not-allowed disabled:opacity-50'
                >
                  {sendingApprovalMessage ? 'Sending...' : 'Send message'}
                </button>
              </div>
            </div>
          )}

          <div className='mt-4 flex flex-wrap items-center gap-3 text-xs text-[color:var(--text-muted)]'>
            <span>{contentWordCount} words</span>
            <span>~{readTime} min read</span>
            {store.isDirty && <span className='text-amber-700'>Unsaved edits</span>}
            {!store.isDirty && <span className='text-emerald-700'>All changes saved</span>}
          </div>

        </div>

        {/* Preview side */}
        {store.previewMode && (
          <div className='w-1/2 border-l border-[color:var(--border)] pl-6 overflow-y-auto'>
            <PreviewPane title={store.title} content={store.content} />
          </div>
        )}
      </div>
    </div>
  )
}
