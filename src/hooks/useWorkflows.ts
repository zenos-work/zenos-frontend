import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import api from '../lib/api'

export type WorkflowNodeType = {
  type: string
  label: string
  description?: string
  category?: string
  defaults?: Record<string, unknown>
  schema?: Record<string, unknown>
}

export type WorkflowTemplate = {
  id: string
  name: string
  description?: string
  category?: string
  definition?: WorkflowDefinition
}

export type WorkflowNode = {
  id: string
  type: string
  position?: { x: number; y: number }
  data?: Record<string, unknown>
}

export type WorkflowEdge = {
  id?: string
  source: string
  target: string
  type?: string
  label?: string
}

export type WorkflowDefinition = {
  nodes: WorkflowNode[]
  edges: WorkflowEdge[]
}

export type Workflow = {
  id: string
  org_id?: string
  name: string
  status?: string
  environment?: string
  definition_version?: number
  definition?: WorkflowDefinition
  nodes?: WorkflowNode[]
  edges?: WorkflowEdge[]
  created_at?: string
  updated_at?: string
}

export type WorkflowRun = {
  id: string
  workflow_id: string
  status: 'PENDING' | 'RUNNING' | 'SUCCESS' | 'FAILED'
  started_at?: string
  finished_at?: string
  error_message?: string
}

export type WorkflowTask = {
  id: string
  run_id?: string
  workflow_id?: string
  title?: string
  status?: string
  assignee_id?: string
  due_at?: string
}

export type WorkflowApproval = {
  id: string
  workflow_id?: string
  run_id?: string
  status?: string
  reviewer_id?: string
  decision_note?: string
}

export type WorkflowVersion = {
  id: string
  workflow_id: string
  version_number: number
  changelog?: string
  created_by?: string
  created_at?: string
}

const normalizeDefinition = (workflow: Partial<Workflow>): WorkflowDefinition => {
  if (workflow.definition?.nodes || workflow.definition?.edges) {
    return {
      nodes: workflow.definition.nodes ?? [],
      edges: workflow.definition.edges ?? [],
    }
  }
  return {
    nodes: workflow.nodes ?? [],
    edges: workflow.edges ?? [],
  }
}

const syncWorkflowGraph = async (workflowId: string, definition: WorkflowDefinition) => {
  const detail = await api.get<Workflow>(`/api/workflows/${workflowId}`).then((r) => r.data)

  const existingEdges = detail.edges ?? []
  for (const edge of existingEdges) {
    if (!edge.id) continue
    await api.delete(`/api/workflows/${workflowId}/edges/${edge.id}`)
  }

  const existingNodes = detail.nodes ?? []
  for (const node of existingNodes) {
    await api.delete(`/api/workflows/${workflowId}/nodes/${node.id}`)
  }

  const nodeIdMap: Record<string, string> = {}
  for (const node of definition.nodes ?? []) {
    const payload = {
      node_type_id: node.type || String(node.data?.node_type ?? 'trigger.manual'),
      label: String(node.data?.label ?? node.type ?? node.id),
      position_x: Number(node.position?.x ?? 0),
      position_y: Number(node.position?.y ?? 0),
      display_config: node.data ?? {},
    }
    const created = await api.post<{ id: string }>(`/api/workflows/${workflowId}/nodes`, payload).then((r) => r.data)
    nodeIdMap[node.id] = created.id
  }

  for (const edge of definition.edges ?? []) {
    const source = nodeIdMap[edge.source]
    const target = nodeIdMap[edge.target]
    if (!source || !target) continue
    await api.post(`/api/workflows/${workflowId}/edges`, {
      source_node_id: source,
      target_node_id: target,
      condition_label: edge.label ?? '',
    })
  }
}

const workflowKeys = {
  all: ['workflows'] as const,
  nodeTypes: () => [...workflowKeys.all, 'node-types'] as const,
  templates: () => [...workflowKeys.all, 'templates'] as const,
  list: (orgId?: string) => [...workflowKeys.all, 'list', orgId ?? 'mine'] as const,
  detail: (workflowId: string) => [...workflowKeys.all, 'detail', workflowId] as const,
  runs: (workflowId: string) => [...workflowKeys.all, 'runs', workflowId] as const,
  tasks: (status?: string) => [...workflowKeys.all, 'tasks', status ?? 'all'] as const,
  approvals: (status?: string) => [...workflowKeys.all, 'approvals', status ?? 'all'] as const,
}

