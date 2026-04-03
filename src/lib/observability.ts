type ObservabilityLevel = 'info' | 'warn' | 'error'

type ObservabilityPayload = {
  event: string
  level: ObservabilityLevel
  timestamp: string
  path?: string
  meta?: Record<string, unknown>
}

const ENDPOINT = (import.meta.env.VITE_OBSERVABILITY_ENDPOINT || '').trim()

function nowIso(): string {
  return new Date().toISOString()
}

function safePathname(): string | undefined {
  if (typeof window === 'undefined') return undefined
  return `${window.location.pathname}${window.location.search}`
}

async function postObservability(payload: ObservabilityPayload): Promise<void> {
  if (!ENDPOINT) return

  try {
    const body = JSON.stringify(payload)

    // Prefer sendBeacon for unload-safe telemetry and fallback to fetch.
    if (typeof navigator !== 'undefined' && typeof navigator.sendBeacon === 'function') {
      const blob = new Blob([body], { type: 'application/json' })
      const queued = navigator.sendBeacon(ENDPOINT, blob)
      if (queued) return
    }

    await fetch(ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body,
      keepalive: true,
    })
  } catch {
    // Never throw from telemetry transport.
  }
}

export async function trackEvent(event: string, meta?: Record<string, unknown>): Promise<void> {
  await postObservability({
    event,
    level: 'info',
    timestamp: nowIso(),
    path: safePathname(),
    meta,
  })
}

export async function reportError(error: unknown, meta?: Record<string, unknown>): Promise<void> {
  const err = error instanceof Error
    ? { name: error.name, message: error.message, stack: error.stack }
    : { message: String(error) }

  await postObservability({
    event: 'runtime_error',
    level: 'error',
    timestamp: nowIso(),
    path: safePathname(),
    meta: {
      ...meta,
      error: err,
    },
  })
}

export function initObservability(): void {
  if (typeof window === 'undefined') return

  window.addEventListener('error', (evt) => {
    void reportError(evt.error ?? evt.message, {
      source: 'window.error',
      filename: evt.filename,
      lineno: evt.lineno,
      colno: evt.colno,
    })
  })

  window.addEventListener('unhandledrejection', (evt) => {
    void reportError(evt.reason, { source: 'window.unhandledrejection' })
  })
}
