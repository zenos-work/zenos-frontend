import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Image from '@tiptap/extension-image'

// Render TipTap JSON content in read-only mode
export default function ArticleDetail({ content }: { content: string }) {
  const editor = useEditor({
    extensions: [StarterKit, Image],
    editable:   false,
    content:    (() => {
      try { return JSON.parse(content) } catch { return content }
    })(),
    editorProps: {
      attributes: {
        class: [
          'prose prose-invert prose-lg max-w-none',
          'prose-headings:text-white prose-p:text-gray-300',
          'prose-a:text-blue-400 prose-strong:text-white',
          'prose-code:text-green-400 prose-code:bg-gray-800',
          'prose-pre:bg-gray-900 prose-pre:border prose-pre:border-gray-800',
          'prose-blockquote:border-l-blue-500 prose-blockquote:text-gray-400',
          'prose-img:rounded-xl prose-img:w-full prose-img:h-auto',
        ].join(' '),
      },
    },
  })

  return <EditorContent editor={editor} />
}
