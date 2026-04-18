import { describe, expect, it } from 'vitest'
import { IframeEmbed /*, VideoEmbed */ } from '../../../../src/components/editor/extensions/EmbedNodes'

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

    const parseResult = iframeConfig.parseHTML()
    expect(parseResult).toHaveLength(2)
    expect(parseResult[0]).toEqual({ tag: 'div[data-zenos-embed="true"]' })
    expect(parseResult[1]).toMatchObject({ tag: 'iframe' })

    const rendered = iframeConfig.renderHTML({
      HTMLAttributes: { src: 'https://example.com/embed' },
    })
    expect(rendered[0]).toBe('div')
    expect(rendered[1]).toMatchObject({
      'data-zenos-embed': 'true',
      class: expect.any(String),
      style: expect.any(String),
    })
    expect(rendered[2]).toEqual([
      'iframe',
      expect.objectContaining({
        src: 'https://example.com/embed',
        loading: 'lazy',
      }),
    ])
  })

  /*
  it('defines video embed attributes and html transforms', () => {
    const videoConfig = asEmbedConfig(VideoEmbed)
    const attrs = videoConfig.addAttributes()
    expect(attrs.src.default).toBeNull()
    expect(attrs.title.default).toBe('Uploaded video')

    const parseResult = videoConfig.parseHTML()
    expect(parseResult).toHaveLength(2)
    expect(parseResult[0]).toEqual({ tag: 'div[data-zenos-video="true"]' })
    expect(parseResult[1]).toMatchObject({ tag: 'video' })

    const rendered = videoConfig.renderHTML({
      HTMLAttributes: { src: '/video.mp4' },
    })
    expect(rendered[0]).toBe('div')
    expect(rendered[1]).toMatchObject({
      'data-zenos-video': 'true',
      class: expect.any(String),
      style: expect.any(String),
    })
    expect(rendered[2]).toEqual([
      'video',
      expect.objectContaining({
        src: '/video.mp4',
        controls: 'true',
        preload: 'metadata',
      }),
    ])
  })
  */
})
