import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Image from '@tiptap/extension-image'
import { TextStyle } from '@tiptap/extension-text-style'
import TextAlign from '@tiptap/extension-text-align'
import Placeholder from '@tiptap/extension-placeholder'
import Youtube from '@tiptap/extension-youtube'
import { useEffect, useMemo, useRef, useState, type MouseEvent } from 'react'
import {
  Plus,
  ImagePlus,
  Code,
  Video,
  Link2,
  Search,
  Bold,
  Italic,
  Underline as UnderlineIcon,
  Quote,
  Minus,
  Type,
  StickyNote,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
} from 'lucide-react'
import { FontSize } from './extensions/FontSize'
import { PrivateNote } from './extensions/PrivateNote'
import { IframeEmbed, VideoEmbed } from './extensions/EmbedNodes'

interface Props {
  content:  string
  onChange: (value: string) => void
  onInlineImageUpload?: (file: File) => Promise<string>
  onInlineVideoUpload?: (file: File) => Promise<string>
}

const FIXED_EDITOR_FONT = `font-[Georgia,'Times New Roman',serif]`
const FONT_STEPS = [14, 16, 18, 20, 24]

type CursorAnchor = {
  top: number
}

type SelectionToolbarAnchor = {
  top: number
  left: number
}

function toVimeoEmbed(url: URL): string | null {
  const match = url.pathname.match(/\/(\d+)/)
  if (!match) return null
  return `https://player.vimeo.com/video/${match[1]}`
}

function toDailymotionEmbed(url: URL): string | null {
  if (url.hostname === 'dai.ly') {
    const id = url.pathname.replace('/', '')
    return id ? `https://www.dailymotion.com/embed/video/${id}` : null
  }
  const match = url.pathname.match(/\/video\/([^_/?]+)/)
  if (!match) return null
  return `https://www.dailymotion.com/embed/video/${match[1]}`
}

function getNextFontSize(current: number, increase: boolean): number {
  const idx = FONT_STEPS.findIndex(v => v >= current)
  if (increase) {
    if (idx === -1) return FONT_STEPS[FONT_STEPS.length - 1]
    return FONT_STEPS[Math.min(idx + 1, FONT_STEPS.length - 1)]
  }
  if (idx === -1) return FONT_STEPS[FONT_STEPS.length - 1]
  return FONT_STEPS[Math.max(idx - 1, 0)]
}

