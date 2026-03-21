import { describe, expect, it } from 'vitest'
import { IframeEmbed, VideoEmbed } from '../../../../src/components/editor/extensions/EmbedNodes'

type EmbedExtensionConfig = {
  addAttributes: () => Record<string, { default: unknown }>
  parseHTML: () => Array<{ tag: string }>
  renderHTML: (args: {
    HTMLAttributes: Record<string, unknown>
  }) => [string, Record<string, unknown>, ...unknown[]]
}

const asEmbedConfig = (extension: unknown): EmbedExtensionConfig => {
  const extensionWithConfig = extension as { config: EmbedExtensionConfig }
  return extensionWithConfig.config
}

describe('Embed node extensions', () => {
  it('defines iframe embed attributes and html transforms', () => {
    const iframeConfig = asEmbedConfig(IframeEmbed)
    const attrs = iframeConfig.addAttributes()
    expect(attrs.src.default).toBeNull()
    expect(attrs.title.default).toBe('Embedded media')
    expect(attrs.height.default).toBe(420)

    expect(iframeConfig.parseHTML()).toEqual([
      { tag: 'iframe[data-embed="true"]' },
    ])

    const rendered = iframeConfig.renderHTML({
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
    const videoConfig = asEmbedConfig(VideoEmbed)
    const attrs = videoConfig.addAttributes()
    expect(attrs.src.default).toBeNull()
    expect(attrs.title.default).toBe('Uploaded video')

    expect(videoConfig.parseHTML()).toEqual([
      { tag: 'video[data-embed-video="true"]' },
    ])

    const rendered = videoConfig.renderHTML({
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
