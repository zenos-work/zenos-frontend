import { Node, mergeAttributes } from '@tiptap/core'

export const IframeEmbed = Node.create({
  name: 'iframeEmbed',
  group: 'block',
  atom: true,

  addAttributes() {
    return {
      src: { default: null },
      title: { default: 'Embedded media' },
      height: { default: 420 },
    }
  },

  parseHTML() {
    return [{ tag: 'iframe[data-embed="true"]' }]
  },

  renderHTML({ HTMLAttributes }: { HTMLAttributes: Record<string, unknown> }) {
    return [
      'iframe',
      mergeAttributes(HTMLAttributes, {
        'data-embed': 'true',
        class: 'my-3 w-full rounded-lg border border-gray-300/40',
        allowfullscreen: 'true',
        loading: 'lazy',
      }),
    ]
  },
})

export const VideoEmbed = Node.create({
  name: 'videoEmbed',
  group: 'block',
  atom: true,

  addAttributes() {
    return {
      src: { default: null },
      title: { default: 'Uploaded video' },
    }
  },

  parseHTML() {
    return [{ tag: 'video[data-embed-video="true"]' }]
  },

  renderHTML({ HTMLAttributes }: { HTMLAttributes: Record<string, unknown> }) {
    return [
      'video',
      mergeAttributes(HTMLAttributes, {
        'data-embed-video': 'true',
        class: 'my-3 w-full rounded-lg border border-gray-300/40 bg-black',
        controls: 'true',
        preload: 'metadata',
      }),
    ]
  },
})
