import { useState } from 'react'
import FeatureComingSoon from '../components/ui/FeatureComingSoon'
import Spinner from '../components/ui/Spinner'
import SurfaceCard from '../components/ui/SurfaceCard'
import Button from '../components/ui/Button'
import { useFeatureFlag } from '../hooks/useFeatureFlags'
import { useCreateLeadContact, useLeadContacts } from '../hooks/useLeads'
import { useUiStore } from '../stores/uiStore'

export default function LeadsPage() {
  const { enabled, isLoading: flagLoading } = useFeatureFlag('leads')
  const toast = useUiStore((s) => s.toast)
  const [orgId, setOrgId] = useState('')
  const [email, setEmail] = useState('')
  const { data, isLoading } = useLeadContacts(orgId, enabled && !!orgId)
  const createLead = useCreateLeadContact()

  if (flagLoading) return <div className='flex justify-center py-12'><Spinner /></div>
  if (!enabled) return <FeatureComingSoon name='Leads & CRM' description='Lead capture and CRM tools are currently behind the leads feature flag.' />

  const create = async () => {
    if (!orgId.trim() || !email.trim()) {
      toast('Org ID and email are required', 'error')
      return
    }
    try {
      await createLead.mutateAsync({ org_id: orgId.trim(), email: email.trim() })
      setEmail('')
      toast('Lead created', 'success')
    } catch {
      toast('Failed to create lead', 'error')
    }
  }

  return (
    <div className='space-y-4'>
      <h1 className='text-2xl font-bold text-[color:var(--text-primary)]'>Leads & CRM</h1>
      <SurfaceCard className='space-y-3'>
        <h2 className='text-base font-semibold text-[color:var(--text-primary)]'>Create Contact</h2>
        <input value={orgId} onChange={(e) => setOrgId(e.target.value)} className='w-full rounded-lg border border-[color:var(--border)] bg-transparent px-3 py-2 text-sm' placeholder='Organization ID' />
        <input value={email} onChange={(e) => setEmail(e.target.value)} className='w-full rounded-lg border border-[color:var(--border)] bg-transparent px-3 py-2 text-sm' placeholder='email@example.com' />
        <Button onClick={() => void create()} disabled={createLead.isPending}>{createLead.isPending ? 'Creating...' : 'Create lead'}</Button>
      </SurfaceCard>

      <SurfaceCard>
        <h2 className='text-base font-semibold text-[color:var(--text-primary)]'>Contacts</h2>
        {isLoading ? <Spinner /> : (
          <ul className='mt-3 space-y-2 text-sm text-[color:var(--text-secondary)]'>
            {(data?.leads ?? []).map((lead) => <li key={lead.id}>{lead.email}</li>)}
            {(data?.leads ?? []).length === 0 && <li>No contacts yet.</li>}
          </ul>
        )}
      </SurfaceCard>
    </div>
  )
}
