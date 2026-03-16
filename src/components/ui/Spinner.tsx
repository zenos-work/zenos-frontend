interface Props { size?: 'sm' | 'md' | 'lg' }

const DIM = { sm: 14, md: 28, lg: 44 }

export default function Spinner({ size = 'md' }: Props) {
  const d = DIM[size]
  return (
    <div style={{
      width: d, height: d, borderRadius: '50%',
      border: '2px solid var(--border-strong)',
      borderTopColor: 'var(--accent)',
      animation: 'spin 0.7s linear infinite',
      flexShrink: 0,
    }}>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}
