import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import Editor from '../../../src/components/editor/Editor'

const setImageRunMock = vi.fn()
const toggleCodeBlockRunMock = vi.fn()
const setLinkRunMock = vi.fn()
const unsetLinkRunMock = vi.fn()

let fakeEditor: {
  state: {
    selection: { from: number; to: number }
    doc: { textBetween: (from: number, to: number, separator: string) => string }
  }
  view: { coordsAtPos: (pos: number) => { top: number } }
  on: (event: string, cb: () => void) => void
  off: (event: string, cb: () => void) => void
  getJSON: () => unknown
  getAttributes: (name: string) => Record<string, string>
  chain: () => {
    focus: () => ReturnType<typeof fakeEditor.chain>
    setImage: (attrs: Record<string, string>) => ReturnType<typeof fakeEditor.chain>
    toggleCodeBlock: () => ReturnType<typeof fakeEditor.chain>
    setLink: (attrs: Record<string, string>) => ReturnType<typeof fakeEditor.chain>
    unsetLink: () => ReturnType<typeof fakeEditor.chain>
    run: () => boolean
  }
  commands: {
    setContent: (value: unknown) => void
  }
}

const useEditorMock = vi.fn()

vi.mock('@tiptap/react', () => ({
  useEditor: (config: unknown) => useEditorMock(config),
  EditorContent: () => <div data-testid='editor-content' />,
}))

describe('Editor', () => {
  beforeEach(() => {
    vi.clearAllMocks()

    const chainApi = {
      focus: () => chainApi,
      setImage: () => chainApi,
      toggleCodeBlock: () => chainApi,
      setLink: () => chainApi,
      unsetLink: () => chainApi,
      run: () => true,
    }

    vi.spyOn(chainApi, 'setImage').mockImplementation(attrs => {
      setImageRunMock(attrs)
      return chainApi
    })
    vi.spyOn(chainApi, 'toggleCodeBlock').mockImplementation(() => {
      toggleCodeBlockRunMock()
      return chainApi
    })
    vi.spyOn(chainApi, 'setLink').mockImplementation(attrs => {
      setLinkRunMock(attrs)
      return chainApi
    })
    vi.spyOn(chainApi, 'unsetLink').mockImplementation(() => {
      unsetLinkRunMock()
      return chainApi
    })

    fakeEditor = {
      state: {
        selection: { from: 1, to: 2 },
        doc: { textBetween: () => 'selection text' },
      },
      view: { coordsAtPos: () => ({ top: 150 }) },
      on: (_event, cb) => cb(),
      off: vi.fn(),
      getJSON: () => ({ type: 'doc', content: [] }),
      getAttributes: () => ({ fontSize: '16px' }),
      chain: () => chainApi,
      commands: {
        setContent: vi.fn(),
      },
    }

    useEditorMock.mockReturnValue(fakeEditor)
  })

  it('uploads inline image and inserts it into the editor', async () => {
    const uploadImage = vi.fn().mockResolvedValue('https://cdn.test/image.png')

    const { container } = render(
      <Editor content='' onChange={vi.fn()} onInlineImageUpload={uploadImage} />,
    )

    const input = container.querySelector('input[accept="image/*"]') as HTMLInputElement | null
    expect(input).not.toBeNull()

    const file = new File(['img'], 'photo.png', { type: 'image/png' })
    fireEvent.change(input!, { target: { files: [file] } })

    await waitFor(() => {
      expect(uploadImage).toHaveBeenCalledWith(file)
    })

    expect(setImageRunMock).toHaveBeenCalledWith({
      src: 'https://cdn.test/image.png',
      alt: 'photo.png',
    })
  })

  it('opens insert menu and inserts a code block', () => {
    render(<Editor content='' onChange={vi.fn()} />)

    fireEvent.click(screen.getByTitle('Insert block'))
    fireEvent.click(screen.getByTitle('Code block'))

    expect(toggleCodeBlockRunMock).toHaveBeenCalledTimes(1)
  })

  it('applies and removes links from selected text', () => {
    const promptSpy = vi.spyOn(window, 'prompt')
    promptSpy.mockReturnValueOnce('https://example.com')
    promptSpy.mockReturnValueOnce('')

    render(<Editor content='' onChange={vi.fn()} />)

    fireEvent.click(screen.getByTitle('Insert block'))
    fireEvent.click(screen.getByTitle('Code block'))

    const linkButtons = screen.getAllByRole('button')
    fireEvent.click(linkButtons[3])
    fireEvent.click(linkButtons[3])

    expect(setLinkRunMock).toHaveBeenCalledWith({ href: 'https://example.com' })
    expect(unsetLinkRunMock).toHaveBeenCalledTimes(1)
  })
})
