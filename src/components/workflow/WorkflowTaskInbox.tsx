import { useState } from 'react'
import Button from '../ui/Button'
import SurfaceCard from '../ui/SurfaceCard'
import {
  useCompleteTask,
  useMyWorkflowApprovals,
  useMyWorkflowTasks,
  useStartTask,
  useSubmitApproval,
} from '../../hooks/useWorkflows'
import { useUiStore } from '../../stores/uiStore'

export default function WorkflowTaskInbox() {
  const toast = useUiStore((s) => s.toast)
  const [completionNotes, setCompletionNotes] = useState<Record<string, string>>({})
  const [approvalNotes, setApprovalNotes] = useState<Record<string, string>>({})

  const tasksQuery = useMyWorkflowTasks(true)
  const approvalsQuery = useMyWorkflowApprovals(true)
  const startTaskMutation = useStartTask()
  const completeTaskMutation = useCompleteTask()
  const submitApprovalMutation = useSubmitApproval()

  const startTask = async (taskId: string) => {
    try {
      await startTaskMutation.mutateAsync(taskId)
      toast('Task claimed', 'success')
    } catch {
      toast('Could not claim task', 'error')
    }
  }

  const completeTask = async (taskId: string) => {
    try {
      await completeTaskMutation.mutateAsync({
        taskId,
        decision: 'approved',
        reviewerNote: completionNotes[taskId] ?? '',
        outputData: completionNotes[taskId] ? { note: completionNotes[taskId] } : {},
      })
      setCompletionNotes((prev) => ({ ...prev, [taskId]: '' }))
      toast('Task completed', 'success')
    } catch {
      toast('Could not complete task', 'error')
    }
  }

  const submitApproval = async (approvalId: string, action: 'approved' | 'rejected') => {
    try {
      await submitApprovalMutation.mutateAsync({ approvalId, action, reviewNote: approvalNotes[approvalId] ?? '' })
      setApprovalNotes((prev) => ({ ...prev, [approvalId]: '' }))
      toast(action === 'approved' ? 'Approval approved' : 'Approval rejected', 'success')
    } catch {
      toast('Could not submit approval', 'error')
    }
  }

  const tasks = tasksQuery.data?.tasks ?? []
  const approvals = approvalsQuery.data?.approvals ?? []

  return (
    <div className='grid gap-4 lg:grid-cols-2'>
      <SurfaceCard>
        <h3 className='mb-3 text-base font-semibold text-[color:var(--text-primary)]'>Task Inbox</h3>
        {tasksQuery.isLoading ? (
          <p className='text-sm text-[color:var(--text-secondary)]'>Loading tasks...</p>
        ) : !tasks.length ? (
          <p className='text-sm text-[color:var(--text-secondary)]'>No workflow tasks assigned.</p>
        ) : (
          <div className='space-y-3'>
            {tasks.map((task) => (
              <div key={task.id} className='rounded-lg border border-[color:var(--border)] p-3'>
                <p className='text-sm font-medium text-[color:var(--text-primary)]'>{task.title || `Task ${task.id}`}</p>
                <p className='mt-1 text-xs text-[color:var(--text-secondary)]'>Status: {task.status || 'pending'}</p>
                <div className='mt-2 flex flex-wrap gap-2'>
                  <Button size='sm' variant='secondary' loading={startTaskMutation.isPending} onClick={() => void startTask(task.id)}>
                    Claim
                  </Button>
                  <Button size='sm' loading={completeTaskMutation.isPending} onClick={() => void completeTask(task.id)}>
                    Complete
                  </Button>
                </div>
                <textarea
                  value={completionNotes[task.id] ?? ''}
                  onChange={(event) =>
                    setCompletionNotes((prev) => ({
                      ...prev,
                      [task.id]: event.target.value,
                    }))
                  }
                  rows={2}
                  placeholder='Completion output (optional)'
                  className='mt-2 w-full resize-none rounded-lg border border-[color:var(--border)] bg-[color:var(--surface-0)] px-3 py-2 text-sm text-[color:var(--text-primary)]'
                />
              </div>
            ))}
          </div>
        )}
      </SurfaceCard>

      <SurfaceCard>
        <h3 className='mb-3 text-base font-semibold text-[color:var(--text-primary)]'>Approvals</h3>
        {approvalsQuery.isLoading ? (
          <p className='text-sm text-[color:var(--text-secondary)]'>Loading approvals...</p>
        ) : !approvals.length ? (
          <p className='text-sm text-[color:var(--text-secondary)]'>No approvals pending.</p>
        ) : (
          <div className='space-y-3'>
            {approvals.map((approval) => (
              <div key={approval.id} className='rounded-lg border border-[color:var(--border)] p-3'>
                <p className='text-sm font-medium text-[color:var(--text-primary)]'>Approval {approval.id}</p>
                <p className='mt-1 text-xs text-[color:var(--text-secondary)]'>Status: {approval.status || 'pending'}</p>
                <textarea
                  value={approvalNotes[approval.id] ?? ''}
                  onChange={(event) =>
                    setApprovalNotes((prev) => ({
                      ...prev,
                      [approval.id]: event.target.value,
                    }))
                  }
                  rows={2}
                  placeholder='Decision note (optional)'
                  className='mt-2 w-full resize-none rounded-lg border border-[color:var(--border)] bg-[color:var(--surface-0)] px-3 py-2 text-sm text-[color:var(--text-primary)]'
                />
                <div className='mt-2 flex flex-wrap gap-2'>
                  <Button size='sm' loading={submitApprovalMutation.isPending} onClick={() => void submitApproval(approval.id, 'approved')}>Approve</Button>
                  <Button size='sm' variant='danger' loading={submitApprovalMutation.isPending} onClick={() => void submitApproval(approval.id, 'rejected')}>Reject</Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </SurfaceCard>
    </div>
  )
}
