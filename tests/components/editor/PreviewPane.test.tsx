import { render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import PreviewPane from '../../../src/components/editor/PreviewPane'

const setContentMock = vi.fn()

vi.mock('@tiptap/react', () => ({
  useEditor: () => ({
    commands: {
      setContent: setContentMock,
    },
  }),
  EditorContent: () => <div data-testid='preview-editor-content' />,
}))

describe('PreviewPane', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders title and applies parsed JSON content', () => {
    render(
      <PreviewPane
        title='Draft Title'
        content='{"type":"doc","content":[{"type":"paragraph","content":[{"type":"text","text":"Hello"}]}]}'
      />,
    )

    expect(screen.getByText('Preview')).toBeInTheDocument()
    expect(screen.getByText('Draft Title')).toBeInTheDocument()
    expect(screen.getByTestId('preview-editor-content')).toBeInTheDocument()
    expect(setContentMock).toHaveBeenCalledWith({
      type: 'doc',
      content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Hello' }] }],
    })
  })

  it('falls back to raw content when JSON parsing fails', () => {
    render(<PreviewPane title='' content='plain text body' />)

    expect(setContentMock).toHaveBeenCalledWith('plain text body')
    expect(screen.queryByRole('heading')).not.toBeInTheDocument()
  })
})
