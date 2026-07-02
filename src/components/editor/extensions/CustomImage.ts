import Image from '@tiptap/extension-image'
import { mergeAttributes } from '@tiptap/core'

export const CustomImage = Image.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      width: {
        default: '100%',
        parseHTML: (element: HTMLElement) => element.getAttribute('width') || element.style.width || '100%',
        renderHTML: (attributes: Record<string, any>) => ({
          width: attributes.width,
        }),
      },
      alignment: {
        default: 'center',
        parseHTML: (element: HTMLElement) => element.getAttribute('data-alignment') || 'center',
        renderHTML: (attributes: Record<string, any>) => ({
          'data-alignment': attributes.alignment,
        }),
      },
    }
  },

  renderHTML({ HTMLAttributes }: { HTMLAttributes: Record<string, any> }) {
    const { width, alignment } = HTMLAttributes
    let style = `width: ${width || '100%'}; max-width: 100%; height: auto;`
    let className = 'my-3 rounded-xl'

    if (alignment === 'left') {
      style += ' float: left; margin-right: 1.5rem; margin-bottom: 0.5rem; clear: left;'
      className += ' align-left'
    } else if (alignment === 'right') {
      style += ' float: right; margin-left: 1.5rem; margin-bottom: 0.5rem; clear: right;'
      className += ' align-right'
    } else if (alignment === 'inline') {
      style += ' display: inline-block; vertical-align: top; margin: 0.5rem;'
      className += ' align-inline'
    } else {
      style += ' display: block; margin-left: auto; margin-right: auto; clear: both;'
      className += ' align-center'
    }

    return [
      'img',
      mergeAttributes(
        this.options.HTMLAttributes,
        HTMLAttributes,
        {
          style,
          class: className.trim(),
        }
      )
    ]
  }
})