export const useWorkflowNodeTypes = (enabled = true) =>
  useQuery({
    queryKey: workflowKeys.nodeTypes(),
    enabled,
    queryFn: () => api.get<{ node_types: WorkflowNodeType[] }>('/api/workflow-node-types').then((r) => r.data),
  })

export const useWorkflowTemplates = (enabled = true) =>
  useQuery({
    queryKey: workflowKeys.templates(),
    enabled,
    queryFn: () => api.get<{ templates: WorkflowTemplate[] }>('/api/workflow-templates').then((r) => r.data),
  })

export const useCloneTemplate = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ templateId, name }: { templateId: string; name?: string }) =>
      api.post<{ workflow_id: string }>(`/api/workflow-templates/${templateId}/clone`, { name }).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: workflowKeys.all })
    },
  })
}

export const useMyWorkflows = (enabled = true, orgId?: string) =>
  useQuery({
    queryKey: workflowKeys.list(orgId),
    enabled,
    queryFn: () => api.get<{ workflows: Workflow[] }>('/api/workflows', { params: { org_id: orgId } }).then((r) => r.data),
  })

export const useWorkflowDetail = (workflowId: string, enabled = true) =>
  useQuery({
    queryKey: workflowKeys.detail(workflowId),
    enabled: enabled && !!workflowId,
    queryFn: async () => {
      const workflow = await api.get<Workflow>(`/api/workflows/${workflowId}`).then((r) => r.data)
      return {
        ...workflow,
        definition: normalizeDefinition(workflow),
      }
    },
  })

export const useCreateWorkflow = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (payload: { name: string; org_id?: string; definition: WorkflowDefinition; description?: string }) => {
      const created = await api
        .post<{ id: string }>('/api/workflows', {
          name: payload.name,
          org_id: payload.org_id,
          description: payload.description ?? '',
          trigger_type: 'manual',
          environment: 'dev',
        })
        .then((r) => r.data)

      if ((payload.definition.nodes?.length ?? 0) > 0) {
        await syncWorkflowGraph(created.id, payload.definition)
      }

      const detail = await api.get<Workflow>(`/api/workflows/${created.id}`).then((r) => r.data)
      return {
        ...detail,
        definition: normalizeDefinition(detail),
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: workflowKeys.all })
    },
  })
}

export const useUpdateWorkflow = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ workflowId, payload }: { workflowId: string; payload: Partial<Workflow> }) => {
      const { definition, nodes, edges, ...rest } = payload
      await api.put<Workflow>(`/api/workflows/${workflowId}`, rest).then((r) => r.data)

      const normalized = definition ?? {
        nodes: nodes ?? [],
        edges: edges ?? [],
      }
      if ((normalized.nodes?.length ?? 0) > 0 || (normalized.edges?.length ?? 0) > 0) {
        await syncWorkflowGraph(workflowId, normalized)
      }

      const detail = await api.get<Workflow>(`/api/workflows/${workflowId}`).then((r) => r.data)
      return {
        ...detail,
        definition: normalizeDefinition(detail),
      }
    },
    onSuccess: (_data, variables) => {
      qc.invalidateQueries({ queryKey: workflowKeys.detail(variables.workflowId) })
      qc.invalidateQueries({ queryKey: workflowKeys.list() })
    },
  })
}

export const useDeleteWorkflow = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (workflowId: string) => api.delete<{ deleted: boolean }>(`/api/workflows/${workflowId}`).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: workflowKeys.all })
    },
  })
}

export const useTriggerWorkflow = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ workflowId, payload }: { workflowId: string; payload?: Record<string, unknown> }) =>
      api.post<{ id: string }>(`/api/workflows/${workflowId}/runs`, payload ?? {}).then((r) => r.data),
    onSuccess: (_data, variables) => {
      qc.invalidateQueries({ queryKey: workflowKeys.runs(variables.workflowId) })
    },
  })
}

