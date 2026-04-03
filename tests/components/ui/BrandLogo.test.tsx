import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import BrandLogo from '../../../src/components/ui/BrandLogo'

const useUiStoreMock = vi.fn()

vi.mock('../../../src/stores/uiStore', () => ({
  useUiStore: (selector: (state: { resolvedTheme: 'light' | 'dark' }) => unknown) =>
    selector(useUiStoreMock()),
}))

describe('BrandLogo', () => {
  it('renders dark-theme logo by default full variant', () => {
    useUiStoreMock.mockReturnValue({ resolvedTheme: 'dark' })

    render(<BrandLogo />)

    const img = screen.getByRole('img', { name: 'zenos.work' }) as HTMLImageElement
    expect(img.src).toContain('logo_dark.svg')
  })

  it('renders mark variant with explicit dimensions', () => {
    useUiStoreMock.mockReturnValue({ resolvedTheme: 'light' })

    const { container } = render(<BrandLogo variant='mark' height={20} width={24} alt='Zenos mark' />)

    const img = screen.getByRole('img', { name: 'Zenos mark' }) as HTMLImageElement
    expect(img.src).toContain('logo_light.svg')
    expect(container.querySelector('span')).toBeInTheDocument()
  })
})
