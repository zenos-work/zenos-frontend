import { describe, expect, it } from 'vitest'
import { PrivateNote } from '../../../../src/components/editor/extensions/PrivateNote'

type PrivateNoteConfig = {
  parseHTML: () => Array<{ tag: string }>
  renderHTML: (args: {
    HTMLAttributes: Record<string, unknown>
  }) => [string, Record<string, unknown>, ...unknown[]]
}

const asPrivateNoteConfig = (extension: unknown): PrivateNoteConfig => {
  const extensionWithConfig = extension as { config: PrivateNoteConfig }
  return extensionWithConfig.config
}

describe('PrivateNote mark', () => {
  it('parses and renders private-note markup', () => {
    const privateNoteConfig = asPrivateNoteConfig(PrivateNote)
    const parsed = privateNoteConfig.parseHTML()
    expect(parsed).toEqual([{ tag: 'span[data-private-note="true"]' }])

    const rendered = privateNoteConfig.renderHTML({
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
