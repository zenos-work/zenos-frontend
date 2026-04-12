import type { Edge, Node } from '@xyflow/react'

export type SerializedWorkflowNode = {
  id: string
  type: string
  position: { x: number; y: number }
  data: Record<string, unknown>
}

export type SerializedWorkflowEdge = {
  source: string
  target: string
}

export type SerializedWorkflowDefinition = {
  nodes: SerializedWorkflowNode[]
  edges: SerializedWorkflowEdge[]
}

export const serializeWorkflowGraph = (
  nodes: Array<Node<Record<string, unknown>>>,
  edges: Array<Edge>,
): SerializedWorkflowDefinition => ({
  nodes: nodes.map((node) => ({
    id: node.id,
    type: node.type ?? 'action',
    position: {
      x: Number.isFinite(node.position?.x) ? node.position.x : 0,
      y: Number.isFinite(node.position?.y) ? node.position.y : 0,
    },
    data: (node.data ?? {}) as Record<string, unknown>,
  })),
  edges: edges.map((edge) => ({
    source: edge.source,
    target: edge.target,
  })),
})

export const hasDirectedCycle = (nodes: SerializedWorkflowNode[], edges: SerializedWorkflowEdge[]) => {
  const adjacency = new Map<string, string[]>()
  const inDegree = new Map<string, number>()

  for (const node of nodes) {
    adjacency.set(node.id, [])
    inDegree.set(node.id, 0)
  }

  for (const edge of edges) {
    if (!adjacency.has(edge.source) || !inDegree.has(edge.target)) {
      continue
    }
    adjacency.get(edge.source)?.push(edge.target)
    inDegree.set(edge.target, (inDegree.get(edge.target) ?? 0) + 1)
  }

  const queue: string[] = []
  for (const [nodeId, degree] of inDegree.entries()) {
    if (degree === 0) queue.push(nodeId)
  }

  let visited = 0
  while (queue.length) {
    const current = queue.shift() as string
    visited += 1
    const neighbors = adjacency.get(current) ?? []
    for (const next of neighbors) {
      const nextDegree = (inDegree.get(next) ?? 0) - 1
      inDegree.set(next, nextDegree)
      if (nextDegree === 0) queue.push(next)
    }
  }

  return visited !== nodes.length
}

export const validateWorkflowDefinition = (definition: SerializedWorkflowDefinition) => {
  const errors: string[] = []

  if (!definition.nodes.length) {
    errors.push('At least one node is required')
  }

  if (!definition.edges.length) {
    errors.push('At least one edge is required')
  }

  const triggerCount = definition.nodes.filter((node) => node.type === 'trigger').length
  if (triggerCount === 0) {
    errors.push('At least one trigger node is required')
  }

  if (hasDirectedCycle(definition.nodes, definition.edges)) {
    errors.push('Workflow graph contains a cycle and cannot be saved')
  }

  return {
    valid: errors.length === 0,
    errors,
  }
}
