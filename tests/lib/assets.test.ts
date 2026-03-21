import { describe, expect, it, vi } from 'vitest'

// We import lazily per test so we can swap env values by stubbing import.meta.
async function importResolver() {
  return import('../../src/lib/assets')
}

describe('resolveAssetUrl', () => {
  it('returns undefined for null/empty values', async () => {
    const { resolveAssetUrl } = await importResolver()
    expect(resolveAssetUrl(undefined)).toBeUndefined()
    expect(resolveAssetUrl(null)).toBeUndefined()
    expect(resolveAssetUrl('   ')).toBeUndefined()
  })

  it('keeps absolute URLs unchanged', async () => {
    const { resolveAssetUrl } = await importResolver()
    expect(resolveAssetUrl('https://cdn.example.com/a.png')).toBe('https://cdn.example.com/a.png')
    expect(resolveAssetUrl('data:image/png;base64,abc')).toBe('data:image/png;base64,abc')
    expect(resolveAssetUrl('blob:https://local/123')).toBe('blob:https://local/123')
  })

  it('resolves relative URL against API base URL when configured', async () => {
    vi.stubEnv('VITE_API_BASE_URL', 'https://api.zenos.work')
    const { resolveAssetUrl } = await importResolver()
    expect(resolveAssetUrl('/api/media/public/uploads/a.png')).toBe(
      'https://api.zenos.work/api/media/public/uploads/a.png'
    )
    vi.unstubAllEnvs()
  })

  it('returns original relative URL if API base URL is not configured', async () => {
    vi.stubEnv('VITE_API_BASE_URL', '')
    const { resolveAssetUrl } = await importResolver()
    expect(resolveAssetUrl('/api/media/public/uploads/a.png')).toBe('/api/media/public/uploads/a.png')
    vi.unstubAllEnvs()
  })
})
