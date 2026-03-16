import { useEffect } from 'react'
import { CheckCircle, AlertCircle, Info, X } from 'lucide-react'
import { useUiStore } from '../../stores/uiStore'

const CONFIG = {
  success: { icon: CheckCircle, color: '#16a34a', bg: 'rgba(22,163,74,0.08)',  border: 'rgba(22,163,74,0.2)'  },
  error:   { icon: AlertCircle, color: '#dc2626', bg: 'rgba(220,38,38,0.08)',  border: 'rgba(220,38,38,0.2)'  },
  info:    { icon: Info,        color: 'var(--accent)', bg: 'var(--accent-dim)', border: 'rgba(166,124,60,0.2)' },
  warning: { icon: AlertCircle, color: '#d97706', bg: 'rgba(217,119,6,0.08)',  border: 'rgba(217,119,6,0.2)'  },
}

function ToastItem({ id, type, message }: { id: string; type: string; message: string }) {
  const remove = useUiStore(s => s.removeToast)
  const cfg = CONFIG[type as keyof typeof CONFIG] ?? CONFIG.info
  const Icon = cfg.icon

  useEffect(() => {
    const t = setTimeout(() => remove(id), 4000)
    return () => clearTimeout(t)
  }, [id, remove])

  return (
    <div style={{
      display: 'flex', alignItems: 'flex-start', gap: 12,
      padding: '12px 16px', borderRadius: 12,
      backgroundColor: cfg.bg, border: `1px solid ${cfg.border}`,
      boxShadow: 'var(--shadow)',
      fontFamily: "'DM Sans', system-ui, sans-serif",
      fontSize: 13,
    }}>
      <Icon size={15} style={{ color: cfg.color, flexShrink: 0, marginTop: 1 }} />
      <span style={{ flex: 1, color: 'var(--text-primary)' }}>{message}</span>
      <button onClick={() => remove(id)} style={{ color: 'var(--text-muted)', padding: 0, background: 'none', border: 'none', cursor: 'pointer', display: 'flex' }}>
        <X size={13} />
      </button>
    </div>
  )
}

export default function ToastContainer() {
  const toasts = useUiStore(s => s.toasts)
  return (
    <div style={{
      position: 'fixed', bottom: 20, right: 20, zIndex: 50,
      display: 'flex', flexDirection: 'column', gap: 8,
      maxWidth: 360, width: '100%',
    }}>
      {toasts.map(t => <ToastItem key={t.id} {...t} />)}
    </div>
  )
}
