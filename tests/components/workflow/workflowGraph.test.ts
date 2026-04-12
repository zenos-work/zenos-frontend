import { describe, expect, it } from 'vitest'
import type { Edge, Node } from '@xyflow/react'
import { hasDirectedCycle, serializeWorkflowGraph, validateWorkflowDefinition } from '../../../src/components/workflow/workflowGraph'

describe('workflowGraph utilities', () => {
  it('serializes workflow nodes and edges', () => {
    const nodes: Array<Node<Record<string, unknown>>> = [
      { id: '1', type: 'default', position: { x: 10, y: 20 }, data: { node_type: 'trigger', label: 'Trigger' } },
      { id: '2', type: 'default', position: { x: 120, y: 60 }, data: { node_type: 'send_email', label: 'Send Email' } },
    ]
    const edges: Edge[] = [{ id: 'e-1-2', source: '1', target: '2' }]

    const serialized = serializeWorkflowGraph(nodes, edges)

    expect(serialized.nodes).toHaveLength(2)
    expect(serialized.edges).toEqual([{ source: '1', target: '2' }])
  })

  it('detects cycle in directed graph', () => {
    const nodes = [
      { id: '1', type: 'trigger', position: { x: 0, y: 0 }, data: {} },
      { id: '2', type: 'action', position: { x: 1, y: 1 }, data: {} },
    ]
    const cyclicEdges = [
      { source: '1', target: '2' },
      { source: '2', target: '1' },
    ]

    expect(hasDirectedCycle(nodes, cyclicEdges)).toBe(true)
  })

  it('validates workflow definition for trigger, edges, and acyclic graph', () => {
    const valid = validateWorkflowDefinition({
      nodes: [
        { id: '1', type: 'trigger', position: { x: 0, y: 0 }, data: {} },
        { id: '2', type: 'action', position: { x: 1, y: 1 }, data: {} },
      ],
      edges: [{ source: '1', target: '2' }],
    })
    expect(valid.valid).toBe(true)

    const invalid = validateWorkflowDefinition({
      nodes: [{ id: '1', type: 'action', position: { x: 0, y: 0 }, data: {} }],
      edges: [{ source: '1', target: '1' }],
    })

    expect(invalid.valid).toBe(false)
    expect(invalid.errors.join(' ')).toMatch(/trigger|cycle/i)
  })
})
