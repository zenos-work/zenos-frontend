/**
 * Phase 13 — Advanced AI Orchestration UI
 * Shows detailed configuration and cost info when a GenAI node
 * (node_type starting with "genai_") is selected in WorkflowBuilder.
 */
import type { Node } from '@xyflow/react'
import { Bot, Cpu, DollarSign, Key, Layers, Tag, X } from 'lucide-react'

// Mirrors GenAINodeConfig from backend genai_nodes.py
export type GenAINodeMeta = {
  node_type: string
  display_name: string
  description: string
  provider: string
  model: string
  input_fields: Record<string, string>
  output_fields: Record<string, string>
  default_temperature: number
  max_tokens: number | null
  cost_per_1k_input_tokens_microcents: number
  cost_per_1k_output_tokens_microcents: number
  requires_addon: boolean
  min_tier: string
  requires_api_key: boolean
}

// Static lookup derived from backend's GenAINodeRegistry.NODES — kept in sync by contract.
const GENAI_META: Record<string, Partial<GenAINodeMeta>> = {
  genai_summarize:       { display_name: 'Summarize',        provider: 'openai',     model: 'gpt-3.5-turbo', min_tier: 'pro',        cost_per_1k_input_tokens_microcents: 150, cost_per_1k_output_tokens_microcents: 200, requires_addon: true },
  genai_translate:       { display_name: 'Translate',        provider: 'deepl',      model: 'deepl-pro',      min_tier: 'pro',        cost_per_1k_input_tokens_microcents: 100, cost_per_1k_output_tokens_microcents: 150, requires_addon: true },
  genai_rewrite_tone:    { display_name: 'Rewrite Tone',     provider: 'openai',     model: 'gpt-3.5-turbo', min_tier: 'pro',        cost_per_1k_input_tokens_microcents: 150, cost_per_1k_output_tokens_microcents: 200, requires_addon: true },
  genai_extract_entities:{ display_name: 'Extract Entities', provider: 'openai',     model: 'gpt-3.5-turbo', min_tier: 'pro',        cost_per_1k_input_tokens_microcents: 150, cost_per_1k_output_tokens_microcents: 200, requires_addon: true },
  genai_generate_tags:   { display_name: 'Generate Tags',    provider: 'openai',     model: 'gpt-3.5-turbo', min_tier: 'starter',    cost_per_1k_input_tokens_microcents: 100, cost_per_1k_output_tokens_microcents: 150, requires_addon: false },
  genai_content_moderate:{ display_name: 'Content Moderation', provider: 'openai',   model: 'gpt-4',          min_tier: 'business',   cost_per_1k_input_tokens_microcents: 300, cost_per_1k_output_tokens_microcents: 400, requires_addon: true },
  genai_seo_optimize:    { display_name: 'SEO Optimize',     provider: 'openai',     model: 'gpt-4',          min_tier: 'business',   cost_per_1k_input_tokens_microcents: 300, cost_per_1k_output_tokens_microcents: 400, requires_addon: true },
  genai_repurpose:       { display_name: 'Repurpose Content',provider: 'anthropic',  model: 'claude-3-sonnet',min_tier: 'enterprise', cost_per_1k_input_tokens_microcents: 300, cost_per_1k_output_tokens_microcents: 600, requires_addon: true },
}

function microcentsToDollars(microcents: number): string {
  return `$${(microcents / 100_000).toFixed(4)}`
}

type Props = {
  node: Node<Record<string, unknown>>
  onClose: () => void
}

export default function GenAINodeConfigPanel({ node, onClose }: Props) {
  const nodeType = String(node.data.node_type ?? '')
  if (!nodeType.startsWith('genai_')) return null

  const meta = GENAI_META[nodeType]
  const label = String(node.data.label ?? meta?.display_name ?? nodeType)

  const tierColors: Record<string, string> = {
    free:       'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300',
    starter:    'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
    pro:        'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300',
    business:   'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300',
    enterprise: 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300',
  }

  return (
    <aside
      className="flex flex-col gap-4 rounded-xl border border-[color:var(--border)] bg-[color:var(--surface-5)] p-4 text-sm shadow-[var(--shadow)]"
      aria-label="GenAI Node Configuration"
    >
      {/* Header */}
      <div className="flex items-start gap-2">
        <Bot className="mt-0.5 h-5 w-5 shrink-0 text-purple-500" />
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-[color:var(--text-primary)] truncate">{label}</p>
          <p className="text-xs text-[color:var(--text-muted)]">{nodeType}</p>
        </div>
        <button
          onClick={onClose}
          className="shrink-0 rounded p-0.5 text-[color:var(--text-muted)] hover:text-[color:var(--text-primary)] hover:bg-[color:var(--surface-1)]"
          aria-label="Close node config panel"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {meta ? (
        <>
          {/* Provider + Model */}
          <div className="flex flex-wrap gap-2">
            <span className="inline-flex items-center gap-1 rounded-full bg-[color:var(--surface-1)] px-2.5 py-1 text-xs font-medium text-[color:var(--text-secondary)]">
              <Cpu className="h-3 w-3" />
              {meta.provider ?? '—'}
            </span>
            <span className="inline-flex items-center gap-1 rounded-full bg-[color:var(--surface-1)] px-2.5 py-1 text-xs font-medium text-[color:var(--text-secondary)]">
              <Layers className="h-3 w-3" />
              {meta.model ?? '—'}
            </span>
            {meta.min_tier && (
              <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium ${tierColors[meta.min_tier] ?? tierColors.pro}`}>
                <Tag className="h-3 w-3" />
                {meta.min_tier} tier+
              </span>
            )}
          </div>

          {/* Cost */}
          <div className="rounded-lg border border-[color:var(--border)] bg-[color:var(--surface-1)] p-3 space-y-1">
            <p className="flex items-center gap-1.5 font-medium text-[color:var(--text-secondary)]">
              <DollarSign className="h-3.5 w-3.5 text-green-500" />
              Cost per 1k tokens
            </p>
            <div className="flex justify-between text-xs text-[color:var(--text-muted)]">
              <span>Input:</span>
              <span className="font-mono font-medium text-[color:var(--text-primary)]">
                {meta.cost_per_1k_input_tokens_microcents != null
                  ? microcentsToDollars(meta.cost_per_1k_input_tokens_microcents)
                  : '—'}
              </span>
            </div>
            <div className="flex justify-between text-xs text-[color:var(--text-muted)]">
              <span>Output:</span>
              <span className="font-mono font-medium text-[color:var(--text-primary)]">
                {meta.cost_per_1k_output_tokens_microcents != null
                  ? microcentsToDollars(meta.cost_per_1k_output_tokens_microcents)
                  : '—'}
              </span>
            </div>
          </div>

          {/* Requirements */}
          {(meta.requires_addon || meta.requires_api_key) && (
            <div className="flex flex-col gap-1">
              {meta.requires_addon && (
                <p className="flex items-center gap-1.5 text-xs text-amber-600 dark:text-amber-400">
                  <Key className="h-3.5 w-3.5" />
                  Requires AI orchestration add-on
                </p>
              )}
              {meta.requires_api_key && (
                <p className="flex items-center gap-1.5 text-xs text-[color:var(--text-muted)]">
                  <Key className="h-3.5 w-3.5" />
                  Provider API key required in Vault
                </p>
              )}
            </div>
          )}
        </>
      ) : (
        <p className="text-xs text-[color:var(--text-muted)]">No metadata available for this node type.</p>
      )}
    </aside>
  )
}
