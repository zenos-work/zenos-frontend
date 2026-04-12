import { fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import OrgSettingsPage from '../../src/pages/OrgSettingsPage'

const useFeatureFlagMock = vi.fn()
const useOrgMock = vi.fn()

vi.mock('../../src/hooks/useFeatureFlags', () => ({
  useFeatureFlag: (...args: unknown[]) => useFeatureFlagMock(...args),
}))

vi.mock('../../src/hooks/useOrg', () => ({
  useOrg: (...args: unknown[]) => useOrgMock(...args),
}))

vi.mock('../../src/components/ui/Spinner', () => ({
  default: () => <div>Loading...</div>,
}))

vi.mock('../../src/components/org/ApiKeysPanel', () => ({
  default: () => <div>ApiKeysPanel</div>,
}))

vi.mock('../../src/components/org/AuditLogPanel', () => ({
  default: () => <div>AuditLogPanel</div>,
}))

vi.mock('../../src/components/org/SubdomainPanel', () => ({
  default: () => <div>SubdomainPanel</div>,
}))

vi.mock('../../src/components/org/SsoConfigPanel', () => ({
  default: () => <div>SsoConfigPanel</div>,
}))

vi.mock('../../src/components/org/VaultPanel', () => ({
  default: () => <div>VaultPanel</div>,
}))

vi.mock('../../src/components/org/ConnectorsPanel', () => ({
  default: () => <div>ConnectorsPanel</div>,
}))

describe('OrgSettingsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    useFeatureFlagMock.mockReturnValue({ enabled: true, isLoading: false })
    useOrgMock.mockReturnValue({
      isLoading: false,
      data: { id: 'org-1', name: 'Team Alpha' },
    })
  })

  it('renders coming soon when organizations flag is disabled', () => {
    useFeatureFlagMock.mockReturnValue({ enabled: false, isLoading: false })

    render(
      <MemoryRouter initialEntries={['/org/org-1/settings']}>
        <Routes>
          <Route path='/org/:id/settings' element={<OrgSettingsPage />} />
        </Routes>
      </MemoryRouter>,
    )

    expect(screen.getByText(/organization settings is coming soon/i)).toBeInTheDocument()
  })

  it('renders org settings shell when enabled', () => {
    render(
      <MemoryRouter initialEntries={['/org/org-1/settings']}>
        <Routes>
          <Route path='/org/:id/settings' element={<OrgSettingsPage />} />
        </Routes>
      </MemoryRouter>,
    )

    expect(screen.getByRole('heading', { name: /organization settings/i })).toBeInTheDocument()
    expect(screen.getByText(/team alpha/i)).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: /api keys/i }))
    expect(screen.getByText('ApiKeysPanel')).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: /vault/i }))
    expect(screen.getByText('VaultPanel')).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: /connectors/i }))
    expect(screen.getByText('ConnectorsPanel')).toBeInTheDocument()
  })
})
