import { describe, expect, it } from 'vitest'
import { IframeEmbed, VideoEmbed } from '../../../../src/components/editor/extensions/EmbedNodes'

describe('Embed node extensions', () => {
  it('defines iframe embed attributes and html transforms', () => {
    const attrs = (IframeEmbed as any).config.addAttributes()
    expect(attrs.src.default).toBeNull()
    expect(attrs.title.default).toBe('Embedded media')
    expect(attrs.height.default).toBe(420)

    expect((IframeEmbed as any).config.parseHTML()).toEqual([
      { tag: 'iframe[data-embed="true"]' },
    ])

    const rendered = (IframeEmbed as any).config.renderHTML({
      HTMLAttributes: { src: 'https://example.com/embed' },
    })
    expect(rendered[0]).toBe('iframe')
    expect(rendered[1]).toMatchObject({
      src: 'https://example.com/embed',
      'data-embed': 'true',
      loading: 'lazy',
    })
  })

  it('defines video embed attributes and html transforms', () => {
    const attrs = (VideoEmbed as any).config.addAttributes()
    expect(attrs.src.default).toBeNull()
    expect(attrs.title.default).toBe('Uploaded video')

    expect((VideoEmbed as any).config.parseHTML()).toEqual([
      { tag: 'video[data-embed-video="true"]' },
    ])

    const rendered = (VideoEmbed as any).config.renderHTML({
      HTMLAttributes: { src: '/video.mp4' },
    })
    expect(rendered[0]).toBe('video')
    expect(rendered[1]).toMatchObject({
      src: '/video.mp4',
      'data-embed-video': 'true',
      controls: 'true',
      preload: 'metadata',
    })
  })
})
