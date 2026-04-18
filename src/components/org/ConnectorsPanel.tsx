import { useState } from 'react'
import FeatureComingSoon from '../ui/FeatureComingSoon'
import Spinner from '../ui/Spinner'
import {
  useConnectorMarketplace,
  useCreateMcpServer,
  useInstallConnector,
  useMcpServers,
  useMyConnectorInstalls,
  useUninstallConnector,
} from '../../hooks/useConnectors'
import { useUiStore } from '../../stores/uiStore'

type Props = {
  orgId: string
  enabled?: boolean
}

export default function ConnectorsPanel({ orgId, enabled = true }: Props) {
  const toast = useUiStore((s) => s.toast)
  const listings = useConnectorMarketplace(enabled)
  const installs = useMyConnectorInstalls(orgId, enabled)
  const mcpServers = useMcpServers(orgId, enabled)
  const install = useInstallConnector()
  const uninstall = useUninstallConnector()
  const createMcp = useCreateMcpServer()

  const [mcpName, setMcpName] = useState('')
  const [mcpEndpoint, setMcpEndpoint] = useState('')

  if (!enabled) {
    return <FeatureComingSoon name='Connectors' description='Connector marketplace and MCP registry are gated by connectors.' />
  }

  if (listings.isLoading || installs.isLoading || mcpServers.isLoading) {
    return <div className='flex justify-center py-8'><Spinner /></div>
  }

  const installedDefs = new Set((installs.data?.installs ?? []).map((item) => item.definition_id))

  return (
    <div className='space-y-6'>
      <section className='space-y-3'>
        <h2 className='text-base font-semibold text-[color:var(--text-primary)]'>Connector marketplace</h2>
        <div className='grid gap-3 md:grid-cols-2'>
          {(listings.data?.listings ?? []).map((listing) => {
            const isInstalled = installedDefs.has(listing.definition_id)
            return (
              <article key={listing.id} className='rounded-lg border border-[color:var(--border)] bg-[color:var(--surface-0)] p-3'>
                <p className='text-sm font-semibold text-[color:var(--text-primary)]'>{listing.title}</p>
                <p className='mt-1 text-xs text-[color:var(--text-secondary)]'>{listing.short_description ?? 'No description provided.'}</p>
                <button
                  type='button'
                  className='mt-3 text-xs font-semibold text-[color:var(--accent)] hover:underline'
                  onClick={() => {
                    if (!orgId) return
                    if (isInstalled) {
                      void uninstall
                        .mutateAsync({ org_id: orgId, definition_id: listing.definition_id })
                        .then(() => toast('Connector uninstalled', 'success'))
                        .catch(() => toast('Could not uninstall connector', 'error'))
                      return
                    }
                    void install
                      .mutateAsync({ org_id: orgId, definition_id: listing.definition_id })
                      .then(() => toast('Connector installed', 'success'))
                      .catch(() => toast('Could not install connector', 'error'))
                  }}
                >
                  {isInstalled ? 'Uninstall' : 'Install'}
                </button>
              </article>
            )
          })}
        </div>
      </section>

      <section className='space-y-3'>
        <h2 className='text-base font-semibold text-[color:var(--text-primary)]'>MCP servers</h2>
        <div className='grid gap-3 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto]'>
          <input
            value={mcpName}
            onChange={(event) => setMcpName(event.target.value)}
            placeholder='MCP server name'
            className='h-10 rounded-lg border border-[color:var(--border-strong)] bg-[color:var(--surface-0)] px-3 text-sm'
          />
          <input
            value={mcpEndpoint}
            onChange={(event) => setMcpEndpoint(event.target.value)}
            placeholder='https://example.com/sse'
            className='h-10 rounded-lg border border-[color:var(--border-strong)] bg-[color:var(--surface-0)] px-3 text-sm'
          />
          <button
            type='button'
            className='rounded-full border border-[color:var(--border-strong)] px-4 py-2 text-sm font-semibold'
            onClick={() => {
              if (!orgId || !mcpName.trim()) {
                toast('Provide org and name', 'warning')
                return
              }
              void createMcp
                .mutateAsync({ org_id: orgId, name: mcpName.trim(), endpoint_url: mcpEndpoint.trim() || undefined })
                .then(() => {
                  setMcpName('')
                  setMcpEndpoint('')
                  toast('MCP server created', 'success')
                })
                .catch(() => toast('Could not create MCP server', 'error'))
            }}
          >
            Add MCP server
          </button>
        </div>

        <ul className='space-y-2'>
          {(mcpServers.data?.mcp_servers ?? []).map((server) => (
            <li key={server.id} className='rounded-lg border border-[color:var(--border)] bg-[color:var(--surface-0)] px-3 py-2'>
              <p className='text-sm font-medium text-[color:var(--text-primary)]'>{server.name}</p>
              <p className='text-xs text-[color:var(--text-secondary)]'>{server.endpoint_url ?? 'Command transport'}</p>
            </li>
          ))}
        </ul>
      </section>
    </div>
  )
}
