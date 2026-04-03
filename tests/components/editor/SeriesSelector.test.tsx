import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { QueryClientProvider } from '@tanstack/react-query'
import SeriesSelector from '../../../src/components/editor/SeriesSelector'
import api from '../../../src/lib/api'
import { createTestQueryClient } from '../../utils/queryClient'
import type { Series } from '../../../src/hooks/useSeries'

vi.mock('../../../src/lib/api', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
  },
}))

const makeSeries = (overrides: Partial<Series> = {}): Series => ({
  id: 'series-1',
  author_id: 'user-1',
  name: 'Finance 101',
  created_at: '2026-03-20T00:00:00Z',
  updated_at: '2026-03-20T00:00:00Z',
  ...overrides,
})

function renderSelector(props: Partial<React.ComponentProps<typeof SeriesSelector>> = {}) {
  const onSeriesSelect = vi.fn()
  const onSeriesRemove = vi.fn()
  const client = createTestQueryClient()

  render(
    <MemoryRouter>
      <QueryClientProvider client={client}>
        <SeriesSelector
          onSeriesSelect={onSeriesSelect}
          onSeriesRemove={onSeriesRemove}
          {...props}
        />
      </QueryClientProvider>
    </MemoryRouter>,
  )

  return { onSeriesSelect, onSeriesRemove }
}

describe('SeriesSelector', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('shows loading state while fetching', () => {
    vi.mocked(api.get).mockReturnValue(new Promise(() => {}))

    renderSelector()

    expect(screen.getByText(/loading series/i)).toBeInTheDocument()
  })

  it('shows dropdown when series list loads', async () => {
    vi.mocked(api.get).mockResolvedValue({
      data: { items: [makeSeries({ id: 's1', name: 'Finance 101' }), makeSeries({ id: 's2', name: 'Crypto Deep Dive' })] },
    })

    renderSelector()

    await waitFor(() => {
      expect(screen.getByRole('combobox')).toBeInTheDocument()
    })

    expect(screen.getByText('Finance 101')).toBeInTheDocument()
    expect(screen.getByText('Crypto Deep Dive')).toBeInTheDocument()
  })

  it('shows empty state when no series exist', async () => {
    vi.mocked(api.get).mockResolvedValue({ data: { items: [] } })

    renderSelector()

    await waitFor(() => {
      expect(screen.getByText(/no series yet/i)).toBeInTheDocument()
    })
  })

  it('calls onSeriesSelect when series is selected from dropdown', async () => {
    const series = makeSeries({ id: 's1', name: 'Finance 101' })
    vi.mocked(api.get).mockResolvedValue({ data: { items: [series] } })

    const { onSeriesSelect } = renderSelector()

    await waitFor(() => expect(screen.getByRole('combobox')).toBeInTheDocument())

    fireEvent.change(screen.getByRole('combobox'), { target: { value: 's1' } })

    expect(onSeriesSelect).toHaveBeenCalledWith(series, 1)
  })

  it('shows selected series with remove button when seriesId is set', async () => {
    vi.mocked(api.get).mockResolvedValue({
      data: { items: [makeSeries({ id: 's1', name: 'Finance 101' })] },
    })

    const { onSeriesRemove } = renderSelector({ seriesId: 's1', currentPartNumber: 2 })

    await waitFor(() => expect(screen.getByText(/finance 101/i)).toBeInTheDocument())

    expect(screen.getByText(/part 2/i)).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: /remove/i }))
    expect(onSeriesRemove).toHaveBeenCalledTimes(1)
  })

  it('creates new series when Enter is pressed in the input', async () => {
    const newSeries = makeSeries({ id: 'new', name: 'Brand New Series' })
    vi.mocked(api.get).mockResolvedValue({ data: { items: [] } })
    vi.mocked(api.post).mockResolvedValue({ data: { series: newSeries } })

    const { onSeriesSelect } = renderSelector()

    await waitFor(() => expect(screen.getByPlaceholderText(/create new series/i)).toBeInTheDocument())

    const input = screen.getByPlaceholderText(/create new series/i)
    fireEvent.change(input, { target: { value: 'Brand New Series' } })
    fireEvent.keyDown(input, { key: 'Enter' })

    await waitFor(() => {
      expect(api.post).toHaveBeenCalledWith('/api/series', { name: 'Brand New Series' })
      expect(onSeriesSelect).toHaveBeenCalledWith(newSeries, 1)
    })
  })
})
