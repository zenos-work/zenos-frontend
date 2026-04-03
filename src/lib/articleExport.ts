import type { ArticleDetail } from '../types'
import { jsPDF } from 'jspdf'

export type ExportFormat = 'pdf' | 'word' | 'markdown'

const WATERMARK_PREFIX = 'powered by '
const WATERMARK_BRAND = 'Zenos.work'
const WATERMARK_URL = 'https://zenos.work'

type RichNode = {
  type?: string
  attrs?: Record<string, unknown>
  marks?: Array<{ type?: string; attrs?: Record<string, unknown> }>
  text?: string
  content?: RichNode[]
}

function sanitizeFileName(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '') || 'article'
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

function parseContent(content: string): RichNode | null {
  try {
    const parsed = JSON.parse(content) as RichNode
    if (parsed && typeof parsed === 'object') return parsed
  } catch {
    return null
  }
  return null
}

function markText(text: string, marks?: RichNode['marks']): string {
  if (!marks?.length) return text

  return marks.reduce((acc, mark) => {
    if (mark.type === 'bold') return `**${acc}**`
    if (mark.type === 'italic') return `*${acc}*`
    if (mark.type === 'code') return `\`${acc}\``
    if (mark.type === 'link') {
      const href = String(mark.attrs?.href || '').trim()
      return href ? `[${acc}](${href})` : acc
    }
    return acc
  }, text)
}

function childrenToMarkdown(node?: RichNode): string {
  return (node?.content || []).map(nodeToMarkdown).join('')
}

function nodeToMarkdown(node: RichNode): string {
  if (node.type === 'text') {
    return markText(node.text || '', node.marks)
  }

  if (node.type === 'hardBreak') return '\n'

  if (node.type === 'heading') {
    const level = Number(node.attrs?.level) || 2
    const hashes = '#'.repeat(Math.max(1, Math.min(6, level)))
    return `${hashes} ${childrenToMarkdown(node).trim()}\n\n`
  }

  if (node.type === 'paragraph') {
    return `${childrenToMarkdown(node).trim()}\n\n`
  }

  if (node.type === 'bulletList') {
    return `${(node.content || []).map((item) => `- ${childrenToMarkdown(item).trim()}\n`).join('')}\n`
  }

  if (node.type === 'orderedList') {
    return `${(node.content || []).map((item, index) => `${index + 1}. ${childrenToMarkdown(item).trim()}\n`).join('')}\n`
  }

  if (node.type === 'listItem') {
    return childrenToMarkdown(node)
  }

  if (node.type === 'blockquote') {
    const text = childrenToMarkdown(node).trim().split('\n').map((line) => `> ${line}`).join('\n')
    return `${text}\n\n`
  }

  if (node.type === 'codeBlock') {
    const code = childrenToMarkdown(node)
    return `\`\`\`\n${code}\n\`\`\`\n\n`
  }

  if (node.type === 'image') {
    const src = String(node.attrs?.src || '')
    const alt = String(node.attrs?.alt || 'image')
    return src ? `![${alt}](${src})\n\n` : ''
  }

  return childrenToMarkdown(node)
}

function childrenToText(node?: RichNode): string {
  return (node?.content || []).map(nodeToText).join('')
}

function nodeToText(node: RichNode): string {
  if (node.type === 'text') return node.text || ''
  if (node.type === 'hardBreak') return '\n'

  if (node.type === 'heading' || node.type === 'paragraph') {
    return `${childrenToText(node).trim()}\n\n`
  }

  if (node.type === 'bulletList') {
    return `${(node.content || []).map((item) => `- ${childrenToText(item).trim()}\n`).join('')}\n`
  }

  if (node.type === 'orderedList') {
    return `${(node.content || []).map((item, index) => `${index + 1}. ${childrenToText(item).trim()}\n`).join('')}\n`
  }

  if (node.type === 'blockquote') {
    return `${childrenToText(node).trim()}\n\n`
  }

  if (node.type === 'image') {
    const src = String(node.attrs?.src || '')
    return src ? `[Image: ${src}]\n\n` : ''
  }

  return childrenToText(node)
}

function childrenToHtml(node?: RichNode): string {
  return (node?.content || []).map(nodeToHtml).join('')
}

function markHtml(text: string, marks?: RichNode['marks']): string {
  if (!marks?.length) return escapeHtml(text)

  return marks.reduce((acc, mark) => {
    if (mark.type === 'bold') return `<strong>${acc}</strong>`
    if (mark.type === 'italic') return `<em>${acc}</em>`
    if (mark.type === 'code') return `<code>${acc}</code>`
    if (mark.type === 'link') {
      const href = escapeHtml(String(mark.attrs?.href || '').trim())
      return href ? `<a href="${href}">${acc}</a>` : acc
    }
    return acc
  }, escapeHtml(text))
}

function nodeToHtml(node: RichNode): string {
  if (node.type === 'text') return markHtml(node.text || '', node.marks)
  if (node.type === 'hardBreak') return '<br />'

  if (node.type === 'heading') {
    const level = Math.max(1, Math.min(6, Number(node.attrs?.level) || 2))
    return `<h${level}>${childrenToHtml(node)}</h${level}>`
  }

  if (node.type === 'paragraph') return `<p>${childrenToHtml(node)}</p>`
  if (node.type === 'bulletList') return `<ul>${childrenToHtml(node)}</ul>`
  if (node.type === 'orderedList') return `<ol>${childrenToHtml(node)}</ol>`
  if (node.type === 'listItem') return `<li>${childrenToHtml(node)}</li>`
  if (node.type === 'blockquote') return `<blockquote>${childrenToHtml(node)}</blockquote>`
  if (node.type === 'codeBlock') return `<pre><code>${escapeHtml(childrenToText(node))}</code></pre>`

  if (node.type === 'image') {
    const src = escapeHtml(String(node.attrs?.src || ''))
    const alt = escapeHtml(String(node.attrs?.alt || ''))
    return src ? `<img src="${src}" alt="${alt}" />` : ''
  }

  return childrenToHtml(node)
}

