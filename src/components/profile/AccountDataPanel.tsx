import { useState } from 'react'
import { useDataExportStatus, useRequestAccountErasure, useRequestDataExport } from '../../hooks/useCompliance'
import { useUiStore } from '../../stores/uiStore'

export default function AccountDataPanel() {
  const toast = useUiStore((s) => s.toast)
  const requestExport = useRequestDataExport()
  const requestErasure = useRequestAccountErasure()
  const [exportId, setExportId] = useState('')
  const exportStatus = useDataExportStatus(exportId, !!exportId)

  const handleRequestExport = async () => {
    try {
      const result = await requestExport.mutateAsync()
      const id = String((result as { id?: string })?.id ?? '')
      if (id) {
        setExportId(id)
      }
      toast('Data export requested', 'success')
    } catch {
      toast('Could not request data export', 'error')
    }
  }

  const handleRequestErasure = async () => {
    if (!confirm('Request account erasure? A cooling-off period may apply.')) return
    try {
      await requestErasure.mutateAsync({ password_confirmed: true })
      toast('Erasure request submitted', 'success')
    } catch {
      toast('Could not request erasure', 'error')
    }
  }

  return (
    <div className='mt-6 space-y-4 rounded-xl border border-[color:var(--border)] bg-[color:var(--surface-0)] p-4'>
      <h3 className='text-sm font-semibold text-[color:var(--text-primary)]'>Account data controls</h3>
      <div className='flex flex-wrap gap-2'>
        <button
          type='button'
          onClick={() => void handleRequestExport()}
          disabled={requestExport.isPending}
          className='rounded-full border border-[color:var(--border)] px-4 py-2 text-sm font-semibold text-[color:var(--text-primary)] hover:bg-[color:var(--surface-2)] disabled:opacity-50'
        >
          {requestExport.isPending ? 'Requesting...' : 'Download my data'}
        </button>
        <button
          type='button'
          onClick={() => void handleRequestErasure()}
          disabled={requestErasure.isPending}
          className='rounded-full border border-[color:rgba(180,35,24,0.45)] bg-[color:rgba(180,35,24,0.14)] px-4 py-2 text-sm font-semibold text-[color:#b42318] disabled:opacity-50 dark:text-[#ff9f94]'
        >
          {requestErasure.isPending ? 'Submitting...' : 'Request account erasure'}
        </button>
      </div>
      {exportId && (
        <p className='text-xs text-[color:var(--text-muted)]'>
          Export request: {exportId} • status: {String((exportStatus.data as { status?: string })?.status ?? 'pending')}
        </p>
      )}
    </div>
  )
}
