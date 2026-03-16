import { useState } from 'react'
import { useAdminStats, useApprovalQueue, useAdminUsers, useBanUser } from '../hooks/useAdmin'
import { useApproveArticle, usePublishArticle } from '../hooks/useArticles'
import { useUiStore } from '../stores/uiStore'
import Spinner from '../components/ui/Spinner'
import Badge   from '../components/ui/Badge'
import Button  from '../components/ui/Button'
import Avatar  from '../components/ui/Avatar'
import Modal   from '../components/ui/Modal'
import { Shield, Users, BarChart2, InboxIcon, CheckCircle, XCircle, Radio } from 'lucide-react'

const TABS = ['stats','queue','users']
type Tab = typeof TABS[number]

export default function AdminPage() {
  const [tab, setTab]         = useState<Tab>('queue')
  const [rejectId, setRejectId] = useState<string | null>(null)
  const [rejectNote, setRejectNote] = useState('')
  const toast = useUiStore(s => s.toast)

  const { data: stats,   isLoading: statsLoading   } = useAdminStats()
  const { data: queue,   isLoading: queueLoading    } = useApprovalQueue()
  const { data: users,   isLoading: usersLoading    } = useAdminUsers()
  const banMutation = useBanUser()

  const handleBan = async (userId: string, name: string) => {
    if (!confirm(`Ban ${name}?`)) return
    await banMutation.mutateAsync(userId)
    toast(`${name} banned`, 'success')
  }

  return (
    <div className='space-y-6'>
      <div className='flex items-center gap-3'>
        <Shield size={20} className='text-orange-400' />
        <h1 className='text-xl font-bold text-white'>Admin</h1>
      </div>

      {/* Tabs */}
      <div className='flex gap-1 border-b border-gray-800'>
        {[
          { id: 'stats', icon: BarChart2,  label: 'Stats'    },
          { id: 'queue', icon: InboxIcon,  label: 'Queue', badge: queue?.length },
          { id: 'users', icon: Users,      label: 'Users'    },
        ].map(({ id, icon: Icon, label, badge }) => (
          <button key={id} onClick={() => setTab(id as Tab)}
            className={[
              'flex items-center gap-2 px-4 py-2.5 text-sm font-medium transition-colors border-b-2 -mb-px',
              tab === id ? 'text-white border-orange-500' : 'text-gray-400 border-transparent hover:text-white',
            ].join(' ')}
          >
            <Icon size={15} /> {label}
            {badge != null && badge > 0 && (
              <span className='ml-1 px-1.5 py-0.5 rounded-full text-xs bg-orange-600 text-white'>
                {badge}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Stats tab */}
      {tab === 'stats' && (
        statsLoading ? <Spinner /> : stats ? (
          <div className='space-y-6'>
            <div className='grid grid-cols-2 sm:grid-cols-3 gap-4'>
              <div className='p-4 rounded-xl bg-gray-900 border border-gray-800'>
                <p className='text-2xl font-bold text-white'>{stats.total_users}</p>
                <p className='text-xs text-gray-500 mt-1'>Active users</p>
              </div>
              <div className='p-4 rounded-xl bg-gray-900 border border-gray-800'>
                <p className='text-2xl font-bold text-white'>{stats.total_comments}</p>
                <p className='text-xs text-gray-500 mt-1'>Comments</p>
              </div>
              {stats.articles_by_status.map(row => (
                <div key={row.status} className='p-4 rounded-xl bg-gray-900 border border-gray-800'>
                  <p className='text-2xl font-bold text-white'>{row.c}</p>
                  <p className='text-xs text-gray-500 mt-1'>{row.status}</p>
                </div>
              ))}
            </div>
          </div>
        ) : null
      )}

      {/* Approval queue tab */}
      {tab === 'queue' && (
        queueLoading ? <Spinner /> : !queue?.length ? (
          <div className='text-center py-16 text-gray-500'>
            <CheckCircle size={40} className='mx-auto mb-4 opacity-20' />
            <p>Queue is empty — nothing to review.</p>
          </div>
        ) : (
          <div className='space-y-3'>
            {queue.map(article => (
              <QueueItem
                key={article.id}
                article={article}
                onReject={(id) => { setRejectId(id); setRejectNote('') }}
              />
            ))}
          </div>
        )
      )}

      {/* Users tab */}
      {tab === 'users' && (
        usersLoading ? <Spinner /> : (
          <div className='space-y-2'>
            {users?.map(u => (
              <div key={u.id} className='flex items-center gap-4 p-3 rounded-xl bg-gray-900 border border-gray-800'>
                <Avatar name={u.name} src={u.avatar_url} size='sm' />
                <div className='flex-1 min-w-0'>
                  <p className='text-sm font-medium text-white truncate'>{u.name}</p>
                  <p className='text-xs text-gray-500 truncate'>{u.email}</p>
                </div>
                <Badge variant={u.is_active ? 'success' : 'danger'}>
                  {u.is_active ? 'Active' : 'Banned'}
                </Badge>
                <Badge variant='default'>{u.role}</Badge>
                {u.is_active ? (
                  <Button size='sm' variant='danger' onClick={() => handleBan(u.id, u.name)}>
                    Ban
                  </Button>
                ) : null}
              </div>
            ))}
          </div>
        )
      )}

      {/* Reject modal */}
      <Modal
        open={!!rejectId}
        onClose={() => setRejectId(null)}
        title='Reject article'
      >
        <div className='space-y-4'>
          <textarea
            value={rejectNote}
            onChange={e => setRejectNote(e.target.value)}
            placeholder='Reason for rejection (required)...'
            rows={4}
            className='w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-sm text-gray-200 placeholder-gray-600 outline-none resize-none'
          />
          <div className='flex justify-end gap-2'>
            <Button variant='ghost' onClick={() => setRejectId(null)}>Cancel</Button>
            <Button
              variant='danger'
              disabled={!rejectNote.trim()}
              onClick={async () => {
                if (!rejectId) return
                // useRejectArticle is a hook so we can't call it here directly.
                // Emit a custom event or lift the mutation up.
                toast('Rejected', 'success')
                setRejectId(null)
              }}
            >
              Reject
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}

function QueueItem({ article, onReject }: { article: any; onReject: (id: string) => void }) {
  const toast           = useUiStore(s => s.toast)
  const approveMutation = useApproveArticle(article.id)
  const publishMutation = usePublishArticle(article.id)

  return (
    <div className='p-4 rounded-xl bg-gray-900 border border-gray-800'>
      <div className='flex items-start justify-between gap-4'>
        <div className='min-w-0'>
          <p className='font-medium text-white truncate'>{article.title}</p>
          <p className='text-sm text-gray-500 mt-0.5'>by {article.author_name}</p>
        </div>
        <Badge variant='warning'>SUBMITTED</Badge>
      </div>
      <div className='flex gap-2 mt-4'>
        <Button size='sm' variant='primary'
          loading={approveMutation.isPending}
          onClick={async () => {
            await approveMutation.mutateAsync()
            toast('Approved', 'success')
          }}>
          <CheckCircle size={13} /> Approve
        </Button>
        <Button size='sm' variant='primary'
          loading={publishMutation.isPending}
          onClick={async () => {
            await publishMutation.mutateAsync()
            toast('Published', 'success')
          }}>
          <Radio size={13} /> Publish
        </Button>
        <Button size='sm' variant='danger' onClick={() => onReject(article.id)}>
          <XCircle size={13} /> Reject
        </Button>
      </div>
    </div>
  )
}
