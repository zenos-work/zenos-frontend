import { useMemo, useState } from 'react'
import FeatureComingSoon from '../components/ui/FeatureComingSoon'
import Spinner from '../components/ui/Spinner'
import { useFeatureFlag } from '../hooks/useFeatureFlags'
import { useMyOrgs } from '../hooks/useOrg'
import {
  useAddSubscriber,
  useCreateIssue,
  useCreateNewsletter,
  useDeleteIssue,
  useDeleteNewsletter,
  useMyNewsletters,
  useNewsletterIssues,
  useNewsletterSubscribers,
  useSendIssue,
  useUpdateSubscriberStatus,
  type Newsletter,
} from '../hooks/useNewsletters'
import { useUiStore } from '../stores/uiStore'

export default function NewsletterPage() {
  const toast = useUiStore((s) => s.toast)
  const { enabled, isLoading: flagLoading } = useFeatureFlag('newsletters')
  const orgs = useMyOrgs(enabled)
  const orgId = orgs.data?.organizations?.[0]?.id ?? ''
  const newsletters = useMyNewsletters(enabled, orgId || undefined)
  const createNewsletter = useCreateNewsletter()
  const deleteNewsletter = useDeleteNewsletter()

  const [selectedNewsletterId, setSelectedNewsletterId] = useState('')
  const [newsletterName, setNewsletterName] = useState('')
  const [newsletterSlug, setNewsletterSlug] = useState('')
  const [subscriberEmail, setSubscriberEmail] = useState('')
  const [issueSubject, setIssueSubject] = useState('')

  const newsletterItems = useMemo(
    () => ((newsletters.data as { newsletters?: Newsletter[] } | undefined)?.newsletters ?? []),
    [newsletters.data],
  )

  const effectiveNewsletterId = selectedNewsletterId || newsletterItems[0]?.id || ''

  const subscribers = useNewsletterSubscribers(effectiveNewsletterId, enabled && !!effectiveNewsletterId)
  const issues = useNewsletterIssues(effectiveNewsletterId, enabled && !!effectiveNewsletterId)
  const addSubscriber = useAddSubscriber(effectiveNewsletterId)
  const updateSubscriber = useUpdateSubscriberStatus(effectiveNewsletterId)
  const createIssue = useCreateIssue(effectiveNewsletterId)
  const removeIssue = useDeleteIssue(effectiveNewsletterId)
  const sendIssue = useSendIssue(effectiveNewsletterId)

  if (flagLoading) return <div className='flex justify-center py-12'><Spinner /></div>

  if (!enabled) {
    return <FeatureComingSoon name='Newsletters' description='Create and manage newsletters, subscribers, and issue sends.' />
  }

  return (
    <div className='space-y-6'>
      <header>
        <h1 className='text-2xl font-bold text-[color:var(--text-primary)]'>Newsletter management</h1>
        <p className='mt-1 text-sm text-[color:var(--text-secondary)]'>Create newsletters, manage subscribers, and compose issue sends.</p>
      </header>

      <section className='rounded-xl border border-[color:var(--border)] bg-[color:var(--surface-1)] p-4'>
        <h2 className='text-sm font-semibold text-[color:var(--text-primary)]'>Create newsletter</h2>
        <div className='mt-3 grid gap-3 md:grid-cols-[minmax(0,1fr)_220px_auto]'>
          <input
            value={newsletterName}
            onChange={(event) => setNewsletterName(event.target.value)}
            placeholder='Newsletter name'
            className='h-10 rounded-lg border border-[color:var(--border-strong)] bg-[color:var(--surface-0)] px-3 text-sm'
          />
          <input
            value={newsletterSlug}
            onChange={(event) => setNewsletterSlug(event.target.value)}
            placeholder='newsletter-slug'
            className='h-10 rounded-lg border border-[color:var(--border-strong)] bg-[color:var(--surface-0)] px-3 text-sm'
          />
          <button
            type='button'
            className='rounded-full bg-[color:var(--accent)] px-4 py-2 text-sm font-semibold text-white'
            onClick={() => {
              if (!orgId || !newsletterName.trim() || !newsletterSlug.trim()) {
                toast('Provide org, name, and slug', 'warning')
                return
              }
              void createNewsletter
                .mutateAsync({
                  org_id: orgId,
                  name: newsletterName.trim(),
                  slug: newsletterSlug.trim(),
                })
                .then(() => {
                  setNewsletterName('')
                  setNewsletterSlug('')
                  toast('Newsletter created', 'success')
                })
                .catch(() => toast('Could not create newsletter', 'error'))
            }}
          >
            Create
          </button>
        </div>
      </section>

      <div className='grid gap-6 lg:grid-cols-[minmax(260px,340px)_minmax(0,1fr)]'>
        <section className='rounded-xl border border-[color:var(--border)] bg-[color:var(--surface-1)] p-4'>
          <h2 className='text-sm font-semibold text-[color:var(--text-primary)]'>My newsletters</h2>
          {newsletters.isLoading ? (
            <div className='mt-4'><Spinner /></div>
          ) : newsletterItems.length === 0 ? (
            <p className='mt-4 text-sm text-[color:var(--text-secondary)]'>No newsletters yet.</p>
          ) : (
            <div className='mt-4 space-y-2'>
              {newsletterItems.map((item) => (
                <div
                  key={item.id}
                  className={[
                    'rounded-lg border p-3',
                    item.id === effectiveNewsletterId
                      ? 'border-[color:var(--accent)] bg-[color:var(--surface-2)]'
                      : 'border-[color:var(--border)] bg-[color:var(--surface-0)]',
                  ].join(' ')}
                >
                  <button
                    type='button'
                    className='w-full text-left'
                    onClick={() => setSelectedNewsletterId(item.id)}
                  >
                    <p className='text-sm font-medium text-[color:var(--text-primary)]'>{item.name}</p>
                    <p className='text-xs text-[color:var(--text-secondary)]'>/{item.slug}</p>
                  </button>
                  <div className='mt-2 flex justify-end'>
                    <button
                      type='button'
                      className='text-xs font-medium text-red-500 hover:underline'
                      onClick={() => {
                        void deleteNewsletter
                          .mutateAsync(item.id)
                          .then(() => {
                            if (item.id === effectiveNewsletterId) setSelectedNewsletterId('')
                            toast('Newsletter deleted', 'success')
                          })
                          .catch(() => toast('Could not delete newsletter', 'error'))
                      }}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        <section className='space-y-6'>
          <div className='rounded-xl border border-[color:var(--border)] bg-[color:var(--surface-1)] p-4'>
            <h2 className='text-sm font-semibold text-[color:var(--text-primary)]'>Subscribers</h2>
            <div className='mt-3 flex flex-wrap gap-2'>
              <input
                value={subscriberEmail}
                onChange={(event) => setSubscriberEmail(event.target.value)}
                placeholder='subscriber@email.com'
                className='h-10 min-w-[240px] flex-1 rounded-lg border border-[color:var(--border-strong)] bg-[color:var(--surface-0)] px-3 text-sm'
              />
              <button
                type='button'
                className='rounded-full border border-[color:var(--border-strong)] px-4 py-2 text-sm font-semibold'
                onClick={() => {
                  if (!effectiveNewsletterId || !subscriberEmail.trim()) return
                  void addSubscriber
                    .mutateAsync({ email: subscriberEmail.trim() })
                    .then(() => {
                      setSubscriberEmail('')
                      toast('Subscriber added', 'success')
                    })
                    .catch(() => toast('Could not add subscriber', 'error'))
                }}
              >
                Add subscriber
              </button>
            </div>
            <div className='mt-4 space-y-2'>
              {((subscribers.data as { subscribers?: Array<{ id: string; email: string; status?: string }> } | undefined)?.subscribers ?? []).map((subscriber) => (
                <div key={subscriber.id} className='flex items-center justify-between rounded-lg border border-[color:var(--border)] bg-[color:var(--surface-0)] px-3 py-2'>
                  <div>
                    <p className='text-sm text-[color:var(--text-primary)]'>{subscriber.email}</p>
                    <p className='text-xs text-[color:var(--text-secondary)]'>{subscriber.status ?? 'subscribed'}</p>
                  </div>
                  <button
                    type='button'
                    className='text-xs font-medium text-[color:var(--accent)] hover:underline'
                    onClick={() => {
                      const next = subscriber.status === 'subscribed' ? 'unsubscribed' : 'subscribed'
                      void updateSubscriber
                        .mutateAsync({ subscriberId: subscriber.id, status: next })
                        .then(() => toast('Subscriber status updated', 'success'))
                        .catch(() => toast('Could not update subscriber', 'error'))
                    }}
                  >
                    Toggle status
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className='rounded-xl border border-[color:var(--border)] bg-[color:var(--surface-1)] p-4'>
            <h2 className='text-sm font-semibold text-[color:var(--text-primary)]'>Issues</h2>
            <div className='mt-3 flex flex-wrap gap-2'>
              <input
                value={issueSubject}
                onChange={(event) => setIssueSubject(event.target.value)}
                placeholder='Issue subject'
                className='h-10 min-w-[240px] flex-1 rounded-lg border border-[color:var(--border-strong)] bg-[color:var(--surface-0)] px-3 text-sm'
              />
              <button
                type='button'
                className='rounded-full border border-[color:var(--border-strong)] px-4 py-2 text-sm font-semibold'
                onClick={() => {
                  if (!effectiveNewsletterId || !issueSubject.trim()) return
                  void createIssue
                    .mutateAsync({ subject: issueSubject.trim(), status: 'draft' })
                    .then(() => {
                      setIssueSubject('')
                      toast('Issue created', 'success')
                    })
                    .catch(() => toast('Could not create issue', 'error'))
                }}
              >
                Create issue
              </button>
            </div>

            <div className='mt-4 space-y-2'>
              {((issues.data as { issues?: Array<{ id: string; subject: string; status?: string }> } | undefined)?.issues ?? []).map((issue) => (
                <div key={issue.id} className='rounded-lg border border-[color:var(--border)] bg-[color:var(--surface-0)] px-3 py-2'>
                  <div className='flex items-center justify-between gap-3'>
                    <div>
                      <p className='text-sm text-[color:var(--text-primary)]'>{issue.subject}</p>
                      <p className='text-xs text-[color:var(--text-secondary)]'>{issue.status ?? 'draft'}</p>
                    </div>
                    <div className='flex items-center gap-3'>
                      <button
                        type='button'
                        className='text-xs font-medium text-[color:var(--accent)] hover:underline'
                        onClick={() => {
                          void sendIssue
                            .mutateAsync(issue.id)
                            .then(() => toast('Issue send queued', 'success'))
                            .catch(() => toast('Could not queue issue send', 'error'))
                        }}
                      >
                        Send
                      </button>
                      <button
                        type='button'
                        className='text-xs font-medium text-red-500 hover:underline'
                        onClick={() => {
                          void removeIssue
                            .mutateAsync(issue.id)
                            .then(() => toast('Issue deleted', 'success'))
                            .catch(() => toast('Could not delete issue', 'error'))
                        }}
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}
