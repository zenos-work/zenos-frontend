import type { ButtonHTMLAttributes } from 'react'
import Spinner from './Spinner'

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?:  'primary' | 'secondary' | 'ghost' | 'danger'
  size?:     'sm' | 'md' | 'lg'
  loading?:  boolean
}

// Uses CSS vars so variants adapt to light/dark theme
const VARIANTS: Record<string, React.CSSProperties> = {
  primary:   { backgroundColor: 'var(--accent)', color: '#fff',                borderColor: 'transparent' },
  secondary: { backgroundColor: 'var(--surface-3)', color: 'var(--text-primary)', borderColor: 'var(--border-strong)' },
  ghost:     { backgroundColor: 'transparent', color: 'var(--text-secondary)',  borderColor: 'transparent' },
  danger:    { backgroundColor: '#dc2626', color: '#fff',                       borderColor: 'transparent' },
}

const SIZES: Record<string, React.CSSProperties> = {
  sm: { padding: '6px 12px', fontSize: 12 },
  md: { padding: '8px 16px', fontSize: 14 },
  lg: { padding: '12px 24px', fontSize: 16 },
}

export default function Button({
  variant = 'primary', size = 'md', loading, children, disabled, style, className = '', ...rest
}: Props) {
  return (
    <button
      {...rest}
      disabled={disabled || loading}
      className={className}
      style={{
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8,
        borderRadius: 8, fontWeight: 500, border: '1px solid',
        cursor: disabled || loading ? 'not-allowed' : 'pointer',
        opacity: disabled || loading ? 0.5 : 1,
        transition: 'opacity 0.15s, background-color 0.15s',
        fontFamily: "'DM Sans', system-ui, sans-serif",
        ...VARIANTS[variant],
        ...SIZES[size],
        ...style,
      }}
    >
      {loading && <Spinner size='sm' />}
      {children}
    </button>
  )
}
