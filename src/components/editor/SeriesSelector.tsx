import { useQuery, useMutation } from '@tanstack/react-query'
import api from '../../lib/api'
import type { Series } from '../../hooks/useSeries'

interface SeriesSelectorProps {
  seriesId?: string
  onSeriesSelect: (series: Series, partNumber: number) => void
  onSeriesRemove: () => void
  currentPartNumber?: number
}

export default function SeriesSelector({
  seriesId,
  onSeriesSelect,
  onSeriesRemove,
  currentPartNumber,
}: SeriesSelectorProps) {
  const { data: seriesList, isLoading } = useQuery({
    queryKey: ['my-series'],
    queryFn: async () => {
      try {
        const res = await api.get<{ items: Series[] }>('/api/series?limit=100')
        return res.data.items ?? []
      } catch {
        return []
      }
    },
  })

  const createMutation = useMutation({
    mutationFn: async (name: string) => {
      const res = await api.post<{ series: Series }>('/api/series', { name })
      return res.data.series
    },
  })

  const handleCreateAndSelect = async (name: string) => {
    try {
      const newSeries = await createMutation.mutateAsync(name)
      onSeriesSelect(newSeries, 1)
    } catch {
      // Error handled by component
    }
  }

  return (
    <div data-testid='series-select' className="rounded-xl border border-[color:var(--border)] bg-[color:var(--surface-1)] p-4">
      <p className="mb-3 text-xs uppercase tracking-wider text-[color:var(--text-muted)]">Series (Optional)</p>

      {seriesId && (
        <div className="mb-3 flex items-center gap-2">
          <div className="flex-1 rounded-lg bg-[color:var(--surface-0)] border border-[color:var(--accent)] px-3 py-2 text-sm text-[color:var(--text-primary)]">
            {seriesList?.find((s: Series) => s.id === seriesId)?.name || 'Series'}
            {currentPartNumber && <span className="ml-2 text-xs text-[color:var(--text-muted)]">Part {currentPartNumber}</span>}
          </div>
          <button
            onClick={onSeriesRemove}
            className="rounded-lg border border-rose-500 px-3 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-500/10"
          >
            Remove
          </button>
        </div>
      )}

      {!seriesId && (
        <>
          {isLoading ? (
            <p className="text-xs text-[color:var(--text-muted)]">Loading series...</p>
          ) : seriesList && seriesList.length > 0 ? (
            <select
              onChange={(e: React.ChangeEvent<HTMLSelectElement>) => {
                const series = seriesList.find((s: Series) => s.id === e.target.value)
                if (series) {
                  onSeriesSelect(series, 1)
                }
              }}
              className="w-full rounded-lg bg-[color:var(--surface-0)] border border-[color:var(--border)] px-3 py-2 text-sm text-[color:var(--text-primary)] mb-2"
            >
              <option value="">Select a series...</option>
              {seriesList.map((series: Series) => (
                <option key={series.id} value={series.id}>
                  {series.name}
                </option>
              ))}
            </select>
          ) : (
            <p className="text-xs text-[color:var(--text-muted)]">No series yet. Create one below.</p>
          )}

          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Create new series..."
              className="flex-1 rounded-lg bg-[color:var(--surface-0)] border border-[color:var(--border)] px-3 py-2 text-sm text-[color:var(--text-primary)] placeholder-[color:var(--text-muted)]"
              onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => {
                if (e.key === 'Enter' && e.currentTarget.value.trim()) {
                  void handleCreateAndSelect(e.currentTarget.value.trim())
                  e.currentTarget.value = ''
                }
              }}
            />
            <button
              disabled={createMutation.isPending}
              className="rounded-lg border border-[color:var(--accent)] px-3 py-2 text-xs font-semibold text-[color:var(--text-primary)] hover:bg-[color:var(--accent-dim)] disabled:opacity-50"
            >
              {createMutation.isPending ? 'Creating...' : 'Create'}
            </button>
          </div>
        </>
      )}
    </div>
  )
}
