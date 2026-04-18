import { useEffect, useState } from 'react'
import {
  addEdge,
  Background,
  Controls,
  MiniMap,
  type Connection,
  type Edge,
  type EdgeChange,
  type Node,
  type NodeChange,
  applyEdgeChanges,
  applyNodeChanges,
  ReactFlow,
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import Button from '../ui/Button'
import SurfaceCard from '../ui/SurfaceCard'
import {
  useCreateWorkflowVersion,
  useCreateWorkflow,
  useDeleteWorkflow,
  useMyWorkflows,
  useRestoreWorkflowVersion,
  useTransitionWorkflow,
  useTriggerWorkflow,
  useUpdateWorkflow,
  useWorkflowDetail,
  useWorkflowNodeTypes,
  useWorkflowRuns,
  useWorkflowVersions,
} from '../../hooks/useWorkflows'
import { useVaultSecrets } from '../../hooks/useOrgInfra'
import { useUiStore } from '../../stores/uiStore'
import { serializeWorkflowGraph, validateWorkflowDefinition } from './workflowGraph'
import GenAINodeConfigPanel from './GenAINodeConfigPanel'

type WorkflowBuilderProps = {
  defaultOrgId?: string
}

const buildNode = (type: string, label: string, index: number): Node<Record<string, unknown>> => ({
  id: `${type}-${Date.now()}-${index}`,
  type: 'default',
  position: { x: 100 + index * 24, y: 100 + index * 24 },
  data: { label, node_type: type },
})

export default function WorkflowBuilder({ defaultOrgId = '' }: WorkflowBuilderProps) {
  const toast = useUiStore((s) => s.toast)

  const [orgId, setOrgId] = useState(defaultOrgId)
  const [name, setName] = useState('')
  const [selectedWorkflowId, setSelectedWorkflowId] = useState('')
  const [selectedSecretByNode, setSelectedSecretByNode] = useState<Record<string, string>>({})
  const [nodes, setNodes] = useState<Array<Node<Record<string, unknown>>>>([])
  const [edges, setEdges] = useState<Array<Edge>>([])
  const [selectedNode, setSelectedNode] = useState<Node<Record<string, unknown>> | null>(null)

  const nodeTypesQuery = useWorkflowNodeTypes(true)
  const workflowsQuery = useMyWorkflows(true, orgId || undefined)
  const vaultSecretsQuery = useVaultSecrets(orgId, Boolean(orgId))
  const createMutation = useCreateWorkflow()
  const updateMutation = useUpdateWorkflow()
  const deleteMutation = useDeleteWorkflow()
  const triggerMutation = useTriggerWorkflow()
  const transitionMutation = useTransitionWorkflow()
  const createVersionMutation = useCreateWorkflowVersion()
  const restoreVersionMutation = useRestoreWorkflowVersion()

  const workflowDetailQuery = useWorkflowDetail(selectedWorkflowId, Boolean(selectedWorkflowId))
  const versionsQuery = useWorkflowVersions(selectedWorkflowId, Boolean(selectedWorkflowId))

  useEffect(() => {
    if (!selectedWorkflowId || !workflowDetailQuery.data) return

    const workflowNodes = workflowDetailQuery.data.definition?.nodes ?? []
    const workflowEdges = workflowDetailQuery.data.definition?.edges ?? []

    const timer = setTimeout(() => {
      setName(workflowDetailQuery.data.name)
      setNodes(
        workflowNodes.map((node, index) => ({
          id: node.id,
          type: 'default',
          position: node.position ?? { x: 80 + index * 30, y: 80 + index * 30 },
          data: {
            ...(node.data ?? {}),
            label: String((node.data?.label as string | undefined) ?? node.type),
            node_type: node.type,
          },
        })),
      )

      setEdges(
        workflowEdges.map((edge, index) => ({
          id: edge.id ?? `${edge.source}-${edge.target}-${index}`,
          source: edge.source,
          target: edge.target,
        })),
      )
    }, 0)

    return () => clearTimeout(timer)
  }, [selectedWorkflowId, workflowDetailQuery.data])

  const runsQuery = useWorkflowRuns(selectedWorkflowId, Boolean(selectedWorkflowId))

  const palette = nodeTypesQuery.data?.node_types ?? [
    { type: 'trigger', label: 'Trigger' },
    { type: 'fetch_data', label: 'Fetch Data' },
    { type: 'send_email', label: 'Send Email' },
  ]

  const secretOptions = vaultSecretsQuery.data?.secrets ?? []

  const onNodesChange = (changes: NodeChange<Node<Record<string, unknown>>>[]) => {
    setNodes((current) => applyNodeChanges(changes, current))
  }

  const onEdgesChange = (changes: EdgeChange<Edge>[]) => {
    setEdges((current) => applyEdgeChanges(changes, current))
  }

  const onConnect = (connection: Connection) => {
    setEdges((current) => addEdge({ ...connection, id: `${connection.source}-${connection.target}-${Date.now()}` }, current))
  }

  const onNodeClick = (_event: React.MouseEvent, node: Node<Record<string, unknown>>) => {
    const nodeType = String(node.data.node_type ?? '')
    setSelectedNode(nodeType.startsWith('genai_') ? node : null)
  }

  const addPaletteNode = (type: string, label: string) => {
    setNodes((current) => [...current, buildNode(type, label, current.length + 1)])
  }

  const applySecretRef = (nodeId: string, secretName: string) => {
    setSelectedSecretByNode((prev) => ({ ...prev, [nodeId]: secretName }))
    setNodes((current) =>
      current.map((node) =>
        node.id === nodeId
          ? {
              ...node,
              data: {
                ...(node.data ?? {}),
                secret_ref: secretName,
              },
            }
          : node,
      ),
    )
  }

  const saveWorkflow = async () => {
    const graph = serializeWorkflowGraph(nodes, edges)
    const validation = validateWorkflowDefinition(graph)

    if (!validation.valid) {
      toast(validation.errors.join('. '), 'error')
      return
    }

    if (!name.trim()) {
      toast('Workflow name is required', 'warning')
      return
    }

    const payload = {
      name: name.trim(),
      org_id: orgId || undefined,
      definition: graph,
    }

    try {
      if (selectedWorkflowId) {
        await updateMutation.mutateAsync({ workflowId: selectedWorkflowId, payload })
        toast('Workflow updated', 'success')
      } else {
        const created = await createMutation.mutateAsync(payload)
        setSelectedWorkflowId(created.id)
        toast('Workflow created', 'success')
      }
    } catch {
      toast('Could not save workflow', 'error')
    }
  }

  const runWorkflow = async (environment: 'dev' | 'staging' | 'production') => {
    if (!selectedWorkflowId) {
      toast('Select or create a workflow first', 'warning')
      return
    }
    try {
      await transitionMutation.mutateAsync({ workflowId: selectedWorkflowId, status: 'active', environment })
      await triggerMutation.mutateAsync({ workflowId: selectedWorkflowId })
      toast(environment === 'production' ? 'Workflow published and run started' : 'Workflow test run started', 'success')
    } catch {
      toast('Could not trigger workflow', 'error')
    }
  }

  const saveDraft = async () => {
    if (!selectedWorkflowId) {
      toast('Save workflow first to set draft status', 'warning')
      return
    }
    try {
      await transitionMutation.mutateAsync({ workflowId: selectedWorkflowId, status: 'draft' })
      toast('Workflow moved to draft', 'success')
    } catch {
      toast('Could not set workflow to draft', 'error')
    }
  }

  const pauseWorkflow = async () => {
    if (!selectedWorkflowId) {
      toast('Save workflow first to pause it', 'warning')
      return
    }
    try {
      await transitionMutation.mutateAsync({ workflowId: selectedWorkflowId, status: 'paused' })
      toast('Workflow paused', 'success')
    } catch {
      toast('Could not pause workflow', 'error')
    }
  }

  const archiveWorkflow = async () => {
    if (!selectedWorkflowId) {
      toast('Save workflow first to archive it', 'warning')
      return
    }
    try {
      await transitionMutation.mutateAsync({ workflowId: selectedWorkflowId, status: 'archived' })
      toast('Workflow archived', 'success')
    } catch {
      toast('Could not archive workflow', 'error')
    }
  }

  const createVersion = async () => {
    if (!selectedWorkflowId) {
      toast('Select or create a workflow first', 'warning')
      return
    }
    try {
      await createVersionMutation.mutateAsync({ workflowId: selectedWorkflowId })
      toast('Workflow version created', 'success')
    } catch {
      toast('Could not create workflow version', 'error')
    }
  }

  const restoreVersion = async (versionNumber: number) => {
    if (!selectedWorkflowId) return
    try {
      await restoreVersionMutation.mutateAsync({ workflowId: selectedWorkflowId, versionNumber })
      toast(`Restored version v${versionNumber}`, 'success')
    } catch {
      toast('Could not restore selected version', 'error')
    }
  }

  const deleteWorkflow = async () => {
    if (!selectedWorkflowId) return
    if (!confirm('Delete this workflow?')) return

    try {
      await deleteMutation.mutateAsync(selectedWorkflowId)
      setSelectedWorkflowId('')
      setName('')
      setNodes([])
      setEdges([])
      toast('Workflow deleted', 'success')
    } catch {
      toast('Could not delete workflow', 'error')
    }
  }

  return (
    <div className='space-y-4'>
      <SurfaceCard>
        <div className='grid gap-3 md:grid-cols-[1fr_1fr_1fr_auto]'>
          <input
            value={orgId}
            onChange={(event) => setOrgId(event.target.value)}
            placeholder='Organization ID for vault and workflow scope'
            className='h-10 rounded-lg border border-[color:var(--border)] bg-[color:var(--surface-0)] px-3 text-sm text-[color:var(--text-primary)]'
          />
          <input
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder='Workflow name'
            className='h-10 rounded-lg border border-[color:var(--border)] bg-[color:var(--surface-0)] px-3 text-sm text-[color:var(--text-primary)]'
          />
          <select
            value={selectedWorkflowId}
            onChange={(event) => setSelectedWorkflowId(event.target.value)}
            className='h-10 rounded-lg border border-[color:var(--border)] bg-[color:var(--surface-0)] px-3 text-sm text-[color:var(--text-primary)]'
          >
            <option value=''>New workflow</option>
            {(workflowsQuery.data?.workflows ?? []).map((workflow) => (
              <option key={workflow.id} value={workflow.id}>{workflow.name}</option>
            ))}
          </select>
          <div className='flex gap-2'>
            <Button size='sm' onClick={() => void saveWorkflow()} loading={createMutation.isPending || updateMutation.isPending}>Save</Button>
            <Button size='sm' variant='secondary' onClick={() => void saveDraft()} loading={transitionMutation.isPending} disabled={!selectedWorkflowId}>Draft</Button>
            <Button size='sm' variant='secondary' onClick={() => void pauseWorkflow()} loading={transitionMutation.isPending} disabled={!selectedWorkflowId}>Pause</Button>
            <Button size='sm' variant='secondary' onClick={() => void archiveWorkflow()} loading={transitionMutation.isPending} disabled={!selectedWorkflowId}>Archive</Button>
            <Button size='sm' variant='secondary' onClick={() => void runWorkflow('dev')} loading={triggerMutation.isPending || transitionMutation.isPending}>Test Run</Button>
            <Button size='sm' variant='secondary' onClick={() => void runWorkflow('production')} loading={triggerMutation.isPending || transitionMutation.isPending}>Publish</Button>
            <Button size='sm' variant='danger' onClick={() => void deleteWorkflow()} loading={deleteMutation.isPending} disabled={!selectedWorkflowId}>Delete</Button>
          </div>
        </div>
      </SurfaceCard>

      <div className='grid gap-4 lg:grid-cols-[280px_1fr]'>
        <SurfaceCard>
          <h3 className='mb-2 text-sm font-semibold text-[color:var(--text-primary)]'>Node Palette</h3>
          <div className='space-y-2'>
            {palette.map((nodeType) => (
              <button
                key={nodeType.type}
                type='button'
                onClick={() => addPaletteNode(nodeType.type, nodeType.label)}
                className='w-full rounded-lg border border-[color:var(--border)] bg-[color:var(--surface-0)] px-3 py-2 text-left text-sm text-[color:var(--text-primary)] hover:bg-[color:var(--surface-2)]'
              >
                <p className='font-medium'>{nodeType.label}</p>
                <p className='text-xs text-[color:var(--text-muted)]'>{nodeType.type}</p>
              </button>
            ))}
          </div>

          <h3 className='mb-2 mt-4 text-sm font-semibold text-[color:var(--text-primary)]'>Vault Secret References</h3>
          {!orgId ? (
            <p className='text-xs text-[color:var(--text-muted)]'>Enter organization ID to load vault secrets.</p>
          ) : vaultSecretsQuery.isLoading ? (
            <p className='text-xs text-[color:var(--text-muted)]'>Loading vault secrets...</p>
          ) : !secretOptions.length ? (
            <p className='text-xs text-[color:var(--text-muted)]'>No secrets in vault yet.</p>
          ) : (
            <div className='space-y-2'>
              {nodes.map((node) => (
                <div key={node.id} className='rounded-lg border border-[color:var(--border)] p-2'>
                  <p className='mb-1 text-xs font-medium text-[color:var(--text-primary)]'>
                    {String((node.data?.label as string | undefined) ?? node.id)}
                  </p>
                  <select
                    value={selectedSecretByNode[node.id] ?? String((node.data?.secret_ref as string | undefined) ?? '')}
                    onChange={(event) => applySecretRef(node.id, event.target.value)}
                    className='h-8 w-full rounded border border-[color:var(--border)] bg-[color:var(--surface-0)] px-2 text-xs text-[color:var(--text-primary)]'
                  >
                    <option value=''>No secret</option>
                    {secretOptions.map((secret) => (
                      <option key={secret.id} value={secret.name}>{secret.name}</option>
                    ))}
                  </select>
                </div>
              ))}
            </div>
          )}
        </SurfaceCard>

        <SurfaceCard>
          <div style={{ width: '100%', height: 560 }}>
            <ReactFlow
              nodes={nodes}
              edges={edges}
              onNodesChange={onNodesChange}
              onEdgesChange={onEdgesChange}
              onConnect={onConnect}
              onNodeClick={onNodeClick}
              fitView
            >
              <MiniMap />
              <Controls />
              <Background />
            </ReactFlow>
          </div>
          {selectedNode && (
            <div className='mt-4'>
              <GenAINodeConfigPanel
                node={selectedNode}
                onClose={() => setSelectedNode(null)}
              />
            </div>
          )}
        </SurfaceCard>
      </div>

      <SurfaceCard>
        <h3 className='mb-2 text-sm font-semibold text-[color:var(--text-primary)]'>Recent Runs</h3>
        {!selectedWorkflowId ? (
          <p className='text-sm text-[color:var(--text-secondary)]'>Select a workflow to see run history.</p>
        ) : runsQuery.isLoading ? (
          <p className='text-sm text-[color:var(--text-secondary)]'>Loading runs...</p>
        ) : !(runsQuery.data?.runs?.length) ? (
          <p className='text-sm text-[color:var(--text-secondary)]'>No runs yet.</p>
        ) : (
          <div className='space-y-2'>
            {runsQuery.data.runs.map((run) => (
              <div key={run.id} className='rounded-lg border border-[color:var(--border)] p-2 text-sm'>
                <p className='font-medium text-[color:var(--text-primary)]'>Run {run.id}</p>
                <p className='text-[color:var(--text-secondary)]'>Status: {run.status}</p>
              </div>
            ))}
          </div>
        )}
      </SurfaceCard>

      <SurfaceCard>
        <div className='mb-2 flex items-center justify-between gap-2'>
          <h3 className='text-sm font-semibold text-[color:var(--text-primary)]'>Workflow Versions</h3>
          <Button size='sm' variant='secondary' onClick={() => void createVersion()} loading={createVersionMutation.isPending} disabled={!selectedWorkflowId}>Create Version</Button>
        </div>
        {!selectedWorkflowId ? (
          <p className='text-sm text-[color:var(--text-secondary)]'>Select a workflow to manage versions.</p>
        ) : versionsQuery.isLoading ? (
          <p className='text-sm text-[color:var(--text-secondary)]'>Loading versions...</p>
        ) : !(versionsQuery.data?.versions?.length) ? (
          <p className='text-sm text-[color:var(--text-secondary)]'>No saved versions yet.</p>
        ) : (
          <div className='space-y-2'>
            {versionsQuery.data.versions.map((version) => (
              <div key={version.id} className='flex items-center justify-between gap-2 rounded-lg border border-[color:var(--border)] p-2'>
                <div>
                  <p className='text-sm font-medium text-[color:var(--text-primary)]'>v{version.version_number}</p>
                  <p className='text-xs text-[color:var(--text-secondary)]'>{version.changelog || 'No changelog'}</p>
                </div>
                <Button
                  size='sm'
                  variant='secondary'
                  onClick={() => void restoreVersion(version.version_number)}
                  loading={restoreVersionMutation.isPending}
                >
                  Restore
                </Button>
              </div>
            ))}
          </div>
        )}
      </SurfaceCard>
    </div>
  )
}
