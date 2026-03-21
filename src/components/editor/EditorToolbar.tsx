import { Save, Eye, EyeOff, Send, ChevronLeft } from 'lucide-react'
import { Link } from 'react-router-dom'
import Button from '../ui/Button'

interface Props {
  onSave:          () => void
  onSubmit:        () => void
  onTogglePreview: () => void
  isSaving:        boolean
  isDirty:         boolean
  previewMode:     boolean
}

export default function EditorToolbar({
  onSave, onSubmit, onTogglePreview, isSaving, isDirty, previewMode,
}: Props) {
  return (
    <div className='flex items-center gap-3 pb-4 border-b border-[color:var(--border)]'>
      <Link to='/library' className='p-2 rounded-lg text-[color:var(--text-muted)] hover:text-[color:var(--text-primary)] hover:bg-[color:var(--surface-2)] transition-colors'>
        <ChevronLeft size={18} />
      </Link>

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

      <Button variant='primary' size='sm' onClick={onSubmit}>
        <Send size={15} />
        Submit for review
      </Button>
    </div>
  )
}
