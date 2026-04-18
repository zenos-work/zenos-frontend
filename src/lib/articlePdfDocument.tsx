/* eslint-disable react-refresh/only-export-components */
import React from 'react'
import {
  Document,
  Page,
  View,
  Text,
  Image,
  Link,
  StyleSheet,
  Font,
  pdf,
} from '@react-pdf/renderer'
import type { ArticleDetail } from '../types'
import { resolveAssetUrl } from './assets'

// Extract Style type from react-pdf's StyleSheet.create signature
type RpStyle = Parameters<typeof StyleSheet.create>[0][string]

/* ── Font Configuration ────────────────────────────────── */

// Use built-in PDF fonts so exports work in offline/test environments without
// relying on external font downloads or font subsetting.

// Enable hyphenation for better text wrapping
Font.registerHyphenationCallback((word) => [word])

/* ── Constants ─────────────────────────────────────────── */

const WATERMARK_PREFIX = 'powered by '
const WATERMARK_BRAND = 'Zenos.work'
const WATERMARK_URL = 'https://zenos.work'

/* ── Types ─────────────────────────────────────────────── */

type RichNode = {
  type?: string
  attrs?: Record<string, unknown>
  marks?: Array<{ type?: string; attrs?: Record<string, unknown> }>
  text?: string
  content?: RichNode[]
}

type ImageMap = Map<string, string>

/* ── Utilities ─────────────────────────────────────────── */

function parseContent(content: string): RichNode | null {
  try {
    const parsed = JSON.parse(content) as RichNode
    if (parsed && typeof parsed === 'object') return parsed
  } catch {
    /* not JSON – will fall back to plain text */
  }
  return null
}

