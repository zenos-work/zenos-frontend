import { act, renderHook, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import api from '../../src/lib/api'
import {
  useConnectorMarketplace,
  useCreateMcpServer,
  useInstallConnector,
  useMcpServers,
  useMyConnectorInstalls,
} from '../../src/hooks/useConnectors'
import { createQueryClientWrapper } from '../utils/queryClient'

vi.mock('../../src/lib/api', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  },
}))

describe('useConnectors hooks', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('fetches listings, installs, and mcp servers', async () => {
    vi.mocked(api.get)
      .mockResolvedValueOnce({ data: { listings: [{ id: 'l-1', definition_id: 'd-1', title: 'Slack' }] } } as never)
      .mockResolvedValueOnce({ data: { installs: [{ definition_id: 'd-1', org_id: 'org-1' }] } } as never)
      .mockResolvedValueOnce({ data: { mcp_servers: [{ id: 'm-1', name: 'Core MCP' }] } } as never)

    const a = createQueryClientWrapper()
    const b = createQueryClientWrapper()
    const c = createQueryClientWrapper()

    const listings = renderHook(() => useConnectorMarketplace(true), { wrapper: a.Wrapper })
    const installs = renderHook(() => useMyConnectorInstalls('org-1', true), { wrapper: b.Wrapper })
    const mcp = renderHook(() => useMcpServers('org-1', true), { wrapper: c.Wrapper })

    await waitFor(() => {
      expect(listings.result.current.isSuccess).toBe(true)
      expect(installs.result.current.isSuccess).toBe(true)
      expect(mcp.result.current.isSuccess).toBe(true)
    })

    expect(api.get).toHaveBeenCalledWith('/api/connector-marketplace')
    expect(api.get).toHaveBeenCalledWith('/api/connectors/installs', { params: { org_id: 'org-1' } })
    expect(api.get).toHaveBeenCalledWith('/api/connectors/mcp-servers', { params: { org_id: 'org-1' } })
  })

  it('installs connector and creates mcp server', async () => {
    vi.mocked(api.post)
      .mockResolvedValueOnce({ data: { installed: true } } as never)
      .mockResolvedValueOnce({ data: { id: 'm-1' } } as never)

    const a = createQueryClientWrapper()
    const b = createQueryClientWrapper()

    const install = renderHook(() => useInstallConnector(), { wrapper: a.Wrapper })
    const createMcp = renderHook(() => useCreateMcpServer(), { wrapper: b.Wrapper })

    await act(async () => {
      await install.result.current.mutateAsync({ org_id: 'org-1', definition_id: 'd-1' })
      await createMcp.result.current.mutateAsync({ org_id: 'org-1', name: 'Core MCP', endpoint_url: 'https://mcp.example.com/sse' })
    })

    expect(api.post).toHaveBeenCalledWith('/api/connectors/installs', { org_id: 'org-1', definition_id: 'd-1' })
    expect(api.post).toHaveBeenCalledWith('/api/connectors/mcp-servers', {
      org_id: 'org-1',
      name: 'Core MCP',
      endpoint_url: 'https://mcp.example.com/sse',
    })
  })
})
