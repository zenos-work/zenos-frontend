import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Eye, Heart, MessageCircle, Clock, Share2 } from 'lucide-react'
import { Copy, Linkedin } from 'lucide-react'
import type { ArticleList } from '../../types'
import Avatar  from '../ui/Avatar'
import TagChip from '../ui/TagChip'
import Badge   from '../ui/Badge'
import { resolveAssetUrl } from '../../lib/assets'
import { useShare } from '../../hooks/useSocial'
import { useAuth } from '../../hooks/useAuth'
import { useUiStore } from '../../stores/uiStore'

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
}

export default function ArticleCard({ article, showStatus, featured = false }: Props) {
  const coverUrl = resolveAssetUrl(article.cover_image_url)
  const { user } = useAuth()
  const navigate = useNavigate()
  const toast = useUiStore((s) => s.toast)
  const shareMutation = useShare(article.id)
  const [showShareMenu, setShowShareMenu] = useState(false)

  const handleLinkedInShare = async () => {
    if (!user) {
      navigate('/login')
      return
    }

    const targetUrl = article.canonical_url || `${window.location.origin}/article/${article.slug}`
    const linkedinUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(targetUrl)}`
    const shareTab = window.open(linkedinUrl, 'linkedin-share', 'noopener,noreferrer,width=720,height=760')
    if (!shareTab) {
      toast('Popup blocked. Please allow popups for LinkedIn sharing.', 'error')
      return
    }

    try {
      await shareMutation.mutateAsync('linkedin')
      toast('Shared to LinkedIn', 'success')
    } catch {
      toast('Could not record share', 'error')
    }

    setShowShareMenu(false)
  }

  const handleCopyLink = async () => {
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
    <article className='group flex gap-5 border-b divider pb-8'>
      <div className='flex min-w-0 flex-1 flex-col gap-2'>
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
        </div>

        <div className='flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-[color:var(--text-muted)]'>
          <span className='flex items-center gap-1'><Clock size={11} /> {article.read_time_minutes}m</span>
          <span className='flex items-center gap-1'><Eye size={11} /> {article.views_count.toLocaleString()}</span>
          <span className='flex items-center gap-1'><Heart size={11} /> {article.likes_count.toLocaleString()}</span>
          <span className='flex items-center gap-1'><MessageCircle size={11} /> {article.comments_count}</span>
          <div className='relative'>
            <button
              type='button'
              onClick={() => setShowShareMenu((v) => !v)}
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
                    className='flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm text-[color:var(--text-secondary)] transition-colors hover:bg-[color:var(--surface-1)] hover:text-[color:var(--text-primary)]'
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
                </div>
              </>
            )}
          </div>
        </div>

        {article.tags?.length > 1 && (
          <div className='flex flex-wrap gap-1'>
            {article.tags.slice(1, 4).map(t => <TagChip key={t.id} tag={t} />)}
          </div>
        )}
      </div>

      {coverUrl && (
        <Link to={`/article/${article.slug}`} className='hidden sm:block'>
          <img src={coverUrl} alt='' className='h-24 w-32 flex-shrink-0 rounded object-cover' loading='lazy' />
        </Link>
      )}
    </article>
  )
}
