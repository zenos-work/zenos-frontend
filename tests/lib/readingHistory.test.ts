import { beforeEach, describe, expect, it } from 'vitest'
import {
  clearReadingHistory,
  getReadingHistory,
  removeReadingHistoryItem,
  setReadingHistory,
  toReadingHistoryItem,
  upsertReadingHistoryItem,
} from '../../src/lib/readingHistory'
import { makeArticle, makeArticleDetail } from '../utils/fixtures'

describe('readingHistory utilities', () => {
  beforeEach(() => {
    const storage: Record<string, string> = {}
    Object.defineProperty(window, 'localStorage', {
      configurable: true,
      value: {
        getItem: (key: string) => storage[key] ?? null,
        setItem: (key: string, value: string) => {
          storage[key] = value
        },
        removeItem: (key: string) => {
          delete storage[key]
        },
      },
    })
  })

  it('reads, validates, clamps, and sorts stored history', () => {
    window.localStorage.setItem(
      'zenos:reading-history',
      JSON.stringify([
        {
          id: 'old',
          slug: 'old-story',
          title: 'Old Story',
          progress: 144,
          read_time_minutes: 5,
          last_read_at: '2026-01-01T00:00:00Z',
        },
        {
          id: 'new',
          slug: 'new-story',
          title: 'New Story',
          progress: -10,
          read_time_minutes: 8,
          last_read_at: '2026-02-01T00:00:00Z',
        },
        { invalid: true },
      ]),
    )

    expect(getReadingHistory()).toEqual([
      expect.objectContaining({ id: 'new', progress: 0 }),
      expect.objectContaining({ id: 'old', progress: 100 }),
    ])
  })

  it('stores only the most recent 75 items', () => {
    const items = Array.from({ length: 80 }, (_, index) => ({
      id: `id-${index}`,
      slug: `slug-${index}`,
      title: `Title ${index}`,
      progress: index,
      read_time_minutes: 3,
      last_read_at: `2026-02-${String((index % 28) + 1).padStart(2, '0')}T00:00:00Z`,
    }))

    setReadingHistory(items)

    expect(JSON.parse(window.localStorage.getItem('zenos:reading-history') as string)).toHaveLength(75)
  })

  it('upserts, removes, clears, and converts history items', () => {
    const first = toReadingHistoryItem(makeArticle({ id: 'article-1', slug: 'first' }), 22)
    const second = toReadingHistoryItem(
      makeArticleDetail({ id: 'article-2', slug: 'second', subtitle: 'Second subtitle' }),
      101,
    )

    upsertReadingHistoryItem(first)
    upsertReadingHistoryItem(second)
    upsertReadingHistoryItem({ ...first, title: 'First updated', progress: 48 })

    expect(getReadingHistory()).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ id: 'article-1', title: 'First updated', progress: 48 }),
        expect.objectContaining({ id: 'article-2', progress: 100, subtitle: 'Second subtitle' }),
      ]),
    )

    removeReadingHistoryItem('article-2')
    expect(getReadingHistory()).toEqual([
      expect.objectContaining({ id: 'article-1' }),
    ])

    clearReadingHistory()
    expect(window.localStorage.getItem('zenos:reading-history')).toBeNull()
  })
})
