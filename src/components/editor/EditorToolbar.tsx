import { Save, Eye, EyeOff, Send, ChevronLeft, ChevronRight } from 'lucide-react'
import Button from '../ui/Button'
import { useUiStore } from '../../stores/uiStore'

interface Props {
  onSave:          () => void
  onSubmit:        () => void
  onTogglePreview: () => void
  isSaving:        boolean
  isSubmitting?:   boolean
  isDirty:         boolean
  previewMode:     boolean
}

export default function EditorToolbar({
  onSave, onSubmit, onTogglePreview, isSaving, isSubmitting = false, isDirty, previewMode,
}: Props) {
  const sidebarOpen = useUiStore(s => s.sidebarOpen)
  const toggleSidebar = useUiStore(s => s.toggleSidebar)

  return (
    <div className='flex items-center gap-3 pb-4 border-b border-[color:var(--border)]'>
      <button
        type='button'
        onClick={toggleSidebar}
        className='p-2 rounded-lg text-[color:var(--text-muted)] hover:text-[color:var(--text-primary)] hover:bg-[color:var(--surface-2)] transition-colors'
        aria-label={sidebarOpen ? 'Minimize sidebar' : 'Expand sidebar'}
        title={sidebarOpen ? 'Minimize sidebar' : 'Expand sidebar'}
      >
        {sidebarOpen ? <ChevronLeft size={18} /> : <ChevronRight size={18} />}
      </button>

      <span className='text-sm text-[color:var(--text-muted)] flex-1'>
        {isDirty ? (
          <span className='text-amber-700'>● Unsaved changes</span>
        ) : (
          <span className='text-emerald-700'>✓ Saved</span>
        )}
      </span>

      <Button
        variant='ghost'
        size='sm'
        onClick={onTogglePreview}
        className='gap-2'
      >
        {previewMode ? <EyeOff size={15} /> : <Eye size={15} />}
        {previewMode ? 'Hide preview' : 'Preview'}
      </Button>

      <Button
        variant='secondary'
        size='sm'
        onClick={onSave}
        loading={isSaving}
        disabled={!isDirty}
      >
        <Save size={15} />
        Save draft
      </Button>

      <Button variant='primary' size='sm' onClick={onSubmit} loading={isSubmitting} disabled={isSubmitting}>
        <Send size={15} />
        Submit for review
      </Button>
    </div>
  )
}
