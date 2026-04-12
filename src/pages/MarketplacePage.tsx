import { useState } from 'react'
import { Link } from 'react-router-dom'
import FeatureComingSoon from '../components/ui/FeatureComingSoon'
import Spinner from '../components/ui/Spinner'
import { useFeatureFlag } from '../hooks/useFeatureFlags'
import { useMarketplaceItems, useCreateMarketplaceItem, usePublishItem, type MarketplaceItem } from '../hooks/useMarketplace'
import { useAuth } from '../hooks/useAuth'
import { useUiStore } from '../stores/uiStore'

function formatPrice(priceCents?: number, currency = 'USD'): string {
  if (priceCents == null || priceCents === 0) return 'Free'
  return new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(priceCents / 100)
}

export default function MarketplacePage() {
  const { enabled, isLoading: flagLoading } = useFeatureFlag('marketplace')
  const items = useMarketplaceItems(enabled)
  const { user } = useAuth()
  const toast = useUiStore((s) => s.toast)
  const createItem = useCreateMarketplaceItem()
  const publishItem = usePublishItem()

  const [tab, setTab] = useState<'browse' | 'seller'>('browse')
  const [form, setForm] = useState({ name: '', slug: '', short_desc: '', category: 'general', item_type: 'template', price_cents: '0' })

  if (flagLoading) return <div className='flex justify-center py-12'><Spinner /></div>
  if (!enabled) {
    return <FeatureComingSoon name='Marketplace' description='Marketplace templates and purchases are gated by the marketplace feature flag.' />
  }

  const myItems: MarketplaceItem[] = (items.data?.items ?? []).filter((i) => i.seller_id === user?.id)

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await createItem.mutateAsync({
        name: form.name.trim(),
        slug: form.slug.trim() || form.name.trim().toLowerCase().replace(/\s+/g, '-'),
        short_desc: form.short_desc.trim() || undefined,
        category: form.category || undefined,
        item_type: form.item_type || undefined,
        price_cents: Number(form.price_cents) || 0,
      })
      toast('Listing created', 'success')
      setForm({ name: '', slug: '', short_desc: '', category: 'general', item_type: 'template', price_cents: '0' })
    } catch {
      toast('Could not create listing', 'error')
    }
  }

  return (
    <div className='space-y-6'>
      <header className='flex items-center justify-between gap-4'>
        <div>
          <h1 className='text-2xl font-bold text-[color:var(--text-primary)]'>Marketplace</h1>
          <p className='mt-1 text-sm text-[color:var(--text-secondary)]'>Discover templates, automations, and creator tools.</p>
        </div>
        {user && (
          <div className='flex gap-2'>
            <button
              type='button'
              onClick={() => setTab('browse')}
              className={`rounded-full px-4 py-1.5 text-sm font-semibold transition-colors ${
                tab === 'browse'
                  ? 'bg-[color:var(--accent)] text-white'
                  : 'border border-[color:var(--border)] text-[color:var(--text-secondary)] hover:bg-[color:var(--surface-2)]'
              }`}
            >Browse</button>
            <button
              type='button'
              onClick={() => setTab('seller')}
              className={`rounded-full px-4 py-1.5 text-sm font-semibold transition-colors ${
                tab === 'seller'
                  ? 'bg-[color:var(--accent)] text-white'
                  : 'border border-[color:var(--border)] text-[color:var(--text-secondary)] hover:bg-[color:var(--surface-2)]'
              }`}
            >My Listings</button>
          </div>
        )}
      </header>

      {tab === 'browse' && (
        items.isLoading ? (
          <div className='flex justify-center py-12'><Spinner /></div>
        ) : (
          <div className='grid gap-4 md:grid-cols-2 xl:grid-cols-3'>
            {(items.data?.items ?? []).map((item) => (
              <article key={item.id} className='flex flex-col rounded-xl border border-[color:var(--border)] bg-[color:var(--surface-1)] p-4'>
                <h2 className='text-base font-semibold text-[color:var(--text-primary)]'>{item.name}</h2>
                <p className='mt-2 flex-1 text-sm text-[color:var(--text-secondary)] line-clamp-3'>{item.short_desc ?? 'No description yet.'}</p>
                <div className='mt-3 flex items-center justify-between'>
                  <div className='flex flex-col gap-0.5'>
                    <span className='text-xs uppercase tracking-wide text-[color:var(--text-muted)]'>{item.category ?? 'general'}</span>
                    <span className='text-sm font-semibold text-[color:var(--accent)]'>{formatPrice(item.price_cents, item.currency)}</span>
                  </div>
                  <Link to={`/marketplace/${item.id}`} className='rounded-full border border-[color:var(--accent)] px-3 py-1 text-xs font-semibold text-[color:var(--accent)] hover:bg-[color:var(--accent)] hover:text-white transition-colors'>
                    View
                  </Link>
                </div>
              </article>
            ))}
          </div>
        )
      )}

      {tab === 'seller' && (
        <div className='space-y-6'>
          {/* My listings table */}
          <section className='rounded-xl border border-[color:var(--border)] bg-[color:var(--surface-1)] p-5'>
            <h2 className='mb-4 text-base font-semibold text-[color:var(--text-primary)]'>My Listings</h2>
            {items.isLoading ? <Spinner /> : myItems.length === 0 ? (
              <p className='text-sm text-[color:var(--text-muted)]'>You have no listings yet. Create one below.</p>
            ) : (
              <div className='space-y-2'>
                {myItems.map((item) => (
                  <div key={item.id} className='flex items-center justify-between gap-3 rounded-lg border border-[color:var(--border)] bg-[color:var(--surface-0)] px-4 py-2'>
                    <div>
                      <p className='text-sm font-medium text-[color:var(--text-primary)]'>{item.name}</p>
                      <p className='text-xs text-[color:var(--text-muted)]'>{formatPrice(item.price_cents, item.currency)} · {item.status ?? 'draft'}</p>
                    </div>
                    <div className='flex gap-2'>
                      <Link to={`/marketplace/${item.id}`} className='text-xs text-[color:var(--accent)] hover:underline'>View</Link>
                      {item.status !== 'published' && (
                        <button
                          type='button'
                          onClick={() => void publishItem.mutateAsync(item.id).then(() => toast('Published!', 'success')).catch(() => toast('Publish failed', 'error'))}
                          className='text-xs font-semibold text-green-600 hover:underline'
                        >Publish</button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Create listing form */}
          <section className='rounded-xl border border-[color:var(--border)] bg-[color:var(--surface-1)] p-5'>
            <h2 className='mb-4 text-base font-semibold text-[color:var(--text-primary)]'>Create New Listing</h2>
            <form onSubmit={(e) => void handleCreate(e)} className='space-y-3'>
              <div className='grid gap-3 sm:grid-cols-2'>
                <div>
                  <label className='mb-1 block text-xs font-medium text-[color:var(--text-secondary)]'>Name *</label>
                  <input
                    required
                    value={form.name}
                    onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                    className='w-full rounded-lg border border-[color:var(--border-strong)] bg-[color:var(--surface-0)] px-3 py-2 text-sm'
                    placeholder='My awesome template'
                  />
                </div>
                <div>
                  <label className='mb-1 block text-xs font-medium text-[color:var(--text-secondary)]'>Slug</label>
                  <input
                    value={form.slug}
                    onChange={(e) => setForm((f) => ({ ...f, slug: e.target.value }))}
                    className='w-full rounded-lg border border-[color:var(--border-strong)] bg-[color:var(--surface-0)] px-3 py-2 text-sm'
                    placeholder='auto-generated if empty'
                  />
                </div>
                <div className='sm:col-span-2'>
                  <label className='mb-1 block text-xs font-medium text-[color:var(--text-secondary)]'>Description</label>
                  <textarea
                    value={form.short_desc}
                    onChange={(e) => setForm((f) => ({ ...f, short_desc: e.target.value }))}
                    className='w-full rounded-lg border border-[color:var(--border-strong)] bg-[color:var(--surface-0)] px-3 py-2 text-sm'
                    rows={3}
                    placeholder='Describe what your listing offers'
                  />
                </div>
                <div>
                  <label className='mb-1 block text-xs font-medium text-[color:var(--text-secondary)]'>Category</label>
                  <select
                    value={form.category}
                    onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
                    className='w-full rounded-lg border border-[color:var(--border-strong)] bg-[color:var(--surface-0)] px-3 py-2 text-sm'
                  >
                    {['general', 'writing', 'automation', 'analytics', 'design'].map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className='mb-1 block text-xs font-medium text-[color:var(--text-secondary)]'>Price (cents, 0 = free)</label>
                  <input
                    type='number'
                    min={0}
                    value={form.price_cents}
                    onChange={(e) => setForm((f) => ({ ...f, price_cents: e.target.value }))}
                    className='w-full rounded-lg border border-[color:var(--border-strong)] bg-[color:var(--surface-0)] px-3 py-2 text-sm'
                    placeholder='0'
                  />
                </div>
              </div>
              <button
                type='submit'
                disabled={createItem.isPending}
                className='rounded-full bg-[color:var(--accent)] px-5 py-2 text-sm font-semibold text-white disabled:opacity-60'
              >
                {createItem.isPending ? 'Creating…' : 'Create Listing'}
              </button>
            </form>
          </section>
        </div>
      )}
    </div>
  )
}
