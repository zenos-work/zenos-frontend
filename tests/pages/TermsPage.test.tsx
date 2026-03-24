import { render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import TermsPage from '../../src/pages/TermsPage'

describe('TermsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders the agreement and read-only acceptance note', () => {
    render(<TermsPage />)

    expect(screen.getByText('Writer Content Agreement')).toBeInTheDocument()
    expect(screen.getByText(/no explicit accept or decline action is required/i)).toBeInTheDocument()
  })

  it('replaces monetary thresholds with yet-to-be-announced copy', () => {
    render(<TermsPage />)

    expect(screen.getAllByText(/yet to be announced/i).length).toBeGreaterThan(0)
    expect(screen.queryByText(/usd \$100/i)).not.toBeInTheDocument()
  })
})