export const useWorkflowVersions = (workflowId: string, enabled = true) =>
  useQuery({
    queryKey: [...workflowKeys.detail(workflowId), 'versions'] as const,
    enabled: enabled && !!workflowId,
    queryFn: () => api.get<{ versions: WorkflowVersion[] }>(`/api/workflows/${workflowId}/versions`).then((r) => r.data),
  })

export const useCreateWorkflowVersion = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ workflowId, changelog }: { workflowId: string; changelog?: string }) =>
      api.post<{ id: string; version_number: number }>(`/api/workflows/${workflowId}/versions`, { changelog: changelog ?? '' }).then((r) => r.data),
    onSuccess: (_data, variables) => {
      qc.invalidateQueries({ queryKey: [...workflowKeys.detail(variables.workflowId), 'versions'] })
      qc.invalidateQueries({ queryKey: workflowKeys.detail(variables.workflowId) })
    },
  })
}

export const useRestoreWorkflowVersion = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ workflowId, versionNumber }: { workflowId: string; versionNumber: number }) =>
      api.post<{ workflow_id: string; restored_version: number }>(`/api/workflows/${workflowId}/versions/${versionNumber}/restore`).then((r) => r.data),
    onSuccess: (_data, variables) => {
      qc.invalidateQueries({ queryKey: [...workflowKeys.detail(variables.workflowId), 'versions'] })
      qc.invalidateQueries({ queryKey: workflowKeys.detail(variables.workflowId) })
    },
  })
}

export const useTransitionWorkflow = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({
      workflowId,
      status,
      environment,
    }: {
      workflowId: string
      status: 'draft' | 'active' | 'paused' | 'archived' | 'error'
      environment?: 'dev' | 'staging' | 'production'
    }) => api.put<Workflow>(`/api/workflows/${workflowId}`, { status, environment }).then((r) => r.data),
    onSuccess: (_data, variables) => {
      qc.invalidateQueries({ queryKey: workflowKeys.detail(variables.workflowId) })
      qc.invalidateQueries({ queryKey: workflowKeys.list() })
    },
  })
}

export const useWorkflowRuns = (workflowId: string, enabled = true) =>
  useQuery({
    queryKey: workflowKeys.runs(workflowId),
    enabled: enabled && !!workflowId,
    queryFn: () => api.get<{ runs: WorkflowRun[] }>(`/api/workflows/${workflowId}/runs`).then((r) => r.data),
    refetchInterval: 8000,
  })

export const useMyWorkflowTasks = (enabled = true, status?: string) =>
  useQuery({
    queryKey: workflowKeys.tasks(status),
    enabled,
    queryFn: () => api.get<{ tasks: WorkflowTask[] }>('/api/workflow-tasks', { params: { status } }).then((r) => r.data),
    refetchInterval: 10000,
  })

export const useStartTask = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (taskId: string) => api.put<{ id: string; status: string }>(`/api/workflow-tasks/${taskId}/start`).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: workflowKeys.tasks() })
    },
  })
}

export const useCompleteTask = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({
      taskId,
      decision,
      reviewerNote,
      outputData,
    }: {
      taskId: string
      decision: 'approved' | 'rejected' | 'modified'
      reviewerNote?: string
      outputData?: Record<string, unknown>
    }) =>
      api
        .put<{ id: string; status: string }>(`/api/workflow-tasks/${taskId}`, {
          decision,
          reviewer_note: reviewerNote ?? '',
          output_data: outputData ?? {},
        })
        .then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: workflowKeys.tasks() })
    },
  })
}

export const useMyWorkflowApprovals = (enabled = true, status?: string) =>
  useQuery({
    queryKey: workflowKeys.approvals(status),
    enabled,
    queryFn: () => api.get<{ approvals: WorkflowApproval[] }>('/api/workflow-approvals', { params: { status } }).then((r) => r.data),
    refetchInterval: 10000,
  })

export const useSubmitApproval = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({
      approvalId,
      action,
      reviewNote,
    }: {
      approvalId: string
      action: 'approved' | 'rejected' | 'changes_requested'
      reviewNote?: string
    }) =>
      api
        .put<{ id: string; status: string }>(`/api/workflow-approvals/${approvalId}`, {
          action,
          review_note: reviewNote ?? '',
        })
        .then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: workflowKeys.approvals() })
    },
  })
}