function extractYouTubeId(url: string): string | null {
  const match = url.match(
    /(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/,
  )
  return match?.[1] ?? null
}

/**
 * Sanitise text for @react-pdf/renderer.
 *
 * The registered font subsets (Inter latin, Merriweather latin, FiraCode latin)
 * only contain glyphs for a limited set of Unicode code-points.  Characters
 * outside those ranges cause the font subsetter to crash with:
 *   "RangeError: Offset is outside the bounds of the DataView"
 *
 * Strategy:
 *  1. Replace common non-ASCII characters with ASCII equivalents.
 *  2. Strip everything that remains outside the safe range.
 */
function sanitizeText(text: string): string {
  return text
    // Smart single quotes / apostrophes
    .replace(/[\u2018\u2019\u201A\u2039\u203A\u0060\u00B4]/g, "'")
    // Smart double quotes
    .replace(/[\u201C\u201D\u201E\u00AB\u00BB]/g, '"')
    // Dashes (en-dash, em-dash, horizontal bar)
    .replace(/[\u2013\u2014\u2015\u2212]/g, '-')
    // Ellipsis
    .replace(/\u2026/g, '...')
    // Bullets / list markers
    .replace(/[\u2022\u2023\u2043\u25E6\u25CF\u25CB]/g, '-')
    // Spaces (NBSP, thin space, en space, em space, etc.)
    .replace(/[\u00A0\u2002-\u200B\u202F\u205F\u3000]/g, ' ')
    // Zero-width / invisible characters
    .replace(/[\u200B-\u200F\u2028-\u202E\uFEFF\u00AD]/g, '')
    // Keep ONLY printable ASCII (U+0020-007E), newline, tab, carriage return
    // This is the safest possible approach — every registered font definitely
    // contains glyphs for this range.
    .replace(/[^\t\n\r -~]/g, '')
}

function getPlainText(node: RichNode): string {
  if (node.type === 'text') return sanitizeText(node.text || '')
  if (node.type === 'hardBreak') return '\n'
  return (node.content || []).map(getPlainText).join('')
}

async function fetchAsDataUrl(url: string): Promise<string | null> {
  if (!url || typeof url !== 'string') return null
  if (/^data:/i.test(url)) return url

  // Strategy 1: Use an <img> element + canvas (leverages browser image cache, works
  // for most CORS-enabled images and same-origin images even when fetch() is blocked)
  if (typeof document !== 'undefined') {
    const viaCanvas = await new Promise<string | null>((resolve) => {
      const img = document.createElement('img')
      img.crossOrigin = 'anonymous'
      const timeout = setTimeout(() => { resolve(null) }, 8000)
      img.onload = () => {
        clearTimeout(timeout)
        try {
          const canvas = document.createElement('canvas')
          canvas.width = img.naturalWidth
          canvas.height = img.naturalHeight
          const ctx = canvas.getContext('2d')
          if (!ctx) { resolve(null); return }
          ctx.drawImage(img, 0, 0)
          resolve(canvas.toDataURL('image/png'))
        } catch {
          resolve(null)
        }
      }
      img.onerror = () => { clearTimeout(timeout); resolve(null) }
      img.src = url
    })
    if (viaCanvas) return viaCanvas
  }

  // Strategy 2: Direct fetch (for URLs that support CORS via fetch)
  try {
    let response: Response
    try {
      response = await fetch(url, { mode: 'cors', credentials: 'omit' })
    } catch {
      response = await fetch(url)
    }
    if (!response.ok) return null
    const blob = await response.blob()
    return new Promise<string | null>((resolve) => {
      const reader = new FileReader()
      reader.onload = () => resolve(String(reader.result || ''))
      reader.onerror = () => resolve(null)
      reader.readAsDataURL(blob)
    })
  } catch {
    return null
  }
}

/**
 * Resolve a potentially-relative image URL to an absolute one
 * using the same logic the rest of the app uses.
 */
function resolveImageUrl(raw: string): string {
  return resolveAssetUrl(raw) || raw
}

async function collectAndEmbedImages(
  parsed: RichNode | null,
  coverImageUrl?: string,
): Promise<ImageMap> {
  // Collect raw URLs first, then resolve them
  const rawUrls = new Set<string>()
  if (coverImageUrl?.trim()) rawUrls.add(coverImageUrl.trim())

  function walk(node: RichNode) {
    if (node.type === 'image') {
      const src = String(node.attrs?.src || '').trim()
      if (src) rawUrls.add(src)
    }
    if (node.type === 'videoEmbed' || node.type === 'embed') {
      const src = String(node.attrs?.src || '').trim()
      const videoId = extractYouTubeId(src)
      if (videoId) {
        rawUrls.add(`https://img.youtube.com/vi/${videoId}/hqdefault.jpg`)
      }
    }
    for (const child of node.content || []) walk(child)
  }

  if (parsed) walk(parsed)

  // Build a mapping: rawUrl → resolved absolute URL
  const resolvedPairs = Array.from(rawUrls).map((raw) => ({
    raw,
    resolved: resolveImageUrl(raw),
  }))

  const map: ImageMap = new Map()
  const entries = await Promise.allSettled(
    resolvedPairs.map(async ({ raw, resolved }) => {
      const dataUrl = await fetchAsDataUrl(resolved)
      return { raw, resolved, dataUrl } as const
    }),
  )

  for (const result of entries) {
    if (result.status === 'fulfilled') {
      const { raw, resolved, dataUrl } = result.value
      // Store under the raw key (so lookups from the node tree match)
      // Use dataUrl if we got one, otherwise fall back to the resolved absolute URL
      map.set(raw, dataUrl || resolved)
    }
  }

  return map
}

/* ── Styles ────────────────────────────────────────────── */

const s = StyleSheet.create({
  /* page */
  page: {
    paddingTop: 50,
    paddingBottom: 65,
    paddingHorizontal: 50,
    fontFamily: 'Helvetica',
    fontSize: 10.5,
    lineHeight: 1.7,
    color: '#2d2d2d',
  },

  /* title / subtitle */
  title: {
    fontSize: 28,
    fontFamily: 'Times-Bold',
    color: '#111111',
    marginBottom: 8,
    paddingBottom: 10,
    borderBottomWidth: 2,
    borderBottomColor: '#e5e7eb',
    lineHeight: 1.3,
  },
  subtitle: {
    fontSize: 13,
    fontFamily: 'Helvetica-Oblique',
    color: '#666666',
    marginBottom: 20,
    lineHeight: 1.5,
  },

  /* cover */
  coverWrap: { marginBottom: 24, alignItems: 'center' },
  coverImg: {
    maxWidth: '100%',
    maxHeight: 340,
    objectFit: 'contain',
    borderRadius: 4,
  },

  /* headings */
  h2: {
    fontSize: 20,
    fontFamily: 'Times-Bold',
    color: '#111',
    marginTop: 24,
    marginBottom: 10,
    lineHeight: 1.3,
  },
  h3: {
    fontSize: 16,
    fontFamily: 'Helvetica-Bold',
    color: '#222',
    marginTop: 20,
    marginBottom: 8,
    lineHeight: 1.35,
  },
  h4: {
    fontSize: 14,
    fontFamily: 'Helvetica-Bold',
    color: '#333',
    marginTop: 16,
    marginBottom: 6,
  },
  h5: {
    fontSize: 12,
    fontFamily: 'Helvetica-Bold',
    color: '#333',
    marginTop: 14,
    marginBottom: 6,
  },
  h6: {
    fontSize: 11,
    fontFamily: 'Helvetica-Bold',
    color: '#444',
    marginTop: 12,
    marginBottom: 4,
  },

  /* paragraph */
  paragraph: {
    fontSize: 10.5,
    lineHeight: 1.75,
    marginBottom: 10,
  },

  /* lists */
  listWrap: { marginBottom: 8 },
  listItemRow: { flexDirection: 'row' as const, marginBottom: 4, paddingLeft: 6 },
  bulletDot: { width: 14, fontSize: 10.5 },
  orderedNum: { width: 20, fontSize: 10.5, fontFamily: 'Helvetica' },
  listItemContent: { flex: 1, fontSize: 10.5, lineHeight: 1.65 },
  nestedBlock: { paddingLeft: 20 },

  /* blockquote */
  blockquote: { flexDirection: 'row' as const, marginVertical: 10 },
  blockquoteBorder: {
    width: 3,
    backgroundColor: '#0a66c2',
    borderRadius: 2,
  },
  blockquoteBody: { flex: 1, paddingLeft: 14, paddingVertical: 6 },
  blockquoteText: {
    fontFamily: 'Helvetica-Oblique',
    color: '#555',
    fontSize: 10.5,
    lineHeight: 1.65,
    marginBottom: 4,
  },

  /* code block */
  codeBlock: {
    backgroundColor: '#f6f8fa',
    borderWidth: 1,
    borderColor: '#e1e4e8',
    borderRadius: 4,
    padding: 12,
    marginVertical: 10,
  },
  codeText: {
    fontFamily: 'Courier',
    fontSize: 8.5,
    color: '#24292e',
    lineHeight: 1.55,
  },

  /* image */
  imageWrap: { marginVertical: 14, alignItems: 'center' },
  image: {
    maxWidth: '100%',
    maxHeight: 480,
    objectFit: 'contain',
    borderRadius: 4,
  },
  imageFallback: { color: '#999', fontSize: 9, marginVertical: 8 },

  /* inline marks */
  bold: { fontFamily: 'Helvetica-Bold' },
  italic: { fontFamily: 'Helvetica-Oblique' },
  boldItalic: { fontFamily: 'Helvetica-BoldOblique' },
  inlineCode: { fontFamily: 'Courier', fontSize: 9.5, backgroundColor: '#f0f0f0' },
  underline: { textDecoration: 'underline' as const },
  inlineLink: { color: '#0a66c2' },

  /* video embed */
  videoBox: {
    flexDirection: 'row' as const,
    alignItems: 'center',
    marginVertical: 10,
    padding: 10,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 4,
    backgroundColor: '#f9fafb',
  },
  videoThumb: {
    width: 120,
    height: 68,
    borderRadius: 4,
    marginRight: 12,
    objectFit: 'cover' as const,
  },
  videoPlay: { fontSize: 16, marginRight: 8, color: '#0a66c2' },
  videoLinkText: { fontSize: 10, color: '#0a66c2', flex: 1 },

  /* citations */
  citationsWrap: {
    marginTop: 28,
    borderTopWidth: 2,
    borderTopColor: '#e5e7eb',
    paddingTop: 16,
  },
  citationsTitle: {
    fontSize: 18,
    fontFamily: 'Times-Bold',
    marginBottom: 10,
    color: '#111',
  },
  citationLink: { fontSize: 10, color: '#0a66c2', marginBottom: 4 },

  /* footer watermark */
  watermark: {
    position: 'absolute' as const,
    bottom: 25,
    left: 50,
    right: 50,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    paddingTop: 8,
    textAlign: 'center' as const,
    fontSize: 8.5,
    color: '#999',
  },
  watermarkBrand: { color: '#0a66c2', textDecoration: 'none' as const },
})

/* ── Heading style lookup ──────────────────────────────── */

const headingStyle = (level: number) => {
  if (level <= 2) return s.h2
  if (level === 3) return s.h3
  if (level === 4) return s.h4
  if (level === 5) return s.h5
  return s.h6
}

/* ── Inline rendering (text + marks) ──────────────────── */

function renderInline(nodes: RichNode[]): React.ReactNode[] {
  return nodes.map((node, i) => {
    if (node.type === 'text') {
      const text = sanitizeText(node.text || '')
      if (!text) return null

      const marks = node.marks || []
      let bold = false
      let italic = false
      let code = false
      let underline = false
      let href: string | null = null

      for (const m of marks) {
        if (m.type === 'bold') bold = true
        if (m.type === 'italic') italic = true
        if (m.type === 'code') code = true
        if (m.type === 'underline') underline = true
        if (m.type === 'link') href = String(m.attrs?.href || '').trim() || null
      }

      const textStyles: RpStyle[] = []
      if (code) {
        textStyles.push(s.inlineCode)
      } else if (bold && italic) {
        textStyles.push(s.boldItalic)
      } else if (bold) {
        textStyles.push(s.bold)
      } else if (italic) {
        textStyles.push(s.italic)
      }
      if (underline) textStyles.push(s.underline)

      if (href) {
        return (
          <Link key={i} src={href} style={[...textStyles, s.inlineLink]}>
            {text}
          </Link>
        )
      }

      return textStyles.length ? (
        <Text key={i} style={textStyles}>
          {text}
        </Text>
      ) : (
        text
      )
    }

    if (node.type === 'hardBreak') return <Text key={i}>{'\n'}</Text>

    if (node.content)
      return <React.Fragment key={i}>{renderInline(node.content)}</React.Fragment>
    return null
  })
}

/* ── List-item rendering ──────────────────────────────── */

function renderListItem(
  item: RichNode,
  index: number,
  marker: string,
  markerStyle: RpStyle,
  imageMap: ImageMap,
): React.ReactNode {
  const children = item.content || []
  if (!children.length) return null

  const firstChild = children[0]
  const rest = children.slice(1)

  return (
    <View key={index}>
      <View style={s.listItemRow}>
        <Text style={markerStyle}>{marker}</Text>
        <Text style={s.listItemContent}>
          {firstChild.type === 'paragraph'
            ? renderInline(firstChild.content || [])
            : null}
        </Text>
      </View>
      {/* First child was not a paragraph → render as block */}
      {firstChild.type !== 'paragraph' && (
        <View style={s.nestedBlock}>{renderBlock(firstChild, 0, imageMap)}</View>
      )}
      {/* Remaining children (nested lists, extra paragraphs) */}
      {rest.length > 0 && (
        <View style={s.nestedBlock}>
          {rest.map((child, j) => renderBlock(child, j + 1, imageMap))}
        </View>
      )}
    </View>
  )
}

/* ── Block rendering ──────────────────────────────────── */

function renderBlock(
  node: RichNode,
  key: number,
  imageMap: ImageMap,
): React.ReactNode {
  /* heading */
  if (node.type === 'heading') {
    const level = Number(node.attrs?.level) || 2
    return (
      <Text key={key} style={headingStyle(level)}>
        {renderInline(node.content || [])}
      </Text>
    )
  }

  /* paragraph */
  if (node.type === 'paragraph') {
    return (
      <Text key={key} style={s.paragraph}>
        {renderInline(node.content || [])}
      </Text>
    )
  }

  /* bullet list */
  if (node.type === 'bulletList') {
    return (
      <View key={key} style={s.listWrap}>
        {(node.content || []).map((item, i) =>
          renderListItem(item, i, '-', s.bulletDot, imageMap),
        )}
      </View>
    )
  }

  /* ordered list */
  if (node.type === 'orderedList') {
    return (
      <View key={key} style={s.listWrap}>
        {(node.content || []).map((item, i) =>
          renderListItem(item, i, `${i + 1}.`, s.orderedNum, imageMap),
        )}
      </View>
    )
  }

  /* blockquote */
  if (node.type === 'blockquote') {
    return (
      <View key={key} style={s.blockquote} wrap={false}>
        <View style={s.blockquoteBorder} />
        <View style={s.blockquoteBody}>
          {(node.content || []).map((child, i) =>
            child.type === 'paragraph' ? (
              <Text key={i} style={s.blockquoteText}>
                {renderInline(child.content || [])}
              </Text>
            ) : (
              renderBlock(child, i, imageMap)
            ),
          )}
        </View>
      </View>
    )
  }

  /* code block */
  if (node.type === 'codeBlock') {
    return (
      <View key={key} style={s.codeBlock} wrap={false}>
        <Text style={s.codeText}>{getPlainText(node)}</Text>
      </View>
    )
  }

  /* image */
  if (node.type === 'image') {
    const src = String(node.attrs?.src || '').trim()
    if (!src) return null
    const imageSrc = imageMap.get(src) || src
    return (
      <View key={key} style={s.imageWrap} wrap={false}>
        <Image style={s.image} src={imageSrc} />
      </View>
    )
  }

  /* video / embed */
  if (node.type === 'videoEmbed' || node.type === 'embed') {
    const src = String(node.attrs?.src || '').trim()
    if (!src) return null
    const videoId = extractYouTubeId(src)
    const thumbUrl = videoId
      ? `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`
      : null
    const thumbSrc = thumbUrl ? (imageMap.get(thumbUrl) || thumbUrl) : null

    return (
      <View key={key} style={s.videoBox} wrap={false}>
        {thumbSrc ? (
          <Image style={s.videoThumb} src={thumbSrc} />
        ) : (
          <Text style={s.videoPlay}>{'>'}</Text>
        )}
        <Link src={src} style={{ flex: 1 }}>
          <Text style={s.videoLinkText}>Watch video: {src}</Text>
        </Link>
      </View>
    )
  }

  /* fallback: render children */
  if (node.content?.length) {
    return (
      <View key={key}>
        {node.content.map((child, i) => renderBlock(child, i, imageMap))}
      </View>
    )
  }

  return null
}

/* ── Document component ────────────────────────────────── */

function ArticlePdfDocument({
  article,
  parsed,
  imageMap,
}: {
  article: ArticleDetail
  parsed: RichNode | null
  imageMap: ImageMap
}) {
  const nodes = parsed?.content || []
  const coverSrc = article.cover_image_url?.trim()
  const coverData = coverSrc ? (imageMap.get(coverSrc) || coverSrc) : null

  return (
    <Document
      title={article.title}
      author={article.author_name || ''}
      creator="Zenos.work"
    >
      <Page size="A4" style={s.page} wrap>
        {/* Cover image */}
        {coverData ? (
          <View style={s.coverWrap} wrap={false}>
            <Image style={s.coverImg} src={coverData} />
          </View>
        ) : null}

        {/* Title */}
        <Text style={s.title}>{sanitizeText(article.title)}</Text>

        {/* Subtitle */}
        {article.subtitle ? (
          <Text style={s.subtitle}>{sanitizeText(article.subtitle)}</Text>
        ) : null}

        {/* Body */}
        {nodes.length > 0
          ? nodes.map((n, i) => renderBlock(n, i, imageMap))
          : <Text style={s.paragraph}>{sanitizeText(article.content)}</Text>}

        {/* Citations */}
        {article.citations?.length ? (
          <View style={s.citationsWrap}>
            <Text style={s.citationsTitle}>Citations</Text>
            {article.citations.map((url, i) => (
              <Link key={i} src={url}>
                <Text style={s.citationLink}>{url}</Text>
              </Link>
            ))}
          </View>
        ) : null}

        {/* Watermark – fixed on every page */}
        <View style={s.watermark} fixed>
          <Text>
            {WATERMARK_PREFIX}
            <Link src={WATERMARK_URL} style={s.watermarkBrand}>
              {WATERMARK_BRAND}
            </Link>
          </Text>
        </View>
      </Page>
    </Document>
  )
}

/* ── Public API ────────────────────────────────────────── */

export async function generateArticlePdfBlob(
  article: ArticleDetail,
): Promise<Blob> {
  const parsed = parseContent(article.content)
  const imageMap = await collectAndEmbedImages(parsed, article.cover_image_url)
  try {
    const blob = await pdf(
      <ArticlePdfDocument article={article} parsed={parsed} imageMap={imageMap} />,
    ).toBlob()
    return blob
  } catch (err) {
    console.error('[PDF] react-pdf render/toBlob failed:', err)
    throw err
  }
}
