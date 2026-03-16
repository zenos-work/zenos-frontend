import { useEffect, useRef } from 'react'
import { X } from 'lucide-react'

interface Props {
  open:       boolean
  onClose:    () => void
  title?:     string
  children:   React.ReactNode
}

export default function Modal({ open, onClose, title, children }: Props) {
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
        className='bg-gray-900 border border-gray-800 rounded-2xl w-full max-w-md shadow-2xl'
      >
        {title && (
          <div className='flex items-center justify-between px-6 py-4 border-b border-gray-800'>
            <h2 className='text-base font-semibold text-white'>{title}</h2>
            <button onClick={onClose} className='text-gray-500 hover:text-white'>
              <X size={18} />
            </button>
          </div>
        )}
        <div className='p-6'>{children}</div>
      </div>
    </div>
  )
}
