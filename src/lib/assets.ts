export function resolveAssetUrl(url?: string | null): string | undefined {
  if (!url) return undefined

  const value = url.trim()
  if (!value) return undefined

  // Already absolute (http/https/data/blob/etc.)
  if (/^[a-zA-Z][a-zA-Z\d+.-]*:/.test(value)) {
    return value
  }

  const apiBase = import.meta.env.VITE_API_BASE_URL
  if (!apiBase) return value

  try {
    return new URL(value, `${apiBase}/`).toString()
  } catch {
    return value
  }
}
