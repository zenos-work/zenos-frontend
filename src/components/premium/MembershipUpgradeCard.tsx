/**
 * MembershipUpgradeCard Component
 * Phase 3 (GAP-016): Membership conversion modules in article context
 * Displays upgrade card within article to convert readers to members
 */
import { Link } from 'react-router-dom'
import { Sparkles, ArrowRight } from 'lucide-react'

interface MembershipUpgradeCardProps {
  currentPlan?: 'free' | 'creator_pro' | 'team_suite'
  articleTitle?: string
}

export function MembershipUpgradeCard({
  currentPlan = 'free',
  articleTitle = 'this article',
}: MembershipUpgradeCardProps) {
  if (currentPlan !== 'free') {
    return null // Don't show upgrade card to already-premium members
  }

  return (
    <div className='rounded-2xl border border-[color:var(--accent)]/30 bg-gradient-to-r from-[color:var(--accent)]/10 via-transparent to-[color:var(--accent)]/5 p-6'>
      <div className='flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between'>
        <div className='space-y-2'>
          <div className='flex items-center gap-2'>
            <Sparkles className='h-5 w-5 text-[color:var(--accent)]' />
            <h3 className='font-semibold text-[color:var(--text-primary)]'>
              Want to read more like {articleTitle}?
            </h3>
          </div>
          <p className='text-sm text-[color:var(--text-secondary)]'>
            Join thousands of readers in our community. Unlock exclusive articles, support independent creators, and enjoy an ad-free experience.
          </p>
        </div>
        <Link
          to='/membership'
          className='flex items-center gap-2 flex-shrink-0 whitespace-nowrap rounded-full border border-[color:var(--accent)] bg-[color:var(--accent)] px-6 py-2 text-sm font-semibold text-white transition-all hover:opacity-95 active:scale-95'
        >
          Upgrade <ArrowRight className='h-4 w-4' />
        </Link>
      </div>
    </div>
  )
}
