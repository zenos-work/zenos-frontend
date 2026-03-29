import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Image from '@tiptap/extension-image'
import Link from '@tiptap/extension-link'
import Underline from '@tiptap/extension-underline'
import { TextStyle } from '@tiptap/extension-text-style'
import Youtube from '@tiptap/extension-youtube'
import { FontSize } from '../editor/extensions/FontSize'
import { PrivateNote } from '../editor/extensions/PrivateNote'
import { IframeEmbed, VideoEmbed } from '../editor/extensions/EmbedNodes'

// Render TipTap JSON content in read-only mode
export default function ArticleDetail({ content }: { content: string }) {
  const editor = useEditor({
    extensions: [
      StarterKit,
      Image,
      VideoEmbed,
      IframeEmbed,
      Youtube,
      Link,
      Underline,
      TextStyle,
      FontSize,
      PrivateNote,
    ],
    editable:   false,
    content:    (() => {
      try { return JSON.parse(content) } catch { return content }
    })(),
    editorProps: {
      attributes: {
        class: [
          'prose max-w-none',
          'prose-code:px-1 prose-code:py-0.5 prose-code:rounded',
          'prose-img:rounded-xl prose-img:w-full prose-img:h-auto',
        ].join(' '),
      },
    },
  })

  return <EditorContent editor={editor} />
}
