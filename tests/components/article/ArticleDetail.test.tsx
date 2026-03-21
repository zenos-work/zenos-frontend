import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import ArticleDetail from '../../../src/components/article/ArticleDetail'

const useEditorMock = vi.fn()

vi.mock('@tiptap/react', () => ({
  useEditor: (...args: unknown[]) => useEditorMock(...args),
  EditorContent: ({ editor }: { editor: unknown }) => <div data-testid='editor-content'>{editor ? 'ready' : 'empty'}</div>,
}))

describe('ArticleDetail', () => {
  it('parses JSON content when valid', () => {
    useEditorMock.mockReturnValue({})

    render(<ArticleDetail content='{"type":"doc","content":[]}' />)

    expect(screen.getByTestId('editor-content')).toHaveTextContent('ready')
    expect(useEditorMock).toHaveBeenCalled()
  })

  it('falls back to raw string content when JSON parsing fails', () => {
    useEditorMock.mockReturnValue({})

    render(<ArticleDetail content='plain-text-content' />)

    expect(screen.getByTestId('editor-content')).toHaveTextContent('ready')
    expect(useEditorMock).toHaveBeenCalled()
  })
})
