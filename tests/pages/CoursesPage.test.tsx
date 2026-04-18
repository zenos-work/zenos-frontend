import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import CoursesPage from '../../src/pages/CoursesPage'

const useFeatureFlagMock = vi.fn()
const useCoursesMock = vi.fn()

vi.mock('../../src/hooks/useFeatureFlags', () => ({
  useFeatureFlag: (...args: unknown[]) => useFeatureFlagMock(...args),
}))

vi.mock('../../src/hooks/useCourses', () => ({
  useCourses: (...args: unknown[]) => useCoursesMock(...args),
}))

vi.mock('../../src/components/ui/Spinner', () => ({
  default: () => <div>Loading...</div>,
}))

describe('CoursesPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders coming soon when feature is disabled', () => {
    useFeatureFlagMock.mockReturnValue({ enabled: false, isLoading: false })
    useCoursesMock.mockReturnValue({ isLoading: false, data: { courses: [] } })

    render(
      <MemoryRouter>
        <CoursesPage />
      </MemoryRouter>,
    )

    expect(screen.getByText(/courses is coming soon/i)).toBeInTheDocument()
  })

  it('renders courses when enabled', () => {
    useFeatureFlagMock.mockReturnValue({ enabled: true, isLoading: false })
    useCoursesMock.mockReturnValue({
      isLoading: false,
      data: { courses: [{ id: 'c-1', title: 'Intro AI', description: 'Learn AI basics' }] },
    })

    render(
      <MemoryRouter>
        <CoursesPage />
      </MemoryRouter>,
    )

    expect(screen.getByRole('heading', { name: /courses/i })).toBeInTheDocument()
    expect(screen.getByText('Intro AI')).toBeInTheDocument()
  })
})
