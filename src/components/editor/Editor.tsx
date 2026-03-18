import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Image from '@tiptap/extension-image'
import { useEffect, useRef, useState } from 'react'

interface Props {
  content:  string
  onChange: (value: string) => void
  onInlineImageUpload?: (file: File) => Promise<string>
}

export default function Editor({ content, onChange, onInlineImageUpload }: Props) {
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const [isUploadingImage, setIsUploadingImage] = useState(false)

  const editor = useEditor({
    extensions: [
      StarterKit,
      Image.configure({
        inline: false,
        allowBase64: false,
        HTMLAttributes: {
          class: 'rounded-xl w-full h-auto',
          loading: 'lazy',
        },
      }),
    ],
    content:    '',
    editorProps: {
      attributes: {
        class: [
          'prose prose-invert prose-lg max-w-none',
          'min-h-[400px] outline-none focus:outline-none',
          'prose-headings:text-white prose-p:text-gray-300',
          'prose-code:text-green-400 prose-code:bg-gray-800/70',
          'prose-pre:bg-gray-950 prose-pre:border prose-pre:border-gray-700',
          'prose-img:rounded-xl prose-img:w-full prose-img:h-auto',
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

  const handleInlineImagePick = async (file: File | undefined) => {
    if (!file || !editor || !onInlineImageUpload) return
    try {
      setIsUploadingImage(true)
      const url = await onInlineImageUpload(file)
      editor.chain().focus().setImage({ src: url, alt: file.name }).run()
    } finally {
      setIsUploadingImage(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  return (
    <div className='bg-gray-900/50 rounded-xl border border-gray-800 p-6 focus-within:border-gray-700 transition-colors'>
      <div className='mb-4 flex items-center gap-3'>
        <button
          type='button'
          onClick={() => fileInputRef.current?.click()}
          disabled={!onInlineImageUpload || isUploadingImage}
          className='rounded-md border border-gray-700 px-3 py-1.5 text-xs text-gray-300 hover:bg-gray-800 disabled:opacity-60 disabled:cursor-not-allowed transition-colors'
        >
          {isUploadingImage ? 'Uploading image...' : 'Insert image'}
        </button>
        <span className='text-xs text-gray-500'>Adds image at cursor position</span>
        <input
          ref={fileInputRef}
          type='file'
          accept='image/*'
          className='hidden'
          onChange={e => void handleInlineImagePick(e.target.files?.[0])}
        />
      </div>
      <EditorContent editor={editor} />
    </div>
  )
}
