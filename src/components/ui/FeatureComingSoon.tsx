type Props = {
  name: string
  description?: string
}

export default function FeatureComingSoon({ name, description }: Props) {
  return (
    <section
      style={{
        borderRadius: 12,
        border: '1px dashed var(--border)',
        backgroundColor: 'var(--surface-4)',
        padding: '20px 18px',
      }}
    >
      <h2 style={{ margin: 0, color: 'var(--text-primary)', fontSize: 18 }}>{name} is coming soon</h2>
      <p style={{ margin: '8px 0 0', color: 'var(--text-secondary)', fontSize: 14 }}>
        {description ?? 'This capability is currently behind a feature flag and will appear here when enabled.'}
      </p>
    </section>
  )
}
