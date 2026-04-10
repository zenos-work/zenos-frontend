import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import api from '../lib/api'
import type { FeatureFlagMetadata } from '../types'

export type FeatureFlagEvaluation = {
  key: string
  enabled: boolean
  metadata?: FeatureFlagMetadata
}

type FeatureFlagsResponse = {
  flags?: unknown[]
  features?: unknown[]
}

const coerceFlag = (raw: unknown): FeatureFlagEvaluation | null => {
  if (!raw || typeof raw !== 'object') return null
  const value = raw as Record<string, unknown>

  const keyCandidate = value.flag_key ?? value.key
  const key = typeof keyCandidate === 'string' ? keyCandidate : ''
  if (!key) return null

  const enabledCandidate = value.enabled ?? value.is_active
  const enabled =
    typeof enabledCandidate === 'boolean'
      ? enabledCandidate
      : Boolean(enabledCandidate)

  return {
    key,
    enabled,
    metadata: value.metadata as FeatureFlagMetadata | undefined,
  }
}

const normalizeFlags = (payload: unknown): FeatureFlagEvaluation[] => {
  if (Array.isArray(payload)) {
    return payload.map(coerceFlag).filter((flag): flag is FeatureFlagEvaluation => !!flag)
  }

  if (!payload || typeof payload !== 'object') return []

  const result = payload as FeatureFlagsResponse
  const list = result.flags ?? result.features ?? []
  if (!Array.isArray(list)) return []

  return list.map(coerceFlag).filter((flag): flag is FeatureFlagEvaluation => !!flag)
}

export function useFeatureFlags(enabled = true) {
  const query = useQuery({
    queryKey: ['feature-flags', 'user'],
    enabled,
    staleTime: 1000 * 60 * 5,
    queryFn: async () => {
      const response = await api.get('/api/features')
      return normalizeFlags(response.data)
    },
  })

  const map = useMemo(() => {
    const output: Record<string, FeatureFlagEvaluation> = {}
    for (const flag of query.data ?? []) {
      output[flag.key] = flag
    }
    return output
  }, [query.data])

  return {
    ...query,
    flags: map,
    list: query.data ?? [],
  }
}

export function useFeatureFlag(key: string, enabled = true) {
  const { flags, isLoading, error } = useFeatureFlags(enabled)
  const flag = flags[key]

  return {
    enabled: flag?.enabled ?? false,
    flag,
    isLoading,
    error,
  }
}
