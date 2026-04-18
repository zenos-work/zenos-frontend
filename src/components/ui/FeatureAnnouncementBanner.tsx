import { Megaphone, X } from 'lucide-react'

type Props = {
  title: string
  summary?: string
  actionRequired?: string
  onDismiss: () => void
}

export default function FeatureAnnouncementBanner({
  title,
  summary,
  actionRequired,
  onDismiss,
}: Props) {
  return (
    <section
      role='status'
      aria-live='polite'
      style={{
        marginBottom: 16,
        border: '1px solid rgba(166,124,60,0.28)',
        background: 'linear-gradient(90deg, rgba(166,124,60,0.18) 0%, rgba(166,124,60,0.08) 60%, rgba(166,124,60,0.04) 100%)',
        borderRadius: 14,
        padding: '12px 14px',
        boxShadow: 'var(--shadow)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
        <Megaphone size={18} style={{ marginTop: 1, color: 'var(--accent)' }} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ margin: 0, fontWeight: 700, fontSize: 14, color: 'var(--text-primary)' }}>{title}</p>
          {summary && (
            <p style={{ margin: '4px 0 0', fontSize: 13, color: 'var(--text-secondary)' }}>{summary}</p>
          )}
          {actionRequired && (
            <p style={{ margin: '6px 0 0', fontSize: 12, color: 'var(--text-muted)' }}>
              Action: {actionRequired}
            </p>
          )}
        </div>
        <button
          type='button'
          aria-label='Dismiss feature announcement'
          onClick={onDismiss}
          style={{
            border: 'none',
            background: 'transparent',
            color: 'var(--text-muted)',
            cursor: 'pointer',
            padding: 0,
            display: 'grid',
            placeItems: 'center',
          }}
        >
          <X size={14} />
        </button>
      </div>
    </section>
  )
}
