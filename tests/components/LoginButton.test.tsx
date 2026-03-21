import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import LoginButton from '../../src/components/LoginButton'

const useAuthMock = vi.fn()

vi.mock('../../src/hooks/useAuth', () => ({
  useAuth: () => useAuthMock(),
}))

describe('LoginButton', () => {
  it('calls loginWithGoogle when clicked', () => {
    const loginWithGoogle = vi.fn()
    useAuthMock.mockReturnValue({ loginWithGoogle })

    render(<LoginButton />)

    fireEvent.click(screen.getByRole('button', { name: /continue with google/i }))
    expect(loginWithGoogle).toHaveBeenCalledTimes(1)
  })
})
