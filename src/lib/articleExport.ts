import type { ArticleDetail } from '../types'
import { generateArticlePdfBlob } from './articlePdfDocument'

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
      try {
        // Try fetching with CORS mode
        const response = await fetch(normalizedSrc, {
          mode: 'cors',
          credentials: 'omit',
        })
        if (!response.ok) {
          // Fallback: try without CORS restrictions
          const fallbackResponse = await fetch(normalizedSrc)
          if (!fallbackResponse.ok) return null
          blob = await fallbackResponse.blob()
        } else {
          blob = await response.blob()
        }
      } catch {
        // Last resort: try direct fetch
        const directResponse = await fetch(normalizedSrc)
        if (!directResponse.ok) return null
        blob = await directResponse.blob()
      }
    }

    const dataUrl = await blobToDataUrl(blob)
    const { width, height } = await getImageDimensions(dataUrl)
    const mime = blob.type.toLowerCase()
    const format: 'PNG' | 'JPEG' | 'WEBP' = mime.includes('png')
      ? 'PNG'
      : mime.includes('webp')
        ? 'WEBP'
        : 'JPEG'

    if (!width || !height) return null

    return {
      dataUrl,
      width,
      height,
      format,
    }
  } catch (error) {
    console.warn(`Failed to embed image: ${src}`, error)
    return null
  }
}

async function embedImagesInHtml(html: string): Promise<string> {
  if (typeof DOMParser === 'undefined') return html

  const parser = new DOMParser()
  const documentNode = parser.parseFromString(`<body>${html}</body>`, 'text/html')
  const images = Array.from(documentNode.querySelectorAll('img'))

  for (const image of images) {
    const src = image.getAttribute('src') || ''
    if (!src) continue

    const embedded = await embedImageSource(src)
    if (embedded) {
      image.setAttribute('src', embedded.dataUrl)
    } else {
      // If embedding fails, keep original src but add error handling
      console.warn(`Could not embed image: ${src}`)
    }

    // Apply responsive image styling
    image.setAttribute(
      'style',
      'display:block;max-width:100%;width:auto;height:auto;object-fit:contain;margin:12pt auto;page-break-inside:avoid;border-radius:4px;',
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
    ? `<div style="margin-bottom:24pt;text-align:center;page-break-inside:avoid;"><img src="${escapeHtml(article.cover_image_url)}" alt="Cover" style="max-width:100%;width:auto;height:auto;object-fit:contain;border-radius:4px;box-shadow:0 1px 3px rgba(0,0,0,0.1);" /></div>`
    : ''

  return {
    markdown: `# ${article.title}\n\n${article.subtitle ? `${article.subtitle}\n\n` : ''}${markdownBody}${citations}\n\n---\n${WATERMARK_PREFIX}[${WATERMARK_BRAND}](${WATERMARK_URL})`.trim(),
    text: `${article.title}\n\n${article.subtitle ? `${article.subtitle}\n\n` : ''}${textBody}${article.citations?.length ? `\n\nCitations\n${article.citations.join('\n')}` : ''}`.trim(),
    html: `
      <style>
        * { margin: 0; padding: 0; }
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; }
        h1, h2, h3, h4, h5, h6 { margin-top: 24px; margin-bottom: 16px; font-weight: 600; line-height: 1.25; }
        h1 { font-size: 32px; border-bottom: 2px solid #e5e7eb; padding-bottom: 12px; }
        h2 { font-size: 24px; }
        h3 { font-size: 20px; }
        h4 { font-size: 18px; }
        h5 { font-size: 16px; }
        h6 { font-size: 14px; }
        p { margin: 12px 0; text-align: justify; }
        em { font-style: italic; }
        strong, b { font-weight: 600; }
        code { background-color: #f3f3f3; padding: 2px 6px; border-radius: 3px; font-family: 'Courier New', monospace; font-size: 0.9em; }
        pre { background-color: #f5f5f5; border: 1px solid #ddd; border-radius: 4px; padding: 12px; overflow-x: auto; line-height: 1.4; page-break-inside: avoid; }
        pre code { background-color: transparent; padding: 0; }
        blockquote { border-left: 4px solid #0a66c2; margin-left: 0; margin-right: 0; padding-left: 16px; color: #666; font-style: italic; }
        ul, ol { margin: 12px 0; padding-left: 24px; }
        li { margin: 8px 0; }
        a { color: #0a66c2; text-decoration: none; }
        a:hover { text-decoration: underline; }
        img { max-width: 100%; height: auto; display: block; margin: 16px auto; border-radius: 4px; }
        table { border-collapse: collapse; width: 100%; margin: 16px 0; }
        td, th { border: 1px solid #ddd; padding: 12px; text-align: left; }
        th { background-color: #f5f5f5; font-weight: 600; }
      </style>
      <div style="padding: 0; max-width: 100%;">
        ${coverImage}
        <h1>${escapeHtml(article.title)}</h1>
        ${article.subtitle ? `<p style="font-size:16px;color:#666;font-style:italic;margin-bottom:24px;"><em>${escapeHtml(article.subtitle)}</em></p>` : ''}
        ${htmlBody}
        ${article.citations?.length ? `<hr style="border:none;border-top:2px solid #e5e7eb;margin:32px 0;"/><h2>Citations</h2><ul>${article.citations.map((url) => `<li><a href="${escapeHtml(url)}">${escapeHtml(url)}</a></li>`).join('')}</ul>` : ''}
      </div>
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
  const blob = await generateArticlePdfBlob(article)
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = `${sanitizeFileName(article.title)}.pdf`
  document.body.appendChild(anchor)
  anchor.click()
  document.body.removeChild(anchor)
  URL.revokeObjectURL(url)
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
