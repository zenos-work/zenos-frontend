import { Node, mergeAttributes } from '@tiptap/core';

export const IframeEmbed = Node.create({
  name: 'iframeEmbed',
  group: 'block',
  atom: true,

  addAttributes() {
    return {
      src: { default: null },
      title: { default: 'Embedded media' },
    };
  },

  parseHTML() {
    return [
      { tag: 'div[data-zenos-embed="true"]' },
      { tag: 'iframe', getAttrs: (node: string | HTMLElement) => (node as HTMLElement).getAttribute('data-embed') === 'true' && null }
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      'div',
      {
        'data-zenos-embed': 'true',
        class: 'video-block-wrapper my-8 w-full relative overflow-hidden rounded-xl border border-gray-400 bg-black shadow-lg',
        style: 'aspect-ratio: 16/9; min-height: 300px; display: block;'
      },
      [
        'iframe',
        mergeAttributes(HTMLAttributes, {
          class: 'absolute inset-0 w-full h-full border-0',
          allowfullscreen: 'true',
          loading: 'lazy',
        })
      ],
      ['div', { class: 'absolute bottom-2 left-2 px-2 py-1 bg-black/50 text-[10px] text-white rounded pointer-events-none' }, HTMLAttributes.title || 'External Embed']
    ];
  },
});

export const VideoEmbed = Node.create({
  name: 'videoEmbed',
  group: 'block',
  atom: true,

  addAttributes() {
    return {
      src: { default: null },
      title: { default: 'Uploaded video' },
    };
  },

  parseHTML() {
    return [
      { tag: 'div[data-zenos-video="true"]' },
      { tag: 'video', getAttrs: (node: string | HTMLElement) => (node as HTMLElement).getAttribute('data-embed-video') === 'true' && null }
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      'div',
      {
        'data-zenos-video': 'true',
        class: 'video-block-wrapper my-8 w-full relative overflow-hidden rounded-xl border border-gray-400 bg-black shadow-lg',
        style: 'aspect-ratio: 16/9; min-height: 300px; display: block;'
      },
      [
        'video',
        mergeAttributes(HTMLAttributes, {
          class: 'absolute inset-0 w-full h-full',
          controls: 'true',
          preload: 'metadata',
          playsinline: 'true',
        })
      ],
      ['div', { class: 'absolute bottom-2 left-2 px-2 py-1 bg-black/50 text-[10px] text-white rounded pointer-events-none' }, `Video: ${HTMLAttributes.title || 'Untitled'}`]
    ];
  },
});
