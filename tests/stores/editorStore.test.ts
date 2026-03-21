import { beforeEach, describe, expect, it } from 'vitest'
import { useEditorStore } from '../../src/stores/editorStore'

describe('editorStore', () => {
  beforeEach(() => {
    useEditorStore.getState().reset()
  })

  it('marks fields dirty when edited and can mark as saved', () => {
    useEditorStore.getState().setTitle('Draft title')
    expect(useEditorStore.getState().title).toBe('Draft title')
    expect(useEditorStore.getState().isDirty).toBe(true)

    useEditorStore.getState().markSaved()
    expect(useEditorStore.getState().isDirty).toBe(false)
  })

  it('toggles tags and preview mode', () => {
    const tag = { id: 't1', name: 'AI', slug: 'ai', article_count: 1 }

    useEditorStore.getState().toggleTag(tag)
    expect(useEditorStore.getState().selectedTags).toHaveLength(1)

    useEditorStore.getState().toggleTag(tag)
    expect(useEditorStore.getState().selectedTags).toHaveLength(0)

    const before = useEditorStore.getState().previewMode
    useEditorStore.getState().togglePreview()
    expect(useEditorStore.getState().previewMode).toBe(!before)
  })

  it('hydrates and resets state', () => {
    useEditorStore.getState().hydrate({
      articleId: 'a1',
      title: 'Hydrated',
      subtitle: 'Sub',
      content: '{"type":"doc"}',
      coverImageUrl: '/cover.png',
      selectedTags: [{ id: 't2', name: 'Cloud', slug: 'cloud', article_count: 2 }],
    })

    const state = useEditorStore.getState()
    expect(state.articleId).toBe('a1')
    expect(state.title).toBe('Hydrated')
    expect(state.isDirty).toBe(false)

    useEditorStore.getState().reset()
    expect(useEditorStore.getState().title).toBe('')
    expect(useEditorStore.getState().selectedTags).toHaveLength(0)
  })

  it('updates article fields and saving state through explicit setters', () => {
    useEditorStore.getState().setArticleId('article-42')
    useEditorStore.getState().setSubtitle('A concise subtitle')
    useEditorStore.getState().setContent('{"type":"doc","content":[]}')
    useEditorStore.getState().setCoverImage('/img/cover.jpg')
    useEditorStore.getState().setSelectedTags([
      { id: 't3', name: 'DevOps', slug: 'devops', article_count: 5 },
    ])
    useEditorStore.getState().setIsSaving(true)

    const state = useEditorStore.getState()
    expect(state.articleId).toBe('article-42')
    expect(state.subtitle).toBe('A concise subtitle')
    expect(state.content).toContain('"type":"doc"')
    expect(state.coverImageUrl).toBe('/img/cover.jpg')
    expect(state.selectedTags).toHaveLength(1)
    expect(state.isDirty).toBe(true)
    expect(state.isSaving).toBe(true)
  })
})
