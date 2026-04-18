import { useState } from 'react'
import Button from '../ui/Button'
import SurfaceCard from '../ui/SurfaceCard'
import { useCloneTemplate, useWorkflowTemplates } from '../../hooks/useWorkflows'
import { useUiStore } from '../../stores/uiStore'

export default function WorkflowTemplateGallery() {
  const toast = useUiStore((s) => s.toast)
  const [nameOverrides, setNameOverrides] = useState<Record<string, string>>({})
  const templatesQuery = useWorkflowTemplates(true)
  const cloneMutation = useCloneTemplate()

  const cloneTemplate = async (templateId: string) => {
    try {
      await cloneMutation.mutateAsync({ templateId, name: nameOverrides[templateId]?.trim() || undefined })
      toast('Template cloned into your workflows', 'success')
    } catch {
      toast('Could not clone template', 'error')
    }
  }

  if (templatesQuery.isLoading) {
    return <SurfaceCard><p className='text-sm text-[color:var(--text-secondary)]'>Loading templates...</p></SurfaceCard>
  }

  const templates = templatesQuery.data?.templates ?? []
  if (!templates.length) {
    return <SurfaceCard><p className='text-sm text-[color:var(--text-secondary)]'>No templates available.</p></SurfaceCard>
  }

  return (
    <div className='grid gap-3 md:grid-cols-2'>
      {templates.map((template) => (
        <SurfaceCard key={template.id}>
          <h3 className='text-base font-semibold text-[color:var(--text-primary)]'>{template.name}</h3>
          <p className='mt-1 text-sm text-[color:var(--text-secondary)]'>{template.description || 'No description provided.'}</p>
          <p className='mt-1 text-xs text-[color:var(--text-muted)]'>Category: {template.category || 'general'}</p>

          <div className='mt-3 flex gap-2'>
            <input
              value={nameOverrides[template.id] ?? ''}
              onChange={(event) =>
                setNameOverrides((prev) => ({
                  ...prev,
                  [template.id]: event.target.value,
                }))
              }
              placeholder='Optional cloned name'
              className='h-9 flex-1 rounded-lg border border-[color:var(--border)] bg-[color:var(--surface-0)] px-3 text-sm text-[color:var(--text-primary)]'
            />
            <Button size='sm' onClick={() => void cloneTemplate(template.id)} loading={cloneMutation.isPending}>Clone</Button>
          </div>
        </SurfaceCard>
      ))}
    </div>
  )
}
