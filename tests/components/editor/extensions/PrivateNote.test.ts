import { describe, expect, it } from 'vitest'
import { PrivateNote } from '../../../../src/components/editor/extensions/PrivateNote'

describe('PrivateNote mark', () => {
  it('parses and renders private-note markup', () => {
    const parsed = (PrivateNote as any).config.parseHTML()
    expect(parsed).toEqual([{ tag: 'span[data-private-note="true"]' }])

    const rendered = (PrivateNote as any).config.renderHTML({
      HTMLAttributes: { title: 'internal' },
    })

    expect(rendered[0]).toBe('span')
    expect(rendered[1]).toMatchObject({
      title: 'internal',
      'data-private-note': 'true',
    })
    expect(rendered[2]).toBe(0)
  })
})
