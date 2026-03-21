import { describe, expect, it } from 'vitest'
import { FontSize } from '../../../../src/components/editor/extensions/FontSize'

describe('FontSize extension', () => {
  it('exposes textStyle global attribute with parser and renderer', () => {
    const attrs = (FontSize as any).config.addGlobalAttributes()
    expect(attrs).toHaveLength(1)
    expect(attrs[0].types).toEqual(['textStyle'])

    const fontSizeAttr = attrs[0].attributes.fontSize
    const el = document.createElement('span')
    el.style.fontSize = '18px'

    expect(fontSizeAttr.parseHTML(el)).toBe('18px')
    expect(fontSizeAttr.renderHTML({ fontSize: null })).toEqual({})
    expect(fontSizeAttr.renderHTML({ fontSize: '20px' })).toEqual({
      style: 'font-size: 20px',
    })
  })
})
