import { useEffect, useRef } from 'react'
import { X } from 'lucide-react'

interface Props {
  open:       boolean
  onClose:    () => void
  title?:     string
  children:   React.ReactNode
  size?:      'md' | 'lg' | 'xl'
}

const SIZE_CLASS = {
  md: 'max-w-md',
  lg: 'max-w-3xl',
  xl: 'max-w-5xl',
}

export default function Modal({ open, onClose, title, children, size = 'md' }: Props) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handler = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [onClose])

  if (!open) return null

  return (
    <div
      className='fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4'
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      <div
        ref={ref}
        className={`bg-[color:var(--surface-5)] border border-[color:var(--border)] rounded-2xl w-full ${SIZE_CLASS[size]} shadow-2xl max-h-[90vh] overflow-y-auto`}
      >
        {title && (
          <div className='flex items-center justify-between px-6 py-4 border-b border-[color:var(--border)]'>
            <h2 className='text-base font-semibold text-[color:var(--text-primary)]'>{title}</h2>
            <button onClick={onClose} className='text-[color:var(--text-muted)] hover:text-[color:var(--text-primary)]'>
              <X size={18} />
            </button>
          </div>
        )}
        <div className='p-6'>{children}</div>
      </div>
    </div>
  )
}