export default function Editor({
  content,
  onChange,
  onInlineImageUpload,
  onInlineVideoUpload,
}: Props) {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const imageInputRef = useRef<HTMLInputElement | null>(null)
  const videoInputRef = useRef<HTMLInputElement | null>(null)

  const [showInsertMenu, setShowInsertMenu] = useState(false)
  const [showUnsplashPicker, setShowUnsplashPicker] = useState(false)
  const [unsplashQuery, setUnsplashQuery] = useState('')
  const [cursorAnchor, setCursorAnchor] = useState<CursorAnchor>({ top: 36 })
  const [hasTextSelection, setHasTextSelection] = useState(false)
  const [selectionToolbarAnchor, setSelectionToolbarAnchor] = useState<SelectionToolbarAnchor>({ top: 8, left: 0 })

  const unsplashCandidates = useMemo(() => {
    const q = (unsplashQuery || 'writing desk').trim()
    return Array.from({ length: 8 }, (_, i) =>
      `https://source.unsplash.com/featured/1200x800/?${encodeURIComponent(q)}&sig=${i + 1}`,
    )
  }, [unsplashQuery])

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        link: {
          openOnClick: false,
          autolink: true,
          HTMLAttributes: {
            class: 'text-blue-700 underline underline-offset-2',
            rel: 'noopener noreferrer nofollow',
          },
        },
      }),
      Placeholder.configure({
        placeholder: 'Type here. Use the + button to insert media, embeds, and code blocks.',
      }),
      Image.configure({
        inline: false,
        allowBase64: false,
        HTMLAttributes: {
          class: 'my-3 rounded-xl w-full h-auto',
          loading: 'lazy',
        },
      }),
      VideoEmbed,
      Youtube.configure({
        controls: true,
        nocookie: true,
        width: 860,
        height: 484,
        HTMLAttributes: {
          class: 'my-3 w-full rounded-lg border border-gray-300/40',
        },
      }),
      IframeEmbed,
      TextStyle,
      FontSize,
      PrivateNote,
      TextAlign.configure({
        types: ['heading', 'paragraph'],
      }),
    ],
    content:    '',
    editorProps: {
      attributes: {
        class: [
          FIXED_EDITOR_FONT,
          'prose prose-lg max-w-none',
          'min-h-[420px] outline-none focus:outline-none',
          'prose-headings:text-gray-900 prose-p:text-gray-800 prose-p:leading-8',
          'prose-code:text-emerald-900 prose-code:bg-emerald-100/80 prose-code:px-1 prose-code:py-0.5 prose-code:rounded',
          'prose-pre:bg-slate-900 prose-pre:text-slate-200 prose-pre:border prose-pre:border-slate-700',
          'prose-blockquote:border-l-slate-500 prose-blockquote:text-slate-700',
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

  useEffect(() => {
    if (!editor || !containerRef.current) return

    const syncCursorAnchor = () => {
      const root = containerRef.current
      if (!root || editor.isDestroyed || !editor.view?.dom?.isConnected) return
      const { from, to } = editor.state.selection
      let start
      let end
      try {
        start = editor.view.coordsAtPos(from)
        end = editor.view.coordsAtPos(to)
      } catch {
        return
      }

      const rect = root.getBoundingClientRect()
      setCursorAnchor({ top: Math.max(16, start.top - rect.top - 12) })

      const selected = from !== to
      setHasTextSelection(selected)
      if (selected) {
        const centerX = (start.left + end.right) / 2
        setSelectionToolbarAnchor({
          top: Math.max(8, start.top - rect.top - 52),
          left: centerX - rect.left,
        })
      }
    }

    syncCursorAnchor()
    editor.on('selectionUpdate', syncCursorAnchor)
    editor.on('focus', syncCursorAnchor)
    editor.on('transaction', syncCursorAnchor)
    return () => {
      editor.off('selectionUpdate', syncCursorAnchor)
      editor.off('focus', syncCursorAnchor)
      editor.off('transaction', syncCursorAnchor)
    }
  }, [editor])

  const handleInlineImagePick = async (file: File | undefined) => {
    if (!file || !editor || !onInlineImageUpload) return
    try {
      const url = await onInlineImageUpload(file)
      editor.chain().focus().setImage({ src: url, alt: file.name }).run()
    } finally {
      if (imageInputRef.current) imageInputRef.current.value = ''
    }
  }

  const handleInlineVideoPick = async (file: File | undefined) => {
    if (!file || !editor) return
    try {
      const src = onInlineVideoUpload
        ? await onInlineVideoUpload(file)
        : URL.createObjectURL(file)

      editor
        .chain()
        .focus()
        .insertContent({
          type: 'videoEmbed',
          attrs: {
            src,
            title: file.name,
          },
        })
        .insertContent({ type: 'paragraph' })
        .run()
    } finally {
      if (videoInputRef.current) videoInputRef.current.value = ''
    }
  }

  const insertCodeBlock = () => {
    if (!editor) return
    editor.chain().focus().toggleCodeBlock().run()
    setShowInsertMenu(false)
  }

  const insertParagraph = () => {
    if (!editor) return
    editor.chain().focus().insertContent({ type: 'paragraph' }).run()
    setShowInsertMenu(false)
  }

  const insertFromUnsplash = (src: string) => {
    if (!editor) return
    editor.chain().focus().setImage({ src, alt: unsplashQuery || 'Unsplash image' }).run()
    setShowUnsplashPicker(false)
    setShowInsertMenu(false)
  }

  const insertVideoByUrl = () => {
    if (!editor) return
    const raw = window.prompt('Paste a video URL (YouTube, Vimeo, Dailymotion):')?.trim()
    if (!raw) return

    try {
      const u = new URL(raw)
      const host = u.hostname.replace('www.', '')

      if (host.includes('youtube.com') || host.includes('youtu.be')) {
        editor.chain().focus().setYoutubeVideo({ src: raw }).insertContent({ type: 'paragraph' }).run()
      } else if (host.includes('vimeo.com')) {
        const src = toVimeoEmbed(u)
        if (!src) throw new Error('Unsupported Vimeo URL')
        editor.chain().focus().insertContent({ type: 'iframeEmbed', attrs: { src, title: 'Vimeo video' } }).insertContent({ type: 'paragraph' }).run()
      } else if (host.includes('dailymotion.com') || host.includes('dai.ly')) {
        const src = toDailymotionEmbed(u)
        if (!src) throw new Error('Unsupported Dailymotion URL')
        editor.chain().focus().insertContent({ type: 'iframeEmbed', attrs: { src, title: 'Dailymotion video' } }).insertContent({ type: 'paragraph' }).run()
      } else {
        throw new Error('Only YouTube, Vimeo, and Dailymotion are supported')
      }

      setShowInsertMenu(false)
    } catch (e) {
      window.alert(e instanceof Error ? e.message : 'Invalid video URL')
    }
  }

  const insertGenericEmbed = () => {
    if (!editor) return
    const raw = window.prompt('Paste an embeddable URL:')?.trim()
    if (!raw) return
    editor.chain().focus().insertContent({ type: 'iframeEmbed', attrs: { src: raw, title: 'Embedded content' } }).insertContent({ type: 'paragraph' }).run()
    setShowInsertMenu(false)
  }

  const applyFontSize = (increase: boolean) => {
    if (!editor) return
    const current = Number.parseInt(String(editor.getAttributes('textStyle').fontSize || '16').replace('px', ''), 10)
    const next = getNextFontSize(Number.isNaN(current) ? 16 : current, increase)
    editor.chain().focus().setMark('textStyle', { fontSize: `${next}px` }).run()
  }

  const applyLink = () => {
    if (!editor) return
    const current = editor.getAttributes('link').href as string | undefined
    const url = window.prompt('Add hyperlink URL', current || 'https://')
    if (url === null) return
    if (!url.trim()) {
      editor.chain().focus().unsetLink().run()
      return
    }
    editor.chain().focus().setLink({ href: url.trim() }).run()
  }

  const preserveSelectionMouseDown = (e: MouseEvent<HTMLButtonElement>) => {
    e.preventDefault()
  }

  return (
    <div
      ref={containerRef}
      className='relative rounded-xl border border-[color:var(--border)] bg-[color:var(--surface-0)] p-6 shadow-sm transition-colors focus-within:border-[color:var(--accent)]'
    >
      {editor && hasTextSelection && (
        <div
          className='absolute z-20 flex -translate-x-1/2 items-center gap-1 rounded-lg border border-[color:var(--border-strong)] bg-[color:var(--surface-0)] p-1 shadow-xl text-[color:var(--text-primary)]'
          style={{ top: `${selectionToolbarAnchor.top}px`, left: `${selectionToolbarAnchor.left}px` }}
        >
          <button type='button' className='rounded px-2 py-1 hover:bg-[color:var(--surface-2)]' onMouseDown={preserveSelectionMouseDown} onClick={() => editor.chain().focus().toggleBold().run()}>
            <Bold size={14} />
          </button>
          <button type='button' className='rounded px-2 py-1 hover:bg-[color:var(--surface-2)]' onMouseDown={preserveSelectionMouseDown} onClick={() => editor.chain().focus().toggleItalic().run()}>
            <Italic size={14} />
          </button>
          <button type='button' className='rounded px-2 py-1 hover:bg-[color:var(--surface-2)]' onMouseDown={preserveSelectionMouseDown} onClick={() => editor.chain().focus().toggleUnderline().run()}>
            <UnderlineIcon size={14} />
          </button>
          <button type='button' className='rounded px-2 py-1 hover:bg-[color:var(--surface-2)]' onMouseDown={preserveSelectionMouseDown} onClick={applyLink}>
            <Link2 size={14} />
          </button>
          <button type='button' className='rounded px-2 py-1 hover:bg-[color:var(--surface-2)]' onMouseDown={preserveSelectionMouseDown} onClick={() => editor.chain().focus().toggleBlockquote().run()}>
            <Quote size={14} />
          </button>
          <button
            type='button'
            className='rounded px-2 py-1 hover:bg-amber-100'
            onMouseDown={preserveSelectionMouseDown}
            onClick={() => editor.chain().focus().toggleMark('privateNote').run()}
            title='Private note'
          >
            <StickyNote size={14} />
          </button>
          <button type='button' className='rounded px-2 py-1 hover:bg-[color:var(--surface-2)]' onMouseDown={preserveSelectionMouseDown} onClick={() => applyFontSize(false)}>
            <Minus size={14} />
          </button>
          <button type='button' className='rounded px-2 py-1 hover:bg-[color:var(--surface-2)] text-[color:var(--text-primary)]' onMouseDown={preserveSelectionMouseDown} onClick={() => applyFontSize(true)}>
            <Type size={14} />
          </button>
          <button type='button' className='rounded px-2 py-1 hover:bg-[color:var(--surface-2)]' onMouseDown={preserveSelectionMouseDown} onClick={() => editor.chain().focus().setTextAlign('left').run()} title='Align left'>
            <AlignLeft size={14} />
          </button>
          <button type='button' className='rounded px-2 py-1 hover:bg-[color:var(--surface-2)]' onMouseDown={preserveSelectionMouseDown} onClick={() => editor.chain().focus().setTextAlign('center').run()} title='Align center'>
            <AlignCenter size={14} />
          </button>
          <button type='button' className='rounded px-2 py-1 hover:bg-[color:var(--surface-2)]' onMouseDown={preserveSelectionMouseDown} onClick={() => editor.chain().focus().setTextAlign('right').run()} title='Align right'>
            <AlignRight size={14} />
          </button>
          <button type='button' className='rounded px-2 py-1 hover:bg-[color:var(--surface-2)]' onMouseDown={preserveSelectionMouseDown} onClick={() => editor.chain().focus().setTextAlign('justify').run()} title='Justify'>
            <AlignJustify size={14} />
          </button>
        </div>
      )}

      <div className='absolute -left-5 z-20' style={{ top: `${cursorAnchor.top}px` }}>
        <button
          type='button'
          onClick={() => setShowInsertMenu(v => !v)}
          className='grid h-8 w-8 place-items-center rounded-full border border-[color:var(--border-strong)] bg-[color:var(--surface-0)] text-[color:var(--text-primary)] shadow-sm hover:bg-[color:var(--surface-2)]'
          title='Insert block'
        >
          <Plus size={16} />
        </button>

        {showInsertMenu && (
          <div className='mt-2 flex items-center gap-2 rounded-full border border-[color:var(--border-strong)] bg-[color:var(--surface-0)] p-2 shadow-lg'>
            <button type='button' onClick={insertParagraph} className='rounded-full border border-[color:var(--border-strong)] p-2 text-[color:var(--text-primary)] hover:bg-[color:var(--surface-2)]' title='Add paragraph'>
              <Plus size={14} />
            </button>
            <button type='button' onClick={() => imageInputRef.current?.click()} className='rounded-full border border-[color:var(--border-strong)] p-2 text-[color:var(--text-primary)] hover:bg-[color:var(--surface-2)]' title='Image from device'>
              <ImagePlus size={14} />
            </button>
            <button type='button' onClick={() => { setShowUnsplashPicker(v => !v); setUnsplashQuery(editor?.state.doc.textBetween(editor.state.selection.from, editor.state.selection.to, ' ') || '') }} className='rounded-full border border-[color:var(--border-strong)] p-2 text-[color:var(--text-primary)] hover:bg-[color:var(--surface-2)]' title='Search Unsplash image'>
              <Search size={14} />
            </button>
            <button type='button' onClick={() => videoInputRef.current?.click()} className='rounded-full border border-[color:var(--border-strong)] p-2 text-[color:var(--text-primary)] hover:bg-[color:var(--surface-2)]' title='Video from device'>
              <Video size={14} />
            </button>
            <button type='button' onClick={insertVideoByUrl} className='rounded-full border border-[color:var(--border-strong)] p-2 text-[color:var(--text-primary)] hover:bg-[color:var(--surface-2)]' title='YouTube/Vimeo/Dailymotion URL'>
              <Link2 size={14} />
            </button>
            <button type='button' onClick={insertCodeBlock} className='rounded-full border border-[color:var(--border-strong)] p-2 text-[color:var(--text-primary)] hover:bg-[color:var(--surface-2)]' title='Code block'>
              <Code size={14} />
            </button>
            <button type='button' onClick={insertGenericEmbed} className='rounded-full border border-[color:var(--border-strong)] p-2 text-[color:var(--text-primary)] hover:bg-[color:var(--surface-2)]' title='Embed item'>
              {'<>'}
            </button>
          </div>
        )}
      </div>

      {showUnsplashPicker && (
        <div className='absolute left-10 top-4 z-20 w-[760px] max-w-[90%] rounded-xl border border-slate-300 bg-white p-4 shadow-2xl'>
          <div className='mb-3 flex items-center gap-3'>
            <input
              value={unsplashQuery}
              onChange={e => setUnsplashQuery(e.target.value)}
              placeholder='Search Unsplash images...'
              className='w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-emerald-500'
            />
            <button type='button' onClick={() => setShowUnsplashPicker(false)} className='rounded-md border border-slate-300 px-3 py-2 text-sm'>Close</button>
          </div>
          <div className='grid grid-cols-2 gap-3 md:grid-cols-4'>
            {unsplashCandidates.map(url => (
              <button key={url} type='button' onClick={() => insertFromUnsplash(url)} className='overflow-hidden rounded-lg border border-slate-200'>
                <img src={url} alt='Unsplash option' className='h-24 w-full object-cover' loading='lazy' />
              </button>
            ))}
          </div>
        </div>
      )}

      <input
        ref={imageInputRef}
        type='file'
        accept='image/*'
        className='hidden'
        onChange={e => void handleInlineImagePick(e.target.files?.[0])}
      />
      <input
        ref={videoInputRef}
        type='file'
        accept='video/*'
        className='hidden'
        onChange={e => void handleInlineVideoPick(e.target.files?.[0])}
      />
      <EditorContent editor={editor} />
    </div>
  )
}
