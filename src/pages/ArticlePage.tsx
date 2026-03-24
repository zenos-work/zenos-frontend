import { useEffect, useMemo, useRef } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useArticle } from '../hooks/useArticles'
import { useAuth } from '../hooks/useAuth'
import ArticleDetail from '../components/article/ArticleDetail'
import ArticleMeta   from '../components/article/ArticleMeta'
import CommentList   from '../components/comments/CommentList'
import LikeButton    from '../components/social/LikeButton'
import BookmarkButton from '../components/social/BookmarkButton'
import FollowButton  from '../components/social/FollowButton'
import TagChip       from '../components/ui/TagChip'
import Avatar        from '../components/ui/Avatar'
import Spinner       from '../components/ui/Spinner'
import { PenSquare } from 'lucide-react'
import { resolveAssetUrl } from '../lib/assets'

type TocHeading = {
  id: string
  text: string
  level: number
}

type SignalTone = 'success' | 'warning' | 'neutral'

function slugifyHeading(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
}

function daysSince(dateValue?: string): number | null {
  if (!dateValue) return null
  const parsed = Date.parse(dateValue)
  if (Number.isNaN(parsed)) return null
  const msPerDay = 1000 * 60 * 60 * 24
  return Math.floor((Date.now() - parsed) / msPerDay)
}

function verificationSignal(article: { last_verified_at?: string; is_expired?: boolean }): { label: string; tone: SignalTone } {
  if (article.is_expired) {
    return { label: 'Verification expired', tone: 'warning' }
  }
  const ageDays = daysSince(article.last_verified_at)
  if (ageDays === null) {
    return { label: 'Verification not set', tone: 'neutral' }
  }
  if (ageDays <= 30) {
    return { label: 'Freshly verified', tone: 'success' }
  }
  if (ageDays <= 90) {
    return { label: 'Verified recently', tone: 'success' }
  }
  return { label: 'Verification aging', tone: 'warning' }
}

function engagementSignal(article: { views_count: number; likes_count: number; comments_count: number }): { label: string; score: number } {
  const score = article.views_count + article.likes_count * 10 + article.comments_count * 15
  if (score >= 500) return { label: 'High audience traction', score }
  if (score >= 120) return { label: 'Growing audience traction', score }
  return { label: 'Early audience traction', score }
}

function signalToneClasses(tone: SignalTone): string {
  if (tone === 'success') {
    return 'border-emerald-500/40 bg-emerald-500/10 text-emerald-700'
  }
  if (tone === 'warning') {
    return 'border-amber-500/40 bg-amber-500/10 text-amber-700'
  }
  return 'border-[color:var(--border)] bg-[color:var(--surface-1)] text-[color:var(--text-secondary)]'
}

