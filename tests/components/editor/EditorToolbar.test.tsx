import { fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it, vi } from 'vitest'
import EditorToolbar from '../../../src/components/editor/EditorToolbar'

describe('EditorToolbar', () => {
  it('renders saved state and disables save when form is clean', () => {
    render(
      <MemoryRouter>
        <EditorToolbar
          onSave={vi.fn()}
          onSubmit={vi.fn()}
          onTogglePreview={vi.fn()}
          isSaving={false}
          isDirty={false}
          previewMode={false}
        />
      </MemoryRouter>,
    )

    expect(screen.getByText(/Saved/)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Save draft' })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Preview' })).toBeInTheDocument()
    expect(screen.getByRole('link')).toHaveAttribute('href', '/library')
  })

  it('fires action handlers when toolbar buttons are clicked', () => {
    const onSave = vi.fn()
    const onSubmit = vi.fn()
    const onTogglePreview = vi.fn()

    render(
      <MemoryRouter>
        <EditorToolbar
          onSave={onSave}
          onSubmit={onSubmit}
          onTogglePreview={onTogglePreview}
          isSaving={false}
          isDirty
          previewMode
        />
      </MemoryRouter>,
    )

    expect(screen.getByText(/Unsaved changes/)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Hide preview' })).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Save draft' }))
    fireEvent.click(screen.getByRole('button', { name: 'Submit for review' }))
    fireEvent.click(screen.getByRole('button', { name: 'Hide preview' }))

    expect(onSave).toHaveBeenCalledTimes(1)
    expect(onSubmit).toHaveBeenCalledTimes(1)
    expect(onTogglePreview).toHaveBeenCalledTimes(1)
  })
})
