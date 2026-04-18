import { act, renderHook, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import api from '../../src/lib/api'
import {
  useCloneTemplate,
  useCompleteTask,
  useCreateWorkflow,
  useCreateWorkflowVersion,
  useMyWorkflowApprovals,
  useMyWorkflowTasks,
  useMyWorkflows,
  useRestoreWorkflowVersion,
  useSubmitApproval,
  useTransitionWorkflow,
  useTriggerWorkflow,
  useWorkflowVersions,
  useWorkflowNodeTypes,
  useWorkflowRuns,
  useWorkflowTemplates,
} from '../../src/hooks/useWorkflows'
import { createQueryClientWrapper } from '../utils/queryClient'

vi.mock('../../src/lib/api', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  },
}))

describe('useWorkflows hooks', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('fetches node types, templates, workflows, runs, tasks, and approvals', async () => {
    vi.mocked(api.get)
      .mockResolvedValueOnce({ data: { node_types: [{ type: 'trigger', label: 'Trigger' }] } } as never)
      .mockResolvedValueOnce({ data: { templates: [{ id: 'tpl-1', name: 'Welcome flow' }] } } as never)
      .mockResolvedValueOnce({ data: { workflows: [{ id: 'wf-1', name: 'Flow A' }] } } as never)
      .mockResolvedValueOnce({ data: { runs: [{ id: 'run-1', workflow_id: 'wf-1', status: 'RUNNING' }] } } as never)
      .mockResolvedValueOnce({ data: { tasks: [{ id: 'task-1', title: 'Review' }] } } as never)
      .mockResolvedValueOnce({ data: { approvals: [{ id: 'apr-1', status: 'pending' }] } } as never)

    const a = createQueryClientWrapper()
    const b = createQueryClientWrapper()
    const c = createQueryClientWrapper()
    const d = createQueryClientWrapper()
    const e = createQueryClientWrapper()
    const f = createQueryClientWrapper()

    const nodeTypes = renderHook(() => useWorkflowNodeTypes(true), { wrapper: a.Wrapper })
    const templates = renderHook(() => useWorkflowTemplates(true), { wrapper: b.Wrapper })
    const workflows = renderHook(() => useMyWorkflows(true, 'org-1'), { wrapper: c.Wrapper })
    const runs = renderHook(() => useWorkflowRuns('wf-1', true), { wrapper: d.Wrapper })
    const tasks = renderHook(() => useMyWorkflowTasks(true), { wrapper: e.Wrapper })
    const approvals = renderHook(() => useMyWorkflowApprovals(true), { wrapper: f.Wrapper })

    await waitFor(() => {
      expect(nodeTypes.result.current.isSuccess).toBe(true)
      expect(templates.result.current.isSuccess).toBe(true)
      expect(workflows.result.current.isSuccess).toBe(true)
      expect(runs.result.current.isSuccess).toBe(true)
      expect(tasks.result.current.isSuccess).toBe(true)
      expect(approvals.result.current.isSuccess).toBe(true)
    })

    expect(api.get).toHaveBeenCalledWith('/api/workflow-node-types')
    expect(api.get).toHaveBeenCalledWith('/api/workflow-templates')
    expect(api.get).toHaveBeenCalledWith('/api/workflows', { params: { org_id: 'org-1' } })
    expect(api.get).toHaveBeenCalledWith('/api/workflows/wf-1/runs')
    expect(api.get).toHaveBeenCalledWith('/api/workflow-tasks', { params: { status: undefined } })
    expect(api.get).toHaveBeenCalledWith('/api/workflow-approvals', { params: { status: undefined } })
  })

  it('creates and triggers workflow, clones template, completes task, and submits approval', async () => {
    vi.mocked(api.post)
      .mockResolvedValueOnce({ data: { id: 'wf-1' } } as never)
      .mockResolvedValueOnce({ data: { id: 'run-1' } } as never)
      .mockResolvedValueOnce({ data: { workflow_id: 'wf-2' } } as never)
    vi.mocked(api.get)
      .mockResolvedValueOnce({ data: { id: 'wf-1', name: 'Flow A', nodes: [], edges: [] } } as never)
    vi.mocked(api.put)
      .mockResolvedValueOnce({ data: { id: 'task-1', status: 'DONE' } } as never)
      .mockResolvedValueOnce({ data: { id: 'apr-1', status: 'APPROVED' } } as never)

    const a = createQueryClientWrapper()
    const b = createQueryClientWrapper()
    const c = createQueryClientWrapper()
    const d = createQueryClientWrapper()
    const e = createQueryClientWrapper()

    const createWorkflow = renderHook(() => useCreateWorkflow(), { wrapper: a.Wrapper })
    const triggerWorkflow = renderHook(() => useTriggerWorkflow(), { wrapper: b.Wrapper })
    const cloneTemplate = renderHook(() => useCloneTemplate(), { wrapper: c.Wrapper })
    const completeTask = renderHook(() => useCompleteTask(), { wrapper: d.Wrapper })
    const submitApproval = renderHook(() => useSubmitApproval(), { wrapper: e.Wrapper })

    await act(async () => {
      await createWorkflow.result.current.mutateAsync({ name: 'Flow A', org_id: 'org-1', definition: { nodes: [], edges: [] } })
      await triggerWorkflow.result.current.mutateAsync({ workflowId: 'wf-1' })
      await cloneTemplate.result.current.mutateAsync({ templateId: 'tpl-1', name: 'My cloned flow' })
      await completeTask.result.current.mutateAsync({ taskId: 'task-1', decision: 'approved', reviewerNote: 'done' })
      await submitApproval.result.current.mutateAsync({ approvalId: 'apr-1', action: 'approved', reviewNote: 'ship it' })
    })

    expect(api.post).toHaveBeenCalledWith('/api/workflows', {
      name: 'Flow A',
      org_id: 'org-1',
      description: '',
      trigger_type: 'manual',
      environment: 'dev',
    })
    expect(api.post).toHaveBeenCalledWith('/api/workflows/wf-1/runs', {})
    expect(api.post).toHaveBeenCalledWith('/api/workflow-templates/tpl-1/clone', { name: 'My cloned flow' })
    expect(api.put).toHaveBeenCalledWith('/api/workflow-tasks/task-1', {
      decision: 'approved',
      reviewer_note: 'done',
      output_data: {},
    })
    expect(api.put).toHaveBeenCalledWith('/api/workflow-approvals/apr-1', { action: 'approved', review_note: 'ship it' })
  })

  it('runs builder version flow: list versions, create version, restore version, and transition lifecycle', async () => {
    vi.mocked(api.get).mockResolvedValueOnce({
      data: {
        versions: [{ id: 'ver-1', workflow_id: 'wf-1', version_number: 1, changelog: 'baseline' }],
      },
    } as never)
    vi.mocked(api.post)
      .mockResolvedValueOnce({ data: { id: 'ver-2', version_number: 2 } } as never)
      .mockResolvedValueOnce({ data: { workflow_id: 'wf-1', restored_version: 1 } } as never)
    vi.mocked(api.put).mockResolvedValueOnce({ data: { id: 'wf-1', status: 'paused' } } as never)

    const a = createQueryClientWrapper()
    const b = createQueryClientWrapper()
    const c = createQueryClientWrapper()
    const d = createQueryClientWrapper()

    const versions = renderHook(() => useWorkflowVersions('wf-1', true), { wrapper: a.Wrapper })
    const createVersion = renderHook(() => useCreateWorkflowVersion(), { wrapper: b.Wrapper })
    const restoreVersion = renderHook(() => useRestoreWorkflowVersion(), { wrapper: c.Wrapper })
    const transition = renderHook(() => useTransitionWorkflow(), { wrapper: d.Wrapper })

    await waitFor(() => {
      expect(versions.result.current.isSuccess).toBe(true)
    })

    await act(async () => {
      await createVersion.result.current.mutateAsync({ workflowId: 'wf-1', changelog: 'checkpoint' })
      await restoreVersion.result.current.mutateAsync({ workflowId: 'wf-1', versionNumber: 1 })
      await transition.result.current.mutateAsync({ workflowId: 'wf-1', status: 'paused' })
    })

    expect(api.get).toHaveBeenCalledWith('/api/workflows/wf-1/versions')
    expect(api.post).toHaveBeenCalledWith('/api/workflows/wf-1/versions', { changelog: 'checkpoint' })
    expect(api.post).toHaveBeenCalledWith('/api/workflows/wf-1/versions/1/restore')
    expect(api.put).toHaveBeenCalledWith('/api/workflows/wf-1', { status: 'paused', environment: undefined })
  })
})
