import { create } from 'zustand'
import type { Tag } from '../types'

interface EditorState {
  articleId?:     string   // set when editing existing article
  title:          string
  subtitle:       string
  content:        string   // TipTap JSON string
  coverImageUrl:  string
  lastVerifiedAt: string
  expiresAt:      string
  seoTitle:       string
  seoDescription: string
  canonicalUrl:   string
  ogImageUrl:     string
  seoSchemaType:  'Article' | 'TechArticle' | 'HowTo'
  selectedTags:   Tag[]
  isDirty:        boolean
  isSaving:       boolean
  previewMode:    boolean

  setArticleId:   (id: string) => void
  setTitle:       (v: string) => void
  setSubtitle:    (v: string) => void
  setContent:     (v: string) => void
  setCoverImage:  (url: string) => void
  setLastVerifiedAt: (v: string) => void
  setExpiresAt: (v: string) => void
  setSeoTitle: (v: string) => void
  setSeoDescription: (v: string) => void
  setCanonicalUrl: (v: string) => void
  setOgImageUrl: (v: string) => void
  setSeoSchemaType: (v: 'Article' | 'TechArticle' | 'HowTo') => void
  toggleTag:      (tag: Tag) => void
  setSelectedTags:(tags: Tag[]) => void
  hydrate:        (data: {
    articleId?: string
    title: string
    subtitle: string
    content: string
    coverImageUrl: string
    lastVerifiedAt: string
    expiresAt: string
    seoTitle: string
    seoDescription: string
    canonicalUrl: string
    ogImageUrl: string
    seoSchemaType: 'Article' | 'TechArticle' | 'HowTo'
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
  lastVerifiedAt: '',
  expiresAt: '',
  seoTitle: '',
  seoDescription: '',
  canonicalUrl: '',
  ogImageUrl: '',
  seoSchemaType: 'Article' as 'Article' | 'TechArticle' | 'HowTo',
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
  setLastVerifiedAt: (lastVerifiedAt) => set({ lastVerifiedAt, isDirty: true }),
  setExpiresAt: (expiresAt) => set({ expiresAt, isDirty: true }),
  setSeoTitle: (seoTitle) => set({ seoTitle, isDirty: true }),
  setSeoDescription: (seoDescription) => set({ seoDescription, isDirty: true }),
  setCanonicalUrl: (canonicalUrl) => set({ canonicalUrl, isDirty: true }),
  setOgImageUrl: (ogImageUrl) => set({ ogImageUrl, isDirty: true }),
  setSeoSchemaType: (seoSchemaType) => set({ seoSchemaType, isDirty: true }),

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
    lastVerifiedAt: data.lastVerifiedAt,
    expiresAt: data.expiresAt,
    seoTitle: data.seoTitle,
    seoDescription: data.seoDescription,
    canonicalUrl: data.canonicalUrl,
    ogImageUrl: data.ogImageUrl,
    seoSchemaType: data.seoSchemaType,
    selectedTags: data.selectedTags,
    isDirty: false,
  }),
  markSaved:       () => set({ isDirty: false }),
  togglePreview:   () => set(s => ({ previewMode: !s.previewMode })),
  setIsSaving:     (isSaving) => set({ isSaving }),
  reset:           () => set({ ...INITIAL }),
}))
