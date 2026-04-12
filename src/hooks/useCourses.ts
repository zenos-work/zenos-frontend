import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import api from '../lib/api'

export type Course = {
  id: string
  org_id: string
  instructor_id: string
  title: string
  slug: string
  description?: string
  cover_image_url?: string
  level?: string
  language?: string
  price_cents?: number
  status?: string
}

export type CourseModule = {
  id: string
  course_id: string
  title: string
  description?: string
  sort_order?: number
}

export type CourseLesson = {
  id: string
  course_id: string
  module_id: string
  title: string
  sort_order?: number
  lesson_type?: string
  duration_minutes?: number
}

export type CourseEnrollment = {
  id: string
  course_id: string
  user_id: string
  status?: string
  progress_pct?: number
  started_at?: string
  completed_at?: string
}

const courseKeys = {
  all: ['courses'] as const,
  list: (page: number, limit: number) => [...courseKeys.all, 'list', page, limit] as const,
  detail: (courseId: string) => [...courseKeys.all, 'detail', courseId] as const,
  modules: (courseId: string) => [...courseKeys.all, 'modules', courseId] as const,
  lessons: (courseId: string, moduleId: string) => [...courseKeys.all, 'lessons', courseId, moduleId] as const,
  enrollments: (courseId: string) => [...courseKeys.all, 'enrollments', courseId] as const,
  progress: (courseId: string, enrollmentId: string) => [...courseKeys.all, 'progress', courseId, enrollmentId] as const,
}

export const useCourses = (enabled = true, page = 1, limit = 20) =>
  useQuery({
    queryKey: courseKeys.list(page, limit),
    enabled,
    queryFn: () => api.get<{ courses: Course[]; page: number; limit: number }>('/api/courses', { params: { page, limit } }).then((r) => r.data),
  })

export const useCourse = (courseId: string, enabled = true) =>
  useQuery({
    queryKey: courseKeys.detail(courseId),
    enabled: enabled && !!courseId,
    queryFn: () => api.get<Course>(`/api/courses/${courseId}`).then((r) => r.data),
  })

export const useCreateCourse = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: {
      org_id: string
      title: string
      slug: string
      description?: string
      level?: string
      language?: string
      price_cents?: number
      status?: string
    }) => api.post<{ id: string }>('/api/courses', payload).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: courseKeys.all }),
  })
}

export const useUpdateCourse = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ courseId, payload }: { courseId: string; payload: Partial<Course> }) =>
      api.put<{ id: string }>(`/api/courses/${courseId}`, payload).then((r) => r.data),
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: courseKeys.detail(vars.courseId) })
      qc.invalidateQueries({ queryKey: courseKeys.all })
    },
  })
}

export const useDeleteCourse = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (courseId: string) => api.delete<{ deleted: boolean }>(`/api/courses/${courseId}`).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: courseKeys.all }),
  })
}

export const useCourseModules = (courseId: string, enabled = true) =>
  useQuery({
    queryKey: courseKeys.modules(courseId),
    enabled: enabled && !!courseId,
    queryFn: () => api.get<{ modules: CourseModule[] }>(`/api/courses/${courseId}/modules`).then((r) => r.data),
  })

export const useCreateModule = (courseId: string) => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: { title: string; description?: string; sort_order?: number }) =>
      api.post<{ id: string }>(`/api/courses/${courseId}/modules`, payload).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: courseKeys.modules(courseId) }),
  })
}

export const useModuleLessons = (courseId: string, moduleId: string, enabled = true) =>
  useQuery({
    queryKey: courseKeys.lessons(courseId, moduleId),
    enabled: enabled && !!courseId && !!moduleId,
    queryFn: () => api.get<{ lessons: CourseLesson[] }>(`/api/courses/${courseId}/modules/${moduleId}/lessons`).then((r) => r.data),
  })

export const useCreateLesson = (courseId: string, moduleId: string) => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: { title: string; sort_order?: number; lesson_type?: string; duration_minutes?: number }) =>
      api.post<{ id: string }>(`/api/courses/${courseId}/modules/${moduleId}/lessons`, payload).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: courseKeys.lessons(courseId, moduleId) }),
  })
}

export const useCourseEnrollments = (courseId: string, enabled = true, page = 1, limit = 20) =>
  useQuery({
    queryKey: courseKeys.enrollments(courseId),
    enabled: enabled && !!courseId,
    queryFn: () =>
      api.get<{ enrollments: CourseEnrollment[]; page: number; limit: number }>(`/api/courses/${courseId}/enrollments`, { params: { page, limit } }).then((r) => r.data),
  })

export const useEnrollCourse = (courseId: string) => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload?: { paid_cents?: number; payment_id?: string }) =>
      api.post<{ id: string }>(`/api/courses/${courseId}/enrollments`, payload ?? {}).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: courseKeys.enrollments(courseId) }),
  })
}

export const useCourseProgress = (courseId: string, enrollmentId: string, enabled = true) =>
  useQuery({
    queryKey: courseKeys.progress(courseId, enrollmentId),
    enabled: enabled && !!courseId && !!enrollmentId,
    queryFn: () => api.get<{ progress: Array<{ lesson_id: string; status: string; progress_pct: number }> }>(`/api/courses/${courseId}/enrollments/${enrollmentId}/progress`).then((r) => r.data),
  })

export const useCompleteLesson = (courseId: string, enrollmentId: string) => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (lessonId: string) => api.post<{ id: string }>(`/api/courses/${courseId}/enrollments/${enrollmentId}/progress/${lessonId}/complete`).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: courseKeys.progress(courseId, enrollmentId) }),
  })
}

export const useCompleteEnrollment = (courseId: string) => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (enrollmentId: string) => api.post<{ id: string }>(`/api/courses/${courseId}/enrollments/${enrollmentId}/complete`).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: courseKeys.enrollments(courseId) }),
  })
}