export default function ArticlePage() {
  const { slug }  = useParams()
  const { user }  = useAuth()
  const { data: article, isLoading, error } = useArticle(slug ?? '')
  const contentShellRef = useRef<HTMLDivElement | null>(null)

  const toc = useMemo<TocHeading[]>(() => {
    if (!article?.content) return []

    type JsonNode = {
      type?: string
      attrs?: { level?: number }
      content?: JsonNode[]
      text?: string
    }

    const extractText = (node?: JsonNode): string => {
      if (!node) return ''
      if (typeof node.text === 'string') return node.text
      if (!Array.isArray(node.content)) return ''
      return node.content.map(extractText).join('')
    }

    const headingNodes: Array<{ text: string; level: number }> = []

    const visit = (node?: JsonNode) => {
      if (!node) return
      if (node.type === 'heading') {
        const text = extractText(node).trim()
        const level = Number(node.attrs?.level) || 2
        if (text) headingNodes.push({ text, level })
      }
      if (Array.isArray(node.content)) {
        node.content.forEach(visit)
      }
    }

    try {
      const parsed = JSON.parse(article.content) as JsonNode
      visit(parsed)
    } catch {
      // Keep TOC empty for non-JSON article payloads.
    }

    const usedIds = new Set<string>()
    return headingNodes.map((node, index) => {
      let baseId = slugifyHeading(node.text)
      if (!baseId) baseId = `section-${index + 1}`
      let nextId = baseId
      let i = 2
      while (usedIds.has(nextId)) {
        nextId = `${baseId}-${i}`
        i += 1
      }
      usedIds.add(nextId)
      return {
        id: nextId,
        text: node.text,
        level: node.level,
      }
    })
  }, [article])

  useEffect(() => {
    if (!article) return

    const prevTitle = document.title
    const seoTitle = article.seo_title || article.title
    document.title = seoTitle

    const ensureMeta = (name: string, content: string) => {
      let tag = document.head.querySelector(`meta[name="${name}"]`) as HTMLMetaElement | null
      if (!tag) {
        tag = document.createElement('meta')
        tag.setAttribute('name', name)
        document.head.appendChild(tag)
      }
      tag.setAttribute('content', content)
    }

    ensureMeta('description', article.seo_description || article.subtitle || '')

    const schema = {
      '@context': 'https://schema.org',
      '@type': article.seo_schema_type || 'Article',
      headline: seoTitle,
      description: article.seo_description || article.subtitle || '',
      datePublished: article.published_at,
      dateModified: article.last_verified_at || article.updated_at,
      author: {
        '@type': 'Person',
        name: article.author_name || '',
      },
      image: article.og_image_url || article.cover_image_url || undefined,
      keywords: (article.tags || []).map((t) => t.name),
      mainEntityOfPage: article.canonical_url || window.location.href,
    }

    const script = document.createElement('script')
    script.type = 'application/ld+json'
    script.id = 'article-jsonld'
    script.text = JSON.stringify(schema)
    document.head.appendChild(script)

    return () => {
      document.title = prevTitle
      document.getElementById('article-jsonld')?.remove()
    }
  }, [article])

  useEffect(() => {
    if (!contentShellRef.current || !toc.length) return
    const root = contentShellRef.current
    const headingNodes = Array.from(root.querySelectorAll('h1, h2, h3')) as HTMLElement[]
    headingNodes.forEach((node, index) => {
      const entry = toc[index]
      if (!entry) return
      node.id = entry.id
    })
  }, [toc])

  const tocVisible = toc.length >= 2
  const verification = verificationSignal(article ?? {})
  const engagement = engagementSignal(article ?? { views_count: 0, likes_count: 0, comments_count: 0 })
  const outcomeCount = article?.tags?.filter((tag) => tag.tag_type === 'outcome').length ?? 0

  if (isLoading) return <div className='flex justify-center py-20'><Spinner size='lg' /></div>
  if (error || !article) return (
    <div className='text-center py-20'>
      <p className='mb-4 text-[color:var(--text-secondary)]'>Article not found</p>
      <Link to='/' className='text-[color:var(--accent)] hover:underline'>← Back to home</Link>
    </div>
  )

  const isOwner = user?.id === article.author_id
  const coverUrl = resolveAssetUrl(article.cover_image_url)

  return (
    <article className='mx-auto w-full max-w-4xl space-y-8'>

      {/* Cover image */}
      {coverUrl && (
        <img src={coverUrl} alt=''
          className='w-full h-72 object-cover rounded-2xl' />
      )}

      {/* Tags */}
      {article.tags?.length > 0 && (
        <div className='flex flex-wrap gap-2'>
          {article.tags.map(tag => <TagChip key={tag.id} tag={tag} size='md' />)}
        </div>
      )}

      {/* Title */}
      <header className='space-y-3'>
        <h1 className='text-3xl font-bold leading-tight text-[color:var(--text-primary)]'>{article.title}</h1>
        {article.subtitle && (
          <p className='text-xl leading-relaxed text-[color:var(--text-secondary)]'>{article.subtitle}</p>
        )}
      </header>

      {/* Author + actions bar */}
      <div className='flex items-center justify-between border-y border-[color:var(--border)] py-4'>
        <div className='flex items-center gap-3'>
          <Avatar name={article.author_name ?? '?'} src={article.author_avatar} size='md' />
          <div>
            <div className='flex items-center gap-2'>
              <Link to={`/profile/${article.author_id}`}
                className='text-sm font-medium text-[color:var(--text-primary)] transition-colors hover:text-[color:var(--accent)]'>
                {article.author_name}
              </Link>
              {!isOwner && <FollowButton authorId={article.author_id} />}
            </div>
            <ArticleMeta article={article} />
          </div>
        </div>
        <div className='flex items-center gap-2'>
          {isOwner && article.status !== 'PUBLISHED' && (
            <Link to={`/write/${article.id}`}
              className='flex items-center gap-1.5 rounded-full border border-[color:var(--border-strong)] px-3 py-1.5 text-sm text-[color:var(--text-secondary)] transition-colors hover:border-[color:var(--accent)] hover:text-[color:var(--text-primary)]'>
              <PenSquare size={13} /> Edit
            </Link>
          )}
          <LikeButton articleId={article.id} count={article.likes_count} />
          <BookmarkButton articleId={article.id} />
        </div>
      </div>

      {/* SR-011: success signals */}
      <section className='rounded-xl border border-[color:var(--border)] bg-[color:var(--surface-1)] p-4'>
        <p className='text-xs uppercase tracking-wider text-[color:var(--text-muted)]'>Success signals</p>
        <div className='mt-3 grid grid-cols-1 gap-3 sm:grid-cols-3'>
          <div className={`rounded-lg border px-3 py-2 text-sm ${signalToneClasses(verification.tone)}`}>
            <p className='text-xs uppercase tracking-wider opacity-80'>Verification</p>
            <p className='font-medium'>{verification.label}</p>
          </div>
          <div className='rounded-lg border border-[color:var(--border)] bg-[color:var(--surface-0)] px-3 py-2 text-sm text-[color:var(--text-secondary)]'>
            <p className='text-xs uppercase tracking-wider text-[color:var(--text-muted)]'>Engagement</p>
            <p className='font-medium text-[color:var(--text-primary)]'>{engagement.label}</p>
            <p className='text-xs'>Signal score: {engagement.score.toLocaleString()}</p>
          </div>
          <div className='rounded-lg border border-[color:var(--border)] bg-[color:var(--surface-0)] px-3 py-2 text-sm text-[color:var(--text-secondary)]'>
            <p className='text-xs uppercase tracking-wider text-[color:var(--text-muted)]'>Outcomes</p>
            <p className='font-medium text-[color:var(--text-primary)]'>
              {outcomeCount > 0 ? `${outcomeCount} outcome tag${outcomeCount > 1 ? 's' : ''}` : 'No outcome tags yet'}
            </p>
            <p className='text-xs'>Outcome tags mark measurable reader value.</p>
          </div>
        </div>
      </section>

      {/* Rejection note for author */}
      {article.rejection_note && isOwner && (
        <div className='p-4 rounded-xl border border-red-500/30 bg-red-900/10'>
          <p className='text-sm font-medium text-red-400 mb-1'>Rejection note</p>
          <p className='text-sm text-[color:var(--text-secondary)]'>{article.rejection_note}</p>
        </div>
      )}

      {article.is_expired && (
        <div className='rounded-xl border border-amber-500/40 bg-amber-500/10 p-4'>
          <p className='text-sm font-semibold text-amber-700'>This article may be outdated.</p>
          <p className='text-xs text-[color:var(--text-secondary)] mt-1'>
            Last verified: {article.last_verified_at ? new Date(article.last_verified_at).toLocaleDateString('en-US') : 'not set'}
          </p>
        </div>
      )}

      {/* Content + TOC */}
      <div className='grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_260px]'>
        <div ref={contentShellRef}>
          <ArticleDetail content={article.content} />
        </div>
        {tocVisible && (
          <aside className='rounded-xl border border-[color:var(--border)] bg-[color:var(--surface-1)] p-4 lg:sticky lg:top-24 lg:self-start'>
            <p className='mb-3 text-xs uppercase tracking-wider text-[color:var(--text-muted)]'>Table of contents</p>
            <nav className='space-y-2'>
              {toc.map((item) => (
                <a
                  key={item.id}
                  href={`#${item.id}`}
                  className='block text-sm text-[color:var(--text-secondary)] hover:text-[color:var(--accent)]'
                  style={{ paddingLeft: `${Math.max(0, item.level - 1) * 10}px` }}
                >
                  {item.text}
                </a>
              ))}
            </nav>
          </aside>
        )}
      </div>

      {/* Comments */}
      <section className='border-t border-[color:var(--border)] pt-8'>
        <h2 className='mb-6 text-lg font-semibold text-[color:var(--text-primary)]'>
          {article.comments_count} {article.comments_count === 1 ? 'Comment' : 'Comments'}
        </h2>
        <CommentList articleId={article.id} />
      </section>
    </article>
  )
}
