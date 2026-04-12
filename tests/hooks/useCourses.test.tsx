import { act, renderHook, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import api from '../../src/lib/api'
import {
  useCompleteEnrollment,
  useCompleteLesson,
  useCourse,
  useCourseModules,
  useCourses,
  useCreateCourse,
  useEnrollCourse,
} from '../../src/hooks/useCourses'
import { createQueryClientWrapper } from '../utils/queryClient'

vi.mock('../../src/lib/api', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  },
}))

describe('useCourses hooks', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('fetches course list, course detail, and modules', async () => {
    vi.mocked(api.get)
      .mockResolvedValueOnce({ data: { courses: [{ id: 'c-1', title: 'Intro AI' }], page: 1, limit: 20 } } as never)
      .mockResolvedValueOnce({ data: { id: 'c-1', title: 'Intro AI' } } as never)
      .mockResolvedValueOnce({ data: { modules: [{ id: 'm-1', title: 'Basics' }] } } as never)

    const a = createQueryClientWrapper()
    const b = createQueryClientWrapper()
    const c = createQueryClientWrapper()

    const list = renderHook(() => useCourses(true), { wrapper: a.Wrapper })
    const detail = renderHook(() => useCourse('c-1', true), { wrapper: b.Wrapper })
    const modules = renderHook(() => useCourseModules('c-1', true), { wrapper: c.Wrapper })

    await waitFor(() => {
      expect(list.result.current.isSuccess).toBe(true)
      expect(detail.result.current.isSuccess).toBe(true)
      expect(modules.result.current.isSuccess).toBe(true)
    })

    expect(api.get).toHaveBeenCalledWith('/api/courses', { params: { page: 1, limit: 20 } })
    expect(api.get).toHaveBeenCalledWith('/api/courses/c-1')
    expect(api.get).toHaveBeenCalledWith('/api/courses/c-1/modules')
  })

  it('creates course, enrolls learner, completes lesson and enrollment', async () => {
    vi.mocked(api.post)
      .mockResolvedValueOnce({ data: { id: 'c-1' } } as never)
      .mockResolvedValueOnce({ data: { id: 'e-1' } } as never)
      .mockResolvedValueOnce({ data: { id: 'p-1' } } as never)
      .mockResolvedValueOnce({ data: { id: 'e-1' } } as never)

    const a = createQueryClientWrapper()
    const b = createQueryClientWrapper()
    const c = createQueryClientWrapper()
    const d = createQueryClientWrapper()

    const createCourse = renderHook(() => useCreateCourse(), { wrapper: a.Wrapper })
    const enroll = renderHook(() => useEnrollCourse('c-1'), { wrapper: b.Wrapper })
    const completeLesson = renderHook(() => useCompleteLesson('c-1', 'e-1'), { wrapper: c.Wrapper })
    const completeEnrollment = renderHook(() => useCompleteEnrollment('c-1'), { wrapper: d.Wrapper })

    await act(async () => {
      await createCourse.result.current.mutateAsync({ org_id: 'org-1', title: 'Intro AI', slug: 'intro-ai' })
      await enroll.result.current.mutateAsync({})
      await completeLesson.result.current.mutateAsync('l-1')
      await completeEnrollment.result.current.mutateAsync('e-1')
    })

    expect(api.post).toHaveBeenCalledWith('/api/courses', { org_id: 'org-1', title: 'Intro AI', slug: 'intro-ai' })
    expect(api.post).toHaveBeenCalledWith('/api/courses/c-1/enrollments', {})
    expect(api.post).toHaveBeenCalledWith('/api/courses/c-1/enrollments/e-1/progress/l-1/complete')
    expect(api.post).toHaveBeenCalledWith('/api/courses/c-1/enrollments/e-1/complete')
  })
})
