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

type PdfBlock =
  | { type: 'text'; text: string }
  | { type: 'image'; src: string; alt: string }

type EmbeddedImage = {
  dataUrl: string
  width: number
  height: number
  format: 'PNG' | 'JPEG' | 'WEBP'
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

  if (node.type === 'videoEmbed' || node.type === 'embed') {
    const src = String(node.attrs?.src || '').trim()
    return src ? `[Video: ${src}]\n\n` : ''
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

  if (node.type === 'videoEmbed' || node.type === 'embed') {
    const src = String(node.attrs?.src || '').trim()
    return src ? `[Video: ${src}]\n\n` : ''
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
  if (node.type === 'blockquote') return `<blockquote style="border-left:4px solid #ccc;margin-left:0;padding-left:16px;color:#666;font-style:italic;">${childrenToHtml(node)}</blockquote>`
  if (node.type === 'codeBlock') return `<pre style="background-color:#f3f3f3;border:1px solid #ddd;border-radius:4px;padding:12px;overflow-x:auto;font-family:monospace;font-size:12px;color:#333;"><code>${escapeHtml(childrenToText(node))}</code></pre>`

  if (node.type === 'image') {
    const src = escapeHtml(String(node.attrs?.src || ''))
    const alt = escapeHtml(String(node.attrs?.alt || ''))
    return src ? `<img src="${src}" alt="${alt}" />` : ''
  }

  if (node.type === 'videoEmbed' || node.type === 'embed') {
    const src = String(node.attrs?.src || '').trim()
    if (!src) return ''
    return `<div style="margin:12pt 0;padding:12px;border:1px solid #e5e7eb;border-radius:4px;background-color:#f9fafb;"><a href="${escapeHtml(src)}" style="color:#0a66c2;text-decoration:none;">▶ Watch video: ${escapeHtml(src)}</a></div>`
  }

  return childrenToHtml(node)
}

function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result || ''))
    reader.onerror = () => reject(new Error('Could not read image blob'))
    reader.readAsDataURL(blob)
  })
}

function getImageDimensions(dataUrl: string): Promise<{ width: number; height: number }> {
  return new Promise((resolve) => {
    if (typeof Image === 'undefined') {
      resolve({ width: 1200, height: 675 })
      return
    }

    const image = new Image()
    let settled = false
    const settle = (dimensions: { width: number; height: number }) => {
      if (settled) return
      settled = true
      resolve(dimensions)
    }

    const timeoutId = globalThis.setTimeout(() => {
      settle({ width: 1200, height: 675 })
    }, 750)

    image.onload = () => {
      globalThis.clearTimeout(timeoutId)
      settle({
        width: image.naturalWidth || image.width,
        height: image.naturalHeight || image.height,
      })
    }
    image.onerror = () => {
      globalThis.clearTimeout(timeoutId)
      settle({ width: 1200, height: 675 })
    }
    image.src = dataUrl
  })
}

function normalizeImageUrl(src: string): string {
  const trimmed = src.trim()
  if (!trimmed) return ''
  if (/^data:/i.test(trimmed)) return trimmed
  try {
    if (typeof window !== 'undefined') {
      return new URL(trimmed, window.location.href).toString()
    }
  } catch {
    return trimmed
  }
  return trimmed
}

async function embedImageSource(src: string): Promise<EmbeddedImage | null> {
  const normalizedSrc = normalizeImageUrl(src)
  if (!normalizedSrc) return null

  try {
    let blob: Blob

    if (/^data:/i.test(normalizedSrc)) {
      const response = await fetch(normalizedSrc)
      blob = await response.blob()
    } else {
      const response = await fetch(normalizedSrc)
      if (!response.ok) return null
      blob = await response.blob()
    }

    const dataUrl = await blobToDataUrl(blob)
    const { width, height } = await getImageDimensions(dataUrl)
    const mime = blob.type.toLowerCase()
    const format = mime.includes('png') ? 'PNG' : mime.includes('webp') ? 'WEBP' : 'JPEG'

    if (!width || !height) return null

    return {
      dataUrl,
      width,
      height,
      format,
    }
  } catch {
    return null
  }
}

