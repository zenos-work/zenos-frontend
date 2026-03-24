import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { describe, expect, it } from 'vitest'
import InfoPage from '../../src/pages/InfoPage'

function renderInfoPage(slug: string) {
  return render(
    <MemoryRouter initialEntries={[`/info/${slug}`]}>
      <Routes>
        <Route path='/info/:slug' element={<InfoPage />} />
      </Routes>
    </MemoryRouter>,
  )
}

describe('InfoPage', () => {
  it('renders platform status page', () => {
    renderInfoPage('status')
    expect(screen.getByText('Platform Status')).toBeInTheDocument()
    expect(screen.getByText(/current service health/i)).toBeInTheDocument()
  })

  it('renders about page content', () => {
    renderInfoPage('about')
    expect(screen.getByText('About Zenos')).toBeInTheDocument()
    expect(screen.getByText(/why we built/i)).toBeInTheDocument()
  })

  it('renders features page content', () => {
    renderInfoPage('features')
    expect(screen.getByText('Features')).toBeInTheDocument()
    expect(screen.getByText(/single place to understand/i)).toBeInTheDocument()
  })

  it('renders privacy page content', () => {
    renderInfoPage('privacy')
    expect(screen.getByText('Privacy')).toBeInTheDocument()
    expect(screen.getByText(/how we handle/i)).toBeInTheDocument()
  })

  it('renders community rules page', () => {
    renderInfoPage('rules')
    expect(screen.getByText('Community Rules')).toBeInTheDocument()
    expect(screen.getByText(/standards for respectful/i)).toBeInTheDocument()
  })

  it('renders help page', () => {
    renderInfoPage('help')
    expect(screen.getByText('Help')).toBeInTheDocument()
    expect(screen.getByText(/where to get support/i)).toBeInTheDocument()
  })

  it('renders terms page', () => {
    renderInfoPage('terms')
    expect(screen.getByText('Terms')).toBeInTheDocument()
    expect(screen.getByText(/high-level terms/i)).toBeInTheDocument()
  })

  it('renders text-to-speech page', () => {
    renderInfoPage('text-to-speech')
    expect(screen.getByText('Text to Speech')).toBeInTheDocument()
    expect(screen.getByText(/accessibility support/i)).toBeInTheDocument()
  })

  it('shows not-found state for unknown slug', () => {
    renderInfoPage('non-existent-slug')
    expect(screen.getByText(/information page not found/i)).toBeInTheDocument()
    expect(screen.getByText(/the requested information section is unavailable/i)).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /back to landing/i })).toHaveAttribute('href', '/')
  })

  it('renders back to landing link on known pages', () => {
    renderInfoPage('about')
    expect(screen.getByRole('link', { name: /back to landing/i })).toBeInTheDocument()
  })
})
