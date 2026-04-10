import { useMemo, useState } from 'react'
import { isAxiosError } from 'axios'
import { Eye, Flag, Mail, Plus, Send, Smartphone, ToggleLeft, Trash2 } from 'lucide-react'
import {
  useAdminFeatureFlags,
  useCreateAdminFeatureFlag,
  useDeleteAdminFeatureFlag,
  usePreviewFeatureAnnouncement,
  useUpdateAdminFeatureFlag,
} from '../../hooks/useAdmin'
import { useUiStore } from '../../stores/uiStore'
import type {
  FeatureAnnouncementChannel,
  FeatureAnnouncementPreview,
  FeatureFlagAdmin,
  FeatureFlagMetadata,
  FeatureFlagTargetType,
} from '../../types'
import Badge from '../ui/Badge'
import Button from '../ui/Button'
import Modal from '../ui/Modal'
import Spinner from '../ui/Spinner'

type EditorMode = 'create' | 'edit' | 'toggle'

type FeatureFlagFormState = {
  id?: string
  flag_key: string
  name: string
  description: string
  category: string
  is_active: boolean
  target_type: FeatureFlagTargetType
  targets_text: string
  rollout_pct: number
  enabled_title: string
  enabled_summary: string
  disabled_title: string
  disabled_summary: string
  details: string
  action_required: string
  effective_at: string
  reason: string
  support_contact: string
  rollback_plan: string
  channels: FeatureAnnouncementChannel[]
}

const TARGET_TYPES: FeatureFlagTargetType[] = [
  'global',
  'user_ids',
  'user_roles',
  'org_ids',
  'org_tiers',
  'membership_tiers',
  'percentage',
]

const emptyForm = (): FeatureFlagFormState => ({
  flag_key: '',
  name: '',
  description: '',
  category: 'general',
  is_active: false,
  target_type: 'global',
  targets_text: '',
  rollout_pct: 0,
  enabled_title: '',
  enabled_summary: '',
  disabled_title: '',
  disabled_summary: '',
  details: '',
  action_required: '',
  effective_at: '',
  reason: '',
  support_contact: '',
  rollback_plan: '',
  channels: ['in_app'],
})

function formFromFlag(flag: FeatureFlagAdmin, nextActive = flag.is_active): FeatureFlagFormState {
  const announcement = flag.metadata?.announcement ?? {}
  const deliveryChannels = flag.metadata?.delivery?.channels ?? announcement.channels ?? ['in_app']
  return {
    id: flag.id,
    flag_key: flag.flag_key,
    name: flag.name,
    description: flag.description ?? '',
    category: flag.category,
    is_active: nextActive,
    target_type: flag.target_type,
    targets_text: (flag.targets ?? []).join(', '),
    rollout_pct: flag.rollout_pct ?? 0,
    enabled_title: announcement.enabled_title ?? '',
    enabled_summary: announcement.enabled_summary ?? '',
    disabled_title: announcement.disabled_title ?? '',
    disabled_summary: announcement.disabled_summary ?? '',
    details: announcement.details ?? '',
    action_required: announcement.action_required ?? '',
    effective_at: announcement.effective_at ?? '',
    reason: announcement.reason ?? '',
    support_contact: announcement.support_contact ?? '',
    rollback_plan: announcement.rollback_plan ?? '',
    channels: deliveryChannels.includes('in_app')
      ? deliveryChannels
      : ['in_app', ...deliveryChannels],
  }
}

function buildMetadata(form: FeatureFlagFormState): FeatureFlagMetadata {
  const channels: FeatureAnnouncementChannel[] = Array.from(
    new Set<FeatureAnnouncementChannel>(['in_app', ...form.channels.filter((channel) => channel !== 'in_app')]),
  )
  return {
    announcement: {
      enabled_title: form.enabled_title || undefined,
      enabled_summary: form.enabled_summary || undefined,
      disabled_title: form.disabled_title || undefined,
      disabled_summary: form.disabled_summary || undefined,
      details: form.details || undefined,
      action_required: form.action_required || undefined,
      effective_at: form.effective_at || undefined,
      reason: form.reason || undefined,
      support_contact: form.support_contact || undefined,
      rollback_plan: form.rollback_plan || undefined,
    },
    delivery: {
      channels,
    },
  }
}

function parseTargets(text: string): string[] {
  return text
    .split(/[\n,]/)
    .map((value) => value.trim())
    .filter(Boolean)
}

