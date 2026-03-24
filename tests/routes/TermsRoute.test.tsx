import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import TermsRoute from '../../src/routes/TermsRoute'

describe('TermsRoute', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders the outlet without redirecting', () => {
    render(
      <MemoryRouter initialEntries={['/write']}>
        <Routes>
          <Route element={<TermsRoute />}>
            <Route path='/write' element={<div>Write Page</div>} />
          </Route>
        </Routes>
      </MemoryRouter>,
    )

    expect(screen.getByText('Write Page')).toBeInTheDocument()
  })
})
