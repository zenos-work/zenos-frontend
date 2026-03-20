import { Mark, mergeAttributes } from '@tiptap/core'

export const PrivateNote = Mark.create({
  name: 'privateNote',

  parseHTML() {
    return [{ tag: 'span[data-private-note="true"]' }]
  },

  renderHTML({ HTMLAttributes }) {
    return [
      'span',
      mergeAttributes(HTMLAttributes, {
        'data-private-note': 'true',
        class: 'rounded bg-amber-200/70 px-1 py-0.5 text-amber-950',
      }),
      0,
    ]
  },
})
