import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import ArticleMeta from '../../../src/components/article/ArticleMeta'
import { makeArticleDetail } from '../../utils/fixtures'

describe('ArticleMeta', () => {
  it('renders read-time and interaction metrics with formatted counts', () => {
    const article = makeArticleDetail({
      read_time_minutes: 8,
      views_count: 15320,
      likes_count: 2200,
      comments_count: 17,
      published_at: '2026-01-15T12:00:00Z',
    })

    render(<ArticleMeta article={article} />)

    expect(screen.getByText('8 min read')).toBeInTheDocument()
    expect(screen.getByText('15,320 views')).toBeInTheDocument()
    expect(screen.getByText('2,200 likes')).toBeInTheDocument()
    expect(screen.getByText('17 comments')).toBeInTheDocument()
    expect(screen.getByText('January 15, 2026')).toBeInTheDocument()
  })

  it('omits published date when it is not available', () => {
    const article = makeArticleDetail({ published_at: undefined })

    render(<ArticleMeta article={article} />)

    expect(screen.queryByText(/\d{4}/)).not.toBeInTheDocument()
  })
})
