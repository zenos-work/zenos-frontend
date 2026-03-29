import { useEffect, useMemo, useRef, useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { useArticle, useAuthorArticles } from '../hooks/useArticles'
import { useAuth } from '../hooks/useAuth'
import ArticleDetail from '../components/article/ArticleDetail'
import ArticleMeta   from '../components/article/ArticleMeta'
import CommentList   from '../components/comments/CommentList'
import BookmarkButton from '../components/social/BookmarkButton'
import FollowButton  from '../components/social/FollowButton'
import { useShare } from '../hooks/useSocial'
import { useUiStore } from '../stores/uiStore'
import TagChip       from '../components/ui/TagChip'
import Avatar        from '../components/ui/Avatar'
import Spinner       from '../components/ui/Spinner'
import { Copy, Linkedin, MessageCircle, PenSquare, Share2, Settings } from 'lucide-react'
import { resolveAssetUrl } from '../lib/assets'
import { ReadingPreferencesPanel } from '../components/reading/ReadingPreferencesPanel'
import { EnhancedTableOfContents } from '../components/reading/EnhancedTableOfContents'
import { ConsolidatedReactions } from '../components/reading/ConsolidatedReactions'
import { ReadingProgressBar } from '../components/reading/ReadingProgressBar'
import { useReadingPreferences } from '../hooks/useReadingPreferences'
import { useArticleReactions } from '../hooks/useReactions'

type TocHeading = {
  id: string
  text: string
  level: number
}

function slugifyHeading(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
}

function formatElapsed(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${m}:${s.toString().padStart(2, '0')}`
}

export default function ArticlePage() {
  const { slug }  = useParams()
  const { user }  = useAuth()
  const navigate = useNavigate()
  const toast = useUiStore((s) => s.toast)
  const { data: article, isLoading, error } = useArticle(slug ?? '')
  const { data: authorArticles } = useAuthorArticles(article?.author_id ?? '', {
    status: 'PUBLISHED',
    limit: 8,
    page: 1,
  })
  const { preferences } = useReadingPreferences()
  const { data: reactions, isLoading: reactionsLoading } = useArticleReactions(article?.id ?? '')
  const contentShellRef = useRef<HTMLDivElement | null>(null)
  const shareMutation = useShare(article?.id ?? '')
  const [showReadingPrefs, setShowReadingPrefs] = useState(false)
  const [showShareMenu, setShowShareMenu] = useState(false)
  const [readingProgress, setReadingProgress] = useState(0)
  const [readingSeconds, setReadingSeconds] = useState(0)

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

  useEffect(() => {
    const handleScroll = () => {
      const documentHeight = document.documentElement.scrollHeight - window.innerHeight
      if (documentHeight <= 0) {
        setReadingProgress(0)
        return
      }
      const value = (window.scrollY / documentHeight) * 100
      setReadingProgress(Math.min(100, Math.max(0, value)))
    }

    handleScroll()
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  useEffect(() => {
    const timer = window.setInterval(() => setReadingSeconds((value) => value + 1), 1000)
    return () => window.clearInterval(timer)
  }, [])

  const tocVisible = toc.length >= 2
  const articleWidth = {
    narrow: '580px',
    medium: '720px',
    wide: '860px',
  }[preferences.contentWidth]
  const articleFontFamily = preferences.fontFamily === 'serif' ? 'var(--font-body)' : 'var(--font-ui)'
  const articleFontSize = preferences.fontSize === 'sm' ? '18px' : preferences.fontSize === 'lg' ? '22px' : preferences.fontSize === 'xl' ? '24px' : '20px'
  const articleLineHeight = preferences.lineHeight === 'loose' ? '1.92' : preferences.lineHeight === 'extra-loose' ? '2.06' : '1.82'
  const readingBackground = {
    white: 'var(--surface-5)',
    cream: 'var(--surface-warm)',
    dark: 'var(--surface-1)',
  }[preferences.backgroundColor]
  const readingTextColor = preferences.backgroundColor === 'dark' ? 'var(--text-primary)' : 'var(--text-secondary)'

  if (isLoading) return <div className='flex justify-center py-20'><Spinner size='lg' /></div>
  if (error || !article) return (
    <div className='text-center py-20'>
      <p className='mb-4 text-[color:var(--text-secondary)]'>Article not found</p>
      <Link to='/' className='text-[color:var(--accent)] hover:underline'>← Back to home</Link>
    </div>
  )

  const isOwner = user?.id === article.author_id
  const coverUrl = resolveAssetUrl(article.cover_image_url)
  const nextFromAuthor = [...(authorArticles?.items ?? [])]
    .filter((item) => item.id !== article.id)
    .sort((a, b) => {
      const aTime = new Date(a.published_at ?? a.created_at).getTime()
      const bTime = new Date(b.published_at ?? b.created_at).getTime()
      return bTime - aTime
    })[0]
  const nextFromAuthorImage = resolveAssetUrl(nextFromAuthor?.cover_image_url)

  const handleLinkedInShare = async () => {
    if (!user) {
      navigate('/login')
      return
    }

    const targetUrl = article.canonical_url || window.location.href
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
    const targetUrl = article.canonical_url || window.location.href
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

  return (
    <>
      <ReadingProgressBar />
      <ReadingPreferencesPanel isOpen={showReadingPrefs} onClose={() => setShowReadingPrefs(false)} />

      <div className='min-h-screen'>
        <div className='fixed left-8 top-1/3 z-30 hidden w-52 xl:block'>
          <EnhancedTableOfContents
            toc={toc}
            content={article.content}
            isVisible={tocVisible}
          />
        </div>

        <article className='mx-auto px-6 py-10' style={{ maxWidth: articleWidth }}>
          <div className='space-y-8'>
            {article.tags?.length > 0 && (
              <div className='mt-2 flex flex-wrap items-center gap-2'>
                {article.tags.slice(0, 1).map((tag) => <TagChip key={tag.id} tag={tag} size='md' />)}
              </div>
            )}

            <header className='space-y-4'>
              <h1 className='font-display text-3xl font-bold leading-tight tracking-tight text-[color:var(--text-primary)] md:text-[42px] md:leading-[1.15]'>
                {article.title}
              </h1>
              {article.subtitle && (
                <p className='font-body text-xl leading-relaxed text-[color:var(--text-secondary)]'>
                  {article.subtitle}
                </p>
              )}
            </header>

            <div className='flex items-center gap-3'>
              <Avatar name={article.author_name ?? '?'} src={article.author_avatar} size='md' />
              <div className='flex-1'>
                <div className='flex items-center gap-2'>
                  <Link to={`/profile/${article.author_id}`} className='text-sm font-medium text-[color:var(--text-primary)] hover:text-[color:var(--accent)]'>
                    {article.author_name}
                  </Link>
                  {!isOwner && <FollowButton authorId={article.author_id} />}
                </div>
                <ArticleMeta article={article} />
              </div>
            </div>

            <div className='flex items-center justify-between border-y divider py-3'>
              <ConsolidatedReactions articleId={article.id} reactions={reactions?.reactions} isLoading={reactionsLoading} />
              <div className='flex items-center gap-2'>
                {isOwner && article.status !== 'PUBLISHED' && (
                  <Link to={`/write/${article.id}`} className='flex items-center gap-1.5 rounded-full border border-[color:var(--border)] px-3 py-1.5 text-sm text-[color:var(--text-secondary)] transition-colors hover:border-[color:var(--text-primary)] hover:text-[color:var(--text-primary)]'>
                    <PenSquare size={13} /> Edit
                  </Link>
                )}
                <button
                  onClick={() => setShowReadingPrefs(true)}
                  className='flex items-center gap-1.5 rounded-full border border-[color:var(--border)] px-3 py-1.5 text-sm text-[color:var(--text-secondary)] transition-colors hover:border-[color:var(--text-primary)] hover:text-[color:var(--text-primary)]'
                  title='Reading preferences'
                >
                  <Settings size={14} />
                  <span className='hidden sm:inline'>Customize</span>
                </button>
                <div className='relative'>
                  <button
                    onClick={() => setShowShareMenu((v) => !v)}
                    className='flex items-center gap-1.5 rounded-full border border-[color:var(--border)] px-3 py-1.5 text-sm text-[color:var(--text-secondary)] transition-colors hover:border-[#0a66c2] hover:text-[#0a66c2]'
                    aria-haspopup='menu'
                    aria-expanded={showShareMenu}
                  >
                    <Share2 size={14} />
                    <span className='hidden sm:inline'>Share</span>
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
                          className='flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm text-[color:var(--text-secondary)] transition-colors hover:bg-[color:var(--surface-1)] hover:text-[#0a66c2]'
                        >
                          <Linkedin size={14} />
                          Share to LinkedIn
                        </button>
                      </div>
                    </>
                  )}
                </div>
                <BookmarkButton articleId={article.id} />
              </div>
            </div>

            {coverUrl && (
              <img src={coverUrl} alt='' className='w-full rounded object-cover' style={{ maxHeight: 460 }} />
            )}

            <div className='article-body mt-10' style={{ background: readingBackground, color: readingTextColor, padding: '2rem', borderRadius: '0.75rem', border: '1px solid var(--border)' }}>
              <div
                ref={contentShellRef}
                style={{
                  fontFamily: articleFontFamily,
                  fontSize: articleFontSize,
                  lineHeight: articleLineHeight,
                }}
              >
                <ArticleDetail content={article.content} />
              </div>
            </div>

            <div className='flex items-center justify-between text-xs text-[color:var(--text-muted)]'>
              <span>Time spent reading: {formatElapsed(readingSeconds)}</span>
              <span>{Math.round(readingProgress)}% complete</span>
            </div>

            {article.tags?.length > 0 && (
              <div className='flex flex-wrap gap-2'>
                {article.tags.map((tag) => (
                  <TagChip key={tag.id} tag={tag} size='md' />
                ))}
              </div>
            )}

            <div className='flex items-center justify-between border-y divider py-4'>
              <ConsolidatedReactions articleId={article.id} reactions={reactions?.reactions} isLoading={reactionsLoading} />
              <div className='flex items-center gap-2'>
                <button className='inline-flex items-center gap-1.5 text-[color:var(--text-muted)] transition-colors hover:text-[color:var(--text-primary)]'>
                  <MessageCircle size={18} />
                  <span className='text-sm'>{article.comments_count}</span>
                </button>
                <BookmarkButton articleId={article.id} />
              </div>
            </div>

            {article.rejection_note && isOwner && (
              <div className='rounded-[1.25rem] border border-red-500/30 bg-red-500/5 p-4'>
                <p className='mb-1 text-sm font-medium text-red-500'>Rejection note</p>
                <p className='text-sm text-[color:var(--text-secondary)]'>{article.rejection_note}</p>
              </div>
            )}

            {article.is_expired && (
              <div className='rounded-[1.25rem] border border-amber-500/40 bg-amber-500/10 p-4'>
                <p className='text-sm font-semibold text-amber-700'>This article may be outdated.</p>
                <p className='mt-1 text-xs text-[color:var(--text-secondary)]'>
                  Last verified: {article.last_verified_at ? new Date(article.last_verified_at).toLocaleDateString('en-US') : 'not set'}
                </p>
              </div>
            )}

            <section className='border-t divider pt-8'>
              <h2 className='mb-6 text-2xl font-bold text-[color:var(--text-primary)]'>
                {article.comments_count} {article.comments_count === 1 ? 'Comment' : 'Comments'}
              </h2>
              <CommentList articleId={article.id} />
            </section>

            {nextFromAuthor && (
              <section className='border-t divider pt-8'>
                <h2 className='mb-5 text-xl font-bold text-[color:var(--text-primary)]'>
                  Next from {article.author_name}
                </h2>
                <Link to={`/article/${nextFromAuthor.slug}`} className='group block rounded-xl border border-[color:var(--border)] p-4 transition-colors hover:border-[color:var(--accent)]/50'>
                  {nextFromAuthorImage && (
                    <img
                      src={nextFromAuthorImage}
                      alt=''
                      className='h-44 w-full rounded object-cover'
                    />
                  )}
                  <h3 className='mt-3 font-display text-xl font-semibold leading-snug text-[color:var(--text-primary)] transition-colors group-hover:text-[color:var(--accent)]'>
                    {nextFromAuthor.title}
                  </h3>
                  {nextFromAuthor.subtitle && (
                    <p className='mt-1 text-sm leading-relaxed text-[color:var(--text-secondary)]'>
                      {nextFromAuthor.subtitle}
                    </p>
                  )}
                  <p className='mt-2 text-xs text-[color:var(--text-muted)]'>
                    {nextFromAuthor.published_at ? new Date(nextFromAuthor.published_at).toLocaleDateString() : 'Draft'} · {nextFromAuthor.read_time_minutes} min read
                  </p>
                </Link>
              </section>
            )}
          </div>
        </article>
      </div>
    </>
  )
}