function nodeToPdfBlocks(node: RichNode): PdfBlock[] {
  if (node.type === 'image') {
    const src = String(node.attrs?.src || '').trim()
    const alt = String(node.attrs?.alt || 'image').trim() || 'image'
    return src ? [{ type: 'image', src, alt }] : []
  }

  if (node.type === 'heading') {
    const text = childrenToText(node).trim()
    return text ? [{ type: 'text', text }] : []
  }

  if (node.type === 'paragraph') {
    const text = childrenToText(node).trim()
    return text ? [{ type: 'text', text }] : []
  }

  if (node.type === 'bulletList') {
    const blocks = (node.content || [])
      .map((item) => `- ${childrenToText(item).trim()}`)
      .filter((line) => line !== '- ')
      .join('\n')
    return blocks ? [{ type: 'text', text: blocks }] : []
  }

  if (node.type === 'orderedList') {
    const blocks = (node.content || [])
      .map((item, index) => `${index + 1}. ${childrenToText(item).trim()}`)
      .filter((line) => !line.endsWith('. '))
      .join('\n')
    return blocks ? [{ type: 'text', text: blocks }] : []
  }

  if (node.type === 'blockquote') {
    const text = childrenToText(node)
      .trim()
      .split('\n')
      .map((line) => `> ${line}`)
      .join('\n')
    return text ? [{ type: 'text', text }] : []
  }

  if (node.type === 'codeBlock') {
    const text = childrenToText(node).trim()
    return text ? [{ type: 'text', text: `[CODE]\n${text}\n[/CODE]` }] : []
  }

  if (node.type === 'videoEmbed' || node.type === 'embed') {
    const src = String(node.attrs?.src || '').trim()
    return src ? [{ type: 'text', text: `[Video: ${src}]` }] : []
  }

  return (node.content || []).flatMap(nodeToPdfBlocks)
}

function buildPdfBlocks(article: ArticleDetail): PdfBlock[] {
  const parsed = parseContent(article.content)
  const blocks: PdfBlock[] = []

  // Add cover image if available
  if (article.cover_image_url?.trim()) {
    blocks.push({ type: 'image', src: article.cover_image_url.trim(), alt: 'Cover image' })
  }

  blocks.push({ type: 'text', text: article.title })
  if (article.subtitle?.trim()) {
    blocks.push({ type: 'text', text: article.subtitle.trim() })
  }

  if (parsed) {
    blocks.push(...(parsed.content || []).flatMap(nodeToPdfBlocks))
  } else if (article.content.trim()) {
    blocks.push({ type: 'text', text: article.content.trim() })
  }

  if (article.citations?.length) {
    blocks.push({ type: 'text', text: `Citations\n${article.citations.map((url) => `- ${url}`).join('\n')}` })
  }

  return blocks
}

