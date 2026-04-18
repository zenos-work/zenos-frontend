import { render, screen, fireEvent } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import GenAINodeConfigPanel from '../../src/components/workflow/GenAINodeConfigPanel'
import type { Node } from '@xyflow/react'

function makeNode(nodeType: string, label = 'Test Node'): Node<Record<string, unknown>> {
  return {
    id: `${nodeType}-1`,
    type: 'default',
    position: { x: 0, y: 0 },
    data: { node_type: nodeType, label },
  }
}

describe('GenAINodeConfigPanel', () => {
  it('renders nothing for non-genai node types', () => {
    const onClose = vi.fn()
    const { container } = render(
      <GenAINodeConfigPanel node={makeNode('trigger', 'Trigger')} onClose={onClose} />,
    )
    expect(container.firstChild).toBeNull()
  })

  it('renders panel header for genai_summarize', () => {
    render(<GenAINodeConfigPanel node={makeNode('genai_summarize', 'Summarize')} onClose={vi.fn()} />)
    expect(screen.getByText('Summarize')).toBeInTheDocument()
    expect(screen.getByText('genai_summarize')).toBeInTheDocument()
  })

  it('shows provider and model badges for genai_summarize', () => {
    render(<GenAINodeConfigPanel node={makeNode('genai_summarize')} onClose={vi.fn()} />)
    expect(screen.getByText('openai')).toBeInTheDocument()
    expect(screen.getByText('gpt-3.5-turbo')).toBeInTheDocument()
  })

  it('shows min tier badge', () => {
    render(<GenAINodeConfigPanel node={makeNode('genai_summarize')} onClose={vi.fn()} />)
    expect(screen.getByText(/pro tier\+/i)).toBeInTheDocument()
  })

  it('shows cost per 1k tokens', () => {
    render(<GenAINodeConfigPanel node={makeNode('genai_summarize')} onClose={vi.fn()} />)
    expect(screen.getByText(/cost per 1k tokens/i)).toBeInTheDocument()
    // 150 microcents → $0.0015 → 4 decimal places
    expect(screen.getByText('$0.0015')).toBeInTheDocument()
  })

  it('shows addon requirement for genai_summarize', () => {
    render(<GenAINodeConfigPanel node={makeNode('genai_summarize')} onClose={vi.fn()} />)
    expect(screen.getByText(/requires ai orchestration add-on/i)).toBeInTheDocument()
  })

  it('shows fallback message for unknown genai_ node type', () => {
    render(<GenAINodeConfigPanel node={makeNode('genai_unknown_thing')} onClose={vi.fn()} />)
    expect(screen.getByText(/no metadata available/i)).toBeInTheDocument()
  })

  it('calls onClose when close button is clicked', () => {
    const onClose = vi.fn()
    render(<GenAINodeConfigPanel node={makeNode('genai_translate')} onClose={onClose} />)
    fireEvent.click(screen.getByRole('button', { name: /close node config panel/i }))
    expect(onClose).toHaveBeenCalledOnce()
  })

  it('renders genai_translate with deepl provider', () => {
    render(<GenAINodeConfigPanel node={makeNode('genai_translate', 'Translate')} onClose={vi.fn()} />)
    expect(screen.getByText('deepl')).toBeInTheDocument()
    expect(screen.getByText('deepl-pro')).toBeInTheDocument()
  })

  it('renders enterprise tier for genai_repurpose', () => {
    render(<GenAINodeConfigPanel node={makeNode('genai_repurpose')} onClose={vi.fn()} />)
    expect(screen.getByText(/enterprise tier\+/i)).toBeInTheDocument()
  })
})
