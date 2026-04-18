import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Eye, Heart, MessageCircle, Clock, Share2, Download, FileText, FileCode2, BookMarked } from 'lucide-react'
import { Copy, Facebook, Linkedin, Twitter } from 'lucide-react'
import type { ArticleDetail, ArticleList } from '../../types'
import { GraduationCap } from 'lucide-react'
import Avatar  from '../ui/Avatar'
import TagChip from '../ui/TagChip'
import Badge   from '../ui/Badge'
import Modal from '../ui/Modal'
import { resolveAssetUrl } from '../../lib/assets'
import { useShare } from '../../hooks/useSocial'
import { useAuth } from '../../hooks/useAuth'
import { useFeatureFlag } from '../../hooks/useFeatureFlags'
import { useAddToReadingList, useCreateReadingList, useReadingLists } from '../../hooks/useReadingLists'
import { useUiStore } from '../../stores/uiStore'
import api from '../../lib/api'
import { exportArticle, type ExportFormat } from '../../lib/articleExport'

const STATUS_VARIANT: Record<string, 'default' | 'warning' | 'info' | 'danger' | 'success'> = {
  DRAFT:     'default',
  SUBMITTED: 'warning',
  APPROVED:  'info',
  REJECTED:  'danger',
  PUBLISHED: 'success',
  ARCHIVED:  'default',
}

interface Props {
  article:    ArticleList
  showStatus?: boolean  // for library view
  featured?: boolean
  compact?: boolean
}

