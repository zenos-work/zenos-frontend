import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Image from '@tiptap/extension-image'
import { TextStyle } from '@tiptap/extension-text-style'
import { useEffect } from 'react'
import { FontSize } from './extensions/FontSize'
import { PrivateNote } from './extensions/PrivateNote'
import { IframeEmbed/*, VideoEmbed*/ } from './extensions/EmbedNodes'
// import { SurveyExtension } from './extensions/SurveyExtension'
// import { ChartExtension } from './extensions/ChartExtension'

interface Props { title: string; content: string }

export default function PreviewPane({ title, content }: Props) {
  const editor = useEditor({
    extensions: [
      StarterKit,
      Image,
      // VideoEmbed,
      IframeEmbed,
      // Youtube,
      TextStyle,
      FontSize,
      PrivateNote,
      // SurveyExtension,
      // ChartExtension,
    ],
    editable:   false,
    content:    '',
    editorProps: {
      attributes: {
        class: [
          "font-[Georgia,'Times New Roman',serif]",
          'prose prose-lg max-w-none',
          'prose-headings:text-gray-900 prose-p:text-gray-800',
          'prose-code:text-emerald-900 prose-code:bg-emerald-100/80 prose-code:px-1 prose-code:py-0.5 prose-code:rounded',
          'prose-pre:bg-slate-900 prose-pre:text-slate-200 prose-pre:border prose-pre:border-slate-700',
          'prose-img:rounded-xl prose-img:w-full prose-img:h-auto',
        ].join(' '),
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
      <div className='pb-4 border-b border-gray-300'>
        <p className='text-xs text-gray-500 uppercase tracking-wider mb-3'>Preview</p>
        {title && <h1 className='text-2xl font-bold text-gray-900'>{title}</h1>}
      </div>
      <EditorContent editor={editor} />
    </div>
  )
}
