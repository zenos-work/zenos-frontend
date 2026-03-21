import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it, vi } from 'vitest'
import ArticleHero from '../../../src/components/article/ArticleHero'
import { resolveAssetUrl } from '../../../src/lib/assets'
import { makeArticle, makeTag } from '../../utils/fixtures'

vi.mock('../../../src/components/ui/Avatar', () => ({
  default: ({ name }: { name: string }) => <div data-testid='avatar'>{name}</div>,
}))

vi.mock('../../../src/components/ui/TagChip', () => ({
  default: ({ tag }: { tag: { name: string } }) => <div data-testid='tag-chip'>{tag.name}</div>,
}))

describe('ArticleHero', () => {
  it('renders cover image, top two tags, and metadata', () => {
    const article = makeArticle({
      title: 'Hero Story',
      slug: 'hero-story',
      cover_image_url: '/uploads/hero.jpg',
      author_name: 'Admin Writer',
      read_time_minutes: 7,
      tags: [
        makeTag({ id: 't1', name: 'AI' }),
        makeTag({ id: 't2', name: 'Cloud' }),
        makeTag({ id: 't3', name: 'Ignored' }),
      ],
    })

    const { container } = render(
      <MemoryRouter>
        <ArticleHero article={article} />
      </MemoryRouter>,
    )

    expect(screen.getByRole('link')).toHaveAttribute('href', '/article/hero-story')
    expect(screen.getByText('Hero Story')).toBeInTheDocument()
    expect(screen.getByTestId('avatar')).toHaveTextContent('Admin Writer')
    expect(screen.getAllByTestId('tag-chip')).toHaveLength(2)
    expect(screen.queryByText('Ignored')).not.toBeInTheDocument()
    expect(screen.getAllByText('Admin Writer').length).toBeGreaterThan(0)
    expect(screen.getByText('· 7m read')).toBeInTheDocument()
    expect(container.querySelector('img')).toHaveAttribute('src', resolveAssetUrl('/uploads/hero.jpg'))
  })

  it('handles missing cover image', () => {
    const article = makeArticle({ cover_image_url: undefined })

    const { container } = render(
      <MemoryRouter>
        <ArticleHero article={article} />
      </MemoryRouter>,
    )

    expect(container.querySelector('img')).toBeNull()
  })
})
