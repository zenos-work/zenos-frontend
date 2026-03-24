import type { ArticleList, ArticleDetail, PaginatedResponse, Tag, User } from '../../src/types'

export function makeTag(overrides: Partial<Tag> = {}): Tag {
  return {
    id: 'tag-1',
    name: 'Fintech',
    slug: 'fintech',
    article_count: 3,
    ...overrides,
  }
}

export function makeUser(overrides: Partial<User> = {}): User {
  return {
    id: 'user-1',
    name: 'Alex Writer',
    role: 'AUTHOR',
    created_at: '2026-03-20T00:00:00Z',
    email: 'alex@zenos.work',
    ...overrides,
  }
}

export function makeArticle(overrides: Partial<ArticleList> = {}): ArticleList {
  return {
    id: 'article-1',
    title: 'Alpha Article',
    slug: 'alpha-article',
    status: 'PUBLISHED',
    author_id: 'user-1',
    author_name: 'Alex Writer',
    subtitle: 'Alpha subtitle',
    content_type: 'article',
    read_time_minutes: 5,
    views_count: 10,
    likes_count: 2,
    comments_count: 1,
    is_featured: 0,
    created_at: '2026-03-20T00:00:00Z',
    updated_at: '2026-03-20T00:00:00Z',
    published_at: '2026-03-20T00:00:00Z',
    tags: [makeTag()],
    ...overrides,
  }
}

export function makeArticleDetail(overrides: Partial<ArticleDetail> = {}): ArticleDetail {
  const article = makeArticle(overrides)
  return {
    ...article,
    content: 'Article body',
    updated_at: article.updated_at ?? article.created_at,
    ...overrides,
  }
}

export function makePaginatedResponse<T>(items: T[], overrides: Partial<PaginatedResponse<T>> = {}): PaginatedResponse<T> {
  return {
    items,
    page: 1,
    limit: items.length || 20,
    has_more: false,
    total: items.length,
    ...overrides,
  }
}
