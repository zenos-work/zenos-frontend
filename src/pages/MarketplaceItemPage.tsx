import { useState } from 'react'
import { useParams } from 'react-router-dom'
import FeatureComingSoon from '../components/ui/FeatureComingSoon'
import Spinner from '../components/ui/Spinner'
import { useFeatureFlag } from '../hooks/useFeatureFlags'
import { useItemReviews, useMarketplaceItem, usePurchaseItem, useWriteReview } from '../hooks/useMarketplace'
import { useUiStore } from '../stores/uiStore'

function formatPrice(priceCents?: number, currency = 'USD'): string {
  if (priceCents == null || priceCents === 0) return 'Free'
  return new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(priceCents / 100)
}

function StarDisplay({ rating, max = 5 }: { rating: number; max?: number }) {
  return (
    <span className='text-amber-400' aria-label={`${rating} out of ${max} stars`}>
      {'★'.repeat(Math.round(rating))}{'☆'.repeat(max - Math.round(rating))}
    </span>
  )
}

export default function MarketplaceItemPage() {
  const { id = '' } = useParams()
  const toast = useUiStore((s) => s.toast)
  const { enabled, isLoading: flagLoading } = useFeatureFlag('marketplace')
  const item = useMarketplaceItem(id, enabled)
  const reviews = useItemReviews(id, enabled)
  const purchase = usePurchaseItem(id)
  const writeReview = useWriteReview(id)

  const [reviewBody, setReviewBody] = useState('')

  if (flagLoading) return <div className='flex justify-center py-12'><Spinner /></div>
  if (!enabled) {
    return <FeatureComingSoon name='Marketplace item' description='Marketplace item details and purchase flows are gated by the marketplace flag.' />
  }

  if (item.isLoading) return <div className='flex justify-center py-12'><Spinner /></div>
  if (!item.data) return <FeatureComingSoon name='Item unavailable' description='The selected marketplace listing could not be loaded.' />

  return (
    <div className='space-y-6'>
      <header className='rounded-xl border border-[color:var(--border)] bg-[color:var(--surface-1)] p-5'>
        <h1 className='text-2xl font-bold text-[color:var(--text-primary)]'>{item.data.name}</h1>
        <p className='mt-2 text-sm text-[color:var(--text-secondary)]'>{item.data.short_desc ?? 'No description yet.'}</p>
        <div className='mt-3 flex items-center gap-4'>
          <span className='text-xl font-bold text-[color:var(--accent)]'>{formatPrice(item.data.price_cents, item.data.currency)}</span>
          {reviews.data?.reviews?.length ? (
            <span className='flex items-center gap-1 text-sm text-[color:var(--text-muted)]'>
              <StarDisplay rating={reviews.data.reviews.reduce((s, r) => s + r.rating, 0) / reviews.data.reviews.length} />
              <span>({reviews.data.reviews.length} review{reviews.data.reviews.length !== 1 ? 's' : ''})</span>
            </span>
          ) : null}
        </div>
        <button
          type='button'
          className='mt-4 rounded-full bg-[color:var(--accent)] px-4 py-2 text-sm font-semibold text-white disabled:opacity-60'
          disabled={purchase.isPending}
          onClick={() => {
            void purchase
              .mutateAsync({ price_paid_cents: item.data.price_cents ?? 0, currency: item.data.currency ?? 'USD' })
              .then(() => toast('Purchase successful', 'success'))
              .catch(() => toast('Could not complete purchase', 'error'))
          }}
        >
          {purchase.isPending ? 'Processing…' : item.data.price_cents ? 'Buy now' : 'Get for free'}
        </button>
      </header>

      <section className='rounded-xl border border-[color:var(--border)] bg-[color:var(--surface-1)] p-5'>
        <h2 className='text-base font-semibold text-[color:var(--text-primary)]'>Reviews</h2>
        <textarea
          value={reviewBody}
          onChange={(event) => setReviewBody(event.target.value)}
          placeholder='Share your feedback'
          className='mt-3 min-h-24 w-full rounded-lg border border-[color:var(--border-strong)] bg-[color:var(--surface-0)] p-3 text-sm'
        />
        <button
          type='button'
          className='mt-3 rounded-full border border-[color:var(--border-strong)] px-4 py-2 text-sm font-semibold'
          onClick={() => {
            if (!reviewBody.trim()) return
            void writeReview
              .mutateAsync({ rating: 5, body: reviewBody.trim() })
              .then(() => {
                setReviewBody('')
                toast('Review submitted', 'success')
              })
              .catch(() => toast('Could not submit review', 'error'))
          }}
        >
          Submit review
        </button>

        <div className='mt-4 space-y-2'>
          {(reviews.data?.reviews ?? []).map((review) => (
            <article key={review.id} className='rounded-lg border border-[color:var(--border)] bg-[color:var(--surface-0)] px-3 py-2'>
              <p className='text-xs text-[color:var(--text-secondary)]'>
              <StarDisplay rating={review.rating} /> {review.rating}/5
            </p>
              <p className='mt-1 text-sm text-[color:var(--text-primary)]'>{review.body ?? 'No comment provided.'}</p>
            </article>
          ))}
        </div>
      </section>
    </div>
  )
}
