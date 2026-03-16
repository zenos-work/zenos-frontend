import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import { useEffect } from 'react'

interface Props {
  content:  string
  onChange: (value: string) => void
}

export default function Editor({ content, onChange }: Props) {
  const editor = useEditor({
    extensions: [StarterKit],
    content:    '',
    editorProps: {
      attributes: {
        class: [
          'prose prose-invert prose-lg max-w-none',
          'min-h-[400px] outline-none focus:outline-none',
          'prose-headings:text-white prose-p:text-gray-300',
          'prose-code:text-green-400 prose-code:bg-gray-800/70',
          'prose-pre:bg-gray-950 prose-pre:border prose-pre:border-gray-700',
        ].join(' '),
      },
    },
    onUpdate: ({ editor }) => {
      onChange(JSON.stringify(editor.getJSON()))
    },
  })

  // Load initial content when editing existing article
  useEffect(() => {
    if (!editor || !content) return
    const current = JSON.stringify(editor.getJSON())
    if (current === content) return
    try {
      editor.commands.setContent(JSON.parse(content))
    } catch {
      editor.commands.setContent(content)
    }
  }, [editor, content])

  return (
    <div className='bg-gray-900/50 rounded-xl border border-gray-800 p-6 focus-within:border-gray-700 transition-colors'>
      <EditorContent editor={editor} />
    </div>
  )
}
