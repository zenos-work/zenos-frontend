import { act, renderHook, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  getReadingPreferencesClasses,
  useReadingPreferences,
} from '../../src/hooks/useReadingPreferences'

describe('useReadingPreferences', () => {
  beforeEach(() => {
    const storage: Record<string, string> = {}
    Object.defineProperty(window, 'localStorage', {
      configurable: true,
      value: {
        getItem: (key: string) => storage[key] ?? null,
        setItem: (key: string, value: string) => {
          storage[key] = value
        },
        removeItem: (key: string) => {
          delete storage[key]
        },
      },
    })
    vi.restoreAllMocks()
  })

  it('loads defaults, updates preferences, and resets them', async () => {
    const { result } = renderHook(() => useReadingPreferences())

    expect(result.current.preferences).toMatchObject({
      fontSize: 'base',
      fontFamily: 'sans',
      backgroundColor: 'white',
    })
    expect(result.current.isLoaded).toBe(true)

    act(() => {
      result.current.updatePreference('fontSize', 'lg')
    })

    expect(result.current.preferences.fontSize).toBe('lg')
    expect(JSON.parse(window.localStorage.getItem('zenos_reading_prefs') as string)).toMatchObject({
      fontSize: 'lg',
    })

    act(() => {
      result.current.resetPreferences()
    })

    expect(result.current.preferences.fontSize).toBe('base')
    expect(window.localStorage.getItem('zenos_reading_prefs')).toBeNull()
  })

  it('accepts cross-instance updates through the custom event', async () => {
    const { result } = renderHook(() => useReadingPreferences())

    act(() => {
      window.dispatchEvent(
        new CustomEvent('zenos:reading-prefs-change', {
          detail: {
            fontSize: 'xl',
            fontFamily: 'serif',
            lineHeight: 'extra-loose',
            contentWidth: 'wide',
            textColor: 'dark',
            backgroundColor: 'cream',
          },
        }),
      )
    })

    await waitFor(() => {
      expect(result.current.preferences.fontSize).toBe('xl')
    })
    expect(result.current.preferences.backgroundColor).toBe('cream')
  })

  it('falls back to defaults when stored preferences are invalid and builds classes', () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    window.localStorage.setItem('zenos_reading_prefs', '{bad json')

    const { result } = renderHook(() => useReadingPreferences())

    expect(result.current.preferences.fontFamily).toBe('sans')
    expect(errorSpy).toHaveBeenCalled()

    expect(
      getReadingPreferencesClasses({
        fontSize: 'xl',
        fontFamily: 'serif',
        lineHeight: 'extra-loose',
        contentWidth: 'medium',
        textColor: 'dark',
        backgroundColor: 'dark',
      }),
    ).toContain('text-xl')
    expect(
      getReadingPreferencesClasses({
        fontSize: 'xl',
        fontFamily: 'serif',
        lineHeight: 'extra-loose',
        contentWidth: 'medium',
        textColor: 'dark',
        backgroundColor: 'dark',
      }),
    ).toContain('font-serif')

    errorSpy.mockRestore()
  })
})
