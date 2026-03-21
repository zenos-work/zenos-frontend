import { beforeEach, describe, expect, it, vi } from 'vitest'
import { useUiStore } from '../../src/stores/uiStore'

describe('uiStore', () => {
  beforeEach(() => {
    useUiStore.setState({ sidebarOpen: true, theme: 'light', toasts: [] })
    document.documentElement.className = ''
    vi.spyOn(globalThis.crypto, 'randomUUID').mockReturnValue('toast-id')
  })

  it('toggles sidebar and theme classes', () => {
    useUiStore.getState().toggleSidebar()
    expect(useUiStore.getState().sidebarOpen).toBe(false)

    useUiStore.getState().setSidebar(true)
    expect(useUiStore.getState().sidebarOpen).toBe(true)

    useUiStore.getState().setTheme('dark')
    expect(useUiStore.getState().theme).toBe('dark')
    expect(document.documentElement.classList.contains('dark')).toBe(true)

    useUiStore.getState().toggleTheme()
    expect(useUiStore.getState().theme).toBe('light')
    expect(document.documentElement.classList.contains('light')).toBe(true)
  })

  it('adds and removes toasts', () => {
    useUiStore.getState().addToast({ type: 'success', message: 'Saved' })
    expect(useUiStore.getState().toasts).toEqual([
      { id: 'toast-id', type: 'success', message: 'Saved' },
    ])

    useUiStore.getState().toast('Info message')
    expect(useUiStore.getState().toasts).toHaveLength(2)
    expect(useUiStore.getState().toasts[1]).toEqual({
      id: 'toast-id',
      type: 'info',
      message: 'Info message',
    })

    useUiStore.getState().removeToast('toast-id')
    expect(useUiStore.getState().toasts).toHaveLength(0)
  })
})
