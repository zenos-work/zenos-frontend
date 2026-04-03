import type { ArticleDetail, ArticleList } from '../types'

export type ReadingHistoryItem = {
  id: string
  article_id?: string
  slug: string
  title: string
  subtitle?: string
  author_name?: string
  cover_image_url?: string
  read_time_minutes: number
  progress: number
  last_read_at: string
}

const STORAGE_KEY = 'zenos:reading-history'
const MAX_ITEMS = 75

function clampProgress(value: number | undefined): number {
  if (!Number.isFinite(value)) return 0
  return Math.min(100, Math.max(0, Math.round(value as number)))
}

function isHistoryItem(value: unknown): value is ReadingHistoryItem {
  if (!value || typeof value !== 'object') return false
  const candidate = value as Partial<ReadingHistoryItem>
  return Boolean(candidate.id && candidate.slug && candidate.title && candidate.last_read_at)
}

export function getReadingHistory(): ReadingHistoryItem[] {
  if (typeof window === 'undefined') return []

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as unknown
    if (!Array.isArray(parsed)) return []

    return parsed
      .filter(isHistoryItem)
      .map((item) => ({ ...item, progress: clampProgress(item.progress) }))
      .sort((a, b) => new Date(b.last_read_at).getTime() - new Date(a.last_read_at).getTime())
  } catch {
    return []
  }
}

export function setReadingHistory(items: ReadingHistoryItem[]) {
  if (typeof window === 'undefined') return
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items.slice(0, MAX_ITEMS)))
}

export function upsertReadingHistoryItem(item: ReadingHistoryItem) {
  const current = getReadingHistory()
  const next = [
    {
      ...item,
      progress: clampProgress(item.progress),
      last_read_at: item.last_read_at || new Date().toISOString(),
    },
    ...current.filter((entry) => entry.id !== item.id),
  ]
  setReadingHistory(next)
}

export function removeReadingHistoryItem(id: string) {
  const current = getReadingHistory()
  setReadingHistory(current.filter((entry) => entry.id !== id))
}

export function clearReadingHistory() {
  if (typeof window === 'undefined') return
  window.localStorage.removeItem(STORAGE_KEY)
}

export function toReadingHistoryItem(article: ArticleList | ArticleDetail, progress = 12): ReadingHistoryItem {
  return {
    id: article.id,
    slug: article.slug,
    title: article.title,
    subtitle: article.subtitle,
    author_name: article.author_name,
    cover_image_url: article.cover_image_url,
    read_time_minutes: article.read_time_minutes,
    progress: clampProgress(progress),
    last_read_at: new Date().toISOString(),
  }
}
