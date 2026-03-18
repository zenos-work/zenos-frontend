import { create } from 'zustand'
import type { Tag } from '../types'

interface EditorState {
  articleId?:     string   // set when editing existing article
  title:          string
  subtitle:       string
  content:        string   // TipTap JSON string
  coverImageUrl:  string
  selectedTags:   Tag[]
  isDirty:        boolean
  isSaving:       boolean
  previewMode:    boolean

  setArticleId:   (id: string) => void
  setTitle:       (v: string) => void
  setSubtitle:    (v: string) => void
  setContent:     (v: string) => void
  setCoverImage:  (url: string) => void
  toggleTag:      (tag: Tag) => void
  setSelectedTags:(tags: Tag[]) => void
  hydrate:        (data: {
    articleId?: string
    title: string
    subtitle: string
    content: string
    coverImageUrl: string
    selectedTags: Tag[]
  }) => void
  markSaved:      () => void
  togglePreview:  () => void
  setIsSaving:    (v: boolean) => void
  reset:          () => void
}

const INITIAL = {
  articleId:    undefined as string | undefined,
  title:        '',
  subtitle:     '',
  content:      '',
  coverImageUrl:'',
  selectedTags: [] as Tag[],
  isDirty:      false,
  isSaving:     false,
  previewMode:  false,
}

export const useEditorStore = create<EditorState>((set) => ({
  ...INITIAL,

  setArticleId:   (articleId) => set({ articleId }),
  setTitle:       (title) => set({ title, isDirty: true }),
  setSubtitle:    (subtitle) => set({ subtitle, isDirty: true }),
  setContent:     (content) => set({ content, isDirty: true }),
  setCoverImage:  (coverImageUrl) => set({ coverImageUrl, isDirty: true }),

  toggleTag: (tag) => set(s => ({
    isDirty: true,
    selectedTags: s.selectedTags.find(t => t.id === tag.id)
      ? s.selectedTags.filter(t => t.id !== tag.id)
      : [...s.selectedTags, tag],
  })),

  setSelectedTags: (selectedTags) => set({ selectedTags, isDirty: true }),
  hydrate: (data) => set({
    articleId: data.articleId,
    title: data.title,
    subtitle: data.subtitle,
    content: data.content,
    coverImageUrl: data.coverImageUrl,
    selectedTags: data.selectedTags,
    isDirty: false,
  }),
  markSaved:       () => set({ isDirty: false }),
  togglePreview:   () => set(s => ({ previewMode: !s.previewMode })),
  setIsSaving:     (isSaving) => set({ isSaving }),
  reset:           () => set({ ...INITIAL }),
}))