export default function ArticleCard({ article, showStatus, featured = false, compact = false }: Props) {
  const coverUrl = resolveAssetUrl(article.cover_image_url)
  const { user } = useAuth()
  const { enabled: readingListsEnabled } = useFeatureFlag('reading_lists', !!user)
  const navigate = useNavigate()
  const toast = useUiStore((s) => s.toast)
  const shareMutation = useShare(article.id)
  const readingListsQuery = useReadingLists(!!user && readingListsEnabled)
  const createReadingList = useCreateReadingList()
  const addToReadingList = useAddToReadingList()
  const [showShareMenu, setShowShareMenu] = useState(false)
  const [showExportMenu, setShowExportMenu] = useState(false)
  const [showReadingListModal, setShowReadingListModal] = useState(false)
  const [newReadingListName, setNewReadingListName] = useState('')
  const [selectedReadingListId, setSelectedReadingListId] = useState<string>('')
  const [exportingFormat, setExportingFormat] = useState<ExportFormat | null>(null)

  const handleLinkedInShare = async () => {
    await handleSocialShare('linkedin')
  }

  const handleSocialShare = async (provider: 'linkedin' | 'x' | 'facebook') => {
    if (!user) {
      navigate('/login')
      return
    }

    const targetUrl = article.canonical_url || `${window.location.origin}/article/${article.slug}`
    const providerLabel = provider === 'x' ? 'X' : provider === 'facebook' ? 'Facebook' : 'LinkedIn'
    const shareUrl = provider === 'x'
      ? `https://twitter.com/intent/tweet?url=${encodeURIComponent(targetUrl)}&text=${encodeURIComponent(article.title)}`
      : provider === 'facebook'
        ? `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(targetUrl)}`
        : `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(targetUrl)}`

    const shareTab = window.open(shareUrl, `${provider}-share`, 'noopener,noreferrer,width=720,height=760')
    if (!shareTab) {
      toast(`Popup blocked. Please allow popups for ${providerLabel} sharing.`, 'error')
      return
    }

    try {
      await shareMutation.mutateAsync(provider)
      toast(`Shared to ${providerLabel}`, 'success')
    } catch {
      toast('Could not record share', 'error')
    }

    setShowShareMenu(false)
  }

  const handleCopyLink = async () => {
    if (!user) return

    const targetUrl = article.canonical_url || `${window.location.origin}/article/${article.slug}`
    try {
      await navigator.clipboard.writeText(targetUrl)
      toast('Link copied', 'success')
    } catch {
      const textArea = document.createElement('textarea')
      textArea.value = targetUrl
      textArea.style.position = 'fixed'
      textArea.style.opacity = '0'
      document.body.appendChild(textArea)
      textArea.select()
      try {
        document.execCommand('copy')
        toast('Link copied', 'success')
      } catch {
        toast('Could not copy link', 'error')
      } finally {
        document.body.removeChild(textArea)
      }
    }

    setShowShareMenu(false)
  }

  const handleExport = async (format: ExportFormat) => {
    if (!user) return

    setExportingFormat(format)
    try {
      const response = await api.get<{ article: ArticleDetail }>(`/api/articles/${article.id}`)
      await exportArticle(format, response.data.article)
      toast(`Exported as ${format.toUpperCase()}`, 'success')
    } catch (err) {
      console.error('[ArticleCard] export failed:', err)
      toast('Could not export article', 'error')
    } finally {
      setExportingFormat(null)
      setShowExportMenu(false)
    }
  }

  const handleCreateReadingList = async () => {
    const name = newReadingListName.trim()
    if (!name) {
      toast('Reading list name is required', 'warning')
      return
    }
    try {
      const result = await createReadingList.mutateAsync({ name })
      setSelectedReadingListId(result.id)
      setNewReadingListName('')
      toast('Reading list created', 'success')
    } catch {
      toast('Could not create reading list', 'error')
    }
  }

  const handleSaveToReadingList = async () => {
    if (!user) {
      navigate('/login')
      return
    }
    if (!selectedReadingListId) {
      toast('Select a reading list first', 'warning')
      return
    }
    try {
      await addToReadingList.mutateAsync({ listId: selectedReadingListId, articleId: article.id })
      toast('Saved to reading list', 'success')
      setShowReadingListModal(false)
    } catch {
      toast('Could not save to reading list', 'error')
    }
  }

  if (featured && coverUrl) {
    return (
      <article className='group grid gap-6 border-b divider pb-8 md:grid-cols-5'>
        <div className='flex flex-col justify-center gap-3 md:col-span-3'>
          <div className='flex items-center gap-2'>
            <Avatar name={article.author_name ?? '?'} src={article.author_avatar} size='sm' />
            <span className='text-sm font-medium text-[color:var(--text-primary)]'>{article.author_name}</span>
            {showStatus && <Badge variant={STATUS_VARIANT[article.status] ?? 'default'}>{article.status}</Badge>}
          </div>
          <Link
            to={`/article/${article.slug}`}
            className='font-display text-3xl font-bold leading-tight text-[color:var(--text-primary)] transition-colors group-hover:text-[color:var(--accent)]'
          >
            {article.title}
          </Link>
          {article.subtitle && (
            <p className='font-body text-lg leading-relaxed text-[color:var(--text-secondary)] line-clamp-3'>
              {article.subtitle}
            </p>
          )}
          <div className='flex flex-wrap items-center gap-3 text-sm text-[color:var(--text-muted)]'>
            {article.reading_level && (
              <span className='inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium bg-[color:var(--surface-2)] text-[color:var(--text-secondary)]'>
                <GraduationCap className='h-3 w-3' />
                {article.reading_level}
              </span>
            )}
            <span>{article.published_at ? new Date(article.published_at).toLocaleDateString() : 'Draft'}</span>
            <span>·</span>
            <span>{article.read_time_minutes} min read</span>
            {article.tags?.[0] && <span className='tag-pill'>{article.tags[0].name}</span>}
            <div className='ml-auto flex items-center gap-3'>
              <span>{article.likes_count.toLocaleString()} likes</span>
              <span className='flex items-center gap-1'><MessageCircle size={13} />{article.comments_count}</span>
            </div>
          </div>
        </div>

        <Link to={`/article/${article.slug}`} className='md:col-span-2'>
          <img src={coverUrl} alt='' className='h-52 w-full rounded object-cover md:h-full' loading='lazy' />
        </Link>
      </article>
    )
  }

  return (
    <article className={[
      'group border-b divider pb-8',
      compact ? 'grid grid-cols-1 gap-4 sm:grid-cols-[minmax(0,780px)_152px] sm:justify-start' : 'flex gap-5',
    ].join(' ')}>
      <div className={compact ? 'flex min-w-0 flex-col gap-2' : 'flex min-w-0 flex-1 flex-col gap-2'}>
        <div className='flex items-center gap-2'>
          <Avatar name={article.author_name ?? '?'} src={article.author_avatar} size='sm' />
          <span className='truncate text-xs font-medium text-[color:var(--text-primary)]'>{article.author_name}</span>
          {showStatus && <Badge variant={STATUS_VARIANT[article.status] ?? 'default'}>{article.status}</Badge>}
        </div>

        <Link
          to={`/article/${article.slug}`}
          className='font-display text-xl font-bold leading-snug text-[color:var(--text-primary)] transition-colors group-hover:text-[color:var(--accent)]'
        >
          {article.title}
        </Link>

        {article.subtitle && (
          <p className='hidden font-body text-base leading-relaxed text-[color:var(--text-secondary)] line-clamp-2 sm:block'>
            {article.subtitle}
          </p>
        )}

        <div className='flex flex-wrap items-center gap-2 text-xs text-[color:var(--text-muted)]'>
          <span>{article.published_at ? new Date(article.published_at).toLocaleDateString() : 'Draft'}</span>
          <span>·</span>
          <span>{article.read_time_minutes} min read</span>
          {article.tags?.[0] && <span className='tag-pill ml-1'>{article.tags[0].name}</span>}
                  {article.reading_level && (
                    <span className='inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium bg-[color:var(--surface-2)] text-[color:var(--text-secondary)]'>
                      <GraduationCap className='h-3 w-3' />
                      {article.reading_level}
                    </span>
                  )}
        </div>

        <div className='flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-[color:var(--text-muted)]'>
          <span className='flex items-center gap-1'><Clock size={11} /> {article.read_time_minutes}m</span>
          <span className='flex items-center gap-1'><Eye size={11} /> {article.views_count.toLocaleString()}</span>
          <span className='flex items-center gap-1'><Heart size={11} /> {article.likes_count.toLocaleString()}</span>
          <span className='flex items-center gap-1'><MessageCircle size={11} /> {article.comments_count}</span>
          <div className='relative'>
            <button
              type='button'
              onClick={() => {
                setShowShareMenu((v) => !v)
                setShowExportMenu(false)
              }}
              className='inline-flex items-center gap-1 text-[color:var(--accent)] transition-colors hover:text-[color:var(--accent-strong)]'
              aria-label={`Share ${article.title}`}
              aria-haspopup='menu'
              aria-expanded={showShareMenu}
            >
              <Share2 size={11} /> {article.shares_count ?? 0}
            </button>

            {showShareMenu && (
              <>
                <button
                  type='button'
                  className='fixed inset-0 z-30 cursor-default'
                  onClick={() => setShowShareMenu(false)}
                  aria-label='Close share menu'
                />
                <div className='absolute right-0 top-[calc(100%+8px)] z-40 w-48 rounded-xl border border-[color:var(--border)] bg-[color:var(--surface-5)] p-1 shadow-[var(--shadow)]'>
                  <button
                    type='button'
                    onClick={handleCopyLink}
                    disabled={!user}
                    className='flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm text-[color:var(--text-secondary)] transition-colors hover:bg-[color:var(--surface-1)] hover:text-[color:var(--text-primary)] disabled:cursor-not-allowed disabled:opacity-50'
                    title={user ? 'Copy link' : 'Login required'}
                  >
                    <Copy size={14} />
                    Copy link
                  </button>
                  <button
                    type='button'
                    onClick={handleLinkedInShare}
                    disabled={shareMutation.isPending}
                    className='flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm text-[color:var(--text-secondary)] transition-colors hover:bg-[color:var(--surface-1)] hover:text-[#0a66c2] disabled:cursor-not-allowed disabled:opacity-60'
                  >
                    <Linkedin size={14} />
                    Share to LinkedIn
                  </button>
                  <button
                    type='button'
                    onClick={() => void handleSocialShare('x')}
                    disabled={shareMutation.isPending}
                    className='flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm text-[color:var(--text-secondary)] transition-colors hover:bg-[color:var(--surface-1)] hover:text-[color:var(--text-primary)] disabled:cursor-not-allowed disabled:opacity-60'
                  >
                    <Twitter size={14} />
                    Share to X
                  </button>
                  <button
                    type='button'
                    onClick={() => void handleSocialShare('facebook')}
                    disabled={shareMutation.isPending}
                    className='flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm text-[color:var(--text-secondary)] transition-colors hover:bg-[color:var(--surface-1)] hover:text-[#1877f2] disabled:cursor-not-allowed disabled:opacity-60'
                  >
                    <Facebook size={14} />
                    Share to Facebook
                  </button>
                </div>
              </>
            )}
          </div>
          <div className='relative'>
            <button
              type='button'
              onClick={() => {
                setShowExportMenu((v) => !v)
                setShowShareMenu(false)
              }}
              className='inline-flex items-center gap-1 text-[color:var(--accent)] transition-colors hover:text-[color:var(--accent-strong)]'
              aria-label={`Export ${article.title}`}
              aria-haspopup='menu'
              aria-expanded={showExportMenu}
            >
              <Download size={11} />
            </button>

            {showExportMenu && (
              <>
                <button
                  type='button'
                  className='fixed inset-0 z-30 cursor-default'
                  onClick={() => setShowExportMenu(false)}
                  aria-label='Close export menu'
                />
                <div className='absolute right-0 top-[calc(100%+8px)] z-40 w-52 rounded-xl border border-[color:var(--border)] bg-[color:var(--surface-5)] p-1 shadow-[var(--shadow)]'>
                  <button
                    type='button'
                    onClick={() => void handleExport('pdf')}
                    disabled={!user || exportingFormat !== null}
                    className='flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm text-[color:var(--text-secondary)] transition-colors hover:bg-[color:var(--surface-1)] hover:text-[color:var(--text-primary)] disabled:cursor-not-allowed disabled:opacity-50'
                    title={user ? 'Export PDF' : 'Login required'}
                  >
                    <FileText size={14} />
                    Export as PDF
                  </button>
                  <button
                    type='button'
                    onClick={() => void handleExport('word')}
                    disabled={!user || exportingFormat !== null}
                    className='flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm text-[color:var(--text-secondary)] transition-colors hover:bg-[color:var(--surface-1)] hover:text-[color:var(--text-primary)] disabled:cursor-not-allowed disabled:opacity-50'
                    title={user ? 'Export Word' : 'Login required'}
                  >
                    <FileText size={14} />
                    Export as Word
                  </button>
                  <button
                    type='button'
                    onClick={() => void handleExport('markdown')}
                    disabled={!user || exportingFormat !== null}
                    className='flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm text-[color:var(--text-secondary)] transition-colors hover:bg-[color:var(--surface-1)] hover:text-[color:var(--text-primary)] disabled:cursor-not-allowed disabled:opacity-50'
                    title={user ? 'Export Markdown' : 'Login required'}
                  >
                    <FileCode2 size={14} />
                    Export as Markdown
                  </button>
                </div>
              </>
            )}
          </div>
          {user && readingListsEnabled && (
            <button
              type='button'
              onClick={() => setShowReadingListModal(true)}
              className='inline-flex items-center gap-1 text-[color:var(--accent)] transition-colors hover:text-[color:var(--accent-strong)]'
              aria-label={`Save ${article.title} to reading list`}
            >
              <BookMarked size={11} /> Save to list
            </button>
          )}
        </div>

        {article.tags?.length > 1 && (
          <div className='flex flex-wrap gap-1'>
            {article.tags.slice(1, 4).map(t => <TagChip key={t.id} tag={t} />)}
          </div>
        )}
      </div>

      {coverUrl && (
        <Link to={`/article/${article.slug}`} className={compact ? 'hidden sm:block sm:self-start' : 'hidden sm:block'}>
          <img
            src={coverUrl}
            alt=''
            className={compact ? 'h-24 w-[152px] rounded object-cover' : 'h-24 w-32 flex-shrink-0 rounded object-cover'}
            loading='lazy'
          />
        </Link>
      )}

      <Modal open={showReadingListModal} onClose={() => setShowReadingListModal(false)} title='Save to reading list'>
        <div className='space-y-4'>
          <div>
            <p className='text-sm text-gray-300'>Choose a reading list for <span className='font-semibold text-white'>{article.title}</span>.</p>
          </div>
          <div className='space-y-2'>
            {(readingListsQuery.data?.reading_lists ?? []).map((list) => (
              <button
                key={list.id}
                type='button'
                onClick={() => setSelectedReadingListId(list.id)}
                className={[
                  'w-full rounded-lg border px-3 py-2 text-left text-sm transition-colors',
                  selectedReadingListId === list.id
                    ? 'border-[color:var(--accent)] bg-[color:var(--surface-1)] text-white'
                    : 'border-gray-800 bg-gray-950 text-gray-300 hover:bg-gray-900',
                ].join(' ')}
              >
                <div className='flex items-center justify-between gap-2'>
                  <span>{list.name}</span>
                  <span className='text-xs text-gray-500'>{list.article_count} saved</span>
                </div>
              </button>
            ))}
          </div>
          <div className='space-y-2'>
            <input
              value={newReadingListName}
              onChange={(event) => setNewReadingListName(event.target.value)}
              placeholder='Create a new reading list'
              className='h-10 w-full rounded-lg border border-gray-800 bg-gray-950 px-3 text-sm text-white'
            />
            <button
              type='button'
              onClick={() => void handleCreateReadingList()}
              className='rounded-lg border border-[color:var(--accent)] px-3 py-2 text-xs font-semibold text-white hover:bg-[color:var(--accent-dim)]'
            >
              Create list
            </button>
          </div>
          <div className='flex justify-end'>
            <button
              type='button'
              onClick={() => void handleSaveToReadingList()}
              className='rounded-lg bg-[color:var(--accent)] px-4 py-2 text-sm font-semibold text-black hover:opacity-90'
            >
              Save
            </button>
          </div>
        </div>
      </Modal>
    </article>
  )
}
