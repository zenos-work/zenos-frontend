import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it, vi } from 'vitest'
import ArticleCard from '../../../src/components/article/ArticleCard'
import { makeArticle, makeTag } from '../../utils/fixtures'

vi.mock('../../../src/components/ui/Avatar', () => ({
  default: ({ name }: { name: string }) => <div data-testid='avatar'>{name}</div>,
}))

vi.mock('../../../src/components/ui/TagChip', () => ({
  default: ({ tag }: { tag: { name: string } }) => <div data-testid='tag-chip'>{tag.name}</div>,
}))

vi.mock('../../../src/components/ui/Badge', () => ({
  default: ({ children }: { children: React.ReactNode }) => <div data-testid='badge'>{children}</div>,
}))

describe('ArticleCard', () => {
  it('renders article metadata, tags, and status badge', () => {
    const article = makeArticle({
      title: 'Testing Article Card',
      subtitle: 'Useful subtitle',
      author_name: 'Alex Writer',
      status: 'PUBLISHED',
      cover_image_url: '/uploads/cover.png',
      tags: [makeTag({ id: 't1', name: 'AI' }), makeTag({ id: 't2', name: 'Cloud' })],
    })

    const { container } = render(
      <MemoryRouter>
        <ArticleCard article={article} showStatus />
      </MemoryRouter>,
    )

    expect(screen.getByText('Testing Article Card')).toBeInTheDocument()
    expect(screen.getByText('Useful subtitle')).toBeInTheDocument()
    expect(screen.getByTestId('avatar')).toHaveTextContent('Alex Writer')
    expect(screen.getByTestId('badge')).toHaveTextContent('PUBLISHED')
    expect(screen.getAllByTestId('tag-chip')).toHaveLength(2)
    expect(screen.getByRole('link', { name: 'Testing Article Card' })).toHaveAttribute('href', '/article/alpha-article')
    expect(container.querySelector('img')).toHaveAttribute('src', 'http://localhost:8787/uploads/cover.png')
    expect(screen.getByText(/5m/)).toBeInTheDocument()
    expect(screen.getByText(/10/)).toBeInTheDocument()
  })

  it('omits optional sections when subtitle, image, and tags are absent', () => {
    const article = makeArticle({
      title: 'Minimal Article',
      subtitle: undefined,
      cover_image_url: undefined,
      tags: [],
      published_at: undefined,
    })

    const { container } = render(
      <MemoryRouter>
        <ArticleCard article={article} />
      </MemoryRouter>,
    )

    expect(screen.getByText('Minimal Article')).toBeInTheDocument()
    expect(screen.queryByTestId('badge')).not.toBeInTheDocument()
    expect(container.querySelector('img')).toBeNull()
    expect(screen.queryByTestId('tag-chip')).not.toBeInTheDocument()
  })
})
