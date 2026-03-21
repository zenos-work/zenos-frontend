import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it } from 'vitest'
import TagChip from '../../../src/components/ui/TagChip'

describe('TagChip', () => {
  it('renders link with small size classes by default', () => {
    render(
      <MemoryRouter>
        <TagChip tag={{ id: 't1', name: 'Fintech', slug: 'fintech', article_count: 1 }} />
      </MemoryRouter>,
    )

    const link = screen.getByRole('link', { name: 'Fintech' })
    expect(link).toHaveAttribute('href', '/tag/fintech')
    expect(link.className).toContain('text-xs')
  })

  it('applies medium size classes when requested', () => {
    render(
      <MemoryRouter>
        <TagChip size='md' tag={{ id: 't2', name: 'Cloud', slug: 'cloud', article_count: 2 }} />
      </MemoryRouter>,
    )

    expect(screen.getByRole('link', { name: 'Cloud' }).className).toContain('text-sm')
  })
})
