import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import { useEffect } from 'react'

interface Props { title: string; content: string }

export default function PreviewPane({ title, content }: Props) {
  const editor = useEditor({
    extensions: [StarterKit],
    editable:   false,
    content:    '',
    editorProps: {
      attributes: {
        class: 'prose prose-invert prose-lg max-w-none',
      },
    },
  })

  useEffect(() => {
    if (!editor || !content) return
    try { editor.commands.setContent(JSON.parse(content)) }
    catch { editor.commands.setContent(content) }
  }, [editor, content])

  return (
    <div className='space-y-4'>
      <div className='pb-4 border-b border-gray-800'>
        <p className='text-xs text-gray-600 uppercase tracking-wider mb-3'>Preview</p>
        {title && <h1 className='text-2xl font-bold text-white'>{title}</h1>}
      </div>
      <EditorContent editor={editor} />
    </div>
  )
}
