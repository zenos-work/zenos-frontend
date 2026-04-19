import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it } from 'vitest'
import MembershipPage from '../../src/pages/MembershipPage'

describe('MembershipPage', () => {
  it('renders all three plan names', () => {
    render(
      <MemoryRouter>
        <MembershipPage />
      </MemoryRouter>,
    )
    expect(screen.getByText('Starter')).toBeInTheDocument()
    expect(screen.getByText('Creator Pro')).toBeInTheDocument()
    expect(screen.getByText('Team Suite')).toBeInTheDocument()
  })

  it('shows free pricing for Starter plan', () => {
    render(
      <MemoryRouter>
        <MembershipPage />
      </MemoryRouter>,
    )
    expect(screen.getAllByText('Free').length).toBeGreaterThan(0)
  })

  it('shows launch offer note for Creator Pro', () => {
    render(
      <MemoryRouter>
        <MembershipPage />
      </MemoryRouter>,
    )
    expect(screen.getAllByText(/launch offer/i).length).toBeGreaterThan(0)
    expect(screen.getAllByText(/1,000 active users/i).length).toBeGreaterThan(0)
  })

  it('shows Custom price for Team Suite', () => {
    render(
      <MemoryRouter>
        <MembershipPage />
      </MemoryRouter>,
    )
    expect(screen.getByText('Custom')).toBeInTheDocument()
  })

  it('renders CTA section with Start now link', () => {
    render(
      <MemoryRouter>
        <MembershipPage />
      </MemoryRouter>,
    )
    expect(screen.getByText(/ready to publish with confidence/i)).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /start now/i })).toHaveAttribute('href', '/login')
    expect(screen.getByRole('link', { name: /back to landing/i })).toHaveAttribute('href', '/')
  })

  it('renders plan features', () => {
    render(
      <MemoryRouter>
        <MembershipPage />
      </MemoryRouter>,
    )
    expect(screen.getByText(/rich editor/i)).toBeInTheDocument()
    expect(screen.getByText(/approval workflows/i)).toBeInTheDocument()
    expect(screen.getByText(/role-based governance/i)).toBeInTheDocument()
  })
})