function buildBodyParts(article: ArticleDetail): { markdown: string; text: string; html: string } {
  const parsed = parseContent(article.content)

  const markdownBody = parsed
    ? nodeToMarkdown(parsed).trim()
    : article.content

  const textBody = parsed
    ? nodeToText(parsed).trim()
    : article.content

  const htmlBody = parsed
    ? nodeToHtml(parsed)
    : `<p>${escapeHtml(article.content)}</p>`

  const citations = article.citations?.length
    ? `\n\n## Citations\n${article.citations.map((url) => `- ${url}`).join('\n')}`
    : ''

  return {
    markdown: `# ${article.title}\n\n${article.subtitle ? `${article.subtitle}\n\n` : ''}${markdownBody}${citations}\n\n---\n${WATERMARK_PREFIX}[${WATERMARK_BRAND}](${WATERMARK_URL})`.trim(),
    text: `${article.title}\n\n${article.subtitle ? `${article.subtitle}\n\n` : ''}${textBody}${article.citations?.length ? `\n\nCitations\n${article.citations.join('\n')}` : ''}`.trim(),
    html: `
      <h1>${escapeHtml(article.title)}</h1>
      ${article.subtitle ? `<p><em>${escapeHtml(article.subtitle)}</em></p>` : ''}
      ${htmlBody}
      ${article.citations?.length ? `<h2>Citations</h2><ul>${article.citations.map((url) => `<li><a href="${escapeHtml(url)}">${escapeHtml(url)}</a></li>`).join('')}</ul>` : ''}
    `.trim(),
  }
}

function downloadBlob(content: string, mimeType: string, filename: string) {
  const blob = new Blob([content], { type: mimeType })
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = filename
  document.body.appendChild(anchor)
  anchor.click()
  document.body.removeChild(anchor)
  URL.revokeObjectURL(url)
}

async function exportAsPdf(article: ArticleDetail) {
  const { text } = buildBodyParts(article)
  const doc = new jsPDF({ unit: 'pt', format: 'a4' })
  const fileName = `${sanitizeFileName(article.title)}.pdf`

  const pageWidth = doc.internal.pageSize.getWidth()
  const pageHeight = doc.internal.pageSize.getHeight()
  const marginX = 48
  const marginTop = 56
  const marginBottom = 48
  const footerY = pageHeight - 20
  const contentWidth = pageWidth - marginX * 2
  const lineHeight = 18

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(12)

  const lines = doc.splitTextToSize(text, contentWidth) as string[]
  let cursorY = marginTop

  for (const line of lines) {
    if (cursorY > pageHeight - marginBottom) {
      doc.addPage()
      cursorY = marginTop
    }
    doc.text(line, marginX, cursorY)
    cursorY += lineHeight
  }

  const totalPages = doc.getNumberOfPages()
  for (let page = 1; page <= totalPages; page += 1) {
    doc.setPage(page)
    doc.setFontSize(10)
    doc.setTextColor(102, 102, 102)

    const prefix = WATERMARK_PREFIX
    const brand = WATERMARK_BRAND
    const prefixWidth = doc.getTextWidth(prefix)
    const brandWidth = doc.getTextWidth(brand)
    const totalWidth = prefixWidth + brandWidth
    const x = (pageWidth - totalWidth) / 2

    doc.text(prefix, x, footerY)
    doc.setTextColor(10, 102, 194)
    doc.textWithLink(brand, x + prefixWidth, footerY, { url: WATERMARK_URL })
  }

  doc.save(fileName)
}

function exportAsWord(article: ArticleDetail) {
  const { html } = buildBodyParts(article)
  const doc = `
    <!doctype html>
    <html>
      <head>
        <meta charset="utf-8" />
        <title>${escapeHtml(article.title)}</title>
        <style>
          @page { margin: 2.5cm 2cm 2.2cm 2cm; }
          body { font-family: Calibri, Arial, sans-serif; color: #111; }
          .watermark-footer {
            position: fixed;
            bottom: 0;
            left: 0;
            right: 0;
            text-align: center;
            font-size: 10.5pt;
            color: #666;
            border-top: 1px solid #e5e7eb;
            padding-top: 4px;
          }
          .watermark-footer a { color: #0a66c2; text-decoration: none; }
        </style>
      </head>
      <body>
        <main>${html}</main>
        <footer class="watermark-footer">
          ${WATERMARK_PREFIX}<a href="${WATERMARK_URL}">${WATERMARK_BRAND}</a>
        </footer>
      </body>
    </html>
  `
  const fileName = `${sanitizeFileName(article.title)}.doc`
  downloadBlob(doc, 'application/msword', fileName)
}

function exportAsMarkdown(article: ArticleDetail) {
  const { markdown } = buildBodyParts(article)
  const fileName = `${sanitizeFileName(article.title)}.md`
  downloadBlob(markdown, 'text/markdown;charset=utf-8', fileName)
}

export async function exportArticle(format: ExportFormat, article: ArticleDetail): Promise<void> {
  if (format === 'pdf') {
    await exportAsPdf(article)
    return
  }

  if (format === 'word') {
    exportAsWord(article)
    return
  }

  exportAsMarkdown(article)
}