export default function FeatureFlagsPanel() {
  const toast = useUiStore((state) => state.toast)
  const { data, isLoading, isError } = useAdminFeatureFlags(true)
  const createMutation = useCreateAdminFeatureFlag()
  const updateMutation = useUpdateAdminFeatureFlag()
  const deleteMutation = useDeleteAdminFeatureFlag()
  const previewMutation = usePreviewFeatureAnnouncement()

  const [editorMode, setEditorMode] = useState<EditorMode>('create')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [form, setForm] = useState<FeatureFlagFormState>(emptyForm())
  const [preview, setPreview] = useState<FeatureAnnouncementPreview | null>(null)

  const flags = useMemo(() => data?.flags ?? [], [data?.flags])
  const total = data?.total ?? flags.length
  const actionVerb = form.is_active ? 'enabled' : 'disabled'

  const sortedFlags = useMemo(
    () => [...flags].sort((left, right) => Number(right.is_active) - Number(left.is_active) || left.name.localeCompare(right.name)),
    [flags],
  )

  const openCreate = () => {
    setEditorMode('create')
    setForm(emptyForm())
    setPreview(null)
    setIsModalOpen(true)
  }

  const openEdit = (flag: FeatureFlagAdmin) => {
    setEditorMode('edit')
    setForm(formFromFlag(flag))
    setPreview(null)
    setIsModalOpen(true)
  }

  const openTogglePreview = (flag: FeatureFlagAdmin) => {
    setEditorMode('toggle')
    setForm(formFromFlag(flag, !flag.is_active))
    setPreview(null)
    setIsModalOpen(true)
  }

  const updateForm = <K extends keyof FeatureFlagFormState>(key: K, value: FeatureFlagFormState[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }))
    setPreview(null)
  }

  const toggleChannel = (channel: Exclude<FeatureAnnouncementChannel, 'in_app'>) => {
    setForm((prev) => {
      const exists = prev.channels.includes(channel)
      const channels = exists
        ? prev.channels.filter((item) => item !== channel)
        : [...prev.channels, channel]
      return { ...prev, channels: ['in_app', ...channels.filter((item) => item !== 'in_app')] }
    })
    setPreview(null)
  }

  const payload = useMemo(() => ({
    flag_key: form.flag_key.trim(),
    name: form.name.trim(),
    description: form.description.trim(),
    category: form.category.trim() || 'general',
    is_active: form.is_active,
    target_type: form.target_type,
    targets: parseTargets(form.targets_text),
    rollout_pct: form.target_type === 'percentage' ? Number(form.rollout_pct) || 0 : 0,
    metadata: buildMetadata(form),
  }), [form])

  const runPreview = async () => {
    try {
      const response = await previewMutation.mutateAsync({
        ...payload,
        action: actionVerb,
      })
      setPreview(response)
    } catch (error) {
      if (isAxiosError(error)) {
        toast((error.response?.data as { error?: string })?.error ?? 'Failed to build preview', 'error')
      } else {
        toast('Failed to build preview', 'error')
      }
    }
  }

  const save = async () => {
    try {
      if (editorMode === 'create') {
        await createMutation.mutateAsync(payload)
        toast(`Created feature flag ${payload.name}`, 'success')
      } else if (form.id) {
        await updateMutation.mutateAsync({
          flagId: form.id,
          payload,
        })
        toast(`Updated feature flag ${payload.name}`, 'success')
      }
      setIsModalOpen(false)
      setPreview(null)
    } catch (error) {
      if (isAxiosError(error)) {
        toast((error.response?.data as { error?: string })?.error ?? 'Failed to save feature flag', 'error')
      } else {
        toast('Failed to save feature flag', 'error')
      }
    }
  }

  const removeFlag = async (flag: FeatureFlagAdmin) => {
    if (!confirm(`Delete feature flag ${flag.name}?`)) return
    try {
      await deleteMutation.mutateAsync(flag.id)
      toast(`Deleted ${flag.name}`, 'success')
    } catch {
      toast('Failed to delete feature flag', 'error')
    }
  }

  if (isLoading) return <Spinner />

  if (isError) {
    return <div className='rounded-xl border border-red-800/40 bg-red-950/30 px-4 py-5 text-sm text-red-200'>Failed to load feature flags.</div>
  }

  return (
    <div className='space-y-4'>
      <div className='rounded-xl border border-[color:var(--border)] bg-[color:var(--surface-1)] p-4'>
        <div className='flex flex-wrap items-center justify-between gap-3'>
          <div>
            <h2 className='text-sm font-semibold text-[color:var(--text-primary)]'>Feature release controls</h2>
            <p className='mt-1 text-sm text-[color:var(--text-secondary)]'>Manage rollout targeting, announcement text, delivery channels, and preview before publishing a feature change.</p>
          </div>
          <div className='flex items-center gap-2'>
            <Badge variant='default'>{total} flags</Badge>
            <Button size='sm' variant='primary' onClick={openCreate}>
              <Plus size={14} /> New feature flag
            </Button>
          </div>
        </div>
      </div>

      <div className='space-y-3'>
        {sortedFlags.map((flag) => {
          const channels = flag.metadata?.delivery?.channels ?? flag.metadata?.announcement?.channels ?? ['in_app']
          return (
            <div key={flag.id} className='rounded-xl border border-[color:var(--border)] bg-[color:var(--surface-1)] p-4'>
              <div className='flex flex-wrap items-start justify-between gap-3'>
                <div className='min-w-0'>
                  <div className='flex flex-wrap items-center gap-2'>
                    <p className='truncate text-sm font-semibold text-[color:var(--text-primary)]'>{flag.name}</p>
                    <Badge variant={flag.is_active ? 'success' : 'warning'}>{flag.is_active ? 'Enabled' : 'Disabled'}</Badge>
                    <Badge variant='default'>{flag.category}</Badge>
                  </div>
                  <p className='mt-1 text-xs text-[color:var(--text-secondary)]'>
                    {flag.flag_key} • {flag.target_type}
                    {flag.targets.length ? ` • ${flag.targets.join(', ')}` : ''}
                    {flag.target_type === 'percentage' ? ` • ${flag.rollout_pct}%` : ''}
                  </p>
                  {flag.description && <p className='mt-2 text-sm text-[color:var(--text-secondary)]'>{flag.description}</p>}
                  <div className='mt-3 flex flex-wrap gap-2 text-xs text-[color:var(--text-secondary)]'>
                    <span className='inline-flex items-center gap-1'><Send size={12} /> in_app</span>
                    {channels.includes('email') && <span className='inline-flex items-center gap-1'><Mail size={12} /> email</span>}
                    {channels.includes('push') && <span className='inline-flex items-center gap-1'><Smartphone size={12} /> push</span>}
                  </div>
                </div>
                <div className='flex flex-wrap gap-2'>
                  <Button size='sm' variant='secondary' onClick={() => openEdit(flag)}>
                    <Flag size={13} /> Edit
                  </Button>
                  <Button size='sm' variant='secondary' onClick={() => openTogglePreview(flag)}>
                    <Eye size={13} /> Preview {flag.is_active ? 'disable' : 'enable'}
                  </Button>
                  <Button size='sm' variant='danger' onClick={() => removeFlag(flag)} loading={deleteMutation.isPending}>
                    <Trash2 size={13} /> Delete
                  </Button>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      <Modal
        open={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editorMode === 'create' ? 'Create feature flag' : editorMode === 'toggle' ? `Preview ${actionVerb}` : 'Edit feature flag'}
        size='xl'
      >
        <div className='space-y-6'>
          <div className='grid gap-4 lg:grid-cols-2'>
            <label className='space-y-1'>
              <span className='text-sm font-medium text-white'>Flag key</span>
              <input
                value={form.flag_key}
                onChange={(event) => updateForm('flag_key', event.target.value)}
                disabled={editorMode !== 'create'}
                className='w-full rounded-lg border border-gray-700 bg-gray-950 px-3 py-2 text-sm text-white disabled:opacity-60'
              />
            </label>
            <label className='space-y-1'>
              <span className='text-sm font-medium text-white'>Name</span>
              <input
                value={form.name}
                onChange={(event) => updateForm('name', event.target.value)}
                className='w-full rounded-lg border border-gray-700 bg-gray-950 px-3 py-2 text-sm text-white'
              />
            </label>
            <label className='space-y-1 lg:col-span-2'>
              <span className='text-sm font-medium text-white'>Description</span>
              <input
                value={form.description}
                onChange={(event) => updateForm('description', event.target.value)}
                className='w-full rounded-lg border border-gray-700 bg-gray-950 px-3 py-2 text-sm text-white'
              />
            </label>
            <label className='space-y-1'>
              <span className='text-sm font-medium text-white'>Category</span>
              <input
                value={form.category}
                onChange={(event) => updateForm('category', event.target.value)}
                className='w-full rounded-lg border border-gray-700 bg-gray-950 px-3 py-2 text-sm text-white'
              />
            </label>
            <label className='space-y-1'>
              <span className='text-sm font-medium text-white'>Target type</span>
              <select
                value={form.target_type}
                onChange={(event) => updateForm('target_type', event.target.value as FeatureFlagTargetType)}
                className='w-full rounded-lg border border-gray-700 bg-gray-950 px-3 py-2 text-sm text-white'
              >
                {TARGET_TYPES.map((targetType) => (
                  <option key={targetType} value={targetType}>{targetType}</option>
                ))}
              </select>
            </label>
            <label className='space-y-1 lg:col-span-2'>
              <span className='text-sm font-medium text-white'>Targets</span>
              <textarea
                rows={3}
                value={form.targets_text}
                onChange={(event) => updateForm('targets_text', event.target.value)}
                disabled={form.target_type === 'global' || form.target_type === 'percentage'}
                placeholder='Comma or newline separated values'
                className='w-full rounded-lg border border-gray-700 bg-gray-950 px-3 py-2 text-sm text-white disabled:opacity-60'
              />
            </label>
            <label className='space-y-1'>
              <span className='text-sm font-medium text-white'>Rollout percentage</span>
              <input
                type='number'
                min={0}
                max={100}
                value={form.rollout_pct}
                onChange={(event) => updateForm('rollout_pct', Number(event.target.value))}
                disabled={form.target_type !== 'percentage'}
                className='w-full rounded-lg border border-gray-700 bg-gray-950 px-3 py-2 text-sm text-white disabled:opacity-60'
              />
            </label>
            <label className='flex items-center gap-3 rounded-lg border border-gray-700 bg-gray-950 px-3 py-2 text-sm text-white'>
              <input
                type='checkbox'
                checked={form.is_active}
                onChange={(event) => updateForm('is_active', event.target.checked)}
              />
              <span>Feature will be {form.is_active ? 'enabled' : 'disabled'} after save</span>
            </label>
          </div>

          <div className='grid gap-6 lg:grid-cols-2'>
            <div className='space-y-4 rounded-xl border border-gray-800 bg-gray-950/70 p-4'>
              <div className='flex items-center gap-2 text-white'>
                <Flag size={15} />
                <h3 className='text-sm font-semibold'>Announcement copy</h3>
              </div>
              <label className='space-y-1'>
                <span className='text-xs font-medium uppercase tracking-wide text-gray-400'>Enable title</span>
                <input value={form.enabled_title} onChange={(event) => updateForm('enabled_title', event.target.value)} className='w-full rounded-lg border border-gray-700 bg-black px-3 py-2 text-sm text-white' />
              </label>
              <label className='space-y-1'>
                <span className='text-xs font-medium uppercase tracking-wide text-gray-400'>Enable summary</span>
                <textarea rows={2} value={form.enabled_summary} onChange={(event) => updateForm('enabled_summary', event.target.value)} className='w-full rounded-lg border border-gray-700 bg-black px-3 py-2 text-sm text-white' />
              </label>
              <label className='space-y-1'>
                <span className='text-xs font-medium uppercase tracking-wide text-gray-400'>Disable title</span>
                <input value={form.disabled_title} onChange={(event) => updateForm('disabled_title', event.target.value)} className='w-full rounded-lg border border-gray-700 bg-black px-3 py-2 text-sm text-white' />
              </label>
              <label className='space-y-1'>
                <span className='text-xs font-medium uppercase tracking-wide text-gray-400'>Disable summary</span>
                <textarea rows={2} value={form.disabled_summary} onChange={(event) => updateForm('disabled_summary', event.target.value)} className='w-full rounded-lg border border-gray-700 bg-black px-3 py-2 text-sm text-white' />
              </label>
              <label className='space-y-1'>
                <span className='text-xs font-medium uppercase tracking-wide text-gray-400'>Details</span>
                <textarea rows={3} value={form.details} onChange={(event) => updateForm('details', event.target.value)} className='w-full rounded-lg border border-gray-700 bg-black px-3 py-2 text-sm text-white' />
              </label>
            </div>

            <div className='space-y-4 rounded-xl border border-gray-800 bg-gray-950/70 p-4'>
              <div className='flex items-center gap-2 text-white'>
                <Send size={15} />
                <h3 className='text-sm font-semibold'>Delivery and ops</h3>
              </div>
              <label className='space-y-1'>
                <span className='text-xs font-medium uppercase tracking-wide text-gray-400'>Action required</span>
                <textarea rows={2} value={form.action_required} onChange={(event) => updateForm('action_required', event.target.value)} className='w-full rounded-lg border border-gray-700 bg-black px-3 py-2 text-sm text-white' />
              </label>
              <label className='space-y-1'>
                <span className='text-xs font-medium uppercase tracking-wide text-gray-400'>Effective at</span>
                <input value={form.effective_at} onChange={(event) => updateForm('effective_at', event.target.value)} placeholder='Effective immediately' className='w-full rounded-lg border border-gray-700 bg-black px-3 py-2 text-sm text-white' />
              </label>
              <label className='space-y-1'>
                <span className='text-xs font-medium uppercase tracking-wide text-gray-400'>Reason</span>
                <textarea rows={2} value={form.reason} onChange={(event) => updateForm('reason', event.target.value)} className='w-full rounded-lg border border-gray-700 bg-black px-3 py-2 text-sm text-white' />
              </label>
              <label className='space-y-1'>
                <span className='text-xs font-medium uppercase tracking-wide text-gray-400'>Support contact</span>
                <input value={form.support_contact} onChange={(event) => updateForm('support_contact', event.target.value)} className='w-full rounded-lg border border-gray-700 bg-black px-3 py-2 text-sm text-white' />
              </label>
              <label className='space-y-1'>
                <span className='text-xs font-medium uppercase tracking-wide text-gray-400'>Rollback plan</span>
                <textarea rows={2} value={form.rollback_plan} onChange={(event) => updateForm('rollback_plan', event.target.value)} className='w-full rounded-lg border border-gray-700 bg-black px-3 py-2 text-sm text-white' />
              </label>
              <div className='space-y-2'>
                <span className='text-xs font-medium uppercase tracking-wide text-gray-400'>Delivery channels</span>
                <div className='flex flex-wrap gap-2'>
                  <Badge variant='info'>in_app always on</Badge>
                  <button type='button' onClick={() => toggleChannel('email')} className={`rounded-lg border px-3 py-2 text-xs ${form.channels.includes('email') ? 'border-[color:var(--accent)] bg-[color:rgba(195,164,92,0.18)] text-white' : 'border-gray-700 bg-black text-gray-300'}`}>
                    <Mail size={12} className='mr-1 inline' /> Email
                  </button>
                  <button type='button' onClick={() => toggleChannel('push')} className={`rounded-lg border px-3 py-2 text-xs ${form.channels.includes('push') ? 'border-[color:var(--accent)] bg-[color:rgba(195,164,92,0.18)] text-white' : 'border-gray-700 bg-black text-gray-300'}`}>
                    <Smartphone size={12} className='mr-1 inline' /> Push
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className='rounded-xl border border-gray-800 bg-gray-950/70 p-4'>
            <div className='flex flex-wrap items-center justify-between gap-2'>
              <div>
                <h3 className='text-sm font-semibold text-white'>Preview</h3>
                <p className='text-sm text-gray-400'>See the exact announcement text and estimated audience before saving.</p>
              </div>
              <Button size='sm' variant='secondary' onClick={runPreview} loading={previewMutation.isPending}>
                <Eye size={14} /> Refresh preview
              </Button>
            </div>
            {preview ? (
              <div className='mt-4 space-y-3'>
                <div className='flex flex-wrap items-center gap-2'>
                  <Badge variant={preview.action === 'enabled' ? 'success' : 'warning'}>{preview.action}</Badge>
                  <Badge variant='default'>{preview.scope}</Badge>
                  <Badge variant='info'>{preview.recipient_count} recipients</Badge>
                </div>
                <div className='rounded-lg border border-gray-800 bg-black p-4 text-sm leading-6 text-gray-100 whitespace-pre-wrap'>
                  {preview.message}
                </div>
                <div className='flex flex-wrap gap-2 text-xs text-gray-300'>
                  {preview.channels.map((channel) => (
                    <span key={channel} className='rounded-full border border-gray-700 px-2 py-1'>
                      {channel}: {preview.channel_recipient_counts[channel] ?? 0}
                    </span>
                  ))}
                </div>
              </div>
            ) : (
              <p className='mt-4 text-sm text-gray-500'>No preview generated yet.</p>
            )}
          </div>

          <div className='flex justify-end gap-2'>
            <Button variant='ghost' onClick={() => setIsModalOpen(false)}>Cancel</Button>
            <Button
              variant='primary'
              onClick={save}
              loading={createMutation.isPending || updateMutation.isPending}
              disabled={!payload.flag_key || !payload.name}
            >
              <ToggleLeft size={14} />
              {editorMode === 'create' ? 'Create flag' : editorMode === 'toggle' ? `Apply ${actionVerb}` : 'Save changes'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
