/**
 * PremiumPaywall Component
 * Phase 3 (GAP-015): Enforce premium gating on article reads
 * Shows paywall UI when user lacks membership for premium-only content
 */
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Lock, Zap } from 'lucide-react'

interface PremiumPaywallProps {
  articleTitle?: string
  articleSlug: string
  teaserWords: number
  contentPreview: string
  onUpgradeClick?: () => void
}

export function PremiumPaywall({
  articleTitle,
  articleSlug,
  teaserWords,
  contentPreview,
  onUpgradeClick,
}: PremiumPaywallProps) {
  const [showFullTeaser, setShowFullTeaser] = useState(false)

  const truncatedContent =
    contentPreview.length > teaserWords
      ? contentPreview.substring(0, teaserWords) + '...'
      : contentPreview

  return (
    <div className='relative rounded-2xl border-2 border-[color:var(--accent)] bg-gradient-to-b from-[color:var(--surface-2)] to-[color:var(--surface-1)] p-8'>
      {/* Background accent */}
      <div className='absolute inset-0 overflow-hidden rounded-2xl opacity-10'>
        <div className='absolute -right-40 -top-40 h-80 w-80 rounded-full bg-[color:var(--accent)] blur-3xl' />
      </div>

      <div className='relative z-10 space-y-6'>
        {/* Lock icon */}
        <div className='flex items-center justify-center'>
          <div className='rounded-full bg-[color:var(--accent)]/20 p-4'>
            <Lock className='h-8 w-8 text-[color:var(--accent)]' />
          </div>
        </div>

        {/* Heading */}
        <h2 className='text-center text-2xl font-bold text-[color:var(--text-primary)]'>
          Premium Article
          {articleTitle && <span className='text-sm font-normal text-[color:var(--text-secondary)]'> — "{articleTitle}"</span>}
        </h2>

        {/* Description */}
        <p className='text-center text-sm leading-relaxed text-[color:var(--text-secondary)]'>
          This exclusive article is available to Zenos members. Upgrade your membership to unlock full
          access and discover more premium content.
        </p>

        {/* Teaser content */}
        <div className='rounded-lg border border-[color:var(--border)] bg-[color:var(--surface-0)] p-4'>
          <p className='text-xs font-semibold uppercase tracking-wide text-[color:var(--text-muted)]'>
            Article Preview
          </p>
          <p className='mt-3 text-sm leading-6 text-[color:var(--text-primary)]'>
            {showFullTeaser ? contentPreview : truncatedContent}
          </p>
          {contentPreview.length > teaserWords && (
            <button
              onClick={() => setShowFullTeaser(!showFullTeaser)}
              className='mt-2 text-xs font-semibold text-[color:var(--accent)] hover:underline'
            >
              {showFullTeaser ? 'Show less' : 'Show more'}
            </button>
          )}
        </div>

        {/* Benefits */}
        <div className='space-y-2'>
          <p className='text-xs font-semibold uppercase tracking-wide text-[color:var(--text-muted)]'>
            With Creator Pro, you get:
          </p>
          <ul className='space-y-2 text-sm text-[color:var(--text-secondary)]'>
            <li className='flex items-start gap-2'>
              <Zap className='mt-1 h-4 w-4 flex-shrink-0 text-[color:var(--accent)]' />
              <span>Access to all premium articles and exclusive content</span>
            </li>
            <li className='flex items-start gap-2'>
              <Zap className='mt-1 h-4 w-4 flex-shrink-0 text-[color:var(--accent)]' />
              <span>Support creators and independent journalism</span>
            </li>
            <li className='flex items-start gap-2'>
              <Zap className='mt-1 h-4 w-4 flex-shrink-0 text-[color:var(--accent)]' />
              <span>Ad-free reading experience</span>
            </li>
          </ul>
        </div>

        {/* CTA Buttons */}
        <div className='flex flex-wrap gap-3 border-t border-[color:var(--border)] pt-6'>
          <Link
            to='/membership'
            onClick={onUpgradeClick}
            className='flex-1 rounded-full border border-[color:var(--accent)] bg-[color:var(--accent)] px-6 py-3 text-center text-sm font-semibold text-white shadow-lg shadow-[color:var(--accent)]/30 transition-all hover:shadow-[color:var(--accent)]/50 hover:opacity-95'
          >
            Upgrade Now
          </Link>
          <Link
            to={`/articles/${articleSlug}`}
            className='flex-1 rounded-full border border-[color:var(--border)] bg-[color:var(--surface-0)] px-6 py-3 text-center text-sm font-semibold text-[color:var(--text-primary)] transition-all hover:bg-[color:var(--surface-2)]'
          >
            See Plans
          </Link>
        </div>

        {/* Footer text */}
        <p className='text-center text-xs text-[color:var(--text-muted)]'>
          Start your free trial or explore our membership plans
        </p>
      </div>
    </div>
  )
}
