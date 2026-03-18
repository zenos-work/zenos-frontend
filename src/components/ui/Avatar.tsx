import { resolveAssetUrl } from '../../lib/assets'

interface Props { name: string; src?: string | null; size?: 'sm' | 'md' | 'lg' }

const DIM = { sm: 28, md: 36, lg: 48 }
const FONT = { sm: 11, md: 13, lg: 16 }

export default function Avatar({ name, src, size = 'md' }: Props) {
  const d = DIM[size]
  const f = FONT[size]
  const initials = name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
  const imageSrc = resolveAssetUrl(src)
  const shared: React.CSSProperties = {
    width: d, height: d, borderRadius: '50%', flexShrink: 0,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
  }
  if (imageSrc) {
    return <img src={imageSrc} alt={name} style={{ ...shared, objectFit: 'cover' }} />
  }
  return (
    <div style={{ ...shared, backgroundColor: 'var(--accent)', color: '#fff', fontSize: f, fontWeight: 600 }}>
      {initials}
    </div>
  )
}
