import { fireEvent, render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import ConnectorsPanel from '../../../src/components/org/ConnectorsPanel'

const useConnectorMarketplaceMock = vi.fn()
const useMyConnectorInstallsMock = vi.fn()
const useMcpServersMock = vi.fn()
const installMutate = vi.fn()
const uninstallMutate = vi.fn()
const createMcpMutate = vi.fn()

vi.mock('../../../src/hooks/useConnectors', () => ({
  useConnectorMarketplace: (...args: unknown[]) => useConnectorMarketplaceMock(...args),
  useMyConnectorInstalls: (...args: unknown[]) => useMyConnectorInstallsMock(...args),
  useMcpServers: (...args: unknown[]) => useMcpServersMock(...args),
  useInstallConnector: () => ({ mutateAsync: installMutate }),
  useUninstallConnector: () => ({ mutateAsync: uninstallMutate }),
  useCreateMcpServer: () => ({ mutateAsync: createMcpMutate }),
}))

vi.mock('../../../src/stores/uiStore', () => ({
  useUiStore: () => vi.fn(),
}))

vi.mock('../../../src/components/ui/Spinner', () => ({
  default: () => <div>Loading...</div>,
}))

describe('ConnectorsPanel', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    useConnectorMarketplaceMock.mockReturnValue({
      isLoading: false,
      data: { listings: [{ id: 'l-1', definition_id: 'd-1', title: 'Slack Sync' }] },
    })
    useMyConnectorInstallsMock.mockReturnValue({ isLoading: false, data: { installs: [] } })
    useMcpServersMock.mockReturnValue({ isLoading: false, data: { mcp_servers: [{ id: 'm-1', name: 'Core MCP' }] } })
    installMutate.mockResolvedValue({ installed: true })
    uninstallMutate.mockResolvedValue({ deleted: true })
    createMcpMutate.mockResolvedValue({ id: 'm-2' })
  })

  it('renders feature coming soon when disabled', () => {
    render(<ConnectorsPanel orgId='org-1' enabled={false} />)

    expect(screen.getByText(/connectors is coming soon/i)).toBeInTheDocument()
  })

  it('renders listings and performs install action', async () => {
    render(<ConnectorsPanel orgId='org-1' enabled />)

    expect(screen.getByText('Slack Sync')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: /install/i }))

    expect(installMutate).toHaveBeenCalledWith({ org_id: 'org-1', definition_id: 'd-1' })
  })
})