async function embedImagesInHtml(html: string): Promise<string> {
  if (typeof DOMParser === 'undefined') return html

  const parser = new DOMParser()
  const documentNode = parser.parseFromString(`<body>${html}</body>`, 'text/html')
  const images = Array.from(documentNode.querySelectorAll('img'))

  for (const image of images) {
    const src = image.getAttribute('src') || ''
    const embedded = await embedImageSource(src)
    if (embedded) {
      image.setAttribute('src', embedded.dataUrl)
    }
    image.setAttribute(
      'style',
      'display:block;max-width:100%;width:auto;height:auto;object-fit:contain;margin:12pt auto;page-break-inside:avoid;',
    )
  }

  return documentNode.body.innerHTML
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

  const coverImage = article.cover_image_url?.trim()
    ? `<img src="${escapeHtml(article.cover_image_url)}" alt="Cover" style="max-width:100%;width:auto;height:auto;object-fit:contain;margin:12pt auto;page-break-inside:avoid;" />`
    : ''

  return {
    markdown: `# ${article.title}\n\n${article.subtitle ? `${article.subtitle}\n\n` : ''}${markdownBody}${citations}\n\n---\n${WATERMARK_PREFIX}[${WATERMARK_BRAND}](${WATERMARK_URL})`.trim(),
    text: `${article.title}\n\n${article.subtitle ? `${article.subtitle}\n\n` : ''}${textBody}${article.citations?.length ? `\n\nCitations\n${article.citations.join('\n')}` : ''}`.trim(),
    html: `
      ${coverImage ? `<div style="margin-bottom:24pt;">${coverImage}</div>` : ''}
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
  const blocks = buildPdfBlocks(article)
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
  let cursorY = marginTop

  const ensurePageSpace = (requiredHeight: number) => {
    if (cursorY + requiredHeight > pageHeight - marginBottom) {
      doc.addPage()
      cursorY = marginTop
    }
  }

  for (const block of blocks) {
    if (block.type === 'text') {
      const text = block.text.trim()

      // Handle code blocks with special styling
      if (text.includes('[CODE]') && text.includes('[/CODE]')) {
        const parts = text.split(/\[CODE\]|\[\/CODE\]/)
        for (let i = 0; i < parts.length; i++) {
          const part = parts[i].trim()
          if (i % 2 === 0) {
            // Regular text
            if (part) {
              const lines = doc.splitTextToSize(part, contentWidth) as string[]
              for (const line of lines) {
                ensurePageSpace(lineHeight)
                doc.text(line, marginX, cursorY)
                cursorY += lineHeight
              }
              cursorY += lineHeight * 0.25
            }
          } else {
            // Code block with grey background
            const codeLines = part.split('\n')
            const codeBoxHeight = (codeLines.length * lineHeight) + 12
            ensurePageSpace(codeBoxHeight + lineHeight)

            // Draw grey background
            doc.setFillColor(240, 240, 240)
            doc.rect(marginX, cursorY, contentWidth, codeBoxHeight, 'F')
            doc.setDrawColor(200, 200, 200)
            doc.rect(marginX, cursorY, contentWidth, codeBoxHeight)

            // Draw code text
            doc.setFont('courier', 'normal')
            doc.setFontSize(10)
            let codeY = cursorY + 8
            for (const codeLine of codeLines) {
              doc.text(codeLine, marginX + 8, codeY)
              codeY += lineHeight
            }
            doc.setFont('helvetica', 'normal')
            doc.setFontSize(12)

            cursorY += codeBoxHeight + lineHeight
          }
        }
      } else {
        // Regular text lines
        const lines = doc.splitTextToSize(text, contentWidth) as string[]
        for (const line of lines) {
          ensurePageSpace(lineHeight)
          doc.text(line, marginX, cursorY)
          cursorY += lineHeight
        }
        cursorY += lineHeight * 0.25
      }
      continue
    }

    const embeddedImage = await embedImageSource(block.src)
    if (!embeddedImage) {
      const fallbackLines = doc.splitTextToSize(`[Image: ${block.alt}]`, contentWidth) as string[]
      for (const line of fallbackLines) {
        ensurePageSpace(lineHeight)
        doc.text(line, marginX, cursorY)
        cursorY += lineHeight
      }
      cursorY += lineHeight * 0.25
      continue
    }

    const imageRatio = embeddedImage.width / embeddedImage.height
    const maxImageHeight = Math.min(pageHeight * 0.45, contentWidth)
    let drawWidth = contentWidth
    let drawHeight = drawWidth / imageRatio

    if (drawHeight > maxImageHeight) {
      drawHeight = maxImageHeight
      drawWidth = drawHeight * imageRatio
    }

    ensurePageSpace(drawHeight + lineHeight)
    const drawX = marginX + (contentWidth - drawWidth) / 2
    doc.addImage(embeddedImage.dataUrl, embeddedImage.format, drawX, cursorY, drawWidth, drawHeight)
    cursorY += drawHeight + lineHeight
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

async function exportAsWord(article: ArticleDetail) {
  const { html } = buildBodyParts(article)
  const embeddedHtml = await embedImagesInHtml(html)
  const doc = `
    <!doctype html>
    <html>
      <head>
        <meta charset="utf-8" />
        <title>${escapeHtml(article.title)}</title>
        <style>
          @page {
            margin: 2.5cm 2cm 3cm 2cm;
            @bottom-center {
              content: "${WATERMARK_PREFIX}${WATERMARK_BRAND}";
            }
          }
          body {
            font-family: Calibri, Arial, sans-serif;
            color: #111;
            margin-bottom: 80px;
          }
          main {
            min-height: 100vh;
          }
          main img {
            display: block;
            max-width: 100%;
            width: auto;
            height: auto;
            object-fit: contain;
            margin: 12pt auto;
            page-break-inside: avoid;
          }
          main blockquote {
            border-left: 4px solid #ccc;
            margin-left: 0;
            padding-left: 16px;
            color: #666;
            font-style: italic;
          }
          main pre {
            background-color: #f3f3f3;
            border: 1px solid #ddd;
            border-radius: 4px;
            padding: 12px;
            overflow-x: auto;
            font-family: monospace;
            font-size: 12px;
            color: #333;
            page-break-inside: avoid;
          }
          main code {
            background-color: #f3f3f3;
            padding: 2px 6px;
            border-radius: 2px;
            font-family: monospace;
            font-size: 12px;
          }
          .watermark-footer {
            page-break-before: always;
            margin-top: 40px;
            padding-top: 12px;
            border-top: 1px solid #e5e7eb;
            text-align: center;
            font-size: 10.5pt;
            color: #666;
          }
          .watermark-footer a {
            color: #0a66c2;
            text-decoration: none;
          }
        </style>
      </head>
      <body>
        <main>${embeddedHtml}</main>
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
    await exportAsWord(article)
    return
  }

  exportAsMarkdown(article)
}
