import { fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it, vi } from 'vitest'
import { MembershipUpgradeCard } from '../../../src/components/premium/MembershipUpgradeCard'
import { PremiumPaywall } from '../../../src/components/premium/PremiumPaywall'

describe('premium components', () => {
  it('hides the upgrade card for non-free plans and renders it for free users', () => {
    const { rerender } = render(
      <MemoryRouter>
        <MembershipUpgradeCard currentPlan='creator_pro' articleTitle='Scaling fintech' />
      </MemoryRouter>,
    )

    expect(screen.queryByText(/want to read more/i)).not.toBeInTheDocument()

    rerender(
      <MemoryRouter>
        <MembershipUpgradeCard currentPlan='free' articleTitle='Scaling fintech' />
      </MemoryRouter>,
    )

    expect(screen.getByText(/want to read more like scaling fintech/i)).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /upgrade/i })).toHaveAttribute('href', '/membership')
  })

  it('renders teaser controls, toggles content, and fires upgrade callbacks', () => {
    const upgradeSpy = vi.fn()
    const preview = 'This is a premium article preview that should be truncated for readers without access.'

    render(
      <MemoryRouter>
        <PremiumPaywall
          articleTitle='Market structure'
          articleSlug='market-structure'
          teaserWords={20}
          contentPreview={preview}
          onUpgradeClick={upgradeSpy}
        />
      </MemoryRouter>,
    )

    expect(screen.getByRole('heading', { name: /premium article/i })).toBeInTheDocument()
    expect(screen.getByText(/this is a premium ar/i)).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /upgrade now/i })).toHaveAttribute('href', '/membership')
    expect(screen.getByRole('link', { name: /see plans/i })).toHaveAttribute('href', '/articles/market-structure')

    fireEvent.click(screen.getByRole('button', { name: /show more/i }))
    expect(screen.getByText(preview)).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: /show less/i }))
    fireEvent.click(screen.getByRole('link', { name: /upgrade now/i }))
    expect(upgradeSpy).toHaveBeenCalledTimes(1)
  })
})
