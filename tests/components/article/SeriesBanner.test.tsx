import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it } from 'vitest'
import SeriesBanner from '../../../src/components/article/SeriesBanner'

function renderBanner(props: Partial<React.ComponentProps<typeof SeriesBanner>> = {}) {
  render(
    <MemoryRouter>
      <SeriesBanner
        seriesId="series-1"
        seriesName="Finance 101"
        part={2}
        total={5}
        {...props}
      />
    </MemoryRouter>,
  )
}

describe('SeriesBanner', () => {
  it('renders part/total badge', () => {
    renderBanner()
    expect(screen.getByText('2/5')).toBeInTheDocument()
  })

  it('renders "Series" label', () => {
    renderBanner()
    expect(screen.getByText('Series')).toBeInTheDocument()
  })

  it('renders series name as a link', () => {
    renderBanner()
    const link = screen.getByRole('link', { name: 'Finance 101' })
    expect(link).toBeInTheDocument()
    expect(link).toHaveAttribute('href', '/series/series-1')
  })

  it('renders part/total badge for different values', () => {
    renderBanner({ part: 3, total: 4 })
    expect(screen.getByText('3/4')).toBeInTheDocument()
  })

  it('links to correct series URL', () => {
    renderBanner({ seriesId: 'abc-123' })
    expect(screen.getByRole('link', { name: 'Finance 101' })).toHaveAttribute('href', '/series/abc-123')
  })
})
