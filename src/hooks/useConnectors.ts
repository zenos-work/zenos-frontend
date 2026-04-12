import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import api from '../lib/api'

export type ConnectorMarketplaceListing = {
  id: string
  definition_id: string
  title: string
  short_description?: string
  tags?: string[]
}

export type ConnectorInstall = {
  definition_id: string
  org_id: string
  installed_by: string
  installed_at: string
}

export type McpServer = {
  id: string
  org_id: string
  name: string
  description?: string
  transport?: string
  endpoint_url?: string
  status?: string
}

export type ConnectorDefinition = {
  id: string
  name: string
  slug: string
  category?: string
  short_description?: string
}

const connectorKeys = {
  all: ['connectors'] as const,
  marketplace: () => [...connectorKeys.all, 'marketplace'] as const,
  installs: (orgId: string) => [...connectorKeys.all, 'installs', orgId] as const,
  mcpServers: (orgId: string) => [...connectorKeys.all, 'mcp-servers', orgId] as const,
  definitions: () => [...connectorKeys.all, 'definitions'] as const,
}

export const useConnectorMarketplace = (enabled = true) =>
  useQuery({
    queryKey: connectorKeys.marketplace(),
    enabled,
    queryFn: () => api.get<{ listings: ConnectorMarketplaceListing[] }>('/api/connector-marketplace').then((r) => r.data),
  })

export const useMyConnectorInstalls = (orgId: string, enabled = true) =>
  useQuery({
    queryKey: connectorKeys.installs(orgId),
    enabled: enabled && !!orgId,
    queryFn: () => api.get<{ installs: ConnectorInstall[] }>('/api/connectors/installs', { params: { org_id: orgId } }).then((r) => r.data),
  })

export const useInstallConnector = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: { org_id: string; definition_id: string }) =>
      api.post<{ installed: boolean }>('/api/connectors/installs', payload).then((r) => r.data),
    onSuccess: (_data, payload) => qc.invalidateQueries({ queryKey: connectorKeys.installs(payload.org_id) }),
  })
}

export const useUninstallConnector = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: { org_id: string; definition_id: string }) =>
      api.delete<{ deleted: boolean }>('/api/connectors/installs', { data: payload }).then((r) => r.data),
    onSuccess: (_data, payload) => qc.invalidateQueries({ queryKey: connectorKeys.installs(payload.org_id) }),
  })
}

export const useMcpServers = (orgId: string, enabled = true) =>
  useQuery({
    queryKey: connectorKeys.mcpServers(orgId),
    enabled: enabled && !!orgId,
    queryFn: () => api.get<{ mcp_servers: McpServer[] }>('/api/connectors/mcp-servers', { params: { org_id: orgId } }).then((r) => r.data),
  })

export const useCreateMcpServer = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: {
      org_id: string
      name: string
      description?: string
      transport?: string
      endpoint_url?: string
      command?: string
    }) => api.post<{ id: string }>('/api/connectors/mcp-servers', payload).then((r) => r.data),
    onSuccess: (_data, payload) => qc.invalidateQueries({ queryKey: connectorKeys.mcpServers(payload.org_id) }),
  })
}

export const useConnectorDefinitions = (enabled = true) =>
  useQuery({
    queryKey: connectorKeys.definitions(),
    enabled,
    queryFn: () => api.get<{ definitions: ConnectorDefinition[] }>('/api/connectors').then((r) => r.data),
  })
