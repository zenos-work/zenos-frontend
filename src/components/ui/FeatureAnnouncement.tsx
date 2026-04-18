type Props = {
  title: string
  message: string
  scope?: string
  channels?: string[]
}

export default function FeatureAnnouncement({ title, message, scope, channels = [] }: Props) {
  return (
    <article
      style={{
        border: '1px solid var(--border)',
        borderRadius: 12,
        backgroundColor: 'var(--surface-5)',
        padding: 14,
      }}
    >
      <h3 style={{ margin: 0, fontSize: 15, color: 'var(--text-primary)' }}>{title}</h3>
      <p style={{ margin: '6px 0 0', fontSize: 13, color: 'var(--text-secondary)' }}>{message}</p>
      {(scope || channels.length > 0) && (
        <p style={{ margin: '8px 0 0', fontSize: 12, color: 'var(--text-muted)' }}>
          {scope ? `Scope: ${scope}. ` : ''}
          {channels.length > 0 ? `Channels: ${channels.join(', ')}` : ''}
        </p>
      )}
    </article>
  )
}
