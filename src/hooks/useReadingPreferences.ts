import { useEffect, useState } from 'react'
import type { ReadingPreferences } from '../types/reading'

const READING_PREFS_KEY = 'zenos_reading_prefs'
const READING_PREFS_EVENT = 'zenos:reading-prefs-change'

const defaultPreferences: ReadingPreferences = {
  fontSize: 'base',
  fontFamily: 'sans',
  lineHeight: 'relaxed',
  contentWidth: 'wide',
  textColor: 'dark',
  backgroundColor: 'white',
}

function getSafeStorage(): Storage | null {
  if (typeof window === 'undefined') return null
  try {
    const storage = window.localStorage
    if (!storage || typeof storage.getItem !== 'function') return null
    return storage
  } catch {
    return null
  }
}

export function useReadingPreferences() {
  const [preferences, setPreferences] = useState<ReadingPreferences>(() => {
    const storage = getSafeStorage()
    const stored = storage?.getItem(READING_PREFS_KEY)
    if (stored) {
      try {
        return JSON.parse(stored) as ReadingPreferences
      } catch (error) {
        console.error('Failed to parse reading preferences:', error)
      }
    }
    return defaultPreferences
  })
  const isLoaded = true

  // Subscribe to cross-instance updates.
  useEffect(() => {
    const handlePreferenceChange = (event: Event) => {
      const customEvent = event as CustomEvent<ReadingPreferences>
      if (!customEvent.detail) return
      setPreferences(customEvent.detail)
    }

    window.addEventListener(READING_PREFS_EVENT, handlePreferenceChange as EventListener)
    return () => {
      window.removeEventListener(READING_PREFS_EVENT, handlePreferenceChange as EventListener)
    }
  }, [])

  // Save to localStorage when preferences change
  const updatePreference = <K extends keyof ReadingPreferences>(key: K, value: ReadingPreferences[K]) => {
    const updated = { ...preferences, [key]: value }
    setPreferences(updated)
    const storage = getSafeStorage()
    storage?.setItem(READING_PREFS_KEY, JSON.stringify(updated))
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent<ReadingPreferences>(READING_PREFS_EVENT, { detail: updated }))
    }
  }

  const resetPreferences = () => {
    setPreferences(defaultPreferences)
    const storage = getSafeStorage()
    storage?.removeItem(READING_PREFS_KEY)
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent<ReadingPreferences>(READING_PREFS_EVENT, { detail: defaultPreferences }))
    }
  }

  return {
    preferences,
    updatePreference,
    resetPreferences,
    isLoaded,
  }
}

export function getReadingPreferencesClasses(prefs: ReadingPreferences) {
  const fontSizeMap = {
    sm: 'text-sm',
    base: 'text-base',
    lg: 'text-lg',
    xl: 'text-xl',
  }

  const fontFamilyMap = {
    serif: 'font-serif',
    sans: 'font-sans',
  }

  const lineHeightMap = {
    relaxed: 'leading-relaxed',
    loose: 'leading-loose',
    'extra-loose': 'leading-[2]',
  }

  const bgColorMap = {
    white: 'bg-white text-gray-900',
    cream: 'bg-amber-50 text-gray-900',
    dark: 'bg-gray-900 text-gray-50',
  }

  return `
    ${fontSizeMap[prefs.fontSize]}
    ${fontFamilyMap[prefs.fontFamily]}
    ${lineHeightMap[prefs.lineHeight]}
    ${bgColorMap[prefs.backgroundColor]}
  `.trim()
}
