import { beforeEach, describe, expect, it, vi } from 'vitest'
import { exportArticle } from '../../src/lib/articleExport'
import { makeArticleDetail } from '../utils/fixtures'

let pdfDoc: {
  internal: { pageSize: { getWidth: () => number; getHeight: () => number } }
  setFont: ReturnType<typeof vi.fn>
  setFontSize: ReturnType<typeof vi.fn>
  splitTextToSize: ReturnType<typeof vi.fn>
  addPage: ReturnType<typeof vi.fn>
  text: ReturnType<typeof vi.fn>
  getNumberOfPages: ReturnType<typeof vi.fn>
  setPage: ReturnType<typeof vi.fn>
  setTextColor: ReturnType<typeof vi.fn>
  getTextWidth: ReturnType<typeof vi.fn>
  textWithLink: ReturnType<typeof vi.fn>
  save: ReturnType<typeof vi.fn>
}

vi.mock('jspdf', () => ({
  jsPDF: vi.fn(function MockJsPDF() {
    return pdfDoc
  }),
}))

describe('articleExport', () => {
  beforeEach(() => {
    pdfDoc = {
      internal: { pageSize: { getWidth: () => 595, getHeight: () => 90 } },
      setFont: vi.fn(),
      setFontSize: vi.fn(),
      splitTextToSize: vi.fn(() => ['line one', 'line two']),
      addPage: vi.fn(),
      text: vi.fn(),
      getNumberOfPages: vi.fn(() => 1),
      setPage: vi.fn(),
      setTextColor: vi.fn(),
      getTextWidth: vi.fn((value: string) => value.length * 5),
      textWithLink: vi.fn(),
      save: vi.fn(),
    }

    vi.restoreAllMocks()
  })

  it('exports PDF content with sanitized file names and watermark links', async () => {
    const article = makeArticleDetail({
      title: 'Fintech & Growth 2026!',
      content: 'Plain text body',
      citations: ['https://example.com/source'],
    })

    await exportArticle('pdf', article)

    expect(pdfDoc.splitTextToSize).toHaveBeenCalledWith(expect.stringContaining('Fintech & Growth 2026!'), 499)
    expect(pdfDoc.addPage).toHaveBeenCalled()
    expect(pdfDoc.textWithLink).toHaveBeenCalledWith('Zenos.work', expect.any(Number), 70, {
      url: 'https://zenos.work',
    })
    expect(pdfDoc.save).toHaveBeenCalledWith('fintech-growth-2026.pdf')
  })

  it('exports Word documents from structured content', async () => {
    let capturedBlob: Blob | undefined
    const createObjectURLSpy = vi.spyOn(URL, 'createObjectURL').mockImplementation((blob) => {
      capturedBlob = blob as Blob
      return 'blob:word'
    })
    const revokeObjectURLSpy = vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {})
    const clickSpy = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {})

    const article = makeArticleDetail({
      title: 'Structured Story',
      subtitle: 'Story subtitle',
      citations: ['https://example.com/citation'],
      content: JSON.stringify({
        type: 'doc',
        content: [
          { type: 'heading', attrs: { level: 2 }, content: [{ type: 'text', text: 'Heading text' }] },
          {
            type: 'paragraph',
            content: [
              { type: 'text', text: 'bold', marks: [{ type: 'bold' }] },
              { type: 'text', text: ' and ' },
              { type: 'text', text: 'linked', marks: [{ type: 'link', attrs: { href: 'https://example.com' } }] },
            ],
          },
          { type: 'bulletList', content: [{ type: 'listItem', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Bullet item' }] }] }] },
          { type: 'orderedList', content: [{ type: 'listItem', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'First item' }] }] }] },
          { type: 'blockquote', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Quote line' }] }] },
          { type: 'codeBlock', content: [{ type: 'text', text: 'const answer = 42;' }] },
          { type: 'image', attrs: { src: 'https://example.com/image.png', alt: 'Example image' } },
        ],
      }),
    })

    await exportArticle('word', article)

    expect(createObjectURLSpy).toHaveBeenCalledTimes(1)
    expect(clickSpy).toHaveBeenCalledTimes(1)
    expect(revokeObjectURLSpy).toHaveBeenCalledWith('blob:word')
    expect(capturedBlob).toBeDefined()
    await expect(capturedBlob?.text()).resolves.toContain('<h2>Heading text</h2>')
    await expect(capturedBlob?.text()).resolves.toContain('<strong>bold</strong>')
    await expect(capturedBlob?.text()).resolves.toContain('<a href="https://example.com">linked</a>')
    await expect(capturedBlob?.text()).resolves.toContain('powered by <a href="https://zenos.work">Zenos.work</a>')
  })

  it('exports Markdown with plain-text fallback content', async () => {
    let capturedBlob: Blob | undefined
    vi.spyOn(URL, 'createObjectURL').mockImplementation((blob) => {
      capturedBlob = blob as Blob
      return 'blob:markdown'
    })
    vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {})
    vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {})

    const article = makeArticleDetail({
      title: 'Markdown Story',
      subtitle: 'Fallback subtitle',
      content: 'Simple body without structured JSON.',
      citations: ['https://example.com/ref-a', 'https://example.com/ref-b'],
    })

    await exportArticle('markdown', article)

    await expect(capturedBlob?.text()).resolves.toContain('# Markdown Story')
    await expect(capturedBlob?.text()).resolves.toContain('Fallback subtitle')
    await expect(capturedBlob?.text()).resolves.toContain('## Citations')
    await expect(capturedBlob?.text()).resolves.toContain('powered by [Zenos.work](https://zenos.work)')
  })
})
