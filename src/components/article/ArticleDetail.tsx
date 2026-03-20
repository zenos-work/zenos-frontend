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
          "font-[Georgia,'Times New Roman',serif]",
          'prose prose-lg max-w-none',
          'prose-headings:text-gray-900 prose-p:text-gray-800',
          'prose-a:text-blue-700 prose-strong:text-gray-950',
          'prose-code:text-emerald-900 prose-code:bg-emerald-100/80 prose-code:px-1 prose-code:py-0.5 prose-code:rounded',
          'prose-pre:bg-slate-900 prose-pre:text-slate-200 prose-pre:border prose-pre:border-slate-700',
          'prose-blockquote:border-l-slate-500 prose-blockquote:text-slate-700',
          'prose-img:rounded-xl prose-img:w-full prose-img:h-auto',
        ].join(' '),
      },
    },
  })

  return <EditorContent editor={editor} />
}
