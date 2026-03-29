import { Minus, Plus, RotateCcw, Type, X } from 'lucide-react'
import { useReadingPreferences } from '../../hooks/useReadingPreferences'

export function ReadingPreferencesPanel({
  isOpen,
  onClose,
}: {
  isOpen: boolean
  onClose: () => void
}) {
  const { preferences, updatePreference, resetPreferences } = useReadingPreferences()

  if (!isOpen) return null

  const canDecrease = preferences.fontSize !== 'sm'
  const canIncrease = preferences.fontSize !== 'xl'
  const decreaseFont = () => {
    if (preferences.fontSize === 'xl') updatePreference('fontSize', 'lg')
    else if (preferences.fontSize === 'lg') updatePreference('fontSize', 'base')
    else if (preferences.fontSize === 'base') updatePreference('fontSize', 'sm')
  }
  const increaseFont = () => {
    if (preferences.fontSize === 'sm') updatePreference('fontSize', 'base')
    else if (preferences.fontSize === 'base') updatePreference('fontSize', 'lg')
    else if (preferences.fontSize === 'lg') updatePreference('fontSize', 'xl')
  }

  return (
    <div className='fixed inset-0 z-50'>
      <button
        type='button'
        className='absolute inset-0 bg-black/10'
        onClick={onClose}
        aria-label='Close reading settings'
      />
      <div className='absolute right-6 top-24 w-72 rounded-2xl border border-[color:var(--border)] bg-[color:var(--surface-5)] p-4 shadow-[var(--shadow)]'>
        <div className='mb-4 flex items-center justify-between'>
          <p className='text-xs font-semibold uppercase tracking-[0.12em] text-[color:var(--text-muted)]'>Customize</p>
          <button
            onClick={onClose}
            className='rounded-full p-1.5 text-[color:var(--text-muted)] transition-colors hover:bg-[color:var(--surface-1)] hover:text-[color:var(--text-primary)]'
            aria-label='Close'
          >
            <X size={15} />
          </button>
        </div>

        <div className='mb-4 rounded-xl bg-[color:var(--surface-1)] p-3'>
          <p className='mb-2 text-xs text-[color:var(--text-muted)]'>Text size</p>
          <div className='flex items-center justify-between'>
            <button
              type='button'
              onClick={decreaseFont}
              disabled={!canDecrease}
              className='rounded-full border border-[color:var(--border)] p-1.5 text-[color:var(--text-secondary)] transition-colors hover:text-[color:var(--text-primary)] disabled:cursor-not-allowed disabled:opacity-45'
              aria-label='Decrease text size'
            >
              <Minus size={14} />
            </button>
            <span className='inline-flex items-center gap-1.5 text-sm text-[color:var(--text-primary)]'>
              <Type size={14} />
              {preferences.fontSize.toUpperCase()}
            </span>
            <button
              type='button'
              onClick={increaseFont}
              disabled={!canIncrease}
              className='rounded-full border border-[color:var(--border)] p-1.5 text-[color:var(--text-secondary)] transition-colors hover:text-[color:var(--text-primary)] disabled:cursor-not-allowed disabled:opacity-45'
              aria-label='Increase text size'
            >
              <Plus size={14} />
            </button>
          </div>
        </div>

        <div className='mb-4 rounded-xl bg-[color:var(--surface-1)] p-3'>
          <p className='mb-2 text-xs text-[color:var(--text-muted)]'>Font</p>
          <div className='flex gap-2'>
            {(['serif', 'sans'] as const).map((font) => (
              <button
                key={font}
                onClick={() => updatePreference('fontFamily', font)}
                className={`flex-1 rounded-full px-3 py-1.5 text-sm font-medium transition ${
                  preferences.fontFamily === font
                    ? 'bg-[color:var(--surface-ink)] text-[color:var(--surface-ink-foreground)]'
                    : 'bg-[color:var(--surface-1)] text-[color:var(--text-secondary)] hover:bg-[color:var(--surface-2)]'
                }`}
                style={{ fontFamily: font === 'serif' ? 'var(--font-body)' : 'var(--font-ui)' }}
              >
                {font === 'serif' ? 'Serif' : 'Sans'}
              </button>
            ))}
          </div>
        </div>

        <div className='mb-4 rounded-xl bg-[color:var(--surface-1)] p-3'>
          <p className='mb-2 text-xs text-[color:var(--text-muted)]'>Content width</p>
          <div className='flex gap-2'>
            {(['narrow', 'medium', 'wide'] as const).map((width) => (
              <button
                key={width}
                onClick={() => updatePreference('contentWidth', width)}
                className={`flex-1 rounded-full px-3 py-1.5 text-sm transition ${
                  preferences.contentWidth === width
                    ? 'bg-[color:var(--surface-ink)] text-[color:var(--surface-ink-foreground)]'
                    : 'bg-[color:var(--surface-1)] text-[color:var(--text-secondary)] hover:bg-[color:var(--surface-2)]'
                }`}
              >
                {width.charAt(0).toUpperCase() + width.slice(1)}
              </button>
            ))}
          </div>
        </div>

        <div className='mb-4 rounded-xl bg-[color:var(--surface-1)] p-3'>
          <p className='mb-2 text-xs text-[color:var(--text-muted)]'>Line spacing</p>
          <div className='flex gap-2'>
            {([
              { value: 'relaxed', label: 'A' },
              { value: 'loose', label: 'A+' },
              { value: 'extra-loose', label: 'A++' },
            ] as const).map((line) => (
              <button
                key={line.value}
                onClick={() => updatePreference('lineHeight', line.value)}
                className={`flex-1 rounded-full px-3 py-1.5 text-sm transition ${
                  preferences.lineHeight === line.value
                    ? 'bg-[color:var(--surface-ink)] text-[color:var(--surface-ink-foreground)]'
                    : 'bg-[color:var(--surface-1)] text-[color:var(--text-secondary)] hover:bg-[color:var(--surface-2)]'
                }`}
                aria-label={`Set ${line.value} line spacing`}
              >
                {line.label}
              </button>
            ))}
          </div>
        </div>

        <div className='rounded-xl bg-[color:var(--surface-1)] p-3'>
          <p className='mb-2 text-xs text-[color:var(--text-muted)]'>Background</p>
          <div className='grid grid-cols-3 gap-2'>
            {(['white', 'cream', 'dark'] as const).map((bg) => (
              <button
                key={bg}
                onClick={() => updatePreference('backgroundColor', bg)}
                className={`h-8 rounded-full border transition ${preferences.backgroundColor === bg ? 'border-[color:var(--accent)]' : 'border-[color:var(--border)]'}`}
                aria-label={`Set ${bg} background`}
                style={{
                  backgroundColor: bg === 'white' ? '#fffdfa' : bg === 'cream' ? '#efe6d8' : '#181410',
                }}
              >
                <span className='sr-only'>{bg}</span>
              </button>
            ))}
          </div>
        </div>

        <button
          onClick={resetPreferences}
          className='mt-4 flex w-full items-center justify-center gap-2 rounded-full bg-[color:var(--surface-1)] px-4 py-2 text-sm font-medium text-[color:var(--text-secondary)] hover:bg-[color:var(--surface-2)]'
        >
          <RotateCcw size={16} />
          Reset
        </button>
      </div>
    </div>
  )
}
