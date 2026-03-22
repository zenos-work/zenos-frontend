interface Props {
  children: React.ReactNode
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'info'
}

const VARIANTS = {
  default: 'border border-[color:var(--border-strong)] bg-[color:var(--surface-2)] text-[color:var(--text-secondary)]',
  success: 'border border-[color:rgba(47,107,70,0.35)] bg-[color:rgba(47,107,70,0.13)] text-[color:#2f6b46] dark:text-[#9bd3aa]',
  warning: 'border border-[color:rgba(166,124,60,0.35)] bg-[color:rgba(166,124,60,0.14)] text-[color:#8a5b18] dark:text-[#e7bd7a]',
  danger:  'border border-[color:rgba(180,35,24,0.35)] bg-[color:rgba(180,35,24,0.12)] text-[color:#b42318] dark:text-[#ff9f94]',
  info:    'border border-[color:rgba(20,125,134,0.35)] bg-[color:rgba(20,125,134,0.14)] text-[color:#147d86] dark:text-[#8adbe2]',
}

export default function Badge({ children, variant = 'default' }: Props) {
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${VARIANTS[variant]}`}>
      {children}
    </span>
  )
}
