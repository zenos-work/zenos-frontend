import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import CustomDomainPanel from '../../../src/components/profile/CustomDomainPanel'

const useMyDomainsMock = vi.fn()
const useAddDomainMock = vi.fn()
const useDeleteDomainMock = vi.fn()
const useVerifyDomainMock = vi.fn()
const toastMock = vi.fn()

vi.mock('../../../src/hooks/useDomains', () => ({
  useMyDomains: (...args: unknown[]) => useMyDomainsMock(...args),
  useAddDomain: () => useAddDomainMock(),
  useDeleteDomain: () => useDeleteDomainMock(),
  useVerifyDomain: () => useVerifyDomainMock(),
}))

vi.mock('../../../src/stores/uiStore', () => ({
  useUiStore: (selector: (state: { toast: typeof toastMock }) => unknown) => selector({ toast: toastMock }),
}))

describe('CustomDomainPanel', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    useMyDomainsMock.mockReturnValue({ data: { domains: [{ id: 'd1', domain: 'example.com', verification_status: 'pending', ssl_status: 'pending' }] }, isLoading: false })
    useAddDomainMock.mockReturnValue({ mutateAsync: vi.fn().mockResolvedValue({ id: 'd2' }), isPending: false })
    useDeleteDomainMock.mockReturnValue({ mutateAsync: vi.fn().mockResolvedValue({ status: 'deleted' }), isPending: false })
    useVerifyDomainMock.mockReturnValue({ mutateAsync: vi.fn().mockResolvedValue({ id: 'd1' }), isPending: false })
    vi.stubGlobal('confirm', vi.fn(() => true))
  })

  it('adds and verifies domain', async () => {
    const add = vi.fn().mockResolvedValue({ id: 'd2' })
    const verify = vi.fn().mockResolvedValue({ id: 'd1' })
    useAddDomainMock.mockReturnValue({ mutateAsync: add, isPending: false })
    useVerifyDomainMock.mockReturnValue({ mutateAsync: verify, isPending: false })

    render(<CustomDomainPanel enabled />)

    fireEvent.change(screen.getByPlaceholderText('yourdomain.com'), { target: { value: 'example.org' } })
    fireEvent.click(screen.getByRole('button', { name: /add domain/i }))

    await waitFor(() => {
      expect(add).toHaveBeenCalledWith({ domain: 'example.org' })
    })

    fireEvent.click(screen.getByRole('button', { name: /verify/i }))
    await waitFor(() => {
      expect(verify).toHaveBeenCalledWith('d1')
    })
  })
})
