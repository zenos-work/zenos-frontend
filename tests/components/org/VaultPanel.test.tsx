import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import VaultPanel from '../../../src/components/org/VaultPanel'

const useUiStoreMock = vi.fn()
const toastMock = vi.fn()

const useVaultSecretsMock = vi.fn()
const useStoreSecretMock = vi.fn()
const useRevokeSecretMock = vi.fn()
const useRotateSecretMock = vi.fn()
const useTestSecretMock = vi.fn()

vi.mock('../../../src/stores/uiStore', () => ({
  useUiStore: (selector: (state: { toast: (...args: unknown[]) => void }) => unknown) =>
    selector({ toast: useUiStoreMock() }),
}))

vi.mock('../../../src/hooks/useOrgInfra', () => ({
  useVaultSecrets: (...args: unknown[]) => useVaultSecretsMock(...args),
  useStoreSecret: (...args: unknown[]) => useStoreSecretMock(...args),
  useRevokeSecret: (...args: unknown[]) => useRevokeSecretMock(...args),
  useRotateSecret: (...args: unknown[]) => useRotateSecretMock(...args),
  useTestSecret: (...args: unknown[]) => useTestSecretMock(...args),
}))

describe('VaultPanel', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    useUiStoreMock.mockReturnValue(toastMock)

    useVaultSecretsMock.mockReturnValue({
      isLoading: false,
      data: {
        secrets: [{ id: 'sec-1', name: 'SENDGRID_API_KEY', created_at: '2026-01-01' }],
      },
    })

    useStoreSecretMock.mockReturnValue({ isPending: false, mutateAsync: vi.fn().mockResolvedValue({ id: 'sec-2' }) })
    useRevokeSecretMock.mockReturnValue({ isPending: false, mutateAsync: vi.fn().mockResolvedValue({ deleted: true }) })
    useRotateSecretMock.mockReturnValue({ isPending: false, mutateAsync: vi.fn().mockResolvedValue({ id: 'sec-1' }) })
    useTestSecretMock.mockReturnValue({ isPending: false, mutateAsync: vi.fn().mockResolvedValue({ exists: true, is_active: true }) })
  })

  it('stores a secret and tests existing secret', async () => {
    render(<VaultPanel orgId='org-1' enabled />)

    fireEvent.change(screen.getByPlaceholderText(/secret name/i), {
      target: { value: 'OPENAI_API_KEY' },
    })
    fireEvent.change(screen.getByPlaceholderText(/^secret value/i), {
      target: { value: 'secret-value' },
    })

    fireEvent.click(screen.getByRole('button', { name: /store secret/i }))

    await waitFor(() => {
      const storeMutation = useStoreSecretMock.mock.results[0]?.value
      expect(storeMutation.mutateAsync).toHaveBeenCalledWith({ name: 'OPENAI_API_KEY', value: 'secret-value' })
      expect(toastMock).toHaveBeenCalledWith('Secret stored in vault', 'success')
    })

    fireEvent.click(screen.getByRole('button', { name: /^test$/i }))

    await waitFor(() => {
      const testMutation = useTestSecretMock.mock.results[0]?.value
      expect(testMutation.mutateAsync).toHaveBeenCalledWith('SENDGRID_API_KEY')
    })
  })
})
